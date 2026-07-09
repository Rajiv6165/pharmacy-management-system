import time
from collections import defaultdict
from fastapi import Request, HTTPException, status

# NOTE: This is a memory-only, single-instance rate limiter.
# It is suitable for initial launch and single-container deployments.
# If scaling to multiple instances (e.g. behind a load balancer), 
# this should be replaced with a distributed rate limiter (e.g. using Redis).
class RateLimiter:
    def __init__(self, requests_limit: int, window_seconds: int):
        """
        Memory-based sliding window rate limiter.
        - requests_limit: Max number of requests allowed in the window
        - window_seconds: Size of the rolling window in seconds
        """
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)

    def __call__(self, request: Request):
        # Bypass rate limiter during unit/integration tests
        from app.config import settings
        if settings.ENV == "testing":
            return

        # Resolve client IP (supporting reverse proxies like Render/Railway)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "unknown"

        now = time.time()
        
        # Filter timestamps outside the sliding window
        self.requests[client_ip] = [
            t for t in self.requests[client_ip] if now - t < self.window_seconds
        ]

        # Check if rate limit exceeded
        if len(self.requests[client_ip]) >= self.requests_limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later."
            )

        # Record this request
        self.requests[client_ip].append(now)
