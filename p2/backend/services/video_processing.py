"""
Video processing service — MediaPipe Face Mesh + DeepFace
Provides accurate real-time facial metrics for live interview analysis.

Metrics produced per frame:
  eye_contact      – gaze direction score (0-1) via iris landmarks
  head_stability   – how centred/still the head is (0-1)
  engagement       – composite: gaze + centering + mouth activity
  centering        – face position relative to frame centre (0-1)
  blink_rate       – eye-aspect-ratio based blink detection
  head_pose        – pitch / yaw / roll in degrees
  emotion          – dominant emotion string (DeepFace, async)
  emotion_scores   – all 7 emotion probabilities
  attention        – derived attention score (0-1)
"""

import asyncio
import threading
import queue
import time
import numpy as np
from typing import Dict, Optional
import os

os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")

import cv2

# ── MediaPipe ────────────────────────────────────────────────────────────────
try:
    import mediapipe as mp
    # MediaPipe 0.10+ uses the Tasks API — mp.solutions no longer exists
    _mp_tasks = mp.tasks
    _mp_vision = mp.tasks.vision
    _mp_base   = mp.tasks.BaseOptions
    MEDIAPIPE_AVAILABLE = True
except Exception:
    MEDIAPIPE_AVAILABLE = False
    _mp_tasks = _mp_vision = _mp_base = None

# ── DeepFace (optional, loaded lazily) ───────────────────────────────────────
# NOTE: DeepFace requires TensorFlow which doesn't support Python 3.14 yet.
# Emotion analysis falls back to geometry-based approximation via MediaPipe.
DEEPFACE_AVAILABLE = False
DeepFace = None

# ── MediaPipe landmark indices ────────────────────────────────────────────────
# Iris centres (Tasks API face_landmarker model — 478 landmarks total)
# Left iris:  468-472  (centre=468, right=469, top=470, left=471, bottom=472)
# Right iris: 473-477  (centre=473, right=474, top=475, left=476, bottom=477)
LEFT_IRIS  = [468, 469, 470, 471, 472]
RIGHT_IRIS = [473, 474, 475, 476, 477]

# Eye corners for gaze calculation
LEFT_EYE_OUTER  = 33    # left outer corner
LEFT_EYE_INNER  = 133   # left inner corner (near nose)
RIGHT_EYE_OUTER = 263   # right outer corner
RIGHT_EYE_INNER = 362   # right inner corner (near nose)

# Eye corners for EAR (Eye Aspect Ratio) — blink detection
LEFT_EYE_EAR  = [362, 385, 387, 263, 373, 380]
RIGHT_EYE_EAR = [33,  160, 158, 133, 153, 144]

# Nose tip + chin for head pose proxy
NOSE_TIP   = 1
CHIN       = 152
LEFT_EAR   = 234
RIGHT_EAR  = 454
LEFT_EYE_OUTER  = 33
RIGHT_EYE_OUTER = 263

# Mouth open detection
UPPER_LIP = 13
LOWER_LIP = 14

# ── Geometry-based emotion approximation (no TensorFlow needed) ──────────────
# Uses MediaPipe landmark ratios to approximate emotional state.
# Not as accurate as a CNN but works on any Python version with zero extra deps.

# Landmark indices for emotion geometry
BROW_LEFT_INNER  = 107   # left inner brow
BROW_LEFT_OUTER  = 70    # left outer brow
BROW_RIGHT_INNER = 336
BROW_RIGHT_OUTER = 300
LEFT_EYE_TOP     = 159
LEFT_EYE_BOT     = 145
RIGHT_EYE_TOP    = 386
RIGHT_EYE_BOT    = 374
MOUTH_LEFT       = 61
MOUTH_RIGHT      = 291
MOUTH_TOP        = 13
MOUTH_BOT        = 14
CHEEK_LEFT       = 234
CHEEK_RIGHT      = 454

