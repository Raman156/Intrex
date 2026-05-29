import { GoogleGenerativeAI } from '@google/generative-ai'

import { debugLog, debugError, debugWarn } from '../utils/logger'
import { geminiModel, safetySettings } from './gemini-client'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

// Get the Gemini model for multimodal content
export const geminiModel = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash',
  generationConfig: {
    temperature: 0.1, // Low temperature for accurate transcription
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 2048,
  }
})

// Safety settings for transcription and analysis
export const safetySettings = [
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_NONE'
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH', 
    threshold: 'BLOCK_NONE'
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_NONE'
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_NONE'
  }
]

// Retry utility with exponential backoff and better error handling
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  onProgress?: (attempt: number, maxRetries: number) => void
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      onProgress?.(attempt, maxRetries)
      return await operation()
    } catch (error) {
      lastError = error as Error
      debugError(`Attempt ${attempt}/${maxRetries} failed:`, error)
      
      // Classify the error
      const geminiError = classifyGeminiError(lastError)
      
      // Don't retry on non-retryable errors
      if (!geminiError.retryable) {
        debugError('Non-retryable error encountered:', geminiError.message)
        throw geminiError
      }
      
      // If this isn't the last attempt, wait before retrying
      if (attempt < maxRetries) {
        const delay = Math.min(Math.pow(2, attempt - 1) * baseDelay, 10000) // Cap at 10 seconds
        debugLog(`Waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw classifyGeminiError(lastError || new Error('Operation failed after retries'))
}

// Error boundary for Gemini API calls
export class GeminiError extends Error {
  constructor(
    message: string,
    public readonly originalError?: Error,
    public readonly retryable: boolean = true,
    public readonly errorType: 'api_key' | 'quota' | 'network' | 'timeout' | 'unknown' = 'unknown'
  ) {
    super(message)
    this.name = 'GeminiError'
  }
}

// Loading state management
export interface LoadingState {
  isLoading: boolean
  operation: string
  progress?: number
}

// Create loading state hook
export function createLoadingState(operation: string): LoadingState {
  return {
    isLoading: true,
    operation,
    progress: 0
  }
}

// Enhanced error classification
export function classifyGeminiError(error: Error): GeminiError {
  const message = error.message.toLowerCase()
  
  if (message.includes('api key') || message.includes('authentication')) {
    return new GeminiError(
      'Invalid or missing API key. Please check your Gemini API configuration.',
      error,
      false, // Not retryable
      'api_key'
    )
  }
  
  if (message.includes('quota') || message.includes('rate limit') || message.includes('429')) {
    return new GeminiError(
      'API quota exceeded or rate limited. Please try again later.',
      error,
      true,
      'quota'
    )
  }
  
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return new GeminiError(
      'Network error. Please check your internet connection.',
      error,
      true,
      'network'
    )
  }
  
  if (message.includes('timeout') || message.includes('aborted')) {
    return new GeminiError(
      'Request timed out. Please try again.',
      error,
      true,
      'timeout'
    )
  }
  
  return new GeminiError(
    'AI service temporarily unavailable. Please try again.',
    error,
    true,
    'unknown'
  )
}

// Validate API key on initialization
export function validateGeminiSetup(): boolean {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    debugError('Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your environment.')
    return false
  }
  return true
}