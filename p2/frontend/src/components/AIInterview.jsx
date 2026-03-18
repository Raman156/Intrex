import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { startAIInterview, submitAnswer, completeInterview, checkApiHealth, getAIInterviewStatus } from '../api/api'
import { batchAnalyzeAnswers, calculateOverallPerformance } from '../services/analysisService'
import { generateSessionSummary, createInterviewSessionResult, generatePerformanceInsights } from '../services/summaryService'
import { saveSessionResult } from '../services/sessionStorage'
import { downloadHTMLReport, downloadTextReport, downloadJSONReport } from '../utils/pdfGenerator'
import MicrophoneValidator from './MicrophoneValidator'
import AudioRecorder from './AudioRecorder'
import QuestionTimer from './QuestionTimer'
import TranscriptionStatus from './TranscriptionStatus'
import AnalysisDisplay from './AnalysisDisplay'
import SessionSummary from './SessionSummary'
import ResultsPage from './ResultsPage'

function AIInterview() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('upload') // upload, mic-check, interview, analyzing, results
  const [sessionId, setSessionId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [answers, setAnswers] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [overallResults, setOverallResults] = useState(null)
  const [showMicValidator, setShowMicValidator] = useState(false)
  const [questionSessions, setQuestionSessions] = useState(new Map()) // QuestionSession data
  const [strictMode, setStrictMode] = useState(false) // Timer pause/resume control
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 0 })
  const [sessionSummary, setSessionSummary] = useState(null)
  const [performanceInsights, setPerformanceInsights] = useState(null)
  const [finalSessionResult, setFinalSessionResult] = useState(null)
  const [serviceStatus, setServiceStatus] = useState({
    checking: true,
    apiConnected: false,
    geminiActive: false,
    error: ''
  })
  
  // Form state
  const [resume, setResume] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [numQuestions, setNumQuestions] = useState(5)
  const [isGenerating, setIsGenerating] = useState(false)
  const [targetedRole, setTargetedRole] = useState('Software Developer')
  const [yearsOfExperience, setYearsOfExperience] = useState(3)

  // Action handlers for ResultsPage
  const handleRetryInterview = () => {
    cleanup() // Clean up audio resources
    setStep('upload')
    setSessionId(null)
    setQuestions([])
    setCurrentQuestionIndex(0)
    setAnswers([])
    setOverallResults(null)
    setResume(null)
    setJobDescription('')
    setIsRecording(false)
    setQuestionSessions(new Map())
    setStrictMode(false)
    setIsAnalyzing(false)
    setAnalysisProgress({ current: 0, total: 0 })
    setTargetedRole('Software Developer')
    setYearsOfExperience(3)
    setSessionSummary(null)
    setPerformanceInsights(null)
    setFinalSessionResult(null)
  }

  const handleGoToDashboard = () => {
    navigate('/dashboard')
  }

  const refreshServiceStatus = async () => {
    setServiceStatus(prev => ({ ...prev, checking: true, error: '' }))
    try {
      const status = await getAIInterviewStatus()
      setServiceStatus({
        checking: false,
        apiConnected: !!status.api_connected,
        geminiActive: !!status.gemini_active,
        error: ''
      })
    } catch (error) {
      setServiceStatus({
        checking: false,
        apiConnected: false,
        geminiActive: false,
        error: error.message || 'Unable to reach backend'
      })
    }
  }

  const handleDownloadReport = () => {
    if (finalSessionResult) {
      // Try to download HTML report first (best formatting)
      const success = downloadHTMLReport(finalSessionResult)
      if (success) {
        alert('Report downloaded successfully!')
      } else {
        // Fallback to text report
        const textSuccess = downloadTextReport(finalSessionResult)
        if (textSuccess) {
          alert('Report downloaded as text file!')
        } else {
          alert('Failed to generate report. Please try again.')
        }
      }
    } else {
      alert('No report data available for download')
    }
  }

  // Initialize question sessions when questions are loaded
  useEffect(() => {
    if (questions.length > 0) {
      const sessions = new Map()
      questions.forEach((question, index) => {
        const questionId = question.id || `question_${index}`
        sessions.set(questionId, {
          questionId,
          questionText: question.question,
          allocatedTime: question.allocatedTime || 120, // Default 2 minutes
          timeUsed: 0,
          skipped: false,
          audioBlob: null,
          transcript: null,
          transcriptionStatus: 'pending',
          analysis: null,
          analysisStatus: 'pending'
        })
      })
      setQuestionSessions(sessions)
    }
  }, [questions])

  useEffect(() => {
    refreshServiceStatus()
  }, [])

  const getCurrentQuestionId = () => {
    return questions[currentQuestionIndex]?.id || `question_${currentQuestionIndex}`
  }

  const getCurrentSession = () => {
    return questionSessions.get(getCurrentQuestionId())
  }

  const updateQuestionSession = (questionId, updates) => {
    setQuestionSessions(prev => {
      const newSessions = new Map(prev)
      const session = newSessions.get(questionId)
      if (session) {
        newSessions.set(questionId, { ...session, ...updates })
      }
      return newSessions
    })
  }

  const handleStartInterview = async (e) => {
    e.preventDefault()
    
    if (!resume || !jobDescription.trim()) {
      alert('Please upload a resume and provide a job description')
      return
    }
    
    setIsGenerating(true)
    
    try {
      await checkApiHealth()

      const normalizedExperience = Number.isFinite(yearsOfExperience)
        ? yearsOfExperience
        : parseInt(yearsOfExperience, 10) || 0

      const difficulty = normalizedExperience <= 1
        ? 'beginner'
        : normalizedExperience <= 4
          ? 'intermediate'
          : 'advanced'

      const enrichedJobDescription = `${jobDescription.trim()}\n\nCandidate Context:\n- Target Role: ${targetedRole.trim()}\n- Years of Experience: ${normalizedExperience}`

      const response = await startAIInterview(
        resume,
        enrichedJobDescription,
        numQuestions,
        { difficulty }
      )
      
      if (response.success) {
        setSessionId(response.session_id)
        setQuestions(response.questions)
        setShowMicValidator(true) // Show mic validator before interview
      }
    } catch (error) {
      console.error('Error starting interview:', error)
      alert(error.message || 'Failed to start interview')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleMicValidationComplete = (success) => {
    setShowMicValidator(false)
    if (success) {
      setStep('interview')
    }
  }

  const handleRecordingComplete = (audioBlob, duration, transcript = null, transcriptionStatus = 'pending') => {
    const questionId = getCurrentQuestionId()
    updateQuestionSession(questionId, { 
      audioBlob,
      transcript,
      transcriptionStatus
    })
  }

  const handleTimerComplete = (timeUsed, skipped = false) => {
    const questionId = getCurrentQuestionId()
    updateQuestionSession(questionId, { 
      timeUsed,
      skipped 
    })
    
    if (skipped) {
      // Move to next question without submitting
      moveToNextQuestion()
    } else {
      // Auto-submit the current recording
      handleSubmitAnswer()
    }
  }

  const handleSkipQuestion = (timeUsed) => {
    handleTimerComplete(timeUsed, true)
  }

  const handleQuestionDone = (timeUsed) => {
    handleTimerComplete(timeUsed, false)
  }

  const moveToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setIsRecording(false)
    } else {
      // Complete interview
      handleCompleteInterview()
    }
  }

  const handleSubmitAnswer = async () => {
    const questionId = getCurrentQuestionId()
    const session = getCurrentSession()
    
    if (!session?.audioBlob && !session?.skipped) {
      alert('Please record an answer first')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      let response
      
      if (session.skipped) {
        // Submit as skipped question
        response = {
          success: true,
          answer_text: '[Question Skipped]',
          analysis: { score: 0, feedback: 'Question was skipped by user.' }
        }
      } else {
        // Submit recorded answer
        response = await submitAnswer(
          sessionId,
          currentQuestionIndex,
          session.audioBlob,
          null,
          session.timeUsed
        )
      }
      
      if (response.success) {
        const newAnswer = {
          question: questions[currentQuestionIndex].question,
          answer_text: response.answer_text,
          analysis: response.analysis,
          timeUsed: session.timeUsed,
          skipped: session.skipped
        }
        
        setAnswers([...answers, newAnswer])
        
        // Clean up blob URL to prevent memory leaks
        if (session.audioBlob) {
          URL.revokeObjectURL(session.audioBlob)
        }
        
        // Update session with transcript
        updateQuestionSession(questionId, { 
          transcript: response.answer_text 
        })
        
        // Move to next question
        moveToNextQuestion()
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
      alert(error.response?.data?.detail || 'Failed to submit answer')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCompleteInterview = async () => {
    try {
      setStep('analyzing')
      setIsAnalyzing(true)
      
      // Prepare analysis items for all answered questions
      const analysisItems = []
      questionSessions.forEach((session) => {
        if (session.transcript && !session.skipped) {
          analysisItems.push({
            questionId: session.questionId,
            questionText: session.questionText,
            transcript: session.transcript,
            targetedRole,
            yearsOfExperience
          })
        }
      })
      
      setAnalysisProgress({ current: 0, total: analysisItems.length + 1 }) // +1 for summary generation
      
      // Batch analyze all answers
      console.log(`Starting analysis for ${analysisItems.length} questions`)
      const analysisResults = await batchAnalyzeAnswers(analysisItems)
      
      // Update question sessions with analysis results
      analysisResults.forEach((result) => {
        updateQuestionSession(result.questionId, {
          analysis: result,
          analysisStatus: result.status
        })
      })
      
      setAnalysisProgress(prev => ({ ...prev, current: prev.current + 1 }))
      
      // Generate session summary using Gemini
      console.log('Generating session summary...')
      const summary = await generateSessionSummary(analysisResults, targetedRole)
      setSessionSummary(summary)
      
      // Calculate overall performance
      const overallPerformance = calculateOverallPerformance(analysisResults)
      
      // Create comprehensive session result
      const sessionResult = createInterviewSessionResult(
        sessionId,
        user?.id || 'anonymous-user',
        targetedRole,
        analysisResults,
        summary,
        questionSessions
      )
      
      // Generate performance insights
      const insights = generatePerformanceInsights(sessionResult)
      setPerformanceInsights(insights)
      setFinalSessionResult(sessionResult)
      
      // Save session result to user's record
      const saveSuccess = saveSessionResult(sessionResult)
      if (saveSuccess) {
        console.log('Session result saved to user record')
      } else {
        console.warn('Failed to save session result')
      }
      
      // Prepare detailed answers for results display
      const detailedAnswers = Array.from(questionSessions.values()).map((session, index) => ({
        question: session.questionText,
        answer_text: session.transcript || '[Question Skipped]',
        analysis: session.analysis || {
          scores: { relevance: 0, clarity: 0, technicalDepth: 0, confidence: 0, overall: 0 },
          strengths: [],
          improvements: session.skipped ? ['Question was skipped'] : ['No analysis available'],
          verdict: session.skipped ? 'Question was skipped by user' : 'Analysis not available'
        },
        timeUsed: session.timeUsed,
        skipped: session.skipped,
        transcriptionStatus: session.transcriptionStatus,
        analysisStatus: session.analysisStatus
      }))
      
      setOverallResults({ ...overallPerformance, sessionSummary: summary })
      setAnswers(detailedAnswers)
      setStep('results')
      
      console.log('Interview analysis and summary completed successfully')
      
    } catch (error) {
      console.error('Error completing interview:', error)
      alert('Failed to complete interview analysis')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Cleanup function for memory management
  const cleanup = () => {
    // Clean up all stored audio blobs
    questionSessions.forEach(session => {
      if (session.audioBlob instanceof Blob) {
        URL.revokeObjectURL(session.audioBlob)
      }
    })
    setQuestionSessions(new Map())
    
    // Clear session storage
    questions.forEach((_, index) => {
      sessionStorage.removeItem(`interview_audio_${index}`)
    })
  }

  useEffect(() => {
    return cleanup
  }, [])

  return (
    <div className="glass rounded-2xl p-8 border border-surface-border">
      {/* Microphone Validator Modal */}
      <MicrophoneValidator
        isVisible={showMicValidator}
        onValidationComplete={handleMicValidationComplete}
      />
      
      <AnimatePresence mode="wait">
        {step === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-accent rounded-xl flex items-center justify-center professional-glow">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">AI Interview Setup</h3>
                <p className="text-sm text-gray-400">Upload your resume and get personalized questions</p>
              </div>
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                serviceStatus.checking
                  ? 'bg-gray-500/10 text-gray-300 border-gray-500/30'
                  : serviceStatus.apiConnected
                    ? 'bg-green-500/10 text-green-400 border-green-500/30'
                    : 'bg-red-500/10 text-red-400 border-red-500/30'
              }`}>
                {serviceStatus.checking
                  ? 'Checking API...'
                  : serviceStatus.apiConnected
                    ? 'API Connected'
                    : 'API Disconnected'}
              </span>

              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                serviceStatus.checking
                  ? 'bg-gray-500/10 text-gray-300 border-gray-500/30'
                  : serviceStatus.geminiActive
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {serviceStatus.checking
                  ? 'Checking Gemini...'
                  : serviceStatus.geminiActive
                    ? 'Gemini Active'
                    : 'Gemini Fallback Mode'}
              </span>

              <button
                type="button"
                onClick={refreshServiceStatus}
                className="px-3 py-1 rounded-full text-xs font-semibold border border-white/20 text-gray-300 hover:bg-white/10 transition-colors"
              >
                Refresh Status
              </button>
            </div>

            {serviceStatus.error && (
              <p className="mb-4 text-xs text-red-400">Status check failed: {serviceStatus.error}</p>
            )}

            <form onSubmit={handleStartInterview} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  📄 Upload Resume (PDF, DOCX, or TXT)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={(e) => setResume(e.target.files[0])}
                    className="block w-full text-sm text-gray-300 file:mr-4 file:py-3 file:px-6
                      file:rounded-xl file:border-0 file:text-sm file:font-semibold
                      file:bg-gradient-accent file:text-white hover:file:shadow-xl
                      file:transition-all file:cursor-pointer
                      bg-surface-elevated border-2 border-surface-border rounded-xl p-3
                      hover:border-blue-500/50 transition-colors cursor-pointer"
                    required
                  />
                  {resume && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-3 flex items-center gap-2 text-sm text-green-400 bg-green-500/10 
                        border border-green-500/30 rounded-lg p-3"
                    >
                      <span>✓</span>
                      <span className="font-medium">{resume.name}</span>
                      <span className="text-gray-500">({(resume.size / 1024).toFixed(1)} KB)</span>
                    </motion.div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  💼 Job Description
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 bg-surface-elevated border-2 border-surface-border rounded-xl 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    text-white placeholder-gray-500 transition-all resize-none"
                  placeholder="Paste the job description here... Include key requirements, responsibilities, and qualifications."
                  required
                />
                <p className="mt-2 text-xs text-gray-500">
                  {jobDescription.length} characters • More detail = Better questions
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    🎯 Targeted Role
                  </label>
                  <input
                    type="text"
                    value={targetedRole}
                    onChange={(e) => setTargetedRole(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-elevated border-2 border-surface-border rounded-xl 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      text-white placeholder-gray-500 transition-all"
                    placeholder="e.g., Software Developer, Data Scientist"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    📅 Years of Experience
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-surface-elevated border-2 border-surface-border rounded-xl 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      text-white placeholder-gray-500 transition-all"
                    placeholder="0"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  🎯 Number of Questions
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[3, 5, 7, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setNumQuestions(num)}
                      className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                        numQuestions === num
                          ? 'bg-gradient-accent text-white professional-glow'
                          : 'glass glass-hover text-gray-300'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              
              <motion.button
                type="submit"
                disabled={isGenerating}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-accent text-white py-4 px-6 rounded-xl hover:shadow-xl 
                  transition-all duration-200 font-semibold text-lg disabled:bg-gray-600 
                  disabled:cursor-not-allowed professional-glow flex items-center justify-center gap-3"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating Questions...
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    Start AI Interview
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        )}
        
        {step === 'interview' && questions.length > 0 && (
          <motion.div
            key="interview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Interview Progress</span>
                <span className="text-sm font-semibold text-white">
                  {currentQuestionIndex + 1} / {questions.length}
                </span>
              </div>
              <div className="h-2 bg-surface-elevated rounded-full overflow-hidden border border-surface-border">
                <motion.div
                  className="h-full bg-gradient-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Settings Toggle */}
            <div className="flex justify-end">
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={strictMode}
                  onChange={(e) => setStrictMode(e.target.checked)}
                  className="rounded"
                />
                Strict Mode (No Pause/Resume)
              </label>
            </div>

            {/* Question Timer */}
            <QuestionTimer
              questionId={getCurrentQuestionId()}
              allocatedTime={getCurrentSession()?.allocatedTime || 120}
              onTimeUp={() => handleTimerComplete(getCurrentSession()?.allocatedTime || 120, false)}
              onSkip={handleSkipQuestion}
              onDone={handleQuestionDone}
              strictMode={strictMode}
              isRecording={isRecording}
            />

            {/* Question Card */}
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass rounded-2xl p-6 border-2 border-blue-500/30"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-accent rounded-lg flex items-center justify-center 
                  flex-shrink-0 professional-glow">
                  <span className="text-white font-bold">Q{currentQuestionIndex + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
                      {questions[currentQuestionIndex].type}
                    </span>
                    <span className="text-xs px-3 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                      {formatTime(getCurrentSession()?.allocatedTime || 120)} allocated
                    </span>
                  </div>
                  <p className="text-lg font-medium text-white leading-relaxed">
                    {questions[currentQuestionIndex].question}
                  </p>
                </div>
              </div>
            </motion.div>
            
            {/* Recording Section */}
            <AudioRecorder
              questionId={getCurrentQuestionId()}
              onRecordingComplete={handleRecordingComplete}
              isRecording={isRecording}
              onStartRecording={() => setIsRecording(true)}
              onStopRecording={() => setIsRecording(false)}
            />
            
            {/* Submit Section */}
            {!isRecording && getCurrentSession()?.audioBlob && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {/* Transcription Status */}
                <TranscriptionStatus 
                  session={getCurrentSession()} 
                  className="max-w-2xl mx-auto"
                />
                
                <div className="glass rounded-2xl p-8 text-center border border-surface-border">
                  <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">✓</span>
                  </div>
                  <p className="text-green-400 mb-2 text-lg font-semibold">Answer Recorded!</p>
                  <p className="text-gray-400 mb-6">
                    Time used: {formatTime(getCurrentSession()?.timeUsed || 0)}
                  </p>
                  <div className="flex gap-4 justify-center">
                    <motion.button
                      onClick={handleSubmitAnswer}
                      disabled={isSubmitting}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-gradient-accent text-white py-4 px-10 rounded-xl hover:shadow-xl 
                        transition-all duration-200 font-semibold text-lg disabled:bg-gray-600 
                        professional-glow flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          Submit Answer
                          <span>→</span>
                        </>
                      )}
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        const questionId = getCurrentQuestionId()
                        const session = getCurrentSession()
                        if (session?.audioBlob) {
                          URL.revokeObjectURL(session.audioBlob)
                        }
                        updateQuestionSession(questionId, { 
                          audioBlob: null, 
                          timeUsed: 0,
                          transcript: null,
                          transcriptionStatus: 'pending'
                        })
                      }}
                      disabled={isSubmitting}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="glass glass-hover text-gray-300 py-4 px-10 rounded-xl 
                        transition-all duration-200 font-semibold text-lg disabled:opacity-50"
                    >
                      Re-record
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
            
            {answers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl flex items-center gap-3"
              >
                <span className="text-2xl">✓</span>
                <div>
                  <p className="text-sm font-medium text-green-400">
                    {answers.length} answer(s) submitted
                  </p>
                  <p className="text-xs text-gray-500">
                    {questions.length - answers.length} remaining
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
        
        {step === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center space-y-6"
          >
            <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
            
            <div>
              <h3 className="text-2xl font-semibold text-white mb-2">Analyzing Your Responses</h3>
              <p className="text-gray-400 mb-6">
                {analysisProgress.current < analysisProgress.total - 1 
                  ? 'Our AI is evaluating your answers using advanced analysis...'
                  : 'Generating personalized coaching summary...'
                }
              </p>
            </div>
            
            {analysisProgress.total > 0 && (
              <div className="max-w-md mx-auto">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Progress</span>
                  <span className="text-sm font-semibold text-white">
                    {analysisProgress.current} / {analysisProgress.total}
                  </span>
                </div>
                <div className="h-2 bg-surface-elevated rounded-full overflow-hidden border border-surface-border">
                  <motion.div
                    className="h-full bg-gradient-accent"
                    initial={{ width: 0 }}
                    animate={{ width: `${(analysisProgress.current / analysisProgress.total) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}
            
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-center gap-2 text-blue-400 text-sm">
                <span>🤖</span>
                <span>Powered by Gemini AI for comprehensive analysis</span>
              </div>
            </div>
          </motion.div>
        )}
        
        {step === 'results' && overallResults && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ResultsPage
              overallResults={overallResults}
              answers={answers}
              sessionSummary={sessionSummary}
              performanceInsights={performanceInsights}
              onRetryInterview={handleRetryInterview}
              onGoToDashboard={handleGoToDashboard}
              onDownloadReport={handleDownloadReport}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AIInterview
