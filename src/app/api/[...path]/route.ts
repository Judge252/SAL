import { NextRequest } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const backend = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
  const url = new URL(path.map(encodeURIComponent).join('/') + request.nextUrl.search, backend + '/');
  const headers = new Headers();
  for (const key of ['content-type', 'cookie', 'origin', 'accept']) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }
  try {
    const result = await fetch(url, {
      method: request.method, headers, cache: 'no-store', redirect: 'manual',
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
      signal: AbortSignal.timeout(180000),
    });
    const outgoing = new Headers({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    outgoing.set('Content-Type', result.headers.get('content-type') || 'application/json');
    for (const cookie of result.headers.getSetCookie()) outgoing.append('Set-Cookie', cookie);
    return new Response(result.body, { status: result.status, headers: outgoing });
  } catch {
    return Response.json({ detail: { code: 'BACKEND_UNAVAILABLE', message: 'The Clinic API is unavailable. Please try again.' } }, { status: 503 });
  }
}
export { proxy as GET, proxy as POST, proxy as PATCH, proxy as DELETE, proxy as PUT };
