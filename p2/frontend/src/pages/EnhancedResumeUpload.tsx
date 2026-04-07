import React, { useState } from 'react';
import { Upload, FileText, Zap, BarChart3, Search, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import AdvancedResumeAnalysis from '../components/AdvancedResumeAnalysis';

interface AnalysisResult {
  overall_score: number;
  ats_score: number;
  section_scores: Record<string, { score: number }>;
}

const EnhancedResumeUpload: React.FC = () => {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [selectedJobProfile, setSelectedJobProfile] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const jobProfiles = [
    { id: 'software-engineering', name: '💻 Software Engineer' },
    { id: 'data-science', name: '📊 Data Scientist' },
    { id: 'product-management', name: '📈 Product Manager' },
    { id: 'business-analyst', name: '📋 Business Analyst' },
    { id: 'frontend-developer', name: '🎨 Frontend Developer' },
    { id: 'devops-engineer', name: '⚙️ DevOps Engineer' },
  ];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    if (!validTypes.includes(file.type) && !file.name.endsWith('.txt')) {
      setError('Only PDF, DOC, DOCX, and TXT files are supported');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError('');
    setResumeFile(file);
    await extractResumeText(file);
  };

  const extractResumeText = async (file: File) => {
    setLoading(true);
    setUploadProgress(0);

    try {
      // For demonstration, we'll send to backend to extract text
      const formData = new FormData();
      formData.append('file', file);
      formData.append('field', selectedJobProfile || '');

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const response = await fetch('/api/auth/upload-resume', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const data = await response.json();
        setResumeText(data.resume_text);
        if (data.analysis) {
          setAnalysisResult(data.analysis);
        }
        setAnalysisComplete(true);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to upload resume');
      }
    } catch (err) {
      setError('Error uploading file. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvancedAnalysis = async () => {
    if (!resumeText) {
      setError('No resume text available');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/resume/analyze-advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          resume_text: resumeText,
          job_profile: selectedJobProfile || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisResult(data.analysis);
      }
    } catch (err) {
      setError('Advanced analysis failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // If analysis is complete, show detailed analysis
  if (analysisComplete && resumeText) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface-dark via-surface-darker to-surface-darkest">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button
              onClick={() => setAnalysisComplete(false)}
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              ← Back to Upload
            </button>
          </motion.div>

          <AdvancedResumeAnalysis
            resumeText={resumeText}
            jobProfile={selectedJobProfile}
            onBack={() => setAnalysisComplete(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-dark via-surface-darker to-surface-darkest">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Advanced Resume Analysis
          </h1>
          <p className="text-lg text-gray-400">
            Get deep insights into your resume with ATS scores, section analysis, and job profile matching
          </p>
        </motion.div>

        {/* Features Highlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-3 gap-4 mb-12"
        >
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20 rounded-lg p-4">
            <BarChart3 className="w-6 h-6 text-blue-400 mb-2" />
            <p className="font-semibold text-white">ATS Score Simulation</p>
            <p className="text-sm text-gray-400">Optimized for applicant tracking systems</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20 rounded-lg p-4">
            <Search className="w-6 h-6 text-purple-400 mb-2" />
            <p className="font-semibold text-white">Job Profile Matching</p>
            <p className="text-sm text-gray-400">Compare with 6+ job profiles</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/20 rounded-lg p-4">
            <Zap className="w-6 h-6 text-green-400 mb-2" />
            <p className="font-semibold text-white">Instant Feedback</p>
            <p className="text-sm text-gray-400">Grammar, language, and suggestions</p>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-8 sticky top-8">
              <h2 className="text-xl font-bold text-white mb-4">Upload Resume</h2>

              {/* File Upload */}
              <div className="mb-6">
                <label
                  htmlFor="resume-input"
                  className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-500/5 transition-all"
                >
                  <FileText className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-300">
                    {resumeFile ? resumeFile.name : 'Click to upload your resume'}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX, TXT (Max 5MB)</span>
                </label>
                <input
                  id="resume-input"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              {/* Progress Bar */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mb-4">
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      className="h-full bg-blue-500"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Uploading... {uploadProgress}%</p>
                </div>
              )}

              {/* Success Message */}
              {uploadProgress === 100 && (
                <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-400">✓ Resume uploaded successfully!</p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Job Profile Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Target Job Profile (Optional)
                </label>
                <select
                  value={selectedJobProfile}
                  onChange={(e) => setSelectedJobProfile(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">Generic Analysis</option>
                  {jobProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Button */}
              <button
                onClick={handleAdvancedAnalysis}
                disabled={!resumeText || loading}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4" />
                    Advanced Analysis
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Preview Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            {resumeText ? (
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Resume Preview</h2>
                <div className="bg-gray-900/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                    {resumeText.substring(0, 1000)}
                    {resumeText.length > 1000 && '...'}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Word Count: {resumeText.split(/\s+/).length} | Characters: {resumeText.length}
                </p>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-dashed border-gray-700 rounded-xl p-12 flex flex-col items-center justify-center text-center">
                <Upload className="w-12 h-12 text-gray-600 mb-4" />
                <p className="text-gray-400 text-lg">Upload a resume to get started</p>
                <p className="text-gray-500 text-sm mt-2">
                  Supported formats: PDF, DOC, DOCX, TXT
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Features List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-8">Why Advanced Analysis?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-2">✓ ATS Score Simulation</h3>
              <p className="text-gray-400">
                Get scored like an Applicant Tracking System would. Understand what recruiters' software sees.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-purple-400 mb-2">✓ Section-wise Scoring</h3>
              <p className="text-gray-400">
                Detailed analysis of Experience, Skills, Projects, and Education sections.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-2">✓ Grammar & Language Check</h3>
              <p className="text-gray-400">
                Professional writing assessment with specific suggestions for improvement.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">✓ Job Profile Matching</h3>
              <p className="text-gray-400">
                Compare your resume against multiple job profiles to find your best fit.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">✓ Voice Feedback</h3>
              <p className="text-gray-400">
                Listen to AI-generated feedback with text-to-speech technology.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-pink-400 mb-2">✓ Actionable Suggestions</h3>
              <p className="text-gray-400">
                Specific, implementable recommendations to improve your resume.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EnhancedResumeUpload;
