"""
FastAPI main application entry point
Handles CORS, routing, and application lifecycle
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import Response, JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.status import HTTP_422_UNPROCESSABLE_ENTITY
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Import routers
from routers import ai_interview, auth, mfa, qr, upload, results, advanced_resume, live

from database import engine, Base
from utils.rate_limiter import rate_limit_headers_middleware

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Intrex API",
    description="AI-powered interview analysis system",
    version="1.0.0"
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    # Provide a clearer error for multipart/form-data uploads
    return JSONResponse(
        status_code=HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Invalid request format. For file uploads ensure Content-Type is multipart/form-data and include 'file' field.",
            "errors": exc.errors(),
        },
    )

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inject X-RateLimit-* headers into responses
app.add_middleware(BaseHTTPMiddleware, dispatch=rate_limit_headers_middleware)

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("temp", exist_ok=True)

# Include routers
app.include_router(auth.router, prefix="/api", tags=["authentication"])
app.include_router(mfa.router, prefix="/api", tags=["mfa"])
app.include_router(qr.router, prefix="/api", tags=["qr"])
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(results.router, prefix="/api", tags=["results"])
app.include_router(ai_interview.router, prefix="/api", tags=["ai-interview"])
app.include_router(advanced_resume.router, tags=["resume-analysis"])
app.include_router(live.router, prefix="/api", tags=["live"])

@app.get("/")
def read_root():
    return {"message": "Intrex API", "status": "running"}

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(status_code=204)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
