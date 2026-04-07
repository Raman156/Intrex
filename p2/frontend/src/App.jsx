import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ErrorBoundary from './components/ErrorBoundary'

// Eagerly loaded (small/critical)
import SimpleLanding from './pages/SimpleLanding'
import FinalLanding from './pages/FinalLanding'
import EnhancedLanding from './pages/EnhancedLanding'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import FirebaseLogin from './pages/FirebaseLogin'
import FirebaseSignup from './pages/FirebaseSignup'

// Lazy loaded
const PremiumLanding = lazy(() => import('./pages/PremiumLanding'))
const InterviewSelection = lazy(() => import('./pages/InterviewSelection'))
const LiveInterview = lazy(() => import('./pages/LiveInterview'))
const InterviewResults = lazy(() => import('./pages/InterviewResults'))
const Home = lazy(() => import('./pages/Home'))
const Upload = lazy(() => import('./pages/Upload'))
const VideoUpload = lazy(() => import('./pages/VideoUpload'))
const TestUpload = lazy(() => import('./pages/TestUpload'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Results = lazy(() => import('./pages/Results'))
const EnhancedResumeUpload = lazy(() => import('./pages/EnhancedResumeUpload'))
const Profile = lazy(() => import('./pages/Profile'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const CookiePage = lazy(() => import('./pages/CookiePage'))
const SecurityPage = lazy(() => import('./pages/SecurityPage'))
const AboutUs = lazy(() => import('./pages/AboutUs'))
const Careers = lazy(() => import('./pages/Careers'))
const Pricing = lazy(() => import('./pages/Pricing'))
const Settings = lazy(() => import('./pages/Settings'))
const ComingSoon = lazy(() => import('./pages/ComingSoon'))
const NotFound = lazy(() => import('./pages/NotFound'))

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
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
                  <Route path="/enhanced-resume-upload" element={<EnhancedResumeUpload />} />
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
                  <Route path="/security" element={<SecurityPage />} />
                  <Route path="/about" element={<AboutUs />} />
                  <Route path="/careers" element={<Careers />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  )
}

export default App
