from urllib.parse import urlsplit


def safe_next(value: str | None) -> str:
    if not value or not value.startswith('/') or value.startswith('//'):
        return '/dashboard'
    if any(ord(c) < 32 for c in value) or '\\' in value or '%' in value.split('?')[0]:
        return '/dashboard'
    path = urlsplit(value).path
    if path == '/auth' or path.startswith('/auth/'):
        return '/dashboard'
    return value
