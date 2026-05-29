import React, { useState } from 'react'
import { debugLog, debugError } from '../utils/logger'
import EnhancedResumeUpload from '../components/EnhancedResumeUpload'
import UploadForm from '../components/UploadForm'

function TestUpload() {
  const [activeTab, setActiveTab] = useState('resume')
  const [uploadResults, setUploadResults] = useState(null)

  const handleResumeSuccess = (result) => {
    debugLog('Resume upload successful:', result)
    setUploadResults({
      type: 'resume',
      success: true,
      data: result
    })
  }

  const handleResumeError = (error) => {
    debugError('Resume upload failed:', error)
    setUploadResults({
      type: 'resume',
      success: false,
      error: error.message
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            🚀 Enhanced Upload Features Test
          </h1>
          <p className="text-gray-300 text-lg">
            Test the new drag-and-drop upload interface with validation and progress tracking
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1 inline-flex">
            <button
              onClick={() => setActiveTab('resume')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'resume'
                  ? 'bg-violet-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              📄 Resume Upload
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'video'
                  ? 'bg-violet-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              🎥 Video Upload
            </button>
          </div>
        </div>

        {/* Upload Components */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'resume' ? (
            <EnhancedResumeUpload
              onUploadSuccess={handleResumeSuccess}
              onUploadError={handleResumeError}
            />
          ) : (
            <UploadForm />
          )}
        </div>

        {/* Results Display */}
        {uploadResults && (
          <div className="max-w-4xl mx-auto mt-8">
            <div className={`p-6 rounded-lg ${
              uploadResults.success 
                ? 'bg-green-500/20 border border-green-500' 
                : 'bg-red-500/20 border border-red-500'
            }`}>
              <h3 className="text-xl font-bold text-white mb-4">
                {uploadResults.success ? '✅ Upload Result' : '❌ Upload Error'}
              </h3>
              <pre className="text-sm text-gray-300 overflow-auto">
                {JSON.stringify(uploadResults, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Features List */}
        <div className="max-w-4xl mx-auto mt-12 grid md:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">✨ Resume Upload Features</h3>
            <ul className="space-y-2 text-gray-300">
              <li>✓ Drag and drop interface</li>
              <li>✓ File type validation (PDF, DOC, DOCX, TXT)</li>
              <li>✓ 5MB size limit</li>
              <li>✓ Real-time progress tracking</li>
              <li>✓ Resume text extraction</li>
              <li>✓ Success/error feedback</li>
              <li>✓ Auto-retry on failure</li>
            </ul>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">✨ Video Upload Features</h3>
            <ul className="space-y-2 text-gray-300">
              <li>✓ Drag and drop interface</li>
              <li>✓ File type validation (MP4, WebM, MOV, AVI)</li>
              <li>✓ 100MB size limit</li>
              <li>✓ Real-time progress tracking</li>
              <li>✓ Automatic analysis</li>
              <li>✓ Success/error feedback</li>
              <li>✓ Auto-retry on failure</li>
            </ul>
          </div>
        </div>

        {/* API Features */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">🔌 API Integration Features</h3>
            <div className="grid md:grid-cols-3 gap-4 text-gray-300">
              <div>
                <h4 className="font-semibold text-white mb-2">Error Handling</h4>
                <ul className="text-sm space-y-1">
                  <li>• Network errors</li>
                  <li>• Timeout handling</li>
                  <li>• Auth errors (401/403)</li>
                  <li>• Server errors (500+)</li>
                  <li>• User-friendly messages</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Retry Logic</h4>
                <ul className="text-sm space-y-1">
                  <li>• Auto-retry (3 attempts)</li>
                  <li>• Exponential backoff</li>
                  <li>• Network failure recovery</li>
                  <li>• Smart retry conditions</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Security</h4>
                <ul className="text-sm space-y-1">
                  <li>• JWT authentication</li>
                  <li>• File validation</li>
                  <li>• MIME type checking</li>
                  <li>• Size limits</li>
                  <li>• Filename sanitization</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">📋 Testing Instructions</h3>
            <div className="text-gray-300 space-y-2">
              <p><strong>1. Test Valid Upload:</strong> Upload a valid file and verify progress bar and success message</p>
              <p><strong>2. Test Invalid Type:</strong> Try uploading wrong file type (e.g., .jpg for resume)</p>
              <p><strong>3. Test Size Limit:</strong> Try uploading a file larger than the limit</p>
              <p><strong>4. Test Drag & Drop:</strong> Drag a file over the upload area and drop it</p>
              <p><strong>5. Test Error Recovery:</strong> Stop backend server, try upload, restart server, try again</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestUpload
