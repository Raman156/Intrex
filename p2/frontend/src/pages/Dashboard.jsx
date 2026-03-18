import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Award, Target, Brain, Download, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart } from 'recharts';
import PolishedNavbar from '../components/PolishedNavbar';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [timeFilter, setTimeFilter] = useState('7days')

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/firebase-login')
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Sample data with semantic colors
  const radarData = [
    { subject: 'Confidence', score: 85, fullMark: 100 },
    { subject: 'Communication', score: 92, fullMark: 100 },
    { subject: 'Body Language', score: 78, fullMark: 100 },
    { subject: 'Technical Depth', score: 88, fullMark: 100 },
    { subject: 'Clarity', score: 90, fullMark: 100 },
  ];

  const progressData = [
    { session: 'Session 1', confidence: 65, communication: 70, bodyLanguage: 60, technical: 75 },
    { session: 'Session 2', confidence: 72, communication: 78, bodyLanguage: 68, technical: 82 },
    { session: 'Session 3', confidence: 78, communication: 85, bodyLanguage: 75, technical: 88 },
    { session: 'Session 4', confidence: 85, communication: 92, bodyLanguage: 78, technical: 88 },
  ];

  const strengths = [
    'Clear and articulate communication',
    'Strong technical knowledge demonstration',
    'Good eye contact and engagement',
    'Structured responses using STAR method',
  ];

  const improvements = [
    'Reduce filler words (um, uh, like)',
    'Improve posture and body language',
    'Provide more specific examples',
    'Work on managing nervousness',
  ];

  const practiceQuestions = [
    'Describe a time when you had to work under pressure',
    'How do you handle conflicts in a team?',
    'What\'s your approach to learning new technologies?',
  ];

  // Semantic color mapping
  const metricColors = {
    confidence: { bg: '#6D5BFF', light: 'rgba(109, 91, 255, 0.2)', text: '#A78BFA' },
    communication: { bg: '#00D4FF', light: 'rgba(0, 212, 255, 0.2)', text: '#22D3EE' },
    bodyLanguage: { bg: '#F59E0B', light: 'rgba(245, 158, 11, 0.2)', text: '#FBBF24' },
    technical: { bg: '#10F0A0', light: 'rgba(16, 240, 160, 0.2)', text: '#6EE7B7' },
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <PolishedNavbar />
      
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center text-gray-400 hover:text-white mb-4 group transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              <span>Home</span>
              <ChevronRight className="w-4 h-4 mx-2 text-gray-600" />
              <span>Performance Dashboard</span>
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Performance Dashboard</h1>
                <p className="text-gray-400">Your AI-powered interview analysis</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Export</span>
              </motion.button>
            </div>
          </div>

          {/* Time Filter */}
          <div className="flex gap-2 mb-8">
            {[
              { label: 'Last 7 Days', value: '7days' },
              { label: 'Last Month', value: 'month' },
              { label: 'All Time', value: 'all' }
            ].map((filter) => (
              <motion.button
                key={filter.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTimeFilter(filter.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  timeFilter === filter.value
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'bg-white/10 text-gray-300 hover:bg-white/15 border border-white/10'
                }`}
              >
                {filter.label}
              </motion.button>
            ))}
          </div>

          {/* Score Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              className="glass rounded-xl p-6 border border-white/10"
            >
              {/* UI audit fix: Standardized card padding and spacing */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-400" />
                </div>
                <span className="text-3xl font-bold text-blue-400">85</span>
              </div>
              <h3 className="font-semibold mb-1">Confidence Score</h3>
              <p className="text-sm text-gray-400">+12% from last session</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-purple-400" />
                </div>
                <span className="text-3xl font-bold text-purple-400">92</span>
              </div>
              <h3 className="font-semibold mb-1">Communication</h3>
              <p className="text-sm text-gray-400">Excellent clarity</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-pink-400" />
                </div>
                <span className="text-3xl font-bold text-pink-400">78</span>
              </div>
              <h3 className="font-semibold mb-1">Body Language</h3>
              <p className="text-sm text-gray-400">Room for improvement</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
                <span className="text-3xl font-bold text-green-400">88</span>
              </div>
              <h3 className="font-semibold mb-1">Technical Depth</h3>
              <p className="text-sm text-gray-400">Strong knowledge</p>
            </motion.div>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Radar Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass rounded-xl p-6 border border-white/10"
            >
              {/* UI audit fix: Standardized card styling and spacing */}
              <h2 className="text-xl font-bold mb-6">Overall Performance</h2>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <defs>
                    <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6D5BFF" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#00D4FF" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                  <Radar name="Score" dataKey="score" stroke="#6D5BFF" fill="url(#radarGradient)" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Line Chart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass rounded-xl p-6 border border-white/10"
            >
              <h2 className="text-xl font-bold mb-6">Confidence Progress</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={progressData}>
                  <defs>
                    <linearGradient id="confidenceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#6D5BFF" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#6D5BFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="session" stroke="#94a3b8" />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                  <Area type="monotone" dataKey="confidence" stroke="#6D5BFF" strokeWidth={3} fill="url(#confidenceGradient)" dot={{ fill: '#6D5BFF', r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Feedback Sections */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Strengths */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-6 border border-white/10"
            >
              {/* UI audit fix: Standardized card styling */}
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mr-3">
                  <Award className="w-5 h-5 text-green-400" />
                </div>
                Strengths
              </h2>
              <ul className="space-y-4">
                {strengths.map((strength, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/5 transition-all"
                  >
                    <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-400 text-xs font-bold">✓</span>
                    </div>
                    <span className="text-gray-300 text-sm">{strength}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Improvements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-xl p-6 border border-white/10"
            >
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center mr-3">
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                </div>
                Areas for Improvement
              </h2>
              <ul className="space-y-4">
                {improvements.map((improvement, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/5 transition-all"
                  >
                    <div className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-amber-400 text-xs font-bold">!</span>
                    </div>
                    <span className="text-gray-300 text-sm">{improvement}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Practice Questions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-xl p-6 border border-white/10"
          >
            {/* UI audit fix: Standardized card styling */}
            <h2 className="text-xl font-bold mb-6">Suggested Practice Questions</h2>
            <div className="space-y-3">
              {practiceQuestions.map((question, index) => (
                <div key={index} className="glass rounded-lg p-4 hover:bg-white/10 transition-all">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-400 font-semibold text-sm">{index + 1}</span>
                    </div>
                    <p className="text-gray-300 pt-1 text-sm">{question}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/interview-selection">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-6 px-6 py-3 bg-gradient-accent text-white rounded-lg font-semibold professional-glow hover:shadow-lg transition-all focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                {/* UI audit fix: Standardized button styling and added focus states */}
                Practice These Questions
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
