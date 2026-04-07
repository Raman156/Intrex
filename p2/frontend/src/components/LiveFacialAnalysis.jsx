import { useEffect, useRef, useState, useCallback } from 'react'

const WS_URL = `ws://${window.location.host}/api/live`
const FRAME_INTERVAL_MS = 200

const EMOTION_EMOJI  = { happy:'😊', sad:'😢', angry:'😠', fear:'😨', surprise:'😲', disgust:'🤢', neutral:'😐' }
const EMOTION_COLOR  = { happy:'text-green-400', sad:'text-blue-400', angry:'text-red-400', fear:'text-purple-400', surprise:'text-yellow-400', disgust:'text-orange-400', neutral:'text-gray-400' }
const EMOTION_BG     = { happy:'bg-green-500', sad:'bg-blue-500', angry:'bg-red-500', fear:'bg-purple-500', surprise:'bg-yellow-500', disgust:'bg-orange-500', neutral:'bg-gray-500' }

function MetricBar({ label, value, color = 'blue', showPct = true }) {
  const pct = Math.round((value || 0) * 100)
  const colors = { blue:'bg-blue-500', green:'bg-green-500', purple:'bg-purple-500', amber:'bg-amber-400', cyan:'bg-cyan-500', rose:'bg-rose-500' }
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 w-[88px] flex-shrink-0 leading-tight">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${colors[color]}`} style={{ width: `${pct}%` }} />
      </div>
      {showPct && <span className="text-xs text-white font-medium w-7 text-right">{pct}%</span>}
    </div>
  )
}