def _geometry_emotion(lm, w, h) -> Dict:
    """
    Approximate emotion from facial geometry ratios.
    Returns dominant emotion + scores dict (0-100 scale).
    """
    def pt(idx): return np.array([lm[idx].x * w, lm[idx].y * h])

    # Brow raise (surprise / fear): brow-to-eye distance normalised by face height
    face_h = abs(pt(CHIN)[1] - pt(NOSE_TIP)[1]) + 1e-6
    left_brow_raise  = (pt(LEFT_EYE_TOP)[1]  - pt(BROW_LEFT_INNER)[1])  / face_h
    right_brow_raise = (pt(RIGHT_EYE_TOP)[1] - pt(BROW_RIGHT_INNER)[1]) / face_h
    brow_raise = float(np.clip((left_brow_raise + right_brow_raise) / 2 * 4, 0, 1))

    # Brow furrow (angry): inner brow distance
    brow_dist = abs(pt(BROW_LEFT_INNER)[0] - pt(BROW_RIGHT_INNER)[0])
    eye_dist  = abs(pt(LEFT_EYE_TOP)[0]    - pt(RIGHT_EYE_TOP)[0]) + 1e-6
    brow_furrow = float(np.clip(1.0 - brow_dist / eye_dist, 0, 1))

    # Mouth curve (happy vs sad): corners vs centre
    mouth_w = abs(pt(MOUTH_RIGHT)[0] - pt(MOUTH_LEFT)[0]) + 1e-6
    corner_avg_y = (pt(MOUTH_LEFT)[1] + pt(MOUTH_RIGHT)[1]) / 2
    centre_y     = (pt(MOUTH_TOP)[1]  + pt(MOUTH_BOT)[1])  / 2
    mouth_curve  = float(np.clip((centre_y - corner_avg_y) / (mouth_w * 0.3), -1, 1))
    # positive = corners up (smile), negative = corners down (sad)

    # Mouth open (surprise / fear)
    mouth_open_ratio = float(np.clip(
        abs(pt(MOUTH_TOP)[1] - pt(MOUTH_BOT)[1]) / (face_h * 0.5), 0, 1
    ))

    # Eye openness (wide = surprise/fear, squint = disgust/angry)
    left_eye_h  = abs(pt(LEFT_EYE_TOP)[1]  - pt(LEFT_EYE_BOT)[1])
    right_eye_h = abs(pt(RIGHT_EYE_TOP)[1] - pt(RIGHT_EYE_BOT)[1])
    eye_open = float(np.clip((left_eye_h + right_eye_h) / (face_h * 0.3), 0, 1))

    # Score each emotion (0-100)
    scores = {
        "happy":    float(np.clip(mouth_curve * 80 + eye_open * 20, 0, 100)),
        "sad":      float(np.clip(-mouth_curve * 70 + (1 - eye_open) * 30, 0, 100)),
        "angry":    float(np.clip(brow_furrow * 70 + (-mouth_curve) * 30, 0, 100)),
        "surprise": float(np.clip(brow_raise * 50 + mouth_open_ratio * 30 + eye_open * 20, 0, 100)),
        "fear":     float(np.clip(brow_raise * 40 + mouth_open_ratio * 30 + (1 - mouth_curve) * 30, 0, 100)),
        "disgust":  float(np.clip(brow_furrow * 40 + (1 - eye_open) * 30 + (-mouth_curve) * 30, 0, 100)),
        "neutral":  0.0,
    }

    # Neutral fills the remainder
    top_sum = sum(v for k, v in scores.items() if k != "neutral")
    scores["neutral"] = float(max(0, 100 - top_sum * 0.6))

    # Normalise to sum = 100
    total = sum(scores.values()) + 1e-6
    scores = {k: round(v / total * 100, 1) for k, v in scores.items()}

    dominant = max(scores, key=scores.get)
    return {"emotion": dominant, "emotion_scores": scores, "emotion_confidence": scores[dominant]}


# ── Emotion worker (background thread — kept for future DeepFace support) ────
_emotion_queue: queue.Queue = queue.Queue(maxsize=1)
_emotion_result: Dict = {}
_emotion_lock = threading.Lock()

def _emotion_worker():
    """Placeholder — geometry emotion runs inline; this thread is reserved for future CNN."""
    while True:
        try:
            _emotion_queue.get(timeout=5)
        except queue.Empty:
            pass

threading.Thread(target=_emotion_worker, daemon=True).start()

def _submit_for_emotion(frame: np.ndarray):
    try:
        _emotion_queue.put_nowait(frame.copy())
    except queue.Full:
        pass

def get_latest_emotion() -> Optional[Dict]:
    with _emotion_lock:
        if not _emotion_result:
            return None
        if time.time() - _emotion_result.get("ts", 0) > 3:
            return None
        return dict(_emotion_result)

