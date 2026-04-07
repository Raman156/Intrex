"""
Authentication router for user registration, login, and profile management
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import os
import PyPDF2
import docx
from pydantic import BaseModel
from google.auth.transport import requests
from google.oauth2 import id_token

from database import get_db
from models import User
from schemas import UserCreate, UserLogin, UserResponse, Token, ResumeUploadResponse
from utils.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_active_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from utils.file_validation import FileValidator
from services.resume_analyzer import ResumeAnalyzer

router = APIRouter(prefix="/auth", tags=["authentication"])

RESUME_UPLOAD_DIR = "uploads/resumes"
os.makedirs(RESUME_UPLOAD_DIR, exist_ok=True)


# Schema for Google login
class GoogleLoginRequest(BaseModel):
    token: str


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    print(f"📝 Signup attempt - Email: {user.email}, Username: {user.username}")
    
    # Check if email already exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        print(f"❌ Email already exists: {user.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username already exists
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        print(f"❌ Username already taken: {user.username}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        full_name=user.full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    print(f"✅ User created successfully: {user.email}")
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user
    }


@router.post("/login", response_model=Token)
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """Login user and return JWT token"""
    # Find user by email
    user = db.query(User).filter(User.email == user_credentials.email).first()
    
    if not user or not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/google-login", response_model=Token)
def google_login(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    """
    Login/signup with Google OAuth ID token.
    
    IMPORTANT: This endpoint expects an ID token (not an access token).
    The ID token contains user information and is verified using the Google Client ID.
    
    Common issues:
    1. Sending access token instead of ID token
    2. Client ID mismatch between frontend and backend
    3. Token expiration (ID tokens expire in 1 hour)
    4. Missing GOOGLE_CLIENT_ID environment variable
    """
    try:
        # Step 1: Validate environment configuration
        google_client_id = os.getenv("GOOGLE_CLIENT_ID")
        if not google_client_id:
            print("❌ ERROR: GOOGLE_CLIENT_ID environment variable not set")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Server configuration error: Google OAuth not configured"
            )
        
        # Step 2: Validate token format
        if not request.token or not isinstance(request.token, str):
            print("❌ ERROR: Invalid token format")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token format"
            )
        
        print(f"📝 Token received (first 50 chars): {request.token[:50]}...")
        print(f"🔑 Using Google Client ID: {google_client_id}")
        
        # Step 3: Verify Google ID token
        # This validates:
        # - Token signature (signed by Google)
        # - Token expiration
        # - Client ID matches
        # - Token is not tampered with
        try:
            idinfo = id_token.verify_oauth2_token(
                request.token,
                requests.Request(),
                google_client_id,
                clock_skew_in_seconds=10  # Allow 10 seconds clock skew
            )
            print(f"✅ Token verified successfully")
            print(f"   - Subject (google_id): {idinfo.get('sub')}")
            print(f"   - Email: {idinfo.get('email')}")
            print(f"   - Email verified: {idinfo.get('email_verified')}")
            print(f"   - Issued at: {idinfo.get('iat')}")
            print(f"   - Expires at: {idinfo.get('exp')}")
            
        except ValueError as token_error:
            # ValueError is raised for invalid tokens
            print(f"❌ Token verification failed: {str(token_error)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired Google token"
            )
        except Exception as token_error:
            # Other exceptions (network, etc.)
            print(f"❌ Token verification error: {str(token_error)}")
            print(f"   Error type: {type(token_error).__name__}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token verification failed: {str(token_error)}"
            )
        
        # Step 4: Extract user information from verified token
        google_id = idinfo.get('sub')
        email = idinfo.get('email')
        name = idinfo.get('name', '')
        picture = idinfo.get('picture', '')
        email_verified = idinfo.get('email_verified', False)
        
        # Validate required fields
        if not google_id or not email:
            print(f"❌ ERROR: Missing required fields in token")
            print(f"   - google_id: {google_id}")
            print(f"   - email: {email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing required user information"
            )
        
        # Optional: Require email verification
        if not email_verified:
            print(f"⚠️  WARNING: Email not verified by Google: {email}")
            # You can choose to allow or reject unverified emails
            # For now, we'll allow it but log the warning
        
        print(f"👤 User info extracted:")
        print(f"   - Google ID: {google_id}")
        print(f"   - Email: {email}")
        print(f"   - Name: {name}")
        
        # Step 5: Check if user exists by google_id
        user = db.query(User).filter(User.google_id == google_id).first()
        
        if user:
            print(f"✅ Existing user found by google_id: {email}")
            # Update profile picture if available
            if picture and user.profile_picture != picture:
                user.profile_picture = picture
                print(f"   - Updated profile picture")
        else:
            # Step 6: Check if email already exists (from previous email/password signup)
            user = db.query(User).filter(User.email == email).first()
            
            if user:
                # Link Google account to existing user
                print(f"✅ Linking Google account to existing user: {email}")
                user.google_id = google_id
                user.oauth_provider = 'google'
                if picture:
                    user.profile_picture = picture
                print(f"   - Google account linked")
            else:
                # Step 7: Create new user
                print(f"✨ Creating new user: {email}")
                
                # Generate unique username from email
                username = email.split('@')[0]
                base_username = username
                counter = 1
                
                # Ensure username is unique
                while db.query(User).filter(User.username == username).first():
                    username = f"{base_username}{counter}"
                    counter += 1
                
                # Create user with random password (won't be used for Google OAuth)
                user = User(
                    email=email,
                    username=username,
                    full_name=name,
                    google_id=google_id,
                    oauth_provider='google',
                    profile_picture=picture,
                    hashed_password=get_password_hash("google_oauth_user_no_password")
                )
                db.add(user)
                print(f"   - New user created with username: {username}")
        
        # Step 8: Commit database changes
        try:
            db.commit()
            db.refresh(user)
            print(f"✅ Database committed successfully")
        except Exception as db_error:
            db.rollback()
            print(f"❌ Database error: {str(db_error)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database error during user creation/update"
            )
        
        # Step 9: Create JWT access token for the application
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        print(f"🔐 JWT access token created for: {user.email}")
        
        # Step 10: Return success response
        print(f"✅ Google login successful for: {email}")
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Catch any unexpected errors
        print(f"❌ Unexpected error in google_login: {str(e)}")
        print(f"   Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during Google login"
        )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_active_user)):
    """Get current user profile"""
    return current_user


@router.post("/upload-resume", response_model=ResumeUploadResponse)
async def upload_resume(
    file: UploadFile = File(...),
    field: str = Form(None),  # Accept as Form field, not query param
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload and parse user resume with comprehensive validation and analysis"""
    
    print(f"📤 Resume upload request:")
    print(f"   - User: {current_user.email}")
    print(f"   - File: {file.filename}")
    print(f"   - Field parameter: '{field}' (type: {type(field).__name__})")
    
    # Comprehensive file validation
    await FileValidator.validate_resume(file)
    
    # Sanitize filename
    safe_filename = FileValidator.validate_filename(file.filename)
    file_ext = os.path.splitext(safe_filename)[1].lower()
    
    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{current_user.id}_{timestamp}_{safe_filename}"
    file_path = os.path.join(RESUME_UPLOAD_DIR, filename)
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error saving file: {str(e)}"
        )
    
    # Validate MIME type after saving (checks actual file content)
    try:
        from utils.file_validation import ALLOWED_RESUME_TYPES
        FileValidator.validate_mime_type(file_path, ALLOWED_RESUME_TYPES)
    except Exception as e:
        # Clean up file if MIME validation fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise
    
    # Extract text from file
    resume_text = ""
    try:
        if file_ext == ".pdf":
            resume_text = extract_text_from_pdf(file_path)
        elif file_ext in [".doc", ".docx"]:
            resume_text = extract_text_from_docx(file_path)
        elif file_ext == ".txt":
            with open(file_path, "r", encoding="utf-8") as f:
                resume_text = f.read()
        
        # Validate that we extracted some text
        if not resume_text or len(resume_text.strip()) < 50:
            raise Exception("Resume appears to be empty or too short")
        
        # VALIDATE IF IT'S ACTUALLY A RESUME
        is_valid, error_message = ResumeAnalyzer.is_valid_resume(resume_text)
        if not is_valid:
            # Clean up file if it's not a valid resume
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(
                status_code=400,
                detail=error_message
            )
        
        # ANALYZE RESUME CONTENT
        print(f"📊 Analyzing resume with field: {field if field else 'None (generic)'}")
        analysis = ResumeAnalyzer.analyze_resume(resume_text, field)
        
        print(f"✅ Resume validated and analyzed:")
        print(f"   - Field: {field if field else 'Generic'}")
        print(f"   - Overall Score: {analysis['overall']}/100")
        print(f"   - Structure: {analysis['structure']}/100")
        print(f"   - Skills: {analysis['skills']}/100")
        print(f"   - Experience: {analysis['experience']}/100")
        print(f"   - Keywords: {analysis['keywords']}/100")
        if analysis.get('field_specific'):
            print(f"   - Matched Skills: {analysis['field_specific'].get('matched_count', 0)}")
            print(f"   - Missing Critical: {len(analysis['field_specific'].get('missing_critical', []))}")
            
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Clean up file if parsing fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=400,
            detail=f"Error parsing resume: {str(e)}"
        )
    
    # Delete old resume file if exists
    if current_user.resume_filename:
        old_file_path = os.path.join(RESUME_UPLOAD_DIR, current_user.resume_filename)
        if os.path.exists(old_file_path):
            try:
                os.remove(old_file_path)
            except Exception as e:
                print(f"Warning: Could not delete old resume: {str(e)}")
    
    # Update user record
    current_user.resume_filename = filename
    current_user.resume_text = resume_text
    current_user.resume_uploaded_at = datetime.utcnow()
    db.commit()
    
    return {
        "message": "Resume uploaded and analyzed successfully",
        "filename": filename,
        "resume_text": resume_text[:500] + "..." if len(resume_text) > 500 else resume_text,
        "uploaded_at": current_user.resume_uploaded_at,
        "analysis": analysis  # Include the analysis scores
    }


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF file with fallback methods"""
    text = ""
    page_count = 0
    
    try:
        with open(file_path, "rb") as file:
            pdf_reader = PyPDF2.PdfReader(file)
            page_count = len(pdf_reader.pages)
            print(f"   📄 PDF has {page_count} pages")
            
            for page_num, page in enumerate(pdf_reader.pages):
                try:
                    page_text = page.extract_text()
                    if page_text is None:
                        page_text = ""
                    text += page_text
                    print(f"      - Page {page_num + 1}: {len(page_text)} characters extracted")
                except Exception as page_error:
                    print(f"      - Page {page_num + 1} extraction error: {str(page_error)}")
                    continue
            
            print(f"   Total PDF text extracted: {len(text)} characters")
            
            if not text or len(text.strip()) == 0:
                raise Exception(f"No text could be extracted from {page_count} pages. The PDF may be scanned or image-based.")
                
    except Exception as e:
        raise Exception(f"Error reading PDF: {str(e)}")
    
    return text


def extract_text_from_docx(file_path: str) -> str:
    """Extract text from DOCX file"""
    try:
        doc = docx.Document(file_path)
        paragraphs = [paragraph.text for paragraph in doc.paragraphs]
        text = "\n".join(paragraphs)
        print(f"   📄 DOCX extracted {len(paragraphs)} paragraphs, {len(text)} total characters")
        
        if not text or len(text.strip()) == 0:
            raise Exception("No text could be extracted from DOCX file")
            
    except Exception as e:
        raise Exception(f"Error reading DOCX: {str(e)}")
    
    return text
