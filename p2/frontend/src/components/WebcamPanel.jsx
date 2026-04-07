import { useEffect, useRef, useState, useCallback } from 'react'

const WS_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api')
  .replace(/^http/, 'ws')
  .replace(/\/api\/?$/, '') + '/api/live'

const EMOTION_EMOJI = {
  happy: '😊', sad: '😢', angry: '😠', fear: '😨',
  surprise: '😲', disgust: '🤢', neutral: '😐'
}

function MetricBar({ label, value, color = 'bg-blue-500' }) {
  const pct = Math.round((value || 0) * 100)
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{label}</span>
        <span className="text-white font-medium">{pct}%</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

/**
 * WebcamPanel
 * - Camera preview is always on (starts as soon as component mounts)
 * - WebSocket analysis only runs when `active=true` AND `sessionId` is set
 */
export default function WebcamPanel({ sessionId, active }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const wsRef = useRef(null)
  const streamRef = useRef(null)
  const frameIntervalRef = useRef(null)

  const [camReady, setCamReady] = useState(false)
  const [camError, setCamError] = useState(null)
  const [wsStatus, setWsStatus] = useState('idle') // idle | connecting | connected | error
  const [metrics, setMetrics] = useState(null)
  const [noFace, setNoFace] = useState(false)

  // ── 1. Start camera on mount, keep it running ──────────────────────────────
  useEffect(() => {
    let cancelled = false

    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false })
      .then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch(() => {})
            setCamReady(true)
          }
        }
      })
      .catch(() => setCamError('Camera access denied or unavailable.'))

    return () => {
      cancelled = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    }
  }, [])

  // ── 2. Connect / disconnect WebSocket based on active + sessionId ──────────
  const stopWs = useCallback(() => {
    clearInterval(frameIntervalRef.current)
    frameIntervalRef.current = null
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setWsStatus('idle')
    setMetrics(null)
    setNoFace(false)
  }, [])

  useEffect(() => {
    if (!active || !sessionId || !camReady) {
      stopWs()
      return
    }

    let cancelled = false
    setWsStatus('connecting')

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      if (cancelled) { ws.close(); return }
      setWsStatus('connected')
      ws.send(JSON.stringify({ type: 'init', session_id: sessionId, start_time: Date.now() }))

      // Send a frame every 300ms
      frameIntervalRef.current = setInterval(() => {
        if (
          !canvasRef.current ||
          !videoRef.current ||
          !videoRef.current.videoWidth ||
          ws.readyState !== WebSocket.OPEN
        ) return

        const canvas = canvasRef.current
        canvas.width = 320
        canvas.height = 240
        const ctx = canvas.getContext('2d')
        ctx.drawImage(videoRef.current, 0, 0, 320, 240)
        const frame = canvas.toDataURL('image/jpeg', 0.65)
        ws.send(JSON.stringify({ frame }))
      }, 300)
    }

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'metrics') {
          setNoFace(!!msg.data.no_face)
          if (!msg.data.no_face) setMetrics(msg.data)
        }
      } catch (_) {}
    }

    ws.onerror = () => { if (!cancelled) setWsStatus('error') }
    ws.onclose = () => {
      clearInterval(frameIntervalRef.current)
      if (!cancelled) setWsStatus('idle')
    }

    return () => {
      cancelled = true
      stopWs()
    }
  }, [active, sessionId, camReady, stopWs])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-xl overflow-hidden border border-surface-border bg-gray-900 flex flex-col">

      {/* Camera feed */}
      <div className="relative bg-black" style={{ aspectRatio: '4/3' }}>
        {camError ? (
          <div className="absolute inset-0 flex items-center justify-center text-red-400 text-xs text-center px-4">
            {camError}
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' /* mirror */ }}
            />
            {!camReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </>
        )}

        {/* WS status badge */}
        <div className="absolute top-2 left-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
            wsStatus === 'connected' ? 'bg-green-500 text-white' :
            wsStatus === 'connecting' ? 'bg-yellow-400 text-black' :
            wsStatus === 'error'     ? 'bg-red-500 text-white' :
            'bg-gray-700 text-gray-300'
          }`}>
            {wsStatus === 'connected' ? '● Analyzing' :
             wsStatus === 'connecting' ? '◌ Connecting' :
             wsStatus === 'error'     ? '✕ Error' :
             camReady                 ? '○ Camera Ready' : '○ Starting...'}
          </span>
        </div>

        {/* No face overlay */}
        {noFace && wsStatus === 'connected' && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center">
            <span className="bg-yellow-500/90 text-black text-xs font-semibold px-3 py-1 rounded-full">
              ⚠ No face detected — look at the camera
            </span>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Metrics panel */}
      <div className="p-3 space-y-2 flex-1">
        {wsStatus === 'connected' && metrics ? (
          <>
            <MetricBar label="Eye Contact" value={metrics.eye_contact} color="bg-blue-500" />
            <MetricBar label="Engagement"  value={metrics.engagement}  color="bg-violet-500" />
            <MetricBar label="Smile"       value={metrics.smile}       color="bg-green-400" />
            <MetricBar label="Centering"   value={metrics.centering}   color="bg-cyan-500" />

            {metrics.emotion && (
              <div className="flex items-center justify-between text-xs pt-2 mt-1 border-t border-gray-700">
                <span className="text-gray-400">Emotion</span>
                <span className="text-white font-semibold capitalize">
                  {EMOTION_EMOJI[metrics.emotion] || '🎭'} {metrics.emotion}
                  {metrics.emotion_confidence
                    ? <span className="text-gray-400 font-normal"> ({Math.round(metrics.emotion_confidence)}%)</span>
                    : null}
                </span>
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-gray-500 text-center py-2">
            {wsStatus === 'connected'
              ? 'Waiting for face detection...'
              : wsStatus === 'connecting'
              ? 'Connecting to analysis server...'
              : active
              ? 'Preparing facial analysis...'
              : 'Facial analysis starts when interview begins'}
          </p>
        )}
      </div>
    </div>
  )
}