# ── Helpers ───────────────────────────────────────────────────────────────────
def _ear(landmarks, indices, w, h) -> float:
    """Eye Aspect Ratio — < 0.2 indicates a blink."""
    pts = np.array([[landmarks[i].x * w, landmarks[i].y * h] for i in indices])
    A = np.linalg.norm(pts[1] - pts[5])
    B = np.linalg.norm(pts[2] - pts[4])
    C = np.linalg.norm(pts[0] - pts[3])
    return (A + B) / (2.0 * C + 1e-6)

def _iris_gaze(landmarks, iris_idx, eye_outer_idx, eye_inner_idx, w, h) -> float:
    """
    Returns a gaze score 0-1.
    1.0 = iris centred between eye corners (looking at camera)
    0.0 = iris at extreme left/right
    """
    iris_x = np.mean([landmarks[i].x for i in iris_idx])
    outer_x = landmarks[eye_outer_idx].x
    inner_x = landmarks[eye_inner_idx].x
    eye_width = abs(outer_x - inner_x) + 1e-6
    # Ratio of iris position within the eye (0=outer corner, 1=inner corner)
    ratio = (iris_x - min(outer_x, inner_x)) / eye_width
    # Ideal ratio ≈ 0.5 (centred); score drops as it moves away
    return float(max(0.0, 1.0 - abs(ratio - 0.5) * 3.0))

def _head_pose(landmarks, w, h) -> Dict[str, float]:
    """
    Estimate head pose (pitch/yaw/roll) from face mesh landmarks.
    Returns degrees; 0 = neutral.
    """
    nose  = np.array([landmarks[NOSE_TIP].x * w,  landmarks[NOSE_TIP].y * h])
    chin  = np.array([landmarks[CHIN].x * w,       landmarks[CHIN].y * h])
    l_ear = np.array([landmarks[LEFT_EAR].x * w,   landmarks[LEFT_EAR].y * h])
    r_ear = np.array([landmarks[RIGHT_EAR].x * w,  landmarks[RIGHT_EAR].y * h])

    # Yaw: horizontal asymmetry between ears and nose
    mid_x = (l_ear[0] + r_ear[0]) / 2
    face_w = abs(r_ear[0] - l_ear[0]) + 1e-6
    yaw = float((nose[0] - mid_x) / face_w * 90)

    # Pitch: vertical position of nose relative to chin
    face_h = abs(chin[1] - nose[1]) + 1e-6
    mid_y = (nose[1] + chin[1]) / 2
    pitch = float((nose[1] - mid_y) / face_h * 60)

    # Roll: tilt of the ear-to-ear line
    dy = r_ear[1] - l_ear[1]
    dx = r_ear[0] - l_ear[0] + 1e-6
    roll = float(np.degrees(np.arctan2(dy, dx)))

    return {"pitch": pitch, "yaw": yaw, "roll": roll}

# ── Per-session blink tracker ─────────────────────────────────────────────────
class BlinkTracker:
    def __init__(self, threshold=0.20, cooldown_frames=3):
        self.threshold = threshold
        self.cooldown  = cooldown_frames
        self._below    = False
        self._cooldown = 0
        self.blink_count = 0
        self.frame_count = 0

    def update(self, ear: float):
        self.frame_count += 1
        if self._cooldown > 0:
            self._cooldown -= 1
            return
        if ear < self.threshold and not self._below:
            self._below = True
        elif ear >= self.threshold and self._below:
            self.blink_count += 1
            self._below = False
            self._cooldown = self.cooldown

    @property
    def blinks_per_minute(self) -> float:
        if self.frame_count == 0:
            return 0.0
        # Assume ~5 fps (frame sent every 200ms)
        minutes = self.frame_count / (5 * 60)
        return self.blink_count / max(minutes, 1e-6)

# Global blink tracker (reset per session via reset_blink_tracker())
_blink_tracker = BlinkTracker()

def reset_blink_tracker():
    global _blink_tracker
    _blink_tracker = BlinkTracker()

# ── MediaPipe FaceLandmarker (Tasks API, v0.10+) ─────────────────────────────
_face_landmarker = None
_FACE_MODEL_PATH = None  # will be resolved on first use

