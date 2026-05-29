import { geminiModel, safetySettings, withRetry, GeminiError, classifyGeminiError, createLoadingState, LoadingState } from '../../../lib/gemini'
import { debugLog, debugError, debugWarn } from '../../../utils/logger'

interface QuestionAnalysis {
  questionId: string
  scores: {
    relevance: number // 0-10
    clarity: number // 0-10
    technicalDepth: number // 0-10
    confidence: number // 0-10
    overall: number // 0-100
  }
  strengths: string[]
  improvements: string[]
  verdict: string
  status: 'success' | 'failed'
  error?: string
  loadingState?: LoadingState
}

interface AnalysisRequest {
  questionId: string
  questionText: string
  transcript: string
  targetedRole: string
  yearsOfExperience: number
}

/**
 * Clean and parse JSON response from Gemini
 */
function parseAnalysisResponse(rawResponse: string): any {
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
        throw new GeminiError('Failed to parse analysis response')
      }
    }
  }
}

/**
 * Analyze a single interview answer using Gemini with enhanced error handling
 */
export async function analyzeAnswer(
  request: AnalysisRequest,
  onProgress?: (loadingState: LoadingState) => void
): Promise<QuestionAnalysis> {
  const { questionId, questionText, transcript, targetedRole, yearsOfExperience } = request

  if (!transcript || transcript.trim().length === 0) {
    return {
      questionId,
      scores: {
        relevance: 0,
        clarity: 0,
        technicalDepth: 0,
        confidence: 0,
        overall: 0
      },
      strengths: [],
      improvements: ['No answer provided'],
      verdict: 'Question was not answered',
      status: 'failed',
      error: 'No transcript available'
    }
  }

  const loadingState = createLoadingState(`Analyzing answer for question ${questionId}`)
  onProgress?.(loadingState)

  const prompt = `You are an expert technical interviewer with 15+ years of experience. Analyze the interview answer below and return ONLY a valid JSON object. No markdown, no backticks, no explanation — raw JSON only.

Question: ${questionText}
Candidate Answer: ${transcript}
Targeted Role: ${targetedRole}
Years of Experience: ${yearsOfExperience}

Return exactly this JSON structure:
{
  "scores": {
    "relevance": <integer 0-10>,
    "clarity": <integer 0-10>,
    "technicalDepth": <integer 0-10>,
    "confidence": <integer 0-10>,
    "overall": <integer 0-100>
  },
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": ["actionable improvement 1", "actionable improvement 2"],
  "verdict": "one concise sentence summarizing the answer quality"
}`

  try {
    const result = await withRetry(
      async () => {
        const result = await geminiModel.generateContent(prompt, {
          safetySettings,
          generationConfig: {
            temperature: 0.3, // Slightly higher for more varied analysis
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 1024,
          }
        })
        
        const response = await result.response
        const rawText = response.text().trim()
        
        if (!rawText || rawText.length === 0) {
          throw new GeminiError('Empty analysis response received')
        }
        
        return parseAnalysisResponse(rawText)
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
    
    // Validate and sanitize the analysis structure
    const validatedAnalysis: QuestionAnalysis = {
      questionId,
      scores: {
        relevance: Math.max(0, Math.min(10, result.scores?.relevance || 0)),
        clarity: Math.max(0, Math.min(10, result.scores?.clarity || 0)),
        technicalDepth: Math.max(0, Math.min(10, result.scores?.technicalDepth || 0)),
        confidence: Math.max(0, Math.min(10, result.scores?.confidence || 0)),
        overall: Math.max(0, Math.min(100, result.scores?.overall || 0))
      },
      strengths: Array.isArray(result.strengths) ? result.strengths.slice(0, 5) : ['Analysis completed'],
      improvements: Array.isArray(result.improvements) ? result.improvements.slice(0, 5) : ['Continue practicing'],
      verdict: typeof result.verdict === 'string' ? result.verdict : 'Analysis completed',
      status: 'success'
    }
    
    return validatedAnalysis
    
  } catch (error) {
    debugError(`Analysis failed for question ${questionId}:`, error)
    
    onProgress?.({
      ...loadingState,
      isLoading: false,
      progress: 0
    })
    
    const geminiError = error instanceof GeminiError ? error : classifyGeminiError(error as Error)
    
    return {
      questionId,
      scores: {
        relevance: 5,
        clarity: 5,
        technicalDepth: 5,
        confidence: 5,
        overall: 50
      },
      strengths: ['Response provided'],
      improvements: ['Analysis failed - manual review recommended'],
      verdict: `Analysis failed: ${geminiError.message}`,
      status: 'failed',
      error: geminiError.message
    }
  }
}

/**
 * Batch analyze multiple interview answers with enhanced progress tracking
 */
export async function batchAnalyzeAnswers(
  requests: AnalysisRequest[],
  onProgress?: (questionId: string, loadingState: LoadingState) => void,
  onComplete?: (questionId: string, result: QuestionAnalysis) => void
): Promise<QuestionAnalysis[]> {
  const results: QuestionAnalysis[] = []
  
  for (const request of requests) {
    try {
        debugLog(`Starting analysis for question: ${request.questionId}`)
      
      const analysis = await analyzeAnswer(
        request,
        (loadingState) => onProgress?.(request.questionId, loadingState)
      )
      
      results.push(analysis)
      onComplete?.(request.questionId, analysis)
      
      debugLog(`Analysis completed for question: ${request.questionId}`)
      
    } catch (error) {
      debugError(`Analysis failed for question ${request.questionId}:`, error)
      
      const geminiError = error instanceof GeminiError ? error : classifyGeminiError(error as Error)
      
      const failedAnalysis: QuestionAnalysis = {
        questionId: request.questionId,
        scores: {
          relevance: 0,
          clarity: 0,
          technicalDepth: 0,
          confidence: 0,
          overall: 0
        },
        strengths: [],
        improvements: ['Analysis failed - manual review needed'],
        verdict: `Analysis error: ${geminiError.message}`,
        status: 'failed',
        error: geminiError.message
      }
      
      results.push(failedAnalysis)
      onComplete?.(request.questionId, failedAnalysis)
    }
    
    // Small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  return results
}

/**
 * Calculate overall interview performance from individual analyses
 */
export function calculateOverallPerformance(analyses: QuestionAnalysis[]) {
  if (!analyses || analyses.length === 0) {
    return {
      overall_score: 0,
      technical_score: 0,
      behavioral_score: 0,
      total_questions: 0,
      answered_questions: 0,
      skipped_questions: 0,
      analysis_success_rate: 0,
      detailed_scores: {
        relevance: 0,
        clarity: 0,
        technicalDepth: 0,
        confidence: 0,
        overall: 0
      }
    }
  }
  
  const validAnalyses = analyses.filter(a => a.status === 'success' && a.scores)
  const totalQuestions = analyses.length
  const answeredQuestions = validAnalyses.length
  const skippedQuestions = totalQuestions - answeredQuestions
  
  if (validAnalyses.length === 0) {
    return {
      overall_score: 0,
      technical_score: 0,
      behavioral_score: 0,
      total_questions: totalQuestions,
      answered_questions: 0,
      skipped_questions: skippedQuestions,
      analysis_success_rate: 0,
      detailed_scores: {
        relevance: 0,
        clarity: 0,
        technicalDepth: 0,
        confidence: 0,
        overall: 0
      }
    }
  }
  
  // Calculate average scores
  const avgScores = validAnalyses.reduce((acc, analysis) => {
    acc.relevance += analysis.scores.relevance
    acc.clarity += analysis.scores.clarity
    acc.technicalDepth += analysis.scores.technicalDepth
    acc.confidence += analysis.scores.confidence
    acc.overall += analysis.scores.overall
    return acc
  }, { relevance: 0, clarity: 0, technicalDepth: 0, confidence: 0, overall: 0 })
  
  const count = validAnalyses.length
  Object.keys(avgScores).forEach(key => {
    avgScores[key as keyof typeof avgScores] = Math.round(avgScores[key as keyof typeof avgScores] / count)
  })
  
  return {
    overall_score: avgScores.overall,
    technical_score: Math.round((avgScores.technicalDepth + avgScores.relevance) / 2 * 10), // Convert to 0-100
    behavioral_score: Math.round((avgScores.clarity + avgScores.confidence) / 2 * 10), // Convert to 0-100
    total_questions: totalQuestions,
    answered_questions: answeredQuestions,
    skipped_questions: skippedQuestions,
    analysis_success_rate: Math.round((validAnalyses.length / totalQuestions) * 100),
    detailed_scores: avgScores
  }
}

/**
 * Get analysis summary statistics
 */
export function getAnalysisSummary(analyses: QuestionAnalysis[]) {
  const total = analyses.length
  const successful = analyses.filter(a => a.status === 'success').length
  const failed = analyses.filter(a => a.status === 'failed').length
  
  return {
    total,
    successful,
    failed,
    success_rate: total > 0 ? (successful / total * 100).toFixed(1) : 0
  }
}