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
function parseAnalysisResponse(rawResponse) {
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
        console.error('Failed to parse analysis response:', rawResponse)
        return {
          scores: {
            relevance: 5,
            clarity: 5,
            technicalDepth: 5,
            confidence: 5,
            overall: 50
          },
          strengths: ['Response provided'],
          improvements: ['Analysis parsing failed - manual review recommended'],
          verdict: 'Unable to analyze response due to parsing error'
        }
      }
    }
  }
}

/**
 * Analyze a single interview answer using Gemini
 * @param {string} questionText - The interview question
 * @param {string} transcript - The candidate's transcribed answer
 * @param {string} targetedRole - The role being interviewed for
 * @param {number} yearsOfExperience - Candidate's years of experience
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<Object>} - Analysis results
 */
export async function analyzeAnswer(
  questionText,
  transcript,
  targetedRole = 'Software Developer',
  yearsOfExperience = 3,
  maxRetries = 3
) {
  if (!transcript || transcript.trim().length === 0) {
    return {
      scores: {
        relevance: 0,
        clarity: 0,
        technicalDepth: 0,
        confidence: 0,
        overall: 0
      },
      strengths: [],
      improvements: ['No answer provided'],
      verdict: 'Question was not answered'
    }
  }

  const prompt = `You are an expert interview coach evaluating a candidate's spoken answer during a job interview. Analyze the answer and return ONLY a valid JSON object. No markdown, no backticks, no explanation — raw JSON only.

Interview Question: ${questionText}
Candidate's Answer: ${transcript}
Role Being Interviewed For: ${targetedRole}
Years of Experience: ${yearsOfExperience}

Evaluate how well the candidate answered this interview question. Return exactly this JSON structure:
{
  "scores": {
    "relevance": <integer 0-10, how directly the answer addresses the question>,
    "clarity": <integer 0-10, how clearly and confidently it was communicated>,
    "technicalDepth": <integer 0-10, depth of technical knowledge shown>,
    "confidence": <integer 0-10, confidence and structure of the response>,
    "overall": <integer 0-100, overall interview answer quality>
  },
  "strengths": ["specific strength about this answer", "another strength"],
  "improvements": ["specific actionable improvement for this answer", "another improvement"],
  "verdict": "one concise sentence summarizing how well the candidate answered this interview question"
}`

  let lastError = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      debugLog(`Analysis attempt ${attempt}/${maxRetries} for question`)
      
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
        throw new Error('Empty analysis response received')
      }
      
      const analysis = parseAnalysisResponse(rawText)
      
      // Validate the analysis structure
      if (!analysis.scores || !analysis.strengths || !analysis.improvements || !analysis.verdict) {
        throw new Error('Invalid analysis structure received')
      }
      
      // Ensure scores are within valid ranges
      const validatedAnalysis = {
        scores: {
          relevance: Math.max(0, Math.min(10, analysis.scores.relevance || 0)),
          clarity: Math.max(0, Math.min(10, analysis.scores.clarity || 0)),
          technicalDepth: Math.max(0, Math.min(10, analysis.scores.technicalDepth || 0)),
          confidence: Math.max(0, Math.min(10, analysis.scores.confidence || 0)),
          overall: Math.max(0, Math.min(100, analysis.scores.overall || 0))
        },
        strengths: Array.isArray(analysis.strengths) ? analysis.strengths : ['Analysis completed'],
        improvements: Array.isArray(analysis.improvements) ? analysis.improvements : ['Continue practicing'],
        verdict: typeof analysis.verdict === 'string' ? analysis.verdict : 'Analysis completed'
      }
      
      debugLog(`Analysis successful on attempt ${attempt}`)
      return validatedAnalysis
      
    } catch (error) {
      lastError = error
      debugError(`Analysis attempt ${attempt} failed:`, error.message)
      
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
  
  // All retries failed - return fallback analysis
  debugError(`Analysis failed after ${maxRetries} attempts. Last error: ${lastError?.message}`)
  return {
    scores: {
      relevance: 5,
      clarity: 5,
      technicalDepth: 5,
      confidence: 5,
      overall: 50
    },
    strengths: ['Response provided'],
    improvements: ['Analysis failed - manual review recommended'],
    verdict: `Analysis failed: ${lastError?.message || 'Unknown error'}`
  }
}
/**
 * Batch analyze multiple interview answers
 * @param {Array} analysisItems - Array of {questionId, questionText, transcript, targetedRole, yearsOfExperience}
 * @returns {Promise<Array>} - Array of analysis results with questionId
 */
export async function batchAnalyzeAnswers(analysisItems) {
  const results = []
  
  for (const item of analysisItems) {
    try {
      debugLog(`Starting analysis for question: ${item.questionId}`)
      
      const analysis = await analyzeAnswer(
        item.questionText,
        item.transcript,
        item.targetedRole,
        item.yearsOfExperience
      )
      
      results.push({
        questionId: item.questionId,
        ...analysis,
        status: 'success'
      })
      
      debugLog(`Analysis completed for question: ${item.questionId}`)
      
    } catch (error) {
      debugError(`Analysis failed for question ${item.questionId}:`, error.message)
      
      results.push({
        questionId: item.questionId,
        scores: {
          relevance: 0,
          clarity: 0,
          technicalDepth: 0,
          confidence: 0,
          overall: 0
        },
        strengths: [],
        improvements: ['Analysis failed - manual review needed'],
        verdict: `Analysis error: ${error.message}`,
        status: 'analysis_failed',
        error: error.message
      })
    }
    
    // Small delay between requests to avoid rate limiting
    await sleep(1000)
  }
  
  return results
}

/**
 * Calculate overall interview performance from individual analyses
 * @param {Array} analyses - Array of question analyses
 * @returns {Object} - Overall performance summary
 */
export function calculateOverallPerformance(analyses) {
  if (!analyses || analyses.length === 0) {
    return {
      overall_score: 0,
      technical_score: 0,
      behavioral_score: 0,
      total_questions: 0,
      answered_questions: 0,
      skipped_questions: 0,
      analysis_success_rate: 0
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
      analysis_success_rate: 0
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
    avgScores[key] = Math.round(avgScores[key] / count)
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
 * @param {Array} analyses - Array of question analyses
 * @returns {Object} - Summary statistics
 */
export function getAnalysisSummary(analyses) {
  const total = analyses.length
  const successful = analyses.filter(a => a.status === 'success').length
  const failed = analyses.filter(a => a.status === 'analysis_failed').length
  
  return {
    total,
    successful,
    failed,
    success_rate: total > 0 ? (successful / total * 100).toFixed(1) : 0
  }
}