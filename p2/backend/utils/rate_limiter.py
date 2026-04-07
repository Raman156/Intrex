"""
Rate Limiting — Sliding Window Algorithm
=========================================
- Primary store : Redis (if REDIS_URL is set and reachable)
- Fallback store : in-process dict (single-instance only)
- Identity       : Firebase UID / JWT sub → IP address as last resort
- Returns proper 429 with Retry-After, X-RateLimit-* headers

Configuration (via environment variables)
------------------------------------------
REDIS_URL                   redis://localhost:6379  (optional)
RATE_LIMIT_AUTH_RPM         requests/min for authenticated users  (default 60)
RATE_LIMIT_ANON_RPM         requests/min for anonymous users      (default 10)
RATE_LIMIT_BURST_MULTIPLIER burst allowance multiplier            (default 1.5)
RATE_LIMIT_ENABLED          set to "false" to disable globally    (default true)
"""

from __future__ import annotations

import os
import time
import logging
import asyncio
from collections import defaultdict, deque
from typing import Optional, Tuple

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger("rate_limiter")

# ── Configuration ─────────────────────────────────────────────────────────────
ENABLED            = os.getenv("RATE_LIMIT_ENABLED", "true").lower() != "false"
AUTH_RPM           = int(os.getenv("RATE_LIMIT_AUTH_RPM", "60"))
ANON_RPM           = int(os.getenv("RATE_LIMIT_ANON_RPM", "10"))
BURST_MULTIPLIER   = float(os.getenv("RATE_LIMIT_BURST_MULTIPLIER", "1.5"))
REDIS_URL          = os.getenv("REDIS_URL", "")
WINDOW_SECONDS     = 60  # sliding window size

# ── Redis setup (optional) ────────────────────────────────────────────────────
_redis_client = None

def _get_redis():
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    if not REDIS_URL:
        return None
    try:
        import redis.asyncio as aioredis
        _redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)
        logger.info("✓ Rate limiter using Redis: %s", REDIS_URL)
        return _redis_client
    except Exception as e:
        logger.warning("⚠ Redis unavailable (%s) — falling back to in-memory rate limiter", e)
        return None

# ── In-memory fallback store ──────────────────────────────────────────────────
# { key: deque of timestamps }
_memory_store: dict[str, deque] = defaultdict(deque)
_memory_lock = asyncio.Lock()

# ── Abuse detection store ─────────────────────────────────────────────────────
# { key: {"failures": int, "last_failure": float} }
_abuse_store: dict[str, dict] = defaultdict(lambda: {"failures": 0, "last_failure": 0.0})
ABUSE_FAILURE_THRESHOLD = 20   # failures in window before flagging
ABUSE_RESET_SECONDS     = 300  # reset failure count after 5 min of clean traffic


# ── Core sliding-window check ─────────────────────────────────────────────────

async def _check_redis(key: str, limit: int) -> Tuple[bool, int, int]:
    """
    Returns (allowed, remaining, retry_after_seconds)
    Uses Redis sorted set as a sliding window log.
    """
    r = _get_redis()
    if r is None:
        return await _check_memory(key, limit)

    now = time.time()
    window_start = now - WINDOW_SECONDS

    pipe = r.pipeline()
    pipe.zremrangebyscore(key, "-inf", window_start)
    pipe.zadd(key, {str(now): now})
    pipe.zcard(key)
    pipe.expire(key, WINDOW_SECONDS + 1)
    results = await pipe.execute()

    count = results[2]
    burst_limit = int(limit * BURST_MULTIPLIER)

    if count > burst_limit:
        # Find oldest entry to compute retry-after
        oldest = await r.zrange(key, 0, 0, withscores=True)
        retry_after = int(WINDOW_SECONDS - (now - oldest[0][1])) + 1 if oldest else WINDOW_SECONDS
        return False, 0, retry_after

    remaining = max(0, limit - count)
    return True, remaining, 0


