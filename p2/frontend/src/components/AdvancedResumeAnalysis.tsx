import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  BookOpen,
  Code,
  MessageSquare,
  Volume2,
  FileText,
  Download,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SectionScore {
  score: number;
  found: boolean;
  feedback: string;
}

interface ATSDetails {
  keyword_match: number;
  formatting: number;
  contact_info: number;
  education: number;
  experience: number;
  skills: number;
  metrics: number;
}

interface JobProfile {
  job_title: string;
  match_percentage: number;
  required_skills_found: number;
  required_skills_total: number;
  preferred_skills_found: number;
  recommended: boolean;
}

interface AdvancedAnalysis {
  overall_score: number;
  ats_score: number;
  ats_details: ATSDetails;
  section_scores: {
    experience: SectionScore;
    skills: SectionScore;
    projects: SectionScore;
    education: SectionScore;
  };
  grammar_quality: {
    overall_score: number;
    total_issues: number;
    issues: any[];
  };
  language_quality: {
    overall_score: number;
    avg_sentence_length: number;
    issues: string[];
  };
  multi_role_comparison: {
    [key: string]: JobProfile;
  };
  improvement_suggestions: string[];
  strengths: string[];
  voice_feedback_summary: string;
  metadata: {
    word_count: number;
    section_count: number;
    has_quantified_metrics: boolean;
    action_verb_count: number;
  };
}

interface AdvancedResumeAnalysisProps {
  resumeText: string;
  jobProfile?: string;
  onBack?: () => void;
}

