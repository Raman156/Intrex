import { geminiModel, safetySettings, withRetry, GeminiError, classifyGeminiError, createLoadingState, LoadingState } from '../../../lib/gemini'
import { debugLog, debugError, debugWarn } from '../../../utils/logger'

interface SessionSummary {
  overallFeedback: string
  topStrengths: string[]
  criticalImprovements: string[]
  recommendedFocus: string
}

interface QuestionAnalysis {
  questionId: string
  scores: {
    relevance: number
    clarity: number
    technicalDepth: number
    confidence: number
    overall: number
  }
  strengths: string[]
  improvements: string[]
  verdict: string
  status: 'success' | 'failed'
  error?: string
}

interface InterviewSessionResult {
  sessionId: string
  userId: string
  timestamp: Date
  targetedRole: string
  totalQuestions: number
  answeredQuestions: number
  skippedQuestions: number
  averageScore: number
  totalTimeUsed: number
  questionResults: QuestionAnalysis[]
  overallFeedback: string
  topStrengths: string[]
  criticalImprovements: string[]
  recommendedFocus: string
  metadata?: {
    analysisSuccessRate: number
    averageTimePerQuestion: number
    completionRate: number
  }
}

interface PerformanceInsights {
  performanceLevel: 'Excellent' | 'Good' | 'Fair' | 'Needs Improvement' | 'Incomplete'
  readinessAssessment: 'Ready' | 'Nearly Ready' | 'Not Ready'
  nextSteps: string[]
  timeManagement: 'Good' | 'Too Slow' | 'Too Fast'
  consistencyScore: number
  scoreDistribution?: {
    highest: number
    lowest: number
    variance: number
  }
}

/**
 * Clean and parse JSON response from Gemini
 */
function parseSummaryResponse(rawResponse: string): any {
  try {
    // First try direct parsing
    return JSON.parse(rawResponse)
  } catch (error) {
    try {
      // Remove markdown code blocks if present
      const cleaned = rawResponse.replace(/```json|```/g, '').trim()
      return JSON.parse(cleaned)
    } catch (secondError) {
      try {
        // Try to extract JSON from response
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
      } catch (thirdError) {
        throw new GeminiError('Failed to parse summary response')
      }
    }
  }
}

/**
 * Generate overall session summary using Gemini with enhanced error handling
 */
export async function generateSessionSummary(
  questionResults: QuestionAnalysis[],
  targetedRole: string = 'Software Developer',
  onProgress?: (loadingState: LoadingState) => void
): Promise<SessionSummary> {
  if (!questionResults || questionResults.length === 0) {
    return {
      overallFeedback: 'No questions were answered during this interview session.',
      topStrengths: [],
      criticalImprovements: ['Complete interview questions', 'Provide detailed responses', 'Practice interview preparation'],
      recommendedFocus: 'Focus on completing interview questions and providing comprehensive answers'
    }
  }

  // Filter out failed analyses and prepare data
  const validResults = questionResults.filter(result => 
    result.status === 'success' && result.scores && result.verdict
  )

  if (validResults.length === 0) {
    return {
      overallFeedback: 'Interview completed but analysis results were not available for detailed feedback.',
      topStrengths: ['Participated in the interview'],
      criticalImprovements: ['Ensure clear audio recording', 'Speak clearly during responses', 'Check technical setup'],
      recommendedFocus: 'Focus on technical setup and clear communication for better analysis results'
    }
  }

  const loadingState = createLoadingState('Generating coaching summary')
  onProgress?.(loadingState)

  const prompt = `You are an expert interview coach with 15+ years of experience. Based on the following interview analysis results, generate a comprehensive session summary. Return ONLY raw JSON, no markdown, no backticks, no explanations.

Targeted Role: ${targetedRole}
Number of Questions Analyzed: ${validResults.length}
Results: ${JSON.stringify(validResults, null, 2)}

Analyze the patterns across all responses and provide actionable coaching feedback. Return exactly this structure:
{
  "overallFeedback": "2-3 sentence summary of overall performance highlighting key patterns and readiness level",
  "topStrengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "criticalImprovements": ["actionable improvement 1", "actionable improvement 2", "actionable improvement 3"],
  "recommendedFocus": "one specific area to focus on before the next interview with actionable advice"
}`

  try {
    const result = await withRetry(
      async () => {
        const result = await geminiModel.generateContent(prompt, {
          safetySettings,
          generationConfig: {
            temperature: 0.4, // Balanced creativity for coaching insights
            topP: 0.9,
            topK: 40,
            maxOutputTokens: 1024,
          }
        })
        
        const response = await result.response
        const rawText = response.text().trim()
        
        if (!rawText || rawText.length === 0) {
          throw new GeminiError('Empty summary response received')
        }
        
        return parseSummaryResponse(rawText)
      },
      3, // maxRetries
      1000, // baseDelay
      (attempt, maxRetries) => {
        onProgress?.({
          ...loadingState,
          progress: (attempt / maxRetries) * 100
        })
      }
    )
    
    onProgress?.({
      ...loadingState,
      isLoading: false,
      progress: 100
    })
    
    // Validate and sanitize the summary structure
    const validatedSummary: SessionSummary = {
      overallFeedback: typeof result.overallFeedback === 'string' ? result.overallFeedback : 'Interview completed successfully.',
      topStrengths: Array.isArray(result.topStrengths) ? result.topStrengths.slice(0, 3) : ['Participated in interview'],
      criticalImprovements: Array.isArray(result.criticalImprovements) ? result.criticalImprovements.slice(0, 3) : ['Continue practicing'],
      recommendedFocus: typeof result.recommendedFocus === 'string' ? result.recommendedFocus : 'Focus on interview preparation'
    }
    
    return validatedSummary
    
  } catch (error) {
    debugError('Summary generation failed:', error)
    
    onProgress?.({
      ...loadingState,
      isLoading: false,
      progress: 0
    })
    
    // Generate basic summary from available data
    const avgScore = validResults.reduce((sum, result) => sum + (result.scores?.overall || 0), 0) / validResults.length
    const allStrengths = validResults.flatMap(result => result.strengths || [])
    const allImprovements = validResults.flatMap(result => result.improvements || [])
    
    return {
      overallFeedback: `Interview completed with an average score of ${Math.round(avgScore)}/100. ${validResults.length} questions were successfully analyzed. Summary generation encountered technical issues.`,
      topStrengths: [...new Set(allStrengths)].slice(0, 3),
      criticalImprovements: [...new Set(allImprovements)].slice(0, 3),
      recommendedFocus: `Focus on improving overall interview performance. Current average: ${Math.round(avgScore)}/100`
    }
  }
}

