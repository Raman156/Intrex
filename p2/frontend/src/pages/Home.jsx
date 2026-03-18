import { useState } from 'react'
import { motion } from 'framer-motion'
import PolishedNavbar from '../components/PolishedNavbar'
import UploadForm from '../components/UploadForm'
import AIInterview from '../components/AIInterview'
import { useTheme } from '../context/ThemeContext'

function Home() {
  const [activeTab, setActiveTab] = useState('upload')
  const { theme } = useTheme()

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900' : 'bg-gray-50'}`}>
      <PolishedNavbar />
      
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className={`text-4xl font-bold mb-3 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Analyze Your Interview Performance
            </h2>
            <p className={`text-lg ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Get AI-powered feedback on your facial expressions, body language, speech patterns, and answers
            </p>
          </div>

          {/* Tab Navigation */}
          <div className={`flex border-b mb-8 ${
            theme === 'dark' ? 'border-surface-border' : 'border-gray-200'
          }`}>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-3 font-medium transition-all whitespace-nowrap relative ${
                activeTab === 'upload'
                  ? 'border-b-2 border-blue-500 text-blue-400'
                  : theme === 'dark'
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Upload Video
              {activeTab === 'upload' && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('ai')}
              className={`px-6 py-3 font-medium transition-all whitespace-nowrap relative flex items-center space-x-2 ${
                activeTab === 'ai'
                  ? 'border-b-2 border-blue-500 text-blue-400'
                  : theme === 'dark'
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🤖 Live Interview
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'upload' && <UploadForm />}
          {activeTab === 'ai' && <AIInterview />}

          {/* Features Section */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">👁️</div>
              <h3 className={`font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Facial Analysis</h3>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Eye contact, head stability, and expressions
              </p>
            </div>
            <div className="glass rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">🎤</div>
              <h3 className={`font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Speech Analysis</h3>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Speech rate, filler words, and clarity
              </p>
            </div>
            <div className="glass rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">🤖</div>
              <h3 className={`font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>AI Questions</h3>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Personalized questions from your resume
              </p>
            </div>
            <div className="glass rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">📊</div>
              <h3 className={`font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Detailed Feedback</h3>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Actionable insights to improve
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