async def _check_memory(key: str, limit: int) -> Tuple[bool, int, int]:
    """In-memory sliding window fallback."""
    now = time.time()
    window_start = now - WINDOW_SECONDS
    burst_limit = int(limit * BURST_MULTIPLIER)

    async with _memory_lock:
        dq = _memory_store[key]
        # Evict expired timestamps
        while dq and dq[0] < window_start:
            dq.popleft()

        count = len(dq)
        if count >= burst_limit:
            retry_after = int(WINDOW_SECONDS - (now - dq[0])) + 1 if dq else WINDOW_SECONDS
            return False, 0, retry_after

        dq.append(now)
        remaining = max(0, limit - len(dq))
        return True, remaining, 0


# ── Identity resolution ───────────────────────────────────────────────────────

def _extract_identity(request: Request) -> Tuple[str, bool]:
    """
    Returns (identity_key, is_authenticated).
    Priority: Firebase UID in token → JWT sub → IP
    """
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        # Try Firebase token (uid claim) or JWT (sub claim)
        try:
            import firebase_admin.auth as fb_auth
            decoded = fb_auth.verify_id_token(token)
            return f"uid:{decoded['uid']}", True
        except Exception:
            pass
        try:
            from jose import jwt as jose_jwt
            SECRET_KEY = os.getenv("SECRET_KEY", "")
            payload = jose_jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            sub = payload.get("sub") or payload.get("email")
            if sub:
                return f"jwt:{sub}", True
        except Exception:
            pass

    # Fall back to IP
    forwarded_for = request.headers.get("X-Forwarded-For")
    ip = forwarded_for.split(",")[0].strip() if forwarded_for else request.client.host
    return f"ip:{ip}", False


# ── Abuse detection ───────────────────────────────────────────────────────────

def _record_failure(key: str):
    now = time.time()
    entry = _abuse_store[key]
    if now - entry["last_failure"] > ABUSE_RESET_SECONDS:
        entry["failures"] = 0
    entry["failures"] += 1
    entry["last_failure"] = now
    if entry["failures"] >= ABUSE_FAILURE_THRESHOLD:
        logger.warning("🚨 Abuse detected for key=%s failures=%d", key, entry["failures"])


def _is_abusive(key: str) -> bool:
    entry = _abuse_store.get(key)
    if not entry:
        return False
    if time.time() - entry["last_failure"] > ABUSE_RESET_SECONDS:
        return False
    return entry["failures"] >= ABUSE_FAILURE_THRESHOLD


# ── Public dependency factory ─────────────────────────────────────────────────

def rate_limit(
    auth_rpm: int = AUTH_RPM,
    anon_rpm: int = ANON_RPM,
    endpoint_tag: str = "general",
):
    """
    FastAPI dependency factory.

    Usage:
        @router.post("/submit-answer")
        async def submit(
            _: None = Depends(rate_limit(auth_rpm=30, anon_rpm=5, endpoint_tag="submit-answer"))
        ):
            ...
    """
    async def _dependency(request: Request):
        if not ENABLED:
            return

        identity, is_auth = _extract_identity(request)
        limit = auth_rpm if is_auth else anon_rpm
        key = f"rl:{endpoint_tag}:{identity}"

        # Hard block abusive clients
        if _is_abusive(key):
            logger.warning("🚫 Blocked abusive client key=%s", key)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Your access has been temporarily suspended due to abuse.",
                headers={
                    "Retry-After": str(ABUSE_RESET_SECONDS),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                },
            )

        allowed, remaining, retry_after = await _check_redis(key, limit)

        if not allowed:
            _record_failure(key)
            logger.info("⏱ Rate limited key=%s endpoint=%s", key, endpoint_tag)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Please retry after {retry_after} seconds.",
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time()) + retry_after),
                },
            )

        # Attach headers to response via request state (picked up by middleware)
        request.state.rate_limit_headers = {
            "X-RateLimit-Limit": str(limit),
            "X-RateLimit-Remaining": str(remaining),
            "X-RateLimit-Reset": str(int(time.time()) + WINDOW_SECONDS),
        }

    return _dependency


# ── Middleware to inject rate limit headers into every response ───────────────

async def rate_limit_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    headers = getattr(request.state, "rate_limit_headers", None)
    if headers:
        for k, v in headers.items():
            response.headers[k] = v
    return response
