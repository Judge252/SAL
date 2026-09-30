"""Bounded single-process protection; use a shared gateway limit when scaling workers.

No medical content, identifiers, or IP addresses are stored here.
"""
from collections import deque
from threading import Lock
from time import monotonic
from fastapi import HTTPException

_calls = deque()
_lock = Lock()


def check_guest_budget():
    now = monotonic()
    with _lock:
        while _calls and _calls[0] <= now - 60:
            _calls.popleft()
        if len(_calls) >= 20:
            raise HTTPException(429, 'SAL is busy. Please wait a minute before trying again.')
        _calls.append(now)
