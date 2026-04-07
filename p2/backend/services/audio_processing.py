"""
Audio processing service using Whisper and Librosa
Extracts speech and acoustic metrics from video audio
"""
import subprocess
import os
import shutil
import whisper
import librosa
import numpy as np
from typing import Dict
import re

# ── Ensure bundled FFmpeg is on PATH so Whisper can find it ──────────────────
def _ensure_ffmpeg_on_path():
    if shutil.which("ffmpeg"):
        return  # already available
    try:
        import imageio_ffmpeg
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        # The bundled binary has a versioned name (e.g. ffmpeg-win-x86_64-v7.1.exe)
        # Whisper calls "ffmpeg" literally, so we copy it as ffmpeg.exe into a temp dir
        ffmpeg_dir = os.path.join(os.path.dirname(ffmpeg_exe), "_ffmpeg_alias")
        os.makedirs(ffmpeg_dir, exist_ok=True)
        alias_path = os.path.join(ffmpeg_dir, "ffmpeg.exe")
        if not os.path.exists(alias_path):
            import shutil as _sh
            _sh.copy2(ffmpeg_exe, alias_path)
        os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")
        print(f"✓ FFmpeg alias created and added to PATH: {alias_path}")
    except Exception as e:
        print(f"⚠ Could not set up bundled FFmpeg: {e}")

_ensure_ffmpeg_on_path()

# Load Whisper model (base model for CPU compatibility)
whisper_model = None

def get_whisper_model():
    """Lazy load Whisper model"""
    global whisper_model
    if whisper_model is None:
        whisper_model = whisper.load_model("base")
    return whisper_model

# Common filler words to detect
FILLER_WORDS = {
    "um", "uh", "like", "you know", "so", "actually", "basically",
    "literally", "right", "okay", "well", "i mean", "kind of", "sort of"
}

def _default_speech_metrics() -> Dict:
    """Return zeroed speech metrics when audio is unavailable."""
    return {
        "speech_rate": 0.0,
        "filler_percentage": 0.0,
        "pitch_mean": 150.0,
        "pitch_variance": 0.0,
        "energy_stability": 0.5,
        "transcript": "",
        "duration": 0.0,
    }

def process_audio(video_path: str) -> Dict:
    """
    Extract and process audio from video.
    Returns zeroed metrics (instead of crashing) when the video has no audio stream.
    """
    # Always derive the wav path from the stem so any extension works
    base = os.path.splitext(video_path)[0]
    audio_path = base + "_audio.wav"

    try:
        extract_audio(video_path, audio_path)
    except RuntimeError as e:
        err = str(e)
        # FFmpeg exits non-zero when there is no audio stream — treat as silent video
        if "does not contain any stream" in err or "Invalid argument" in err or "Output file" in err:
            print(f"⚠ No audio stream found in {video_path} — returning default speech metrics.")
            return _default_speech_metrics()
        raise  # re-raise genuine errors (FFmpeg not found, etc.)

    try:
        # Transcribe audio with Whisper
        transcript_data = transcribe_audio(audio_path)
        transcript = transcript_data["text"]

        # Analyze speech content
        word_count, filler_count = analyze_transcript(transcript)

        # Load audio for acoustic analysis
        y, sr = librosa.load(audio_path, sr=None)
        duration = librosa.get_duration(y=y, sr=sr)

        # Compute speech rate (WPM)
        speech_rate = (word_count / duration) * 60 if duration > 0 else 0

        # Compute filler percentage
        filler_percentage = (filler_count / word_count * 100) if word_count > 0 else 0

        # Extract pitch using librosa
        pitch_mean, pitch_variance = extract_pitch(y, sr)

        # Compute energy stability
        energy_stability = compute_energy_stability(y)

        return {
            "speech_rate": float(speech_rate),
            "filler_percentage": float(filler_percentage),
            "pitch_mean": float(pitch_mean),
            "pitch_variance": float(pitch_variance),
            "energy_stability": float(energy_stability),
            "transcript": transcript,
            "duration": float(duration),
        }

    finally:
        if os.path.exists(audio_path):
            os.remove(audio_path)

