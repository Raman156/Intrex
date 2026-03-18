import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ErrorBoundary from './components/ErrorBoundary'
import SimpleLanding from './pages/SimpleLanding'
import FinalLanding from './pages/FinalLanding'
import EnhancedLanding from './pages/EnhancedLanding'
import Landing from './pages/Landing'
import LiveInterview from './pages/LiveInterview'
import InterviewResults from './pages/InterviewResults'
import Upload from './pages/Upload'
import VideoUpload from './pages/VideoUpload'
import Dashboard from './pages/Dashboard'
import Results from './pages/Results'
import Login from './pages/Login'
import Signup from './pages/Signup'
import FirebaseLogin from './pages/FirebaseLogin'
import FirebaseSignup from './pages/FirebaseSignup'
import EnhancedResumeUpload from './pages/EnhancedResumeUpload'
import Profile from './pages/Profile'
import TestUpload from './pages/TestUpload'

function App() {
  return (
    <Router>
      <AuthProvider>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-white focus:text-black"
        >
          Skip to main content
        </a>
        <main id="main-content" role="main">
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
                Loading...
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<PremiumLanding />} />
              <Route path="/simple" element={<SimpleLanding />} />
              <Route path="/polished" element={<FinalLanding />} />
              <Route path="/enhanced" element={<EnhancedLanding />} />
              <Route path="/classic" element={<Landing />} />
              <Route path="/interview-selection" element={<InterviewSelection />} />
              <Route path="/interview" element={<Navigate to="/interview-selection" replace />} />
              <Route path="/ai-interview-setup" element={<Navigate to="/interview-selection" replace />} />
              <Route path="/live-interview" element={<LiveInterview />} />
              <Route path="/interview-results" element={<InterviewResults />} />
              <Route path="/interview-results/:sessionId" element={<InterviewResults />} />
              <Route path="/home" element={<Home />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/video-upload" element={<VideoUpload />} />
              <Route path="/test-upload" element={<TestUpload />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/results" element={<Navigate to="/dashboard" replace />} />
              <Route path="/results/:id" element={<Results />} />
              <Route path="/login" element={<Navigate to="/firebase-login" replace />} />
              <Route path="/signup" element={<Navigate to="/firebase-signup" replace />} />
              <Route path="/firebase-login" element={<FirebaseLogin />} />
              <Route path="/firebase-signup" element={<FirebaseSignup />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/cookies" element={<CookiePage />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/careers" element={<ComingSoon title="Careers" />} />
              <Route path="/blog" element={<ComingSoon title="Blog" />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
      </AuthProvider>
    </Router>
  )
}

export default App