const AdvancedResumeAnalysis: React.FC<AdvancedResumeAnalysisProps> = ({
  resumeText,
  jobProfile,
  onBack,
}) => {
  const [analysis, setAnalysis] = useState<AdvancedAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['overview', 'scores'])
  );
  const [playingVoice, setPlayingVoice] = useState(false);

  React.useEffect(() => {
    performAnalysis();
  }, [resumeText, jobProfile]);

  const performAnalysis = async () => {
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
          job_profile: jobProfile || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-blue-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 85) return 'bg-green-500/10 border-green-500/20';
    if (score >= 70) return 'bg-blue-500/10 border-blue-500/20';
    if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  const playVoiceFeedback = async () => {
    if (!analysis) return;

    setPlayingVoice(true);
    try {
      // Using Web Speech API (built-in, no API needed)
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(analysis.voice_feedback_summary);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onend = () => setPlayingVoice(false);
      synth.speak(utterance);
    } catch (error) {
      console.error('Voice playback failed:', error);
      setPlayingVoice(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-400">
        <div className="animate-spin mr-3">⏳</div>
        Analyzing resume...
      </div>
    );
  }

  if (!analysis) {
    return <div className="p-8 text-gray-400">No analysis available</div>;
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Advanced Resume Analysis</h2>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
        )}
      </div>

      {/* Overall Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border rounded-xl p-6 ${getScoreBgColor(analysis.overall_score)}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm mb-2">Overall Resume Score</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-5xl font-bold ${getScoreColor(analysis.overall_score)}`}>
                {analysis.overall_score}
              </span>
              <span className="text-2xl text-gray-400">/100</span>
            </div>
            <p className="text-sm text-gray-300 mt-2">
              {analysis.overall_score >= 85
                ? '✨ Excellent resume!'
                : analysis.overall_score >= 70
                  ? '✓ Good resume'
                  : 'Consider improvements below'}
            </p>
          </div>
          <div className="text-right">
            <Award className={`w-12 h-12 ${getScoreColor(analysis.overall_score)}`} />
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1">ATS Score</p>
          <p className={`text-2xl font-bold ${getScoreColor(analysis.ats_score)}`}>
            {analysis.ats_score}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1">Grammar Score</p>
          <p className={`text-2xl font-bold ${getScoreColor(analysis.grammar_quality.overall_score)}`}>
            {analysis.grammar_quality.overall_score}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/20 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1">Language Quality</p>
          <p className={`text-2xl font-bold ${getScoreColor(analysis.language_quality.overall_score)}`}>
            {analysis.language_quality.overall_score}
          </p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1">Word Count</p>
          <p className="text-2xl font-bold text-yellow-400">{analysis.metadata.word_count}</p>
        </div>
      </div>

      {/* Voice Feedback */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="w-5 h-5 text-indigo-400" />
              <p className="font-semibold text-white">Voice Feedback</p>
            </div>
            <p className="text-gray-300 text-sm">{analysis.voice_feedback_summary}</p>
          </div>
          <button
            onClick={playVoiceFeedback}
            disabled={playingVoice}
            className={`ml-4 px-4 py-2 rounded-lg font-semibold transition-all ${
              playingVoice
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
            }`}
          >
            {playingVoice ? 'Playing...' : 'Play'}
          </button>
        </div>
      </motion.div>

      {/* Section Scores */}
      <div className="border border-gray-700 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('sections')}
          className="w-full flex items-center justify-between p-4 bg-gray-900/50 hover:bg-gray-900 transition-colors"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-white">Section-wise Scoring</span>
          </div>
          {expandedSections.has('sections') ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        {expandedSections.has('sections') && (
          <div className="p-4 space-y-4 border-t border-gray-700">
            {Object.entries(analysis.section_scores).map(([section, data]) => (
              <div key={section} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="capitalize font-medium text-gray-300">{section}</span>
                  <span className={`text-lg font-bold ${getScoreColor(data.score)}`}>
                    {data.score}
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${data.score}%` }}
                    transition={{ duration: 1 }}
                    className={`h-full ${
                      data.score >= 80
                        ? 'bg-green-500'
                        : data.score >= 60
                          ? 'bg-blue-500'
                          : 'bg-yellow-500'
                    }`}
                  />
                </div>
                <p className="text-xs text-gray-400">{data.feedback}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ATS Score Breakdown */}
      <div className="border border-gray-700 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('ats')}
          className="w-full flex items-center justify-between p-4 bg-gray-900/50 hover:bg-gray-900 transition-colors"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="font-semibold text-white">ATS Score Breakdown</span>
          </div>
          {expandedSections.has('ats') ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        {expandedSections.has('ats') && (
          <div className="p-4 space-y-3 border-t border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(analysis.ats_details).map(([key, value]) => (
                <div
                  key={key}
                  className="bg-gray-800/50 rounded-lg p-3 text-center border border-gray-700"
                >
                  <p className="text-xs text-gray-400 mb-1 capitalize">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xl font-bold text-blue-400">{value}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-400 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              {analysis.ats_score >= 80
                ? '✓ Excellent ATS compatibility'
                : analysis.ats_score >= 60
                  ? '△ Good ATS compatibility'
                  : '⚠ Needs ATS optimization'}
            </p>
          </div>
        )}
      </div>

      {/* Job Profile Comparison */}
      <div className="border border-gray-700 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('profiles')}
          className="w-full flex items-center justify-between p-4 bg-gray-900/50 hover:bg-gray-900 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-purple-400" />
            <span className="font-semibold text-white">Job Profile Compatibility</span>
          </div>
          {expandedSections.has('profiles') ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        {expandedSections.has('profiles') && (
          <div className="p-4 space-y-3 border-t border-gray-700">
            {Object.entries(analysis.multi_role_comparison)
              .slice(0, 6)
              .map(([profileId, profile]) => (
                <div key={profileId} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{profile.job_title}</span>
                    {profile.recommended && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/20">
                        Recommended
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-lg font-bold ${getScoreColor(profile.match_percentage)}`}>
                      {profile.match_percentage}%
                    </span>
                    <span className="text-xs text-gray-400">
                      {profile.required_skills_found}/{profile.required_skills_total} skills
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${profile.match_percentage}%` }}
                      transition={{ duration: 1 }}
                      className="h-full bg-purple-500"
                    />
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Improvements & Strengths */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="border border-gray-700 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 p-4 bg-green-500/10 border-b border-green-500/20">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="font-semibold text-white">Strengths</span>
          </div>
          <div className="p-4 space-y-2">
            {analysis.strengths.map((strength, idx) => (
              <div key={idx} className="flex gap-2 text-sm">
                <span className="text-green-400 flex-shrink-0">✓</span>
                <span className="text-gray-300">{strength}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Improvements */}
        <div className="border border-gray-700 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 p-4 bg-yellow-500/10 border-b border-yellow-500/20">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <span className="font-semibold text-white">Improvements</span>
          </div>
          <div className="p-4 space-y-2">
            {analysis.improvement_suggestions.map((suggestion, idx) => (
              <div key={idx} className="flex gap-2 text-sm">
                <span className="text-yellow-400 flex-shrink-0">•</span>
                <span className="text-gray-300">{suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grammar & Language Issues */}
      {(analysis.grammar_quality.total_issues > 0 ||
        analysis.language_quality.issues.length > 0) && (
        <div className="border border-gray-700 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('quality')}
            className="w-full flex items-center justify-between p-4 bg-gray-900/50 hover:bg-gray-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-orange-400" />
              <span className="font-semibold text-white">Language & Grammar</span>
            </div>
            {expandedSections.has('quality') ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>

          {expandedSections.has('quality') && (
            <div className="p-4 space-y-3 border-t border-gray-700">
              {analysis.grammar_quality.issues.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-white mb-2">Grammar Issues</p>
                  {analysis.grammar_quality.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-gray-300 bg-red-500/10 border border-red-500/20 rounded p-2 mb-2"
                    >
                      {issue.type}: {issue.suggestion || issue.description}
                    </div>
                  ))}
                </div>
              )}
              {analysis.language_quality.issues.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-white mb-2">Language Issues</p>
                  {analysis.language_quality.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-gray-300 bg-yellow-500/10 border border-yellow-500/20 rounded p-2 mb-2"
                    >
                      {issue}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Export/Download Options */}
      <div className="flex gap-3">
        <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
          <Download className="w-4 h-4" />
          Download Report
        </button>
        <button className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Share Feedback
        </button>
      </div>
    </div>
  );
};

export default AdvancedResumeAnalysis;
