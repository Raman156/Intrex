/**
 * Session storage service for managing interview session data
 */

import { debugLog, debugError } from '../utils/logger'

const SESSIONS_STORAGE_KEY = 'interview_sessions'
const USER_PROFILE_KEY = 'user_profile'

/**
 * Save interview session result to local storage
 * @param {Object} sessionResult - Complete interview session result
 * @returns {boolean} - Success status
 */
export function saveSessionResult(sessionResult) {
  try {
    const existingSessions = getSessionHistory()
    
    // Add new session to the beginning of the array (most recent first)
    const updatedSessions = [sessionResult, ...existingSessions]
    
    // Keep only the last 50 sessions to prevent storage bloat
    const limitedSessions = updatedSessions.slice(0, 50)
    
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(limitedSessions))
    
    debugLog('Session saved successfully:', sessionResult.sessionId)
    return true
  } catch (error) {
    debugError('Error saving session:', error)
    return false
  }
}

/**
 * Get all session history from local storage
 * @returns {Array} - Array of session results
 */
export function getSessionHistory() {
  try {
    const sessionsData = localStorage.getItem(SESSIONS_STORAGE_KEY)
    return sessionsData ? JSON.parse(sessionsData) : []
  } catch (error) {
    debugError('Error loading session history:', error)
    return []
  }
}

/**
 * Get latest session result
 * @returns {Object|null} - Latest session or null
 */
export function getLatestSession() {
  const sessions = getSessionHistory()
  return sessions.length > 0 ? sessions[0] : null
}

/**
 * Get session by ID
 * @param {string} sessionId - Session identifier
 * @returns {Object|null} - Session result or null
 */
export function getSessionById(sessionId) {
  const sessions = getSessionHistory()
  return sessions.find(session => session.sessionId === sessionId) || null
}

/**
 * Delete session by ID
 * @param {string} sessionId - Session identifier
 * @returns {boolean} - Success status
 */
export function deleteSession(sessionId) {
  try {
    const sessions = getSessionHistory()
    const filteredSessions = sessions.filter(session => session.sessionId !== sessionId)
    
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(filteredSessions))
    return true
  } catch (error) {
    debugError('Error deleting session:', error)
    return false
  }
}
/**
 * Calculate dashboard analytics from session history
 * @param {Array} sessions - Array of session results
 * @returns {Object} - Dashboard analytics
 */
export function calculateDashboardAnalytics(sessions = null) {
  const sessionHistory = sessions || getSessionHistory()
  
  if (sessionHistory.length === 0) {
    return {
      totalSessions: 0,
      averageScore: 0,
      totalQuestionsAnswered: 0,
      totalTimeSpent: 0,
      scoreHistory: [],
      skillAverages: {
        relevance: 0,
        clarity: 0,
        technicalDepth: 0,
        confidence: 0
      },
      trendDirection: 'neutral',
      improvementRate: 0
    }
  }

  // Calculate basic metrics
  const totalSessions = sessionHistory.length
  const totalScore = sessionHistory.reduce((sum, session) => sum + (session.averageScore || 0), 0)
  const averageScore = Math.round(totalScore / totalSessions)
  
  const totalQuestionsAnswered = sessionHistory.reduce((sum, session) => sum + (session.answeredQuestions || 0), 0)
  const totalTimeSpent = sessionHistory.reduce((sum, session) => sum + (session.totalTimeUsed || 0), 0)

  // Calculate score history for trend analysis
  const scoreHistory = sessionHistory
    .slice()
    .reverse() // Oldest first for chronological order
    .map(session => ({
      date: new Date(session.timestamp).toLocaleDateString(),
      score: session.averageScore || 0,
      sessionId: session.sessionId
    }))

  // Calculate skill averages across all sessions
  const skillTotals = { relevance: 0, clarity: 0, technicalDepth: 0, confidence: 0 }
  let validSkillSessions = 0

  sessionHistory.forEach(session => {
    if (session.questionResults && session.questionResults.length > 0) {
      const sessionSkills = { relevance: 0, clarity: 0, technicalDepth: 0, confidence: 0 }
      let validQuestions = 0

      session.questionResults.forEach(result => {
        if (result.scores && result.status === 'success') {
          sessionSkills.relevance += result.scores.relevance || 0
          sessionSkills.clarity += result.scores.clarity || 0
          sessionSkills.technicalDepth += result.scores.technicalDepth || 0
          sessionSkills.confidence += result.scores.confidence || 0
          validQuestions++
        }
      })

      if (validQuestions > 0) {
        skillTotals.relevance += sessionSkills.relevance / validQuestions
        skillTotals.clarity += sessionSkills.clarity / validQuestions
        skillTotals.technicalDepth += sessionSkills.technicalDepth / validQuestions
        skillTotals.confidence += sessionSkills.confidence / validQuestions
        validSkillSessions++
      }
    }
  })

  const skillAverages = validSkillSessions > 0 ? {
    relevance: Math.round((skillTotals.relevance / validSkillSessions) * 10) / 10,
    clarity: Math.round((skillTotals.clarity / validSkillSessions) * 10) / 10,
    technicalDepth: Math.round((skillTotals.technicalDepth / validSkillSessions) * 10) / 10,
    confidence: Math.round((skillTotals.confidence / validSkillSessions) * 10) / 10
  } : { relevance: 0, clarity: 0, technicalDepth: 0, confidence: 0 }

  // Calculate trend direction
  let trendDirection = 'neutral'
  let improvementRate = 0

  if (sessionHistory.length >= 2) {
    const recentSessions = sessionHistory.slice(0, Math.min(5, sessionHistory.length))
    const olderSessions = sessionHistory.slice(Math.min(5, sessionHistory.length))
    
    if (olderSessions.length > 0) {
      const recentAvg = recentSessions.reduce((sum, s) => sum + (s.averageScore || 0), 0) / recentSessions.length
      const olderAvg = olderSessions.reduce((sum, s) => sum + (s.averageScore || 0), 0) / olderSessions.length
      
      const difference = recentAvg - olderAvg
      improvementRate = Math.round(difference * 10) / 10
      
      if (difference > 2) trendDirection = 'improving'
      else if (difference < -2) trendDirection = 'declining'
    }
  }

  return {
    totalSessions,
    averageScore,
    totalQuestionsAnswered,
    totalTimeSpent,
    scoreHistory,
    skillAverages,
    trendDirection,
    improvementRate
  }
}

