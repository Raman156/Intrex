import { geminiModel, safetySettings } from '../lib/gemini'
import { debugLog, debugError } from '../utils/logger'

/**
 * Sleep utility for retry delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Clean and parse JSON response from Gemini
 */
function parseSummaryResponse(rawResponse) {
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
        // Return fallback structure
        debugError('Failed to parse summary response:', rawResponse)
        return {
          overallFeedback: 'Interview completed successfully. Manual review recommended for detailed feedback.',
          topStrengths: ['Participated in the interview', 'Provided responses to questions', 'Demonstrated engagement'],
          criticalImprovements: ['Continue practicing interview skills', 'Focus on clear communication', 'Prepare for technical questions'],
          recommendedFocus: 'Practice answering questions with specific examples and clear structure'
        }
      }
    }
  }
}

/**
 * Generate overall session summary using Gemini
 * @param {Array} questionResults - Array of QuestionAnalysis objects
 * @param {string} targetedRole - The role being interviewed for
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<Object>} - Session summary
 */
export async function generateSessionSummary(
  questionResults,
  targetedRole = 'Software Developer',
  maxRetries = 3
) {
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

  const prompt = `You are an expert interview coach with 15+ years of experience helping candidates prepare for job interviews. Based on the following interview session analysis, generate a comprehensive coaching summary. Return ONLY raw JSON, no markdown, no backticks, no explanations.

Role Being Interviewed For: ${targetedRole}
Number of Questions Analyzed: ${validResults.length}
Interview Analysis Results: ${JSON.stringify(validResults, null, 2)}

Analyze the candidate's interview performance patterns and provide actionable coaching feedback to help them improve for their next interview. Return exactly this structure:
{
  "overallFeedback": "2-3 sentence summary of overall interview performance, highlighting key patterns and job readiness",
  "topStrengths": ["specific interview strength demonstrated", "another strength", "third strength"],
  "criticalImprovements": ["specific actionable tip to improve interview performance", "another improvement", "third improvement"],
  "recommendedFocus": "one specific interview skill to practice before the next interview, with concrete advice"
}`

  let lastError = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      debugLog(`Summary generation attempt ${attempt}/${maxRetries}`)
      
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
        throw new Error('Empty summary response received')
      }
      
      const summary = parseSummaryResponse(rawText)
      
      // Validate the summary structure
      if (!summary.overallFeedback || !summary.topStrengths || !summary.criticalImprovements || !summary.recommendedFocus) {
        throw new Error('Invalid summary structure received')
      }
      
      // Ensure arrays are properly formatted
      const validatedSummary = {
        overallFeedback: typeof summary.overallFeedback === 'string' ? summary.overallFeedback : 'Interview completed successfully.',
        topStrengths: Array.isArray(summary.topStrengths) ? summary.topStrengths.slice(0, 3) : ['Participated in interview'],
        criticalImprovements: Array.isArray(summary.criticalImprovements) ? summary.criticalImprovements.slice(0, 3) : ['Continue practicing'],
        recommendedFocus: typeof summary.recommendedFocus === 'string' ? summary.recommendedFocus : 'Focus on interview preparation'
      }
      
      debugLog(`Summary generation successful on attempt ${attempt}`)
      return validatedSummary
      
    } catch (error) {
      lastError = error
      debugError(`Summary generation attempt ${attempt} failed:`, error.message)
      
      // Don't retry on certain errors
      if (error.message?.includes('API key') || 
          error.message?.includes('quota') ||
          error.message?.includes('permission')) {
        debugError('Non-retryable error encountered:', error.message)
        break
      }
      
      // If this isn't the last attempt, wait before retrying
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000 // Exponential backoff
        debugLog(`Waiting ${delay}ms before retry...`)
        await sleep(delay)
      }
    }
  }
  
  // All retries failed - return fallback summary
  debugError(`Summary generation failed after ${maxRetries} attempts. Last error: ${lastError?.message}`)
  
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
/**
 * Create comprehensive interview session result
 * @param {string} sessionId - Unique session identifier
 * @param {string} userId - User identifier
 * @param {string} targetedRole - Role being interviewed for
 * @param {Array} questionResults - Array of QuestionAnalysis objects
 * @param {Object} sessionSummary - Generated session summary
 * @param {Map} questionSessions - Map of question session data
 * @returns {Object} - Complete interview session result
 */
export function createInterviewSessionResult(
  sessionId,
  userId,
  targetedRole,
  questionResults,
  sessionSummary,
  questionSessions
) {
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
 * @param {Object} sessionResult - Complete interview session result
 * @returns {Object} - Performance insights and recommendations
 */
export function generatePerformanceInsights(sessionResult) {
  const { questionResults, averageScore, answeredQuestions, totalQuestions } = sessionResult
  
  if (!questionResults || questionResults.length === 0) {
    return {
      performanceLevel: 'Incomplete',
      readinessAssessment: 'Not Ready',
      nextSteps: ['Complete a full interview session', 'Practice answering questions', 'Improve technical setup'],
      timeManagement: 'Unable to assess',
      consistencyScore: 0
    }
  }
  
  // Analyze score distribution
  const scores = questionResults.map(result => result.scores?.overall || 0)
  const maxScore = Math.max(...scores)
  const minScore = Math.min(...scores)
  const scoreVariance = maxScore - minScore
  
  // Determine performance level
  let performanceLevel = 'Needs Improvement'
  if (averageScore >= 85) performanceLevel = 'Excellent'
  else if (averageScore >= 75) performanceLevel = 'Good'
  else if (averageScore >= 60) performanceLevel = 'Fair'
  
  // Assess readiness
  let readinessAssessment = 'Not Ready'
  if (averageScore >= 75 && answeredQuestions >= totalQuestions * 0.8) readinessAssessment = 'Ready'
  else if (averageScore >= 60 && answeredQuestions >= totalQuestions * 0.7) readinessAssessment = 'Nearly Ready'
  
  // Generate next steps
  const nextSteps = []
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
  let timeManagement = 'Good'
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
 * @param {Object} sessionResult - Complete interview session result
 * @returns {Object} - Exportable session data
 */
export function exportSessionData(sessionResult) {
  return {
    ...sessionResult,
    exportedAt: new Date().toISOString(),
    version: '1.0',
    format: 'interview-session-result'
  }
}