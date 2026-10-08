"""In-memory sliding-window rate limiter (per process).

Good enough for a single API process. With several workers/instances each
keeps its own counters; move to a shared store if the deployment scales out.
Memory is bounded: idle keys are pruned once MAX_KEYS is exceeded.
"""

import threading
import time


class SlidingWindowLimiter:
    MAX_KEYS = 10_000

    def __init__(self, limit: int, window_seconds: float):
        self.limit = limit
        self.window_seconds = window_seconds
        self._events: dict[str, list[float]] = {}
        self._lock = threading.Lock()

    def _recent(self, key: str, now: float) -> list[float]:
        events = [stamp for stamp in self._events.get(key, []) if now - stamp < self.window_seconds]
        if events:
            self._events[key] = events
        else:
            self._events.pop(key, None)
        return events

    def _prune(self, now: float) -> None:
        if len(self._events) > self.MAX_KEYS:
            for key in list(self._events):
                self._recent(key, now)

    def is_limited(self, key: str) -> bool:
        """True if `key` already used its budget in the current window (does not record)."""
        now = time.monotonic()
        with self._lock:
            return len(self._recent(key, now)) >= self.limit

    def record(self, key: str) -> None:
        now = time.monotonic()
        with self._lock:
            self._prune(now)
            self._events.setdefault(key, []).append(now)

    def hit(self, key: str) -> bool:
        """Record one event; returns False (and does not record) when over the limit."""
        now = time.monotonic()
        with self._lock:
            self._prune(now)
            events = self._recent(key, now)
            if len(events) >= self.limit:
                return False
            self._events[key] = events + [now]
            return True

    def reset(self, key: str | None = None) -> None:
        with self._lock:
            if key is None:
                self._events.clear()
            else:
                self._events.pop(key, None)