/**
 * Get paginated session history
 * @param {number} page - Page number (1-based)
 * @param {number} pageSize - Number of items per page
 * @param {string} sortBy - Sort field ('date' or 'score')
 * @param {string} sortOrder - Sort order ('asc' or 'desc')
 * @returns {Objec
/**
 * Get paginated session history
 * @param {number} page - Page number (1-based)
 * @param {number} pageSize - Number of items per page
 * @param {string} sortBy - Sort field ('date' or 'score')
 * @param {string} sortOrder - Sort order ('asc' or 'desc')
 * @returns {Object} - Paginated results
 */
export function getPaginatedSessions(page = 1, pageSize = 10, sortBy = 'date', sortOrder = 'desc') {
  const sessions = getSessionHistory()
  
  // Sort sessions
  const sortedSessions = [...sessions].sort((a, b) => {
    let aValue, bValue
    
    if (sortBy === 'date') {
      aValue = new Date(a.timestamp).getTime()
      bValue = new Date(b.timestamp).getTime()
    } else if (sortBy === 'score') {
      aValue = a.averageScore || 0
      bValue = b.averageScore || 0
    } else {
      return 0
    }
    
    if (sortOrder === 'asc') {
      return aValue - bValue
    } else {
      return bValue - aValue
    }
  })
  
  // Calculate pagination
  const totalItems = sortedSessions.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const items = sortedSessions.slice(startIndex, endIndex)
  
  return {
    items,
    pagination: {
      currentPage: page,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  }
}

/**
 * Clear all session data (for testing or reset)
 * @returns {boolean} - Success status
 */
export function clearAllSessions() {
  try {
    localStorage.removeItem(SESSIONS_STORAGE_KEY)
    return true
  } catch (error) {
    debugError('Error clearing sessions:', error)
    return false
  }
}

/**
 * Export session data for backup
 * @returns {string} - JSON string of all sessions
 */
export function exportSessionData() {
  const sessions = getSessionHistory()
  return JSON.stringify({
    exportDate: new Date().toISOString(),
    totalSessions: sessions.length,
    sessions
  }, null, 2)
}

/**
 * Import session data from backup
 * @param {string} jsonData - JSON string of session data
 * @returns {boolean} - Success status
 */
export function importSessionData(jsonData) {
  try {
    const data = JSON.parse(jsonData)
    if (data.sessions && Array.isArray(data.sessions)) {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(data.sessions))
      return true
    }
    return false
  } catch (error) {
    debugError('Error importing session data:', error)
    return false
  }
}