def _get_face_landmarker():
    global _face_landmarker, _FACE_MODEL_PATH
    if _face_landmarker is not None:
        return _face_landmarker
    if not MEDIAPIPE_AVAILABLE:
        return None
    try:
        import urllib.request, os, tempfile
        model_url  = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
        model_path = os.path.join(tempfile.gettempdir(), "face_landmarker.task")
        if not os.path.exists(model_path):
            print("⬇ Downloading MediaPipe face_landmarker model (~30 MB)…")
            urllib.request.urlretrieve(model_url, model_path)
            print("✓ Model downloaded")
        _FACE_MODEL_PATH = model_path

        FaceLandmarker = _mp_vision.FaceLandmarker
        FaceLandmarkerOptions = _mp_vision.FaceLandmarkerOptions
        RunningMode = _mp_vision.RunningMode

        options = FaceLandmarkerOptions(
            base_options=_mp_base(model_asset_path=model_path),
            running_mode=RunningMode.IMAGE,
            num_faces=1,
            min_face_detection_confidence=0.5,
            min_face_presence_confidence=0.5,
            min_tracking_confidence=0.5,
            output_face_blendshapes=True,
        )
        _face_landmarker = FaceLandmarker.create_from_options(options)
        print("✓ MediaPipe FaceLandmarker ready")
        return _face_landmarker
    except Exception as e:
        print(f"⚠ MediaPipe FaceLandmarker init failed: {e}")
        return None

# ── Haar cascade fallback ─────────────────────────────────────────────────────
_face_cascade = None
_eye_cascade  = None
_smile_cascade = None

def _get_cascades():
    global _face_cascade, _eye_cascade, _smile_cascade
    if _face_cascade is None:
        _face_cascade  = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        _eye_cascade   = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_eye.xml")
        _smile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_smile.xml")
    return _face_cascade, _eye_cascade, _smile_cascade