/**
 * Create comprehensive interview session result
 */
export function createInterviewSessionResult(
  sessionId: string,
  userId: string,
  targetedRole: string,
  questionResults: QuestionAnalysis[],
  sessionSummary: SessionSummary,
  questionSessions: Map<string, any>
): InterviewSessionResult {
  const validResults = questionResults.filter(result => result.status === 'success')
  const totalQuestions = questionResults.length
  const answeredQuestions = validResults.length
  const skippedQuestions = totalQuestions - answeredQuestions
  
  // Calculate average score
  const averageScore = validResults.length > 0 
    ? Math.round(validResults.reduce((sum, result) => sum + (result.scores?.overall || 0), 0) / validResults.length)
    : 0
  
  // Calculate total time used
  const totalTimeUsed = Array.from(questionSessions.values())
    .reduce((sum, session) => sum + (session.timeUsed || 0), 0)
  
  return {
    sessionId,
    userId,
    timestamp: new Date(),
    targetedRole,
    totalQuestions,
    answeredQuestions,
    skippedQuestions,
    averageScore,
    totalTimeUsed,
    questionResults: validResults,
    overallFeedback: sessionSummary.overallFeedback,
    topStrengths: sessionSummary.topStrengths,
    criticalImprovements: sessionSummary.criticalImprovements,
    recommendedFocus: sessionSummary.recommendedFocus,
    metadata: {
      analysisSuccessRate: totalQuestions > 0 ? Math.round((validResults.length / totalQuestions) * 100) : 0,
      averageTimePerQuestion: answeredQuestions > 0 ? Math.round(totalTimeUsed / answeredQuestions) : 0,
      completionRate: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
    }
  }
}

/**
 * Generate performance insights from session data
 */
export function generatePerformanceInsights(sessionResult: InterviewSessionResult): PerformanceInsights {
  const { questionResults, averageScore, answeredQuestions, totalQuestions } = sessionResult
  
  if (!questionResults || questionResults.length === 0) {
    return {
      performanceLevel: 'Incomplete',
      readinessAssessment: 'Not Ready',
      nextSteps: ['Complete a full interview session', 'Practice answering questions', 'Improve technical setup'],
      timeManagement: 'Good',
      consistencyScore: 0
    }
  }
  
  // Analyze score distribution
  const scores = questionResults.map(result => result.scores?.overall || 0)
  const maxScore = Math.max(...scores)
  const minScore = Math.min(...scores)
  const scoreVariance = maxScore - minScore
  
  // Determine performance level
  let performanceLevel: PerformanceInsights['performanceLevel'] = 'Needs Improvement'
  if (averageScore >= 85) performanceLevel = 'Excellent'
  else if (averageScore >= 75) performanceLevel = 'Good'
  else if (averageScore >= 60) performanceLevel = 'Fair'
  
  // Assess readiness
  let readinessAssessment: PerformanceInsights['readinessAssessment'] = 'Not Ready'
  if (averageScore >= 75 && answeredQuestions >= totalQuestions * 0.8) readinessAssessment = 'Ready'
  else if (averageScore >= 60 && answeredQuestions >= totalQuestions * 0.7) readinessAssessment = 'Nearly Ready'
  
  // Generate next steps
  const nextSteps: string[] = []
  if (answeredQuestions < totalQuestions) {
    nextSteps.push('Complete all interview questions')
  }
  if (averageScore < 70) {
    nextSteps.push('Focus on improving answer quality and depth')
  }
  if (scoreVariance > 30) {
    nextSteps.push('Work on consistency across different question types')
  }
  if (nextSteps.length === 0) {
    nextSteps.push('Continue practicing to maintain performance level')
  }
  
  // Time management assessment
  const avgTimePerQuestion = sessionResult.metadata?.averageTimePerQuestion || 0
  let timeManagement: PerformanceInsights['timeManagement'] = 'Good'
  if (avgTimePerQuestion > 150) timeManagement = 'Too Slow'
  else if (avgTimePerQuestion < 60) timeManagement = 'Too Fast'
  
  // Consistency score (lower variance = higher consistency)
  const consistencyScore = Math.max(0, 100 - (scoreVariance * 2))
  
  return {
    performanceLevel,
    readinessAssessment,
    nextSteps,
    timeManagement,
    consistencyScore: Math.round(consistencyScore),
    scoreDistribution: {
      highest: maxScore,
      lowest: minScore,
      variance: scoreVariance
    }
  }
}

/**
 * Export session data for external use (e.g., saving to backend)
 */
export function exportSessionData(sessionResult: InterviewSessionResult) {
  return {
    ...sessionResult,
    exportedAt: new Date().toISOString(),
    version: '1.0',
    format: 'interview-session-result'
  }
}