import React, { useState, useRef } from 'react'
import { uploadResume } from '../api/api'

function EnhancedResumeUpload({ onUploadSuccess, onUploadError }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [resumeData, setResumeData] = useState(null)
  const fileInputRef = useRef(null)

  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
  const maxSize = 5 * 1024 * 1024 // 5MB

  const validateFile = (selectedFile) => {
    if (!selectedFile) {
      return 'Please select a file'
    }

    if (!allowedTypes.includes(selectedFile.type)) {
      return 'Invalid file type. Please upload PDF, DOC, DOCX, or TXT'
    }

    if (selectedFile.size > maxSize) {
      return `File size exceeds 5MB limit (${(selectedFile.size / 1024 / 1024).toFixed(2)}MB)`
    }

    return null
  }

  const handleFileSelect = (selectedFile) => {
    const validationError = validateFile(selectedFile)
    
    if (validationError) {
      setError(validationError)
      setFile(null)
      return
    }

    setFile(selectedFile)
    setError(null)
    setSuccess(false)
    setResumeData(null)
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    handleFileSelect(selectedFile)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file')
      return
    }

    setUploading(true)
    setError(null)
    setProgress(0)
    setSuccess(false)

    try {
      const result = await uploadResume(file, (progressValue) => {
        setProgress(progressValue)
      })

      setSuccess(true)
      setResumeData(result)
      
      if (onUploadSuccess) {
        onUploadSuccess(result)
      }

      // Reset after 3 seconds
      setTimeout(() => {
        setSuccess(false)
      }, 3000)

    } catch (err) {
      const errorMessage =
        err?.response?.data?.detail ||
        err?.message ||
        'Upload failed. Please try again.'
      setError(errorMessage)
      
      if (onUploadError) {
        onUploadError(err)
      }
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = () => {
    if (!file) return '📄'
    const ext = file.name.split('.').pop().toLowerCase()
    switch (ext) {
      case 'pdf': return '📕'
      case 'doc':
      case 'docx': return '📘'
      case 'txt': return '📝'
      default: return '📄'
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            📄 Upload Your Resume
          </h2>
          <p className="text-gray-600">
            Upload your resume to get personalized interview questions
          </p>
        </div>

        {/* Drag and Drop Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-violet-400 ${
            dragActive
              ? 'border-violet-500 bg-violet-50'
              : 'border-gray-300 bg-gray-50 hover:border-violet-400 hover:bg-violet-25'
          } ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />

          <div className="space-y-4">
            <div className="text-6xl">
              {dragActive ? '📥' : '📎'}
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-700 mb-1">
                Drag & drop your resume here
              </p>
              <p className="text-sm text-gray-500">or</p>
            </div>

            <button
              type="button"
              className="inline-flex items-center px-6 py-3 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors duration-200"
              onClick={(e) => {
                e.stopPropagation()
                handleBrowseClick()
              }}
            >
              📄 Browse Files
            </button>

            <div className="text-xs text-gray-500 space-y-1">
              <p>Supported formats: PDF, DOC, DOCX, TXT</p>
              <p>Maximum file size: 5MB</p>
            </div>
          </div>
        </div>

        {/* Selected File Preview */}
        {file && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{getFileIcon()}</span>
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              {!uploading && (
                <button
                  onClick={() => {
                    setFile(null)
                    setError(null)
                    setSuccess(false)
                    setResumeData(null)
                  }}
                  className="text-red-500 hover:text-red-700 font-medium"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {progress < 100 ? 'Uploading...' : 'Processing...'}
              </span>
              <span className="text-sm font-medium text-violet-600">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-violet-500 to-indigo-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              >
                <div className="h-full w-full bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <span className="text-red-500 text-xl">⚠️</span>
            <div>
              <p className="font-medium text-red-800">Upload Failed</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <span className="text-green-500 text-xl">✓</span>
              <div className="flex-1">
                <p className="font-medium text-green-800">Resume uploaded successfully!</p>
                {resumeData && (
                  <div className="mt-3 text-sm text-gray-700">
                    <p className="font-medium mb-2">📊 Extracted Information:</p>
                    <div className="bg-white p-3 rounded border border-green-200 space-y-1">
                      <p><span className="font-medium">Filename:</span> {resumeData.filename}</p>
                      <p><span className="font-medium">Uploaded:</span> {new Date(resumeData.uploaded_at).toLocaleString()}</p>
                      {resumeData.resume_text && (
                        <div className="mt-2">
                          <p className="font-medium mb-1">Preview:</p>
                          <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded max-h-20 overflow-y-auto">
                            {resumeData.resume_text}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`mt-6 w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 ${
            !file || uploading
              ? 'bg-gray-500 cursor-not-allowed opacity-60 text-gray-300'
              : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-violet-500/30 active:scale-95'
          }`}
          aria-busy={uploading}
        >
          {uploading ? (
            <span className="flex items-center justify-center space-x-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Processing...</span>
            </span>
          ) : (
            '🚀 Upload Resume'
          )}
        </button>
      </div>
    </div>
  )
}

export default EnhancedResumeUpload
