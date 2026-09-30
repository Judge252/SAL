export class ApiError extends Error {
  constructor(public status: number, message: string,
    public detail?: { code?: string; conversation_id?: string; message_saved?: boolean }) { super(message); }
}
let refresh: Promise<Response> | null = null;
export async function api<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const response = await fetch(`/api${path}`, { ...options, headers, credentials: 'same-origin', cache: 'no-store' });
  if (response.status === 401 && retry && !['/auth/login','/auth/register','/auth/refresh','/auth/logout'].includes(path)) {
    refresh ??= fetch('/api/auth/refresh', { method: 'POST', credentials: 'same-origin' });
    const renewed = await refresh.finally(() => { refresh = null; });
    if (renewed.ok) return api(path, options, false);
  }
  const body = await response.json();
  if (!response.ok) throw new ApiError(response.status,
    typeof body.detail === 'string' ? body.detail : body.detail?.message || 'Unable to complete request',
    typeof body.detail === 'object' && body.detail ? body.detail : undefined);
  return body as T;
}
export const json = (data: unknown) => JSON.stringify(data);
