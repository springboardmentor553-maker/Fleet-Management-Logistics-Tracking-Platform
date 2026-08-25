from slowapi import Limiter
from slowapi.util import get_remote_address

# Shared Limiter instance — imported by main.py (to register the middleware)
# and by individual routers (to decorate specific endpoints with stricter limits).
# default_limits applies to every endpoint that doesn't have its own @limiter.limit(...)
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])