def extract_audio(video_path: str, audio_path: str):
    """
    Extract audio from video using FFmpeg.
    Raises RuntimeError if FFmpeg is missing or the video has no audio stream.
    """
    ffmpeg_cmd = shutil.which("ffmpeg")

    if not ffmpeg_cmd:
        possible_paths = [
            r"C:\Users\tiwar\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0.1-full_build\bin\ffmpeg.exe",
            r"C:\ffmpeg\bin\ffmpeg.exe",
            r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
        ]
        for path in possible_paths:
            if os.path.exists(path):
                ffmpeg_cmd = path
                break

    if not ffmpeg_cmd:
        try:
            import imageio_ffmpeg
            ffmpeg_cmd = imageio_ffmpeg.get_ffmpeg_exe()
        except Exception:
            pass

    if not ffmpeg_cmd:
        raise RuntimeError(
            "FFmpeg not found. Please install FFmpeg and add it to your system PATH.\n"
            "Download from: https://ffmpeg.org/download.html"
        )

    # First probe whether the video actually has an audio stream
    probe_cmd = [
        ffmpeg_cmd, "-i", video_path,
        "-hide_banner",
    ]
    probe = subprocess.run(
        probe_cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
    )
    probe_output = probe.stderr.decode(errors="replace")
    if "Audio:" not in probe_output:
        raise RuntimeError("Output file does not contain any stream")

    command = [
        ffmpeg_cmd,
        "-i", video_path,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        "-ac", "1",
        "-y",
        audio_path,
    ]

    try:
        subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
        )
    except FileNotFoundError:
        raise RuntimeError(
            "FFmpeg not found. Please install FFmpeg and add it to your system PATH.\n"
            "Download from: https://ffmpeg.org/download.html"
        )
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"FFmpeg failed: {e.stderr.decode(errors='replace')}")

def transcribe_audio(audio_path: str) -> Dict:
    """
    Transcribe audio using Whisper
    """
    model = get_whisper_model()
    result = model.transcribe(audio_path, language="en", fp16=False)
    return result

def analyze_transcript(transcript: str) -> tuple:
    """
    Analyze transcript for word count and filler words
    
    Returns:
        (total_word_count, filler_word_count)
    """
    # Clean and tokenize
    words = re.findall(r'\b\w+\b', transcript.lower())
    total_words = len(words)
    
    # Count filler words
    filler_count = sum(1 for word in words if word in FILLER_WORDS)
    
    # Check for multi-word fillers
    text_lower = transcript.lower()
    for filler in ["you know", "i mean", "kind of", "sort of"]:
        filler_count += text_lower.count(filler)
    
    return total_words, filler_count

def extract_pitch(y: np.ndarray, sr: int) -> tuple:
    """
    Extract pitch (F0) statistics using librosa
    
    Returns:
        (mean_pitch, pitch_variance)
    """
    # Extract pitch using piptrack
    pitches, magnitudes = librosa.piptrack(y=y, sr=sr, fmin=75, fmax=400)
    
    # Get pitch values where magnitude is highest
    pitch_values = []
    for t in range(pitches.shape[1]):
        index = magnitudes[:, t].argmax()
        pitch = pitches[index, t]
        if pitch > 0:  # Valid pitch
            pitch_values.append(pitch)
    
    if len(pitch_values) > 0:
        mean_pitch = np.mean(pitch_values)
        pitch_variance = np.var(pitch_values)
    else:
        mean_pitch = 150.0  # Default average pitch
        pitch_variance = 0.0
    
    return mean_pitch, pitch_variance

def compute_energy_stability(y: np.ndarray) -> float:
    """
    Compute RMS energy stability
    Lower variance = more stable energy = better
    """
    # Compute RMS energy per frame
    rms = librosa.feature.rms(y=y)[0]
    
    # Normalize variance to 0-1 score
    if len(rms) > 0:
        variance = np.var(rms)
        # Inverse relationship: lower variance = higher score
        stability = 1.0 / (1.0 + variance * 10)
        return np.clip(stability, 0, 1)
    
    return 0.5
