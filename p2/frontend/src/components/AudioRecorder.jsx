import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { transcribeAudio, validateAudioBlob } from '../services/transcriptionService'
import { debugLog, debugError } from '../utils/logger'

function AudioRecorder({ 
  questionId, 
  onRecordingComplete, 
  isRecording, 
  onStartRecording, 
  onStopRecording,
  enableTranscription = true,
  autoStart = false
}) {
  const [audioLevel, setAudioLevel] = useState(0)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [silenceWarning, setSilenceWarning] = useState(false)
  const [waveformData, setWaveformData] = useState(new Array(20).fill(0))
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcriptionError, setTranscriptionError] = useState(null)
  
  const mediaRecorderRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const streamRef = useRef(null)
  const audioChunksRef = useRef([])
  const animationFrameRef = useRef(null)
  const timerRef = useRef(null)
  const silenceTimeoutRef = useRef(null)
  const lastAudioTimeRef = useRef(Date.now())
  const startTimeRef = useRef(null)

  // Session storage key for this question
  const storageKey = `interview_audio_${questionId}`

  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus'
    ]
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }
    return 'audio/webm' // fallback
  }
  const startAudioMonitoring = (stream) => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)
      
      analyserRef.current.fftSize = 512
      analyserRef.current.smoothingTimeConstant = 0.8
      
      const bufferLength = analyserRef.current.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      const waveformArray = new Uint8Array(analyserRef.current.fftSize)
      
      const updateAudioVisualization = () => {
        if (!isRecording) return
        
        analyserRef.current.getByteFrequencyData(dataArray)
        analyserRef.current.getByteTimeDomainData(waveformArray)
        
        // Calculate average volume
        const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength
        const normalizedLevel = Math.min(average / 128, 1)
        setAudioLevel(normalizedLevel)
        
        // Update waveform data (sample every 25th point for visualization)
        const waveform = []
        for (let i = 0; i < 20; i++) {
          const index = Math.floor((i / 20) * waveformArray.length)
          const value = (waveformArray[index] - 128) / 128
          waveform.push(Math.abs(value))
        }
        setWaveformData(waveform)
        
        // Check for audio activity
        if (normalizedLevel > 0.02) {
          lastAudioTimeRef.current = Date.now()
          setSilenceWarning(false)
        }
        
        animationFrameRef.current = requestAnimationFrame(updateAudioVisualization)
      }
      
      updateAudioVisualization()
      
      // Start silence detection
      const checkSilence = () => {
        if (!isRecording) return
        
        const timeSinceLastAudio = Date.now() - lastAudioTimeRef.current
        if (timeSinceLastAudio > 5000) {
          setSilenceWarning(true)
        }
        
        silenceTimeoutRef.current = setTimeout(checkSilence, 1000)
      }
      
      setTimeout(checkSilence, 1000)
      
    } catch (error) {
      debugError('Error setting up audio monitoring:', error)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      })
      
      streamRef.current = stream
      audioChunksRef.current = []
      
      const mimeType = getSupportedMimeType()
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType })
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        
        // Save to session storage
        const reader = new FileReader()
        reader.onload = () => {
          sessionStorage.setItem(storageKey, reader.result)
        }
        reader.readAsDataURL(audioBlob)
        
        // Handle transcription if enabled
        let transcript = null
        let transcriptionStatus = 'pending'
        
        if (enableTranscription && validateAudioBlob(audioBlob)) {
          setIsTranscribing(true)
          setTranscriptionError(null)
          
          try {
            debugLog(`Starting transcription for question: ${questionId}`)
            transcript = await transcribeAudio(audioBlob)
            transcriptionStatus = 'success'
            debugLog(`Transcription completed for question: ${questionId}`)
          } catch (error) {
            debugError(`Transcription failed for question ${questionId}:`, error.message)
            setTranscriptionError(error.message)
            transcriptionStatus = 'transcription_failed'
          } finally {
            setIsTranscribing(false)
          }
        }
        
        onRecordingComplete(audioBlob, recordingDuration, transcript, transcriptionStatus)
      }
      
      startAudioMonitoring(stream)
      mediaRecorderRef.current.start(100) // Collect data every 100ms
      
      startTimeRef.current = Date.now()
      lastAudioTimeRef.current = Date.now()
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
      
      onStartRecording()
      
    } catch (error) {
      debugError('Error starting recording:', error)
      alert('Could not start recording. Please check your microphone.')
    }
  }
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    
    cleanup()
    onStopRecording()
  }

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    
    setSilenceWarning(false)
    setAudioLevel(0)
    setWaveformData(new Array(20).fill(0))
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const clearStoredAudio = () => {
    sessionStorage.removeItem(storageKey)
  }

  // Check for stored audio on mount
  useEffect(() => {
    const storedAudio = sessionStorage.getItem(storageKey)
    if (storedAudio) {
      // Could restore previous recording if needed
    }
    
    return cleanup
  }, [])

  // Auto-start recording when TTS finishes
  useEffect(() => {
    if (autoStart && !isRecording) {
      startRecording()
    }
  }, [autoStart])

  return (
    <div className="space-y-4">
      {/* Transcription Status */}
      <AnimatePresence>
        {isTranscribing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-blue-500/20 border border-blue-500/30 text-blue-400 p-3 rounded-lg 
              flex items-center gap-2 text-sm"
          >
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Transcribing audio...</span>
          </motion.div>
        )}
        
        {transcriptionError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-500/20 border border-red-500/30 text-red-400 p-3 rounded-lg 
              flex items-center gap-2 text-sm"
          >
            <span>⚠️</span>
            <div>
              <div className="font-semibold">Transcription Failed</div>
              <div className="text-xs opacity-80">{transcriptionError}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Silence Warning Toast */}
      <AnimatePresence>
        {silenceWarning && isRecording && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 p-3 rounded-lg 
              flex items-center gap-2 text-sm"
          >
            <span>⚠️</span>
            <span>We stopped detecting your voice. Please check your mic.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording Interface */}
      <div className="glass rounded-2xl p-8 text-center border border-surface-border">
        {!isRecording ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-20 h-20 recorder-icon recorder-icon--idle rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🎤</span>
            </div>
            <p className="text-gray-400 mb-6">Click the button below to record your answer</p>
            <motion.button
              onClick={startRecording}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-red-500/20 border-2 border-red-500/30 text-red-400 py-4 px-10 rounded-full 
                hover:bg-red-500/30 transition-all duration-200 font-semibold text-lg"
            >
              Start Recording
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Recording Timer */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: 'var(--error)' }}
              />
              <p className="text-4xl font-mono font-bold text-white">{formatTime(recordingDuration)}</p>
            </div>

            {/* Live Waveform */}
            <div className="mb-6">
              <div className="flex items-end justify-center gap-1 h-16 mb-2">
                {waveformData.map((value, index) => (
                  <motion.div
                    key={index}
                    className="bg-gradient-to-t from-blue-500 to-green-400 rounded-full"
                    style={{
                      width: '4px',
                      height: `${Math.max(4, value * 60)}px`
                    }}
                    animate={{
                      height: `${Math.max(4, value * 60)}px`
                    }}
                    transition={{ duration: 0.1 }}
                  />
                ))}
              </div>
              
              {/* Audio Level Bar */}
              <div className="w-full max-w-xs mx-auto">
                <div className="h-2 bg-surface-border rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                    style={{ width: `${audioLevel * 100}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {audioLevel > 0.02 ? 'Recording...' : 'Speak louder'}
                </p>
              </div>
            </div>

            <p className="text-gray-400 mb-6">Recording in progress...</p>
            <motion.button
              onClick={stopRecording}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="glass glass-hover text-white py-4 px-10 rounded-full 
                transition-all duration-200 font-semibold text-lg"
            >
              ⏹ Stop Recording
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default AudioRecorder