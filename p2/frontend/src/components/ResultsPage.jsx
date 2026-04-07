import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import CircularScore from './CircularScore'
import RadarChart from './RadarChart'
import QuestionAccordion from './QuestionAccordion'
import SessionSummary from './SessionSummary'

const EMOTION_EMOJI = {
  happy: '😊', sad: '😢', angry: '😠', fear: '😨',
  surprise: '😲', disgust: '🤢', neutral: '😐'
}
const EMOTION_COLOR_MAP = {
  happy: '#22c55e', neutral: '#94a3b8', sad: '#60a5fa',
  angry: '#ef4444', fear: '#a855f7', surprise: '#f59e0b', disgust: '#f97316'
}

function FacialAnalysisSection({ facialAnalysis }) {
  if (!facialAnalysis) return null

  const { emotionHistory = [], emotionSummary } = facialAnalysis

  // Build distribution from local emotion history if no server summary yet
  const buildDistribution = () => {
    if (emotionSummary?.distribution && Object.keys(emotionSummary.distribution).length > 0) {
      return emotionSummary.distribution
    }
    if (!emotionHistory.length) return null
    const counts = {}
    emotionHistory.forEach(e => { counts[e.emotion] = (counts[e.emotion] || 0) + 1 })
    const total = emotionHistory.length
    return Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, +(v / total * 100).toFixed(1)]))
  }

  const distribution = buildDistribution()
  const dominant = emotionSummary?.dominant || (emotionHistory[emotionHistory.length - 1]?.emotion) || null
  const nervousness = emotionSummary?.nervousness_score ?? null
  const positivity = emotionSummary?.positivity_score ?? null

  const chartData = distribution
    ? Object.entries(distribution)
        .sort((a, b) => b[1] - a[1])
        .map(([emotion, pct]) => ({ emotion, pct, fill: EMOTION_COLOR_MAP[emotion] || '#64748b' }))
    : []

  if (!chartData.length && !facialAnalysis?.avgMetrics) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass rounded-2xl p-6 border border-surface-border space-y-5"
    >
      <h2 className="text-xl font-semibold text-white flex items-center gap-2">
        <span>🎭</span> Facial & Emotion Analysis
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emotion distribution bar chart */}
        <div>
          <p className="text-sm text-gray-400 mb-3">Emotion Distribution</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`}
                tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="emotion" width={70}
                tick={{ fill: '#e2e8f0', fontSize: 12 }} axisLine={false} tickLine={false}
                tickFormatter={e => `${EMOTION_EMOJI[e] || ''} ${e}`} />
              <Tooltip
                formatter={(v) => [`${v}%`, 'Share']}
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Derived scores */}
        <div className="space-y-4">
          {dominant && (
            <div className="bg-slate-800/60 rounded-xl p-4 flex items-center gap-3">
              <span className="text-3xl">{EMOTION_EMOJI[dominant] || '🎭'}</span>
              <div>
                <p className="text-xs text-gray-400">Dominant Emotion</p>
                <p className="text-lg font-semibold text-white capitalize">{dominant}</p>
              </div>
            </div>
          )}

          {nervousness !== null && (
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>😰 Nervousness Score</span>
                <span className={nervousness > 40 ? 'text-red-400' : nervousness > 20 ? 'text-amber-400' : 'text-green-400'}>
                  {nervousness.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${nervousness > 40 ? 'bg-red-500' : nervousness > 20 ? 'bg-amber-400' : 'bg-green-500'}`}
                  style={{ width: `${nervousness}%` }} />
              </div>
            </div>
          )}

          {positivity !== null && (
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>😊 Positivity Score</span>
                <span className="text-green-400">{positivity.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${positivity}%` }} />
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 pt-1">
            Based on {emotionHistory.length} emotion samples captured during the interview.
          </p>
        </div>
      </div>

      {/* Avg facial metrics grid */}
      {facialAnalysis?.avgMetrics && (() => {
        const m = facialAnalysis.avgMetrics
        const pct = v => Math.round((v || 0) * 100)
        const items = [
          { label: 'Eye Contact',    value: pct(m.eye_contact),    color: '#3b82f6', icon: '👁' },
          { label: 'Head Stability', value: pct(m.head_stability), color: '#22c55e', icon: '🧠' },
          { label: 'Engagement',     value: pct(m.engagement),     color: '#a855f7', icon: '⚡' },
          { label: 'Attention',      value: pct(m.attention),      color: '#06b6d4', icon: '🎯' },
          { label: 'Centering',      value: pct(m.centering),      color: '#f59e0b', icon: '📐' },
        ]
        return (
          <div>
            <p className="text-sm text-gray-400 mb-3">Session Averages</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {items.map(({ label, value, color, icon }) => (
                <div key={label} className="bg-slate-800/60 rounded-xl p-3 text-center">
                  <div className="text-xl mb-1">{icon}</div>
                  <div className="text-2xl font-bold text-white">{value}%</div>
                  <div className="text-xs text-gray-400 mt-0.5">{label}</div>
                  <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
                  </div>
                </div>
              ))}
            </div>
            {m.avg_blink_rate > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Avg blink rate: <span className={`font-medium ${m.avg_blink_rate < 10 ? 'text-amber-400' : m.avg_blink_rate > 30 ? 'text-red-400' : 'text-green-400'}`}>{m.avg_blink_rate} bpm</span>
                {m.avg_blink_rate < 10 ? ' — low (possible stress)' : m.avg_blink_rate > 30 ? ' — high (possible nervousness)' : ' — normal range'}
              </p>
            )}
          </div>
        )
      })()}
    </motion.div>
  )
}

function ResultsPage({ 
  overallResults, 
  answers, 
  sessionSummary, 
  performanceInsights,
  facialAnalysis,
  onRetryInterview,
  onGoToDashboard,
  onDownloadReport,
  className = '' 
}) {
  if (!overallResults || !answers) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No results available</p>
      </div>
    )
  }

  // Calculate radar chart data from detailed scores
  const radarData = overallResults.detailed_scores ? {
    relevance: overallResults.detailed_scores.relevance,
    clarity: overallResults.detailed_scores.clarity,
    technicalDepth: overallResults.detailed_scores.technicalDepth,
    confidence: overallResults.detailed_scores.confidence
  } : {
    relevance: 5,
    clarity: 5,
    technicalDepth: 5,
    confidence: 5
  }

  // Prepare questions data for accordion
  const questionsData = answers.map((answer, index) => ({
    question: answer.question,
    answer_text: answer.answer_text,
    analysis: answer.analysis,
    timeUsed: answer.timeUsed || 0,
    allocatedTime: 120, // Default allocation
    skipped: answer.skipped,
    transcriptionStatus: answer.transcriptionStatus,
    analysisStatus: answer.analysisStatus
  }))

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Interview Results</h1>
        <p className="text-gray-400">Comprehensive analysis of your performance</p>
      </motion.div>

      {/* Overall Score and Radar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Circular Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-8 border border-surface-border text-center"
        >
          <h2 className="text-xl font-semibold text-white mb-6">Overall Score</h2>
          <div className="flex justify-center mb-6">
            <CircularScore score={overallResults.overall_score} size={200} />
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{overallResults.answered_questions}</div>
              <div className="text-xs text-gray-400">Answered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{overallResults.analysis_success_rate}%</div>
              <div className="text-xs text-gray-400">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{overallResults.total_questions}</div>
              <div className="text-xs text-gray-400">Total Questions</div>
            </div>
          </div>
        </motion.div>

        {/* Radar Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-8 border border-surface-border text-center"
        >
          <h2 className="text-xl font-semibold text-white mb-6">Performance Dimensions</h2>
          <div className="flex justify-center">
            <RadarChart data={radarData} size={280} />
          </div>
        </motion.div>
      </div>

      {/* Facial & Emotion Analysis */}
      <FacialAnalysisSection facialAnalysis={facialAnalysis} />

      {/* Summary Highlights */}
      {sessionSummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Top Strengths */}
          <div className="glass rounded-xl p-6 border border-surface-border">
            <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
              <span>💪</span>
              Top Strengths
            </h3>
            <div className="space-y-3">
              {sessionSummary.topStrengths.slice(0, 3).map((strength, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-green-500/20 border border-green-500/30 rounded-full 
                    flex items-center justify-center text-green-400 font-bold text-xs flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <p className="text-sm text-gray-300">{strength}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Improvements */}
          <div className="glass rounded-xl p-6 border border-surface-border">
            <h3 className="text-lg font-semibold text-amber-400 mb-4 flex items-center gap-2">
              <span>🎯</span>
              Critical Improvements
            </h3>
            <div className="space-y-3">
              {sessionSummary.criticalImprovements.slice(0, 3).map((improvement, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-amber-500/20 border border-amber-500/30 rounded-full 
                    flex items-center justify-center text-amber-400 font-bold text-xs flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <p className="text-sm text-gray-300">{improvement}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Focus */}
          <div className="glass rounded-xl p-6 border border-surface-border">
            <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
              <span>🎯</span>
              Recommended Focus
            </h3>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-white leading-relaxed">
                {sessionSummary.recommendedFocus}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Per-Question Accordion */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <h2 className="text-2xl font-semibold text-white mb-6">Question-by-Question Analysis</h2>
        <QuestionAccordion questions={questionsData} />
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="flex flex-col sm:flex-row gap-4 pt-8"
      >
        <motion.button
          onClick={onRetryInterview}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 bg-gradient-accent text-white py-4 px-6 rounded-xl hover:shadow-xl 
            transition-all duration-200 font-semibold professional-glow flex items-center justify-center gap-2"
        >
          <span>🔄</span>
          Retry Interview
        </motion.button>
        
        <motion.button
          onClick={onGoToDashboard}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 glass glass-hover text-white py-4 px-6 rounded-xl 
            transition-all duration-200 font-semibold flex items-center justify-center gap-2"
        >
          <span>📊</span>
          Go to Dashboard
        </motion.button>
        
        <motion.button
          onClick={onDownloadReport}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-4 px-6 rounded-xl 
            transition-all duration-200 font-semibold flex items-center justify-center gap-2"
        >
          <span>📄</span>
          Download PDF Report
        </motion.button>
      </motion.div>

      {/* Additional Session Summary (if needed for more details) */}
      {sessionSummary && performanceInsights && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="border-t border-surface-border pt-8"
        >
          <h2 className="text-2xl font-semibold text-white mb-6">Detailed Coaching Summary</h2>
          <SessionSummary 
            sessionSummary={sessionSummary}
            performanceInsights={performanceInsights}
          />
        </motion.div>
      )}
    </div>
  )
}

export default ResultsPage