function HeadPoseIndicator({ pose }) {
  if (!pose) return null
  const yaw   = Math.round(pose.yaw   || 0)
  const pitch = Math.round(pose.pitch || 0)
  const roll  = Math.round(pose.roll  || 0)
  const ok = Math.abs(yaw) < 15 && Math.abs(pitch) < 12
  return (
    <div className={`flex items-center gap-2 text-xs rounded-lg px-2 py-1 ${ok ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
      <span>{ok ? '✓' : '⚠'}</span>
      <span>Yaw {yaw > 0 ? '+' : ''}{yaw}°  Pitch {pitch > 0 ? '+' : ''}{pitch}°  Roll {roll > 0 ? '+' : ''}{roll}°</span>
    </div>
  )
}

function EmotionBar({ emotion, pct }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-16 text-gray-400 capitalize">{emotion}</span>
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${EMOTION_BG[emotion] || 'bg-gray-500'}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-8 text-right">{Math.round(pct)}%</span>
    </div>
  )
}

export default function LiveFacialAnalysis({ sessionId, active, onMetricsUpdate }) {
  const videoRef    = useRef(null)
  const canvasRef   = useRef(null)
  const wsRef       = useRef(null)
  const intervalRef = useRef(null)
  const streamRef   = useRef(null)

  const [metrics,   setMetrics]   = useState(null)
  const [noFace,    setNoFace]    = useState(false)
  const [wsStatus,  setWsStatus]  = useState('disconnected')
  const [camError,  setCamError]  = useState(null)
  const [showEmotionDetail, setShowEmotionDetail] = useState(false)

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch { setCamError('Camera access denied.') }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  const connect = useCallback(() => {
    if (!sessionId) return
    setWsStatus('connecting')
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setWsStatus('connected')
      ws.send(JSON.stringify({ type: 'init', session_id: sessionId, start_time: Date.now() }))
      intervalRef.current = setInterval(() => {
        if (!videoRef.current || !canvasRef.current || ws.readyState !== WebSocket.OPEN) return
        const canvas = canvasRef.current
        canvas.width = 320; canvas.height = 240
        canvas.getContext('2d').drawImage(videoRef.current, 0, 0, 320, 240)
        ws.send(JSON.stringify({ frame: canvas.toDataURL('image/jpeg', 0.7) }))
      }, FRAME_INTERVAL_MS)
    }

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      if (msg.type === 'metrics') {
        if (msg.data.no_face) { setNoFace(true); setMetrics(null) }
        else {
          setNoFace(false)
          setMetrics(msg.data)
          onMetricsUpdate?.(msg.data)
        }
      }
    }

    ws.onerror = () => setWsStatus('error')
    ws.onclose = () => { setWsStatus('disconnected'); clearInterval(intervalRef.current) }
  }, [sessionId, onMetricsUpdate])

  const disconnect = useCallback(() => {
    clearInterval(intervalRef.current)
    wsRef.current?.close()
    wsRef.current = null
  }, [])

  useEffect(() => {
    if (active) { startCamera().then(connect) }
    else { disconnect(); stopCamera(); setMetrics(null); setNoFace(false) }
    return () => { disconnect(); stopCamera() }
  }, [active, sessionId]) // eslint-disable-line

  const statusDot = wsStatus === 'connected' ? 'bg-green-500' : wsStatus === 'connecting' ? 'bg-amber-400 animate-pulse' : 'bg-red-500'

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-700 overflow-hidden w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusDot}`} />
          <span className="text-xs font-semibold text-gray-300">Live Facial Analysis</span>
        </div>
        {metrics?.emotion && (
          <button onClick={() => setShowEmotionDetail(v => !v)}
            className={`text-xs font-medium flex items-center gap-1 ${EMOTION_COLOR[metrics.emotion] || 'text-gray-400'} hover:opacity-80`}>
            {EMOTION_EMOJI[metrics.emotion]}
            <span className="capitalize">{metrics.emotion}</span>
            <span className="text-gray-500 ml-1">{showEmotionDetail ? '▲' : '▼'}</span>
          </button>
        )}
      </div>

      <div className="p-3 space-y-3">
        {/* Webcam feed */}
        <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
          {camError
            ? <div className="absolute inset-0 flex items-center justify-center"><p className="text-red-400 text-xs text-center px-4">{camError}</p></div>
            : <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
          }
          <canvas ref={canvasRef} className="hidden" />

          {noFace && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <p className="text-amber-400 text-xs font-medium text-center">⚠️ No face detected<br /><span className="text-gray-400">Center yourself in frame</span></p>
            </div>
          )}

          {/* Attention badge */}
          {metrics?.attention != null && (
            <div className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium ${
              metrics.attention > 0.7 ? 'bg-green-500/80 text-white' :
              metrics.attention > 0.4 ? 'bg-amber-500/80 text-white' : 'bg-red-500/80 text-white'
            }`}>
              {metrics.attention > 0.7 ? '✓ Focused' : metrics.attention > 0.4 ? '~ Partial' : '✗ Distracted'}
            </div>
          )}

          {wsStatus !== 'connected' && !camError && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center">
              <span className="text-xs bg-black/70 text-gray-400 px-2 py-0.5 rounded-full capitalize">{wsStatus}…</span>
            </div>
          )}
        </div>

        {/* Head pose */}
        {metrics?.head_pose && <HeadPoseIndicator pose={metrics.head_pose} />}

        {/* Core metrics */}
        {metrics && (
          <div className="space-y-1.5 pt-0.5">
            <MetricBar label="Eye Contact"    value={metrics.eye_contact}   color="blue" />
            <MetricBar label="Head Stability" value={metrics.head_stability} color="green" />
            <MetricBar label="Engagement"     value={metrics.engagement}    color="purple" />
            <MetricBar label="Attention"      value={metrics.attention}     color="cyan" />
            <MetricBar label="Centering"      value={metrics.centering}     color="amber" />
          </div>
        )}

        {/* Blink rate */}
        {metrics?.blink_rate != null && (
          <div className="flex items-center justify-between text-xs text-gray-400 bg-slate-800/60 rounded-lg px-3 py-1.5">
            <span>Blink rate</span>
            <span className={`font-medium ${
              metrics.blink_rate < 10 ? 'text-amber-400' :
              metrics.blink_rate > 30 ? 'text-red-400' : 'text-green-400'
            }`}>{Math.round(metrics.blink_rate)} bpm</span>
          </div>
        )}

        {/* Emotion detail panel */}
        {showEmotionDetail && metrics?.all_emotions && (
          <div className="bg-slate-800/60 rounded-xl p-3 space-y-1.5">
            <p className="text-xs text-gray-400 font-medium mb-2">Emotion breakdown</p>
            {Object.entries(metrics.all_emotions)
              .sort(([,a],[,b]) => b - a)
              .map(([emo, pct]) => <EmotionBar key={emo} emotion={emo} pct={pct} />)
            }
          </div>
        )}
      </div>
    </div>
  )
}
