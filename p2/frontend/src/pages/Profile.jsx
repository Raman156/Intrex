import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  FileText,
  LogOut,
  Menu,
  X,
  Edit2,
  Save,
  Award,
  Briefcase,
  Code,
  Settings,
  ChevronRight,
  CheckCircle2,
  Clock,
  TrendingUp,
  Home,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EnhancedResumeUpload from '../components/EnhancedResumeUpload';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

const Profile = () => {
  const [profileData, setProfileData] = useState({
    fullName: '',
    jobTitle: '',
    targetRole: '',
    experience: '',
    skills: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/firebase-login');
      return;
    }

    if (authLoading || !user) {
      return;
    }

    const savedProfile = localStorage.getItem('profileData');
    if (savedProfile) {
      setProfileData(JSON.parse(savedProfile));
    } else {
      setProfileData((prev) => ({
        ...prev,
        fullName: user.displayName || '',
      }));
    }

    const resumeStatus = localStorage.getItem('resumeUploaded');
    setResumeUploaded(resumeStatus === 'true');

    setLoading(false);
  }, [user, authLoading, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    // Validate required fields
    if (!profileData.fullName.trim()) {
      alert('Full Name is required');
      return;
    }
    if (!profileData.targetRole.trim()) {
      alert('Target Role is required');
      return;
    }

    setSaving(true);
    try {
      localStorage.setItem('profileData', JSON.stringify(profileData));
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUploadSuccess = () => {
    setResumeUploaded(true);
    localStorage.setItem('resumeUploaded', 'true');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('profileData');
      localStorage.removeItem('resumeUploaded');
      navigate('/firebase-login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'resume', label: 'Resume', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const stats = [
    { label: 'Interviews Completed', value: '12', icon: CheckCircle2, color: 'bg-blue-500/20' },
    { label: 'Total Practice Time', value: '24h', icon: Clock, color: 'bg-green-500/20' },
    { label: 'Improvement Score', value: '+45%', icon: TrendingUp, color: 'bg-purple-500/20' },
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* InTrex Logo */}
            <div className="flex items-center space-x-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center professional-glow"
                style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)' }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Intrex</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark' 
                  ? 'hover:bg-slate-700 text-yellow-400' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>
            
            {/* Home Button - Moved to Right */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className={`p-2 rounded-lg transition-colors flex items-center gap-2 font-medium ${
                theme === 'dark'
                  ? 'hover:bg-slate-700 text-white'
                  : 'hover:bg-gray-100 text-gray-900'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="hidden sm:inline">Home</span>
            </motion.button>
            
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`md:hidden p-2 rounded-lg transition-colors ${
                theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
              }`}
            >
              {sidebarOpen ? (
                <X className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`} />
              ) : (
                <Menu className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`} />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`md:col-span-1 ${sidebarOpen ? 'block' : 'hidden md:block'}`}
          >
            {/* Profile Card */}
            <div className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6 mb-6`}>
              <div className="flex flex-col items-center text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 professional-glow"
                  style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)' }}
                >
                  {profileData.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase() || 'U'}
                </div>
                <h3 className={`text-lg font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {profileData.fullName || 'User'}
                </h3>
                <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{user?.email}</p>
                <div className={`w-full h-1 rounded-full mb-4 ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'}`}>
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{
                      width: `${
                        (Object.values(profileData).filter((v) => v).length / 5) * 100
                      }%`,
                    }}
                  ></div>
                </div>
                <p className={`text-xs mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {Math.round(
                    (Object.values(profileData).filter((v) => v).length / 5) * 100
                  )}% Complete
                </p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-2 mb-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    whileHover={{ x: 4 }}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      activeTab === item.id
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : theme === 'dark'
                        ? 'text-gray-300 hover:bg-slate-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {activeTab === item.id && (
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    )}
                  </motion.button>
                );
              })}
            </nav>

            {/* Logout Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="w-full px-4 py-3 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 font-medium border border-red-500/30"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </motion.button>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-3 space-y-6"
          >
            {/* Success Message */}
            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3"
              >
                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-400">Profile updated successfully!</p>
                  <p className="text-sm text-green-300">Your changes have been saved.</p>
                </div>
              </motion.div>
            )}

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}
                  >
                    <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-blue-400" />
                    </div>
                    <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</p>
                    <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                  </motion.div>
                );
              })}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-8`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Profile Information</h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all flex items-center gap-2 font-medium border border-blue-500/30"
                  >
                    {isEditing ? (
                      <>
                        <X className="w-4 h-4" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </>
                    )}
                  </motion.button>
                </div>

                {/* Email Display */}
                <div className={`mb-6 p-4 rounded-lg border ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email Address
                  </label>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-400" />
                    <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{user?.email}</span>
                  </div>
                </div>

                {/* Profile Form */}
                <div className="space-y-6">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={profileData.fullName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="John Doe"
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        theme === 'dark'
                          ? 'border-slate-600 bg-slate-700 text-white placeholder-gray-500 disabled:bg-slate-700 disabled:text-gray-400'
                          : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 disabled:bg-gray-50 disabled:text-gray-500'
                      }`}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Current Job / Role
                      </label>
                      <input
                        type="text"
                        name="jobTitle"
                        value={profileData.jobTitle}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="e.g., Software Engineer"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          theme === 'dark'
                            ? 'border-slate-600 bg-slate-700 text-white placeholder-gray-500 disabled:bg-slate-700 disabled:text-gray-400'
                            : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 disabled:bg-gray-50 disabled:text-gray-500'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Targeted Role *
                      </label>
                      <input
                        type="text"
                        name="targetRole"
                        value={profileData.targetRole}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="e.g., Senior Developer"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          theme === 'dark'
                            ? 'border-slate-600 bg-slate-700 text-white placeholder-gray-500 disabled:bg-slate-700 disabled:text-gray-400'
                            : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 disabled:bg-gray-50 disabled:text-gray-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Years of Experience
                    </label>
                    <select
                      name="experience"
                      value={profileData.experience}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        theme === 'dark'
                          ? 'border-slate-600 bg-slate-700 text-white disabled:bg-slate-700 disabled:text-gray-400'
                          : 'border-gray-300 bg-white text-gray-900 disabled:bg-gray-50 disabled:text-gray-500'
                      }`}
                    >
                      <option value="">Select experience level</option>
                      <option value="0-1">0-1 years</option>
                      <option value="1-3">1-3 years</option>
                      <option value="3-5">3-5 years</option>
                      <option value="5-10">5-10 years</option>
                      <option value="10+">10+ years</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Key Skills
                    </label>
                    <textarea
                      name="skills"
                      value={profileData.skills}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="e.g., JavaScript, React, Node.js, Python (comma-separated)"
                      rows="4"
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
                        theme === 'dark'
                          ? 'border-slate-600 bg-slate-700 text-white placeholder-gray-500 disabled:bg-slate-700 disabled:text-gray-400'
                          : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 disabled:bg-gray-50 disabled:text-gray-500'
                      }`}
                    />
                  </div>

                  {isEditing && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Resume Tab */}
            {activeTab === 'resume' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-8`}
              >
                <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Resume Management</h2>
                <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Upload your resume to get personalized interview questions tailored to your experience.
                </p>

                <EnhancedResumeUpload
                  onUploadSuccess={handleResumeUploadSuccess}
                  onUploadError={(err) => console.error('Resume upload error:', err)}
                />

                {resumeUploaded && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-green-400">Resume uploaded successfully</p>
                      <p className="text-sm text-green-300">
                        Your resume is ready for interview practice
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-8`}
              >
                <h2 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Settings</h2>

                <div className="space-y-6">
                  {/* Theme Setting */}
                  <div className={`flex items-center justify-between p-4 rounded-lg border ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                    <div>
                      <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Theme Preference</p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Choose between light and dark mode
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={toggleTheme}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        theme === 'dark'
                          ? 'bg-slate-600 hover:bg-slate-500 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                      }`}
                    >
                      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
                    </motion.button>
                  </div>

                  <div className={`flex items-center justify-between p-4 rounded-lg border ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                    <div>
                      <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Email Notifications</p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Receive updates about your interview progress
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className={`flex items-center justify-between p-4 rounded-lg border ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                    <div>
                      <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Performance Analytics</p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Share analytics to help improve our AI
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className={`pt-6 border-t ${theme === 'dark' ? 'border-slate-600' : 'border-gray-200'}`}>
                    <h3 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Danger Zone</h3>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 py-3 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all font-medium border border-red-500/30"
                    >
                      Delete Account
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            {profileData.fullName && resumeUploaded && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl shadow-sm border border-blue-500/30 p-8 text-center"
              >
                <div className="text-4xl mb-4">🎉</div>
                <h3 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Ready to Practice?</h3>
                <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Your profile is complete. Start practicing with AI-powered interviews now.
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/interview-selection')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
                  >
                    Start AI Interview
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/dashboard')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all border ${
                      theme === 'dark'
                        ? 'bg-slate-700 text-white hover:bg-slate-600 border-slate-600'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border-gray-300'
                    }`}
                  >
                    View Dashboard
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
