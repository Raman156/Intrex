import { geminiModel, safetySettings, withRetry, GeminiError, classifyGeminiError, createLoadingState, LoadingState } from '../../../lib/gemini'
import { debugLog, debugError, debugWarn } from '../../../utils/logger'

interface TranscriptionResult {
  transcript: string
  status: 'success' | 'failed'
  error?: string
  loadingState?: LoadingState
}

interface BatchTranscriptionResult {
  questionId: string
  transcript: string | null
  status: 'success' | 'failed'
  error?: string
  loadingState?: LoadingState
}

/**
 * Convert Blob to base64 string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Get appropriate MIME type for audio blob
 */
function getAudioMimeType(blob: Blob): string {
  // Check blob type first
  if (blob.type) {
    return blob.type
  }
  
  // Fallback to common audio types
  return 'audio/webm'
}

/**
 * Validate audio blob before transcription
 */
export function validateAudioBlob(blob: Blob): boolean {
  if (!blob) {
    return false
  }
  
  if (blob.size === 0) {
    return false
  }
  
  // Check if it's a reasonable size (not too small, not too large)
  const minSize = 1024 // 1KB minimum
  const maxSize = 25 * 1024 * 1024 // 25MB maximum (Gemini limit)
  
  if (blob.size < minSize || blob.size > maxSize) {
    return false
  }
  
  return true
}

/**
 * Transcribe audio using Gemini's multimodal capability with enhanced error handling
 */
export async function transcribeAudio(
  audioBlob: Blob,
  onProgress?: (loadingState: LoadingState) => void
): Promise<TranscriptionResult> {
  if (!validateAudioBlob(audioBlob)) {
    return {
      transcript: '',
      status: 'failed',
      error: 'Invalid audio blob provided'
    }
  }

  const loadingState = createLoadingState('Transcribing audio')
  onProgress?.(loadingState)

  try {
    const result = await withRetry(
      async () => {
        // Convert blob to base64
        const base64Audio = await blobToBase64(audioBlob)
        const mimeType = getAudioMimeType(audioBlob)
        
        // Prepare the request
        const request = [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio,
            },
          },
          {
            text: "Transcribe this audio exactly as spoken. Return only the transcript text, nothing else. No labels, no formatting, no explanations. Just the spoken words.",
          },
        ]

        // Make the API call with safety settings
        const result = await geminiModel.generateContent(request, {
          safetySettings
        })
        
        const response = await result.response
        const transcript = response.text().trim()
        
        if (!transcript || transcript.length === 0) {
          throw new GeminiError('Empty transcription received')
        }
        
        return transcript
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

    return {
      transcript: result,
      status: 'success'
    }
    
  } catch (error) {
    debugError('Transcription failed:', error)
    
    onProgress?.({
      ...loadingState,
      isLoading: false,
      progress: 0
    })
    
    const geminiError = error instanceof GeminiError ? error : classifyGeminiError(error as Error)
    
    return {
      transcript: '',
      status: 'failed',
      error: geminiError.message
    }
  }
}

/**
 * Batch transcribe multiple audio blobs with enhanced error handling and progress tracking
 */
export async function batchTranscribeAudio(
  audioItems: Array<{ questionId: string; audioBlob: Blob }>,
  onProgress?: (questionId: string, loadingState: LoadingState) => void,
  onComplete?: (questionId: string, result: BatchTranscriptionResult) => void
): Promise<BatchTranscriptionResult[]> {
  const results: BatchTranscriptionResult[] = []
  
  for (const item of audioItems) {
    try {
      debugLog(`Starting transcription for question: ${item.questionId}`)
      
      const result = await transcribeAudio(
        item.audioBlob,
        (loadingState) => onProgress?.(item.questionId, loadingState)
      )
      
      const batchResult: BatchTranscriptionResult = {
        questionId: item.questionId,
        transcript: result.transcript,
        status: result.status,
        error: result.error,
        loadingState: result.loadingState
      }
      
      results.push(batchResult)
      onComplete?.(item.questionId, batchResult)
      
      debugLog(`Transcription completed for question: ${item.questionId}`)
      
    } catch (error) {
      debugError(`Transcription failed for question ${item.questionId}:`, error)
      
      const geminiError = error instanceof GeminiError ? error : classifyGeminiError(error as Error)
      
      const batchResult: BatchTranscriptionResult = {
        questionId: item.questionId,
        transcript: null,
        status: 'failed',
        error: geminiError.message
      }
      
      results.push(batchResult)
      onComplete?.(item.questionId, batchResult)
    }
    
    // Small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  return results
}

/**
 * Get transcription summary statistics
 */
export function getTranscriptionSummary(transcriptionResults: BatchTranscriptionResult[]) {
  const total = transcriptionResults.length
  const successful = transcriptionResults.filter(r => r.status === 'success').length
  const failed = transcriptionResults.filter(r => r.status === 'failed').length
  
  return {
    total,
    successful,
    failed,
    successRate: total > 0 ? (successful / total * 100).toFixed(1) : 0
  }
}