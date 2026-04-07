"""
Integration Examples for Advanced Resume Analysis

Shows how to integrate the new advanced analysis features
into existing resume upload flows
"""

# ============================================================================
# EXAMPLE 1: Backend - Add to existing upload route (auth.py)
# ============================================================================

# In routers/auth.py, after the existing upload-resume endpoint:

from services.advanced_resume_analyzer import AdvancedResumeAnalyzer

@router.post("/upload-resume-advanced")
async def upload_resume_with_advanced_analysis(
    file: UploadFile = File(...),
    field: str = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload resume and perform advanced analysis"""
    
    # [existing upload code from lines 412-493...]
    
    # After basic analysis, add advanced analysis
    try:
        advanced_analysis = AdvancedResumeAnalyzer.analyze_resume_advanced(
            resume_text,
            field
        )
        
        # Store in database (optional - requires migration)
        # current_user.resume_advanced_analysis = json.dumps(advanced_analysis)
        
        return {
            "message": "Resume uploaded and analyzed successfully",
            "filename": filename,
            "analysis": analysis,
            "advanced_analysis": advanced_analysis  # New!
        }
    
    except Exception as e:
        print(f"Advanced analysis error: {str(e)}")
        # Return basic analysis even if advanced fails
        return {
            "message": "Resume uploaded successfully",
            "filename": filename,
            "analysis": analysis,
            "advanced_analysis": None
        }


# ============================================================================
# EXAMPLE 2: Frontend - Update InterviewSelection component
# ============================================================================

// In pages/InterviewSelection.jsx, add advanced analysis:

import AdvancedResumeAnalysis from '../components/AdvancedResumeAnalysis';

function InterviewSelection() {
  const [showAdvancedAnalysis, setShowAdvancedAnalysis] = useState(false);
  const [advancedAnalysisData, setAdvancedAnalysisData] = useState(null);
  
  // ... existing state ...
  
  const handleResumeUpload = async (event) => {
    // ... existing upload logic ...
    
    const response = await uploadResume(file, selectedField);
    
    // Display basic analysis
    if (response.analysis) {
      setResumeScore(response.analysis);
    }
    
    // Also load advanced analysis
    if (response.advanced_analysis) {
      setAdvancedAnalysisData(response.advanced_analysis);
      setShowAdvancedAnalysis(true);
    } else {
      // Optional: automatically fetch advanced analysis
      loadAdvancedAnalysis(response.resume_text);
    }
  };
  
  const loadAdvancedAnalysis = async (resumeText) => {
    try {
      const response = await fetch('/api/resume/analyze-advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          resume_text: resumeText,
          job_profile: selectedField
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdvancedAnalysisData(data.analysis);
        setShowAdvancedAnalysis(true);
      }
    } catch (error) {
      console.error('Failed to load advanced analysis:', error);
    }
  };
  
  // In JSX:
  return (
    <>
      {/* ... existing resume upload UI ... */}
      
      {showAdvancedAnalysis && advancedAnalysisData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <AdvancedResumeAnalysis
            resumeText={resumeFile?.text || ''}
            jobProfile={selectedField}
            onBack={() => setShowAdvancedAnalysis(false)}
          />
        </motion.div>
      )}
    </>
  );
}


# ============================================================================
# EXAMPLE 3: Quick Analysis Button
# ============================================================================

// Add a button in the existing UI to trigger advanced analysis:

<button
  onClick={() => loadAdvancedAnalysis(currentResumeText)}
  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg 
    font-semibold transition-colors flex items-center gap-2"
>
  <BarChart3 className="w-4 h-4" />
  Advanced Analysis
</button>


# ============================================================================
# EXAMPLE 4: Database Schema Update (Optional)
# ============================================================================

# In models.py, add fields to User model:

from sqlalchemy import Column, Text, JSON

class User(Base):
    __tablename__ = "users"
    
    # ... existing fields ...
    
    # Advanced analysis data
    resume_advanced_analysis = Column(
        JSON,
        nullable=True,
        comment="Advanced resume analysis results"
    )
    
    # Analysis metadata
    last_advanced_analysis_at = Column(
        DateTime,
        nullable=True,
        comment="When advanced analysis was last performed"
    )
    
    # Best matching profile
    best_matching_profile = Column(
        String(50),
        nullable=True,
        comment="Best job profile match from advanced analysis"
    )
    
    # Overall advanced score
    advanced_resume_score = Column(
        Integer,
        nullable=True,
        comment="Overall score from advanced analysis"
    )


# Migration: Create migration file in alembic/versions/
# alembic revision --autogenerate -m "Add advanced resume analysis fields"
# alembic upgrade head


# ============================================================================
# EXAMPLE 5: Batch Analysis for All Users (Admin Feature)
# ============================================================================

from services.advanced_resume_analyzer import AdvancedResumeAnalyzer
from database import SessionLocal

async def analyze_all_user_resumes():
    """Batch analyze all uploaded resumes"""
    db = SessionLocal()
    
    users_with_resumes = db.query(User).filter(
        User.resume_text.isnot(None)
    ).all()
    
    for user in users_with_resumes:
        try:
            analysis = AdvancedResumeAnalyzer.analyze_resume_advanced(
                user.resume_text,
                user.resume_uploaded_for_field  # if storing which field
            )
            
            # Store results
            user.resume_advanced_analysis = json.dumps(analysis)
            user.advanced_resume_score = analysis['overall_score']
            user.best_matching_profile = list(
                analysis['multi_role_comparison'].keys()
            )[0]
            user.last_advanced_analysis_at = datetime.utcnow()
            
            db.commit()
            print(f"✓ Analyzed resume for user {user.id}")
            
        except Exception as e:
            print(f"✗ Failed to analyze resume for user {user.id}: {str(e)}")
            continue
    
    db.close()
    print(f"Batch analysis complete - {len(users_with_resumes)} resumes processed")


# ============================================================================
# EXAMPLE 6: API Route for Existing Resumes
# ============================================================================

@router.post("/analyze-existing-resume")
async def analyze_existing_resume(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Analyze current user's stored resume with advanced analysis"""
    
    if not current_user.resume_text:
        raise HTTPException(
            status_code=400,
            detail="No resume found. Please upload a resume first."
        )
    
    try:
        analysis = AdvancedResumeAnalyzer.analyze_resume_advanced(
            current_user.resume_text
        )
        
        # Optionally store
        current_user.resume_advanced_analysis = json.dumps(analysis)
        current_user.last_advanced_analysis_at = datetime.utcnow()
        db.commit()
        
        return {
            "status": "success",
            "analysis": analysis
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


# ============================================================================
# EXAMPLE 7: Dashboard Widget for Resume Score
# ============================================================================

// In dashboard component:

<div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 
  border border-blue-500/30 rounded-lg p-6">
  <h3 className="text-lg font-semibold text-white mb-4">Resume Score</h3>
  
  <div className="flex items-end gap-4 mb-4">
    <div>
      <p className="text-sm text-gray-4 00 mb-1">Overall Score</p>
      <p className="text-4xl font-bold text-blue-400">
        {userResumeData?.advanced_resume_score || 'N/A'}
      </p>
    </div>
    
    <div>
      <p className="text-sm text-gray-400 mb-1">Best Profile</p>
      <p className="text-lg font-semibold text-cyan-400">
        {userResumeData?.best_matching_profile?.replace('-', ' ') || 'N/A'}
      </p>
    </div>
  </div>
  
  <button
    onClick={() => setShowResumeAnalysis(true)}
    className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 
      text-white text-sm rounded-lg transition-colors"
  >
    View Detailed Analysis
  </button>
</div>


# ============================================================================
# EXAMPLE 8: Comparison Table
# ============================================================================

// Show all job profiles side-by-side:

<div className="overflow-x-auto">
  <table className="w-full text-sm">
    <thead>
      <tr className="border-b border-gray-700">
        <th className="text-left p-3">Job Role</th>
        <th className="text-center p-3">Match %</th>
        <th className="text-center p-3">Skills Found</th>
        <th className="text-center p-3">Recommended</th>
      </tr>
    </thead>
    <tbody>
      {Object.entries(analysis.multi_role_comparison).map(([id, profile]) => (
        <tr key={id} className="border-b border-gray-800 hover:bg-gray-900/30">
          <td className="p-3 text-white font-medium">{profile.job_title}</td>
          <td className="p-3 text-center">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold
              ${profile.match_percentage >= 75 ? 'bg-green-500/20 text-green-400' :
                'bg-yellow-500/20 text-yellow-400'}`}>
              {profile.match_percentage}%
            </span>
          </td>
          <td className="p-3 text-center text-gray-300">
            {profile.required_skills_found}/{profile.required_skills_total}
          </td>
          <td className="p-3 text-center">
            {profile.recommended ? '✓' : '—'}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>


# ============================================================================
# EXAMPLE 9: Email Notification with Analysis
# ============================================================================

# Send analysis results via email:

from services.email_service import send_email  # existing service

async def send_resume_analysis_email(user: User, analysis: dict):
    """Send resume analysis results to user"""
    
    subject = f"Your Resume Analysis - Score: {analysis['overall_score']}/100"
    
    html_content = f"""
    <h2>Resume Analysis Results</h2>
    
    <p>Hi {user.first_name},</p>
    
    <p>Here's your advanced resume analysis:</p>
    
    <ul>
      <li>Overall Score: <strong>{analysis['overall_score']}/100</strong></li>
      <li>ATS Score: <strong>{analysis['ats_score']}/100</strong></li>
      <li>Best Matching Profile: <strong>{
        list(analysis['multi_role_comparison'].keys())[0].replace('-', ' ').title()
      }</strong></li>
    </ul>
    
    <h3>Top Suggestions:</h3>
    <ul>
    {''.join(f'<li>{s}</li>' for s in analysis['improvement_suggestions'][:3])}
    </ul>
    
    <p><a href="{APP_URL}/resume-analysis">View Full Analysis</a></p>
    """
    
    await send_email(user.email, subject, html_content)


# ============================================================================
# EXAMPLE 10: Caching Analysis Results
# ============================================================================

# Cache analysis to avoid recalculating:

from functools import lru_cache
import hashlib

@lru_cache(maxsize=100)
def get_cached_analysis(resume_hash: str, job_profile: str):
    """Return cached analysis if available"""
    # Implementation would use Redis or similar
    pass

def analyze_with_cache(resume_text: str, job_profile: str):
    """Analyze resume, returning cached result if available"""
    
    # Create hash of resume
    resume_hash = hashlib.md5(resume_text.encode()).hexdigest()
    
    # Check cache
    cached = get_cached_analysis(resume_hash, job_profile)
    if cached:
        return cached
    
    # Perform analysis
    analysis = AdvancedResumeAnalyzer.analyze_resume_advanced(
        resume_text,
        job_profile
    )
    
    # Cache result
    cache_analysis(resume_hash, job_profile, analysis)
    
    return analysis

