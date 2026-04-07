import React, { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Upload, FileText, CheckCircle, AlertCircle, X,
  Sparkles, Zap, Shield, ChevronRight, ChevronDown, TrendingUp,
  Award, Target, BookOpen, Briefcase, AlertTriangle, Info,
  BarChart2, Brain, Star, ArrowRight, RefreshCw
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { uploadResume } from '../api/api'

// ── Animated radial arc ────────────────────────────────────────────────────────
const RadialScore = ({ score, size = 120, strokeWidth = 10, color, label, sublabel, delay = 0 }) => {
  const [displayed, setDisplayed] = useState(0)
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (displayed / 100) * circ

  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0
      const step = () => {
        start += 2
        setDisplayed(Math.min(start, score))
        if (start < score) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }, delay)
    return () => clearTimeout(timer)
  }, [score, delay])

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
          <circle
            cx={size/2} cy={size/2} r={r} fill="none"
            stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.05s linear', filter: `drop-shadow(0 0 6px ${color}60)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white" style={{ color }}>{displayed}</span>
          <span className="text-xs text-gray-500">/100</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-white">{label}</p>
        {sublabel && <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  )
}

// ── Animated bar ──────────────────────────────────────────────────────────────
const AnimatedBar = ({ value, color, delay = 0 }) => {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return (
    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${width}%`, background: color, boxShadow: `0 0 8px ${color}60` }}
      />
    </div>
  )
}

// ── Score color helper ────────────────────────────────────────────────────────
const scoreColor = s => s >= 75 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444'
const scoreGrade = s => s >= 85 ? 'Excellent' : s >= 75 ? 'Strong' : s >= 60 ? 'Good' : s >= 45 ? 'Fair' : 'Needs Work'
const scoreGradient = s => s >= 75 ? 'from-emerald-500 to-teal-400' : s >= 50 ? 'from-amber-500 to-yellow-400' : 'from-red-500 to-rose-400'

// ── Expandable insight card ───────────────────────────────────────────────────
const InsightCard = ({ icon: Icon, title, items, color, bg, delay = 0 }) => {
  const [open, setOpen] = useState(true)
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: `${color}30`, background: `${bg}` }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <span className="font-semibold text-white text-sm">{title}</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${color}20`, color }}>
            {items.length}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <ul className="px-5 pb-4 space-y-2">
              {items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-white/5 rounded-lg ${className}`} />
)

const AnalysisSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-5 gap-6 p-6 rounded-2xl bg-white/3 border border-white/10">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-3">
          <Skeleton className="w-24 h-24 rounded-full" />
          <Skeleton className="w-16 h-3" />
        </div>
      ))}
    </div>
    <div className="grid md:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
    </div>
  </div>
)

// ── Main component ────────────────────────────────────────────────────────────
const EnhancedResumeUpload = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)
  const [activeTab, setActiveTab] = useState('overview')

  const handleDrag = useCallback(e => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }, [])

  const handleDrop = useCallback(e => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0])
  }, [])

  const handleFileSelect = f => {
    setError(null); setResult(null)
    const allowed = ['application/pdf','application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain']
    if (!allowed.includes(f.type)) { setError('Please upload a PDF, DOC, DOCX, or TXT file'); return }
    if (f.size > 5 * 1024 * 1024) { setError('File size must be less than 5MB'); return }
    setFile(f)
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true); setError(null); setProgress(0)
    try {
      const res = await uploadResume(file, p => setProgress(p))
      if (res && (res.success || res.message)) setResult(res)
      else throw new Error('Unexpected response')
    } catch (e) {
      setError(e.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const reset = () => { setFile(null); setResult(null); setError(null); setProgress(0) }
  const fmt = b => b > 1024*1024 ? `${(b/1024/1024).toFixed(1)} MB` : `${(b/1024).toFixed(0)} KB`

  const a = result?.analysis

  // Derived insight data
  const wordCount = a?.word_count ?? 0
  const wordStatus = wordCount < 300 ? { label: 'Too Short', color: '#ef4444', tip: 'Aim for 400–700 words for optimal ATS parsing' }
    : wordCount > 800 ? { label: 'Too Long', color: '#f59e0b', tip: 'Consider trimming to under 700 words' }
    : { label: 'Optimal', color: '#10b981', tip: 'Word count is in the ideal range (300–800)' }

  const sections = [
    { key: 'structure', label: 'Structure', icon: BookOpen, tip: 'Checks for required sections: Experience, Education, Skills' },
    { key: 'skills', label: 'Skills Match', icon: Zap, tip: 'Relevance of your skills to the target role' },
    { key: 'experience', label: 'Experience', icon: Briefcase, tip: 'Quality of work history, action verbs, and quantifiable impact' },
    { key: 'keywords', label: 'ATS Keywords', icon: Target, tip: 'Keyword density and formatting for ATS systems' },
  ]

  const strengths = a?.field_specific?.strengths?.length
    ? a.field_specific.strengths.map(s => `Strong presence of "${s}" — a key indicator for this role`)
    : ['Resume contains required sections (Experience, Education, Skills)',
       a?.has_projects ? 'Projects section detected — adds credibility' : null,
       a?.has_certifications ? 'Certifications listed — boosts ATS score' : null,
    ].filter(Boolean)

  const criticalIssues = [
    ...(a?.field_specific?.missing_critical?.map(s => `Missing critical skill: "${s}"`) ?? []),
    wordCount < 300 ? `Word count (${wordCount}) is below the recommended minimum of 300` : null,
    !a?.has_projects ? 'No Projects section detected — add 2–3 relevant projects' : null,
    !a?.has_certifications ? 'No certifications listed — consider adding relevant ones' : null,
  ].filter(Boolean)

  const improvements = [
    ...(a?.field_specific?.recommendations ?? []),
    wordCount < 400 ? `Expand descriptions to reach 400+ words (currently ${wordCount})` : null,
    (a?.keywords ?? 0) < 60 ? 'Add more industry-specific keywords to improve ATS pass rate' : null,
  ].filter(Boolean)

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-white/5 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/upload" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-violet-500/20 flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <span className="text-sm font-medium text-white">Resume Intelligence</span>
          </div>
          {result && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-gray-500">{file?.name}</span>
              <button onClick={reset} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <RefreshCw className="w-3 h-3" /> New Analysis
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* ── UPLOAD STATE ── */}
        <AnimatePresence mode="wait">
          {!result && (
            <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              {/* Hero */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-4">
                  <Sparkles className="w-3 h-3" /> AI-Powered Resume Analysis
                </div>
                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Analyse Your Resume
                </h1>
                <p className="text-gray-400 text-lg">
                  Get an instant ATS score, skill gap analysis, and AI-generated improvement plan
                </p>
              </div>

              {/* Hidden file input — only triggered by ref */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />

              {/* Drop zone — no file input inside, click opens picker only when no file */}
              <div
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                onClick={() => !file && fileInputRef.current?.click()}
                className={`rounded-2xl border-2 border-dashed transition-all duration-300 p-10 text-center
                  ${!file ? 'cursor-pointer' : 'cursor-default'}
                  ${dragActive ? 'border-violet-500 bg-violet-500/5' : 'border-white/10 hover:border-white/20 bg-white/2'}`}
              >
                {!file ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto">
                      <Upload className="w-7 h-7 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-lg mb-1">Drop your resume here</p>
                      <p className="text-gray-500 text-sm">or click to browse · PDF, DOC, DOCX, TXT · Max 5MB</p>
                    </div>
                    <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
                      {['ATS Score', 'Skill Gap', 'AI Insights', 'Section Analysis'].map(f => (
                        <span key={f} className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-violet-500" />{f}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-violet-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">{file.name}</p>
                        <p className="text-xs text-gray-400">{fmt(file.size)} · Ready to analyse</p>
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); reset() }}
                      className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                )}
              </div>

              {/* Progress bar — shown during upload */}
              {uploading && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <Brain className="w-3 h-3 text-violet-400 animate-pulse" />Analysing with AI...
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
                      style={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-4 flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
                </div>
              )}

              {/* Run Analysis button — completely outside drop zone, no file input nearby */}
              {file && !uploading && (
                <motion.button
                  onClick={handleUpload}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  disabled={uploading}
                  className="mt-4 w-full py-3.5 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 transition-all shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Brain className="w-4 h-4" /> Run AI Analysis
                </motion.button>
              )}

              {/* Upload another — only shown when file is selected but not yet analysing */}
              {file && !uploading && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 w-full py-2.5 text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" /> Choose a different file
                </button>
              )}
            </motion.div>
          )}

          {/* ── RESULTS STATE ── */}
          {result && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

              {/* Top hero bar */}
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 to-cyan-600/5" />
                <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
                        <FileText className="w-7 h-7 text-violet-300" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-white font-semibold">{file?.name}</p>
                      <p className="text-gray-400 text-sm">{fmt(file?.size ?? 0)} · Analysed just now</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-0.5">Overall Score</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold" style={{ color: scoreColor(a?.overall ?? 0) }}>{a?.overall ?? 0}</span>
                        <span className="text-gray-500 text-sm">/100</span>
                      </div>
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg text-sm font-semibold bg-gradient-to-r ${scoreGradient(a?.overall ?? 0)} text-white`}>
                      {scoreGrade(a?.overall ?? 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Score rings row */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-6 rounded-2xl border border-white/8 bg-white/2">
                <RadialScore score={a?.overall ?? 0} color={scoreColor(a?.overall ?? 0)} label="Overall" sublabel={scoreGrade(a?.overall ?? 0)} size={110} delay={0} />
                {sections.map((s, i) => (
                  <RadialScore key={s.key} score={a?.[s.key] ?? 0} color={scoreColor(a?.[s.key] ?? 0)}
                    label={s.label} sublabel={scoreGrade(a?.[s.key] ?? 0)} size={90} delay={(i+1)*120} />
                ))}
              </div>

              {/* ATS Match Score bar */}
              {a && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="rounded-xl border border-white/8 bg-white/2 p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                        <Target className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <span className="font-semibold text-white text-sm">ATS Compatibility Score</span>
                      <span className="group relative cursor-help">
                        <Info className="w-3.5 h-3.5 text-gray-600" />
                        <span className="absolute bottom-5 left-0 w-56 bg-slate-800 text-xs text-gray-300 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none border border-white/10">
                          Estimates how well your resume passes Applicant Tracking Systems used by recruiters
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold" style={{ color: scoreColor(a.ats_score ?? a.keywords ?? 0) }}>
                        {a.ats_score ?? a.keywords ?? 0}%
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: `${scoreColor(a.ats_score ?? 0)}15`,
                          color: scoreColor(a.ats_score ?? 0)
                        }}>
                        {(a.ats_score ?? 0) >= 80 ? 'High' : (a.ats_score ?? 0) >= 60 ? 'Medium' : 'Low'}
                      </span>
                    </div>
                  </div>
                  <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
                    <AnimatedBar value={a.ats_score ?? a.keywords ?? 0} color={scoreColor(a.ats_score ?? 0)} delay={400} />
                    {/* Threshold markers */}
                    <div className="absolute top-0 left-[60%] w-px h-full bg-white/20" />
                    <div className="absolute top-0 left-[80%] w-px h-full bg-white/20" />
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-1.5">
                    <span>Low</span><span className="ml-[55%]">Medium</span><span>High</span>
                  </div>
                </motion.div>
              )}

              {/* Tabs */}
              <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit">
                {[
                  { id: 'overview', label: 'Overview', icon: BarChart2 },
                  { id: 'insights', label: 'AI Insights', icon: Brain },
                  { id: 'skills', label: 'Skill Gap', icon: Zap },
                  { id: 'breakdown', label: 'Breakdown', icon: Target },
                ].map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === t.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <t.icon className="w-3.5 h-3.5" />{t.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="grid md:grid-cols-2 gap-4"
                  >
                    {/* Score bars */}
                    <div className="rounded-2xl border border-white/8 bg-white/2 p-5 space-y-4">
                      <h3 className="font-semibold text-white flex items-center gap-2"><BarChart2 className="w-4 h-4 text-violet-400" />Score Breakdown</h3>
                      {sections.map((s, i) => (
                        <div key={s.key} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-gray-300">
                              <s.icon className="w-3.5 h-3.5 text-gray-500" />{s.label}
                              <span className="group relative cursor-help">
                                <Info className="w-3 h-3 text-gray-600" />
                                <span className="absolute bottom-5 left-0 w-48 bg-slate-800 text-xs text-gray-300 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none border border-white/10">
                                  {s.tip}
                                </span>
                              </span>
                            </div>
                            <span className="font-semibold" style={{ color: scoreColor(a?.[s.key] ?? 0) }}>{a?.[s.key] ?? 0}</span>
                          </div>
                          <AnimatedBar value={a?.[s.key] ?? 0} color={scoreColor(a?.[s.key] ?? 0)} delay={(i+1)*150} />
                        </div>
                      ))}
                    </div>

                    {/* Quick stats */}
                    <div className="space-y-3">
                      {[
                        {
                          label: 'Word Count', value: wordCount,
                          status: wordStatus.label, color: wordStatus.color,
                          tip: wordStatus.tip, icon: FileText,
                          compare: `Industry avg: 450–600 words`
                        },
                        {
                          label: 'Projects Section', value: a?.has_projects ? 'Present' : 'Missing',
                          status: a?.has_projects ? 'Good' : 'Add Now', color: a?.has_projects ? '#10b981' : '#ef4444',
                          tip: a?.has_projects ? 'Projects section boosts credibility' : 'Add 2–3 relevant projects to stand out',
                          icon: Briefcase, compare: '78% of hired candidates include projects'
                        },
                        {
                          label: 'Certifications', value: a?.has_certifications ? 'Present' : 'Missing',
                          status: a?.has_certifications ? 'Good' : 'Consider Adding', color: a?.has_certifications ? '#10b981' : '#f59e0b',
                          tip: 'Certifications improve ATS keyword matching',
                          icon: Award, compare: 'Increases ATS score by ~8 points'
                        },
                        {
                          label: 'Contact Info', value: a?.has_contact ? 'Detected' : 'Not Found',
                          status: a?.has_contact ? 'Good' : 'Required', color: a?.has_contact ? '#10b981' : '#ef4444',
                          tip: 'Email/phone must be present for recruiter contact',
                          icon: CheckCircle, compare: 'Required by all ATS systems'
                        },
                      ].map((stat, i) => (
                        <motion.div key={stat.label} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                          className="flex items-center justify-between p-4 rounded-xl border border-white/8 bg-white/2 hover:bg-white/4 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                              <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{stat.label}</p>
                              <p className="text-xs text-gray-500">{stat.compare}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold" style={{ color: stat.color }}>{stat.value}</p>
                            <p className="text-xs" style={{ color: stat.color }}>{stat.status}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'insights' && (
                  <motion.div key="insights" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <InsightCard icon={Award} title="Strengths" items={strengths.length ? strengths : ['Resume meets basic requirements']}
                      color="#10b981" bg="rgba(16,185,129,0.03)" delay={0} />
                    {criticalIssues.length > 0 && (
                      <InsightCard icon={AlertTriangle} title="Critical Issues" items={criticalIssues}
                        color="#ef4444" bg="rgba(239,68,68,0.03)" delay={0.1} />
                    )}
                    {improvements.length > 0 && (
                      <InsightCard icon={TrendingUp} title="Recommended Improvements" items={improvements}
                        color="#f59e0b" bg="rgba(245,158,11,0.03)" delay={0.2} />
                    )}
                    {/* Matched skills */}
                    {a?.field_specific?.matched_skills?.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="rounded-xl border border-violet-500/20 bg-violet-500/3 p-5"
                      >
                        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-violet-400" />
                          Detected Skills ({a.field_specific.matched_count})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {a.field_specific.matched_skills.map(s => (
                            <span key={s} className="px-2.5 py-1 bg-violet-500/15 text-violet-300 text-xs rounded-full border border-violet-500/20 font-medium">
                              {s}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                    {/* Missing critical skills */}
                    {a?.field_specific?.missing_critical?.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="rounded-xl border border-red-500/20 bg-red-500/3 p-5"
                      >
                        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-400" />
                          Missing Critical Skills
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {a.field_specific.missing_critical.map(s => (
                            <span key={s} className="px-2.5 py-1 bg-red-500/15 text-red-300 text-xs rounded-full border border-red-500/20 font-medium">
                              + Add: {s}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'skills' && (
                  <motion.div key="skills" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="space-y-5"
                  >
                    {/* Detected skills */}
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/3 p-5">
                      <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        Detected Skills
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-medium">
                          {a?.field_specific?.matched_count ?? a?.field_specific?.matched_skills?.length ?? 0} found
                        </span>
                      </h3>
                      <p className="text-xs text-gray-500 mb-3">Skills already present in your resume — these are working in your favour</p>
                      {a?.field_specific?.matched_skills?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {a.field_specific.matched_skills.map((s, i) => (
                            <motion.span key={s} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 text-emerald-300 text-xs rounded-full border border-emerald-500/25 font-medium"
                            >
                              <CheckCircle className="w-3 h-3" />{s}
                            </motion.span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Upload with a specific field selected to see skill detection</p>
                      )}
                    </div>

                    {/* Missing critical skills */}
                    {a?.field_specific?.missing_critical?.length > 0 && (
                      <div className="rounded-xl border border-red-500/20 bg-red-500/3 p-5">
                        <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          Missing Critical Skills
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 font-medium">
                            {a.field_specific.missing_critical.length} gaps
                          </span>
                        </h3>
                        <p className="text-xs text-gray-500 mb-3">These are must-have skills for this role — adding them will significantly boost your ATS score</p>
                        <div className="flex flex-wrap gap-2">
                          {a.field_specific.missing_critical.map((s, i) => (
                            <motion.span key={s} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 text-red-300 text-xs rounded-full border border-red-500/25 font-medium"
                            >
                              <X className="w-3 h-3" />{s}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing recommended skills */}
                    {a?.field_specific?.missing_advanced?.length > 0 && (
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/3 p-5">
                        <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                          Recommended Skills to Add
                        </h3>
                        <p className="text-xs text-gray-500 mb-3">Nice-to-have skills that will differentiate your resume from other candidates</p>
                        <div className="flex flex-wrap gap-2">
                          {a.field_specific.missing_advanced.map((s, i) => (
                            <motion.span key={s} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 text-amber-300 text-xs rounded-full border border-amber-500/25 font-medium"
                            >
                              <ChevronRight className="w-3 h-3" />{s}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick improvement suggestions with score impact */}
                    {a?.skill_impact?.length > 0 && (
                      <div className="rounded-xl border border-violet-500/20 bg-violet-500/3 p-5">
                        <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-violet-400" />
                          Quick Wins — Score Impact
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">Add these to your resume for the highest ATS score improvement</p>
                        <div className="space-y-2">
                          {a.skill_impact.map((item, i) => (
                            <motion.div key={item.skill} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                              className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-white/8 hover:bg-white/6 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${item.priority === 'critical' ? 'bg-red-400' : 'bg-amber-400'}`} />
                                <span className="text-sm text-gray-200">+ Add <span className="font-semibold text-white">{item.skill}</span></span>
                              </div>
                              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                                +{item.boost} ATS pts
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'breakdown' && (
                  <motion.div key="breakdown" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="grid md:grid-cols-2 gap-4"
                  >
                    {sections.map((s, i) => {
                      const score = a?.[s.key] ?? 0
                      const color = scoreColor(score)
                      return (
                        <motion.div key={s.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                          className="rounded-xl border border-white/8 bg-white/2 p-5 hover:bg-white/4 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                                <s.icon className="w-4 h-4" style={{ color }} />
                              </div>
                              <span className="font-semibold text-white text-sm">{s.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-bold" style={{ color }}>{score}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${color}15`, color }}>
                                {scoreGrade(score)}
                              </span>
                            </div>
                          </div>
                          <AnimatedBar value={score} color={color} delay={i * 100} />
                          <p className="text-xs text-gray-500 mt-3">{s.tip}</p>
                          {score < 60 && (
                            <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-400">
                              <AlertTriangle className="w-3 h-3" />
                              Needs improvement — below industry average (65)
                            </div>
                          )}
                          {score >= 75 && (
                            <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400">
                              <CheckCircle className="w-3 h-3" />
                              Above average — keep it up
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CTA */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-600/10 to-cyan-600/10 p-6"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-semibold text-white">Ready for your interview?</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Based on your resume score of <span className="font-semibold" style={{ color: scoreColor(a?.overall ?? 0) }}>{a?.overall ?? 0}/100</span>,
                      we'll generate personalised questions targeting your skill gaps and experience level.
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => navigate('/live-interview')}
                    className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 shadow-lg shadow-violet-500/20 transition-all"
                  >
                    Start AI Interview <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default EnhancedResumeUpload
