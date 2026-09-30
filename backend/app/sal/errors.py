"""Public SAL failure codes; diagnostics deliberately exclude request content."""
import logging
from contextlib import contextmanager
from fastapi import HTTPException
from google.genai.errors import APIError as GeminiError
from pydantic import ValidationError

logger = logging.getLogger('clinic.sal')


@contextmanager
def stage(name, code, message):
    try:
        yield
    except HTTPException:
        raise
    except Exception as error:
        status = 503
        upstream_code = getattr(error, 'code', None)
        if name == 'generation':
            if isinstance(error, GeminiError):
                if upstream_code == 429:
                    code, message = 'AI_RATE_LIMITED', 'SAL has reached its AI service limit. Please try again later.'
                elif upstream_code in (400, 401, 403, 404):
                    code, message = 'AI_CONFIGURATION', 'SAL needs an AI service configuration check.'
            elif isinstance(error, (ValidationError, ValueError, TypeError)):
                code, message = 'AI_INVALID_RESPONSE', 'SAL received an incomplete response. Please try again.'
                status = 502
        # Never log exception messages, payloads, credentials, or medical text.
        logger.warning('sal_failure stage=%s category=%s error_type=%s upstream_code=%s',
                       name, code, type(error).__name__, upstream_code)
        raise HTTPException(status, {'code': code, 'message': message}) from None