# ── Main per-frame function ───────────────────────────────────────────────────
def process_frame_facial(frame: np.ndarray, detect_emotion: bool = True) -> Optional[Dict]:
    """
    Process a single webcam frame.
    Returns a metrics dict or None if no face detected.

    Keys returned:
      eye_contact, head_stability, engagement, centering,
      blink_rate, head_pose (dict), attention,
      emotion*, emotion_scores*, confidence*   (* when available)
    """
    h, w = frame.shape[:2]
    face_mesh = _get_face_landmarker()

    # ── MediaPipe Tasks API path ──────────────────────────────────────────────
    if face_mesh is not None:
        import mediapipe as mp
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result = face_mesh.detect(mp_image)

        if not result.face_landmarks:
            return None

        lm = result.face_landmarks[0]  # list of NormalizedLandmark

        # Gaze / eye contact — use correct inner/outer corner pairs per eye
        left_gaze  = _iris_gaze(lm, LEFT_IRIS,  LEFT_EYE_OUTER,  LEFT_EYE_INNER,  w, h)
        right_gaze = _iris_gaze(lm, RIGHT_IRIS, RIGHT_EYE_OUTER, RIGHT_EYE_INNER, w, h)
        eye_contact = float(np.clip((left_gaze + right_gaze) / 2, 0, 1))

        # Blink
        left_ear  = _ear(lm, LEFT_EYE_EAR,  w, h)
        right_ear = _ear(lm, RIGHT_EYE_EAR, w, h)
        avg_ear   = (left_ear + right_ear) / 2
        _blink_tracker.update(avg_ear)
        blink_rate = _blink_tracker.blinks_per_minute

        # Head pose
        pose = _head_pose(lm, w, h)
        yaw_score   = float(max(0, 1.0 - abs(pose["yaw"])   / 30))
        pitch_score = float(max(0, 1.0 - abs(pose["pitch"]) / 20))
        head_stability = float((yaw_score + pitch_score) / 2)

        # Face centering
        nose_x = lm[NOSE_TIP].x
        nose_y = lm[NOSE_TIP].y
        cx_dist = abs(nose_x - 0.5) * 2   # 0 = centred, 1 = edge
        cy_dist = abs(nose_y - 0.5) * 2
        centering = float(max(0, 1.0 - (cx_dist + cy_dist) / 2))

        # Mouth openness (speaking indicator)
        upper_y = lm[UPPER_LIP].y * h
        lower_y = lm[LOWER_LIP].y * h
        mouth_open = float(np.clip((lower_y - upper_y) / 20, 0, 1))

        # Composite engagement
        engagement = float(np.clip(
            eye_contact * 0.45 + centering * 0.30 + mouth_open * 0.15 + head_stability * 0.10,
            0, 1
        ))

        # Attention score (penalise large yaw/pitch)
        attention = float(np.clip(
            eye_contact * 0.5 + head_stability * 0.3 + centering * 0.2,
            0, 1
        ))

        result: Dict = {
            "eye_contact":     eye_contact,
            "head_stability":  head_stability,
            "engagement":      engagement,
            "centering":       centering,
            "blink_rate":      blink_rate,
            "head_pose":       pose,
            "attention":       attention,
            "mouth_open":      mouth_open,
            "smile":           mouth_open,  # legacy key
        }

        # Geometry-based emotion (runs every frame, no ML needed)
        if detect_emotion:
            emo = _geometry_emotion(lm, w, h)
            result["emotion"]             = emo["emotion"]
            result["emotion_scores"]      = emo["emotion_scores"]
            result["emotion_confidence"]  = emo["emotion_confidence"]
            result["all_emotions"]        = emo["emotion_scores"]

        return result

    # ── Haar cascade fallback (if MediaPipe unavailable) ─────────────────────
    face_cascade, eye_cascade, smile_cascade = _get_cascades()
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)
    faces = face_cascade.detectMultiScale(gray, 1.1, 4, minSize=(80, 80))

    if len(faces) == 0:
        return None

    (x, y, fw, fh) = max(faces, key=lambda f: f[2] * f[3])
    face_gray = gray[y:y+fh, x:x+fw]

    eyes   = eye_cascade.detectMultiScale(face_gray, 1.1, 3, minSize=(20, 20))
    smiles = smile_cascade.detectMultiScale(face_gray, 1.5, 15, minSize=(25, 25))

    eye_contact = 1.0 if len(eyes) >= 2 else (0.7 if len(eyes) == 1 else 0.3)
    cx = (x + fw / 2) / w
    cy = (y + fh / 2) / h
    centering = float(max(0, 1.0 - (abs(cx - 0.5) + abs(cy - 0.5))))
    engagement = float(eye_contact * 0.5 + centering * 0.3 + (0.2 if smiles else 0))

    return {
        "eye_contact":    eye_contact,
        "head_stability": centering,
        "engagement":     engagement,
        "centering":      centering,
        "blink_rate":     0.0,
        "head_pose":      {"pitch": 0.0, "yaw": 0.0, "roll": 0.0},
        "attention":      engagement,
        "mouth_open":     0.0,
        "smile":          1.0 if smiles else 0.0,
    }


# ── Batch video processing (for uploaded video files) ────────────────────────
def process_video_facial(video_path: str) -> Dict[str, float]:
    """Process a recorded video file and return aggregated facial metrics."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError("Could not open video file")

    SAMPLE = 10
    metrics_acc = {k: [] for k in
                   ["eye_contact", "head_stability", "engagement", "centering", "attention"]}
    face_detected = []
    frame_idx = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        if frame_idx % SAMPLE == 0:
            m = process_frame_facial(frame, detect_emotion=False)
            if m:
                for k in metrics_acc:
                    metrics_acc[k].append(m.get(k, 0))
                face_detected.append(1)
            else:
                face_detected.append(0)
        frame_idx += 1

    cap.release()

    face_presence = float(np.mean(face_detected)) if face_detected else 0.0
    return {
        "eye_contact_score":      float(np.mean(metrics_acc["eye_contact"]))    if metrics_acc["eye_contact"]    else 0.0,
        "head_stability_score":   float(np.mean(metrics_acc["head_stability"])) if metrics_acc["head_stability"] else 0.0,
        "smile_score":            float(np.mean(metrics_acc["engagement"]))     if metrics_acc["engagement"]     else 0.0,
        "engagement_score":       float(np.mean(metrics_acc["engagement"]))     if metrics_acc["engagement"]     else 0.0,
        "face_presence_percentage": face_presence,
    }


def compute_stability(positions: list) -> float:
    if len(positions) < 2:
        return 0.5
    arr = np.array(positions)
    variance = np.var(arr, axis=0).mean()
    return float(1.0 / (1.0 + variance / 1000))
