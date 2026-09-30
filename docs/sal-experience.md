# SAL product and authentication verification

The existing Next.js/FastAPI/Supabase architecture remains in place. No database migration was made.

## Product changes

- Homepage and /sal share a centered session with the exact protected sal 3d.png asset, copied byte-for-byte to public/images/sal-3d.png. Original logos remain intact.
- Welcome, listening, thinking, and recommendation states use subtle motion with reduced-motion support.
- Guests use the same /sal/chat endpoint and Gemini/RAG navigation function as patients. Guest history stays in browser memory and is sent as bounded conversational context; it is not written to patient tables. Reloading clears it.
- Signed-in conversations continue to use existing ownership checks and saved history.
- Recommendation reasons use the actual validated search filters returned by SAL and matching doctor fields. The UI does not invent clinical rationale.
- Booking still requires a patient account. Authentication preserves the selected doctor and visit type through the next parameter. Guest medical text is never put in URLs or browser storage.
- Manual search, specialties, and online consultations remain below SAL.

## Authentication changes

The existing cookie authentication has been repaired, not replaced:
- /auth/confirm now supports custom token_hash email links, Supabase default access/refresh fragments, and Google PKCE codes.
- Default email fragments are validated and rotated server-side into the existing HttpOnly cookies.
- Google uses an S256 challenge, short-lived HttpOnly verifier/state cookies, state validation, and server-side code exchange.
- Callback credentials are removed from the address bar. Invalid/expired/used links offer sign-in and resend recovery.
- Safe local redirects reject protocol-relative URLs, backslashes, encoded paths, and auth loops.
- Profile refresh waits for a verified user and ignores stale results. Role destinations come from the server profile.
- Visible sign-in/create-account links and Google entry points are present on desktop and mobile.

## Necessary backend bug fixes

The original temporary gemini().models call could destroy and close the SDK client before its HTTP request ran. Generation and embedding now keep that client alive with a context manager and close it afterward.

The configured gemini-2.5-flash model returned 404 for this account. The configured text model is now gemini-3.8-flash, verified against the provider model list and official documentation. Embedding model and vector dimensions are unchanged.

Guest calls have a bounded per-process budget of 20 requests/minute. A deployment with multiple workers needs a shared gateway limit; this local limiter is not a distributed abuse-control system.

## Verification and remaining dependencies

- Backend tests: 13 passed, including callback identities, PKCE state, safe redirects, guest/private boundaries, and generation-client lifetime.
- Browser contract tests cover guest chat to booking, email signup, both email callback formats, Google callback, invalid links, returning login, conversation continuity, errors, and multilingual mobile layouts.
- Live Supabase tests used temporary synthetic accounts and removed both afterward. Both token-hash and default email-fragment confirmation returned 200, created HttpOnly cookies, loaded a patient profile, persisted across a new client, refreshed tokens, signed out, and allowed password login.
- The default email action redirected to http://127.0.0.1:3107/auth/confirm. These checks used generated confirmation links; delivery into a real inbox was not tested.
- Google is disabled in the actual Supabase auth settings. Code and simulated provider callback tests pass; a real Google login is not yet verified.
- Live guest SAL returned HTTP 200 from Gemini through the application proxy. A real browser also displayed the first answer and sent a follow-up with two history entries. The follow-up encountered Google's intermittent 503 high-demand error. Guest error recovery preserves the draft and offers retry without requiring an account. This verifies a real response, not sustained provider reliability. No fake reply or substitute provider has been added.
- Public API reads briefly returned 503 during one smoke run; the focused rerun passed. This does not prove the upstream interruption cannot recur.
- There are no approved doctors in the live directory, so actual doctor selection/booking was verified with isolated browser fixtures rather than a real appointment.

## Google setup still required

In the Supabase project vlqbaqfvtwndtdfeksis, configure the Google provider with the application's Google OAuth Web Client ID and Client Secret.

Google Cloud authorized redirect URI:
https://vlqbaqfvtwndtdfeksis.supabase.co/auth/v1/callback

Supabase redirect allowlist for local testing:
http://127.0.0.1:3107/auth/confirm**

For production, add the exact production origin/callback pattern, set APP_ORIGIN to that origin, and enable secure cookies. The callback's next value is separately validated by the application. Never put the Google client secret into frontend environment variables or chat.

The connected Supabase connector currently exposes a different account. Project-owner access and Google credentials are needed to complete provider setup.

## Commands

Frontend: npm run lint, npm run typecheck, npm run build.
Browser: set PLAYWRIGHT_CHANNEL=chrome and run npm run test:e2e with both servers running.
Backend: from backend, run venv/Scripts/python -m pytest tests -q.

References:
- https://supabase.com/docs/guides/auth/social-login/auth-google
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash/

## SAL failure and hydration investigation — 2026-09-30

Scope: repair SAL execution/error handling and investigate hydration only. No redesign, auth/provider changes, schema changes, or edits to brand assets.

### Reproduced failure

The browser sends `/api/sal/chat`; the Next route proxies `/sal/chat` to `BACKEND_URL` (default `http://127.0.0.1:8000`). The configured frontend origin is `http://127.0.0.1:3107`. The running backend health and docs endpoints returned 200. Payload and response contracts, guest branching, and authenticated persistence were valid.

With the configured key and installed `google-genai` 2.25.0, the full navigation request to `gemini-3.8-flash` reproduced Gemini `503 UNAVAILABLE` (high demand). A basic generation succeeded, confirming the key/client were usable. Subsequent live testing also encountered an upstream 504 timeout and a 429 rate/quota rejection. These were previously swallowed by broad handlers and the frontend's generic catch block. No credentials or patient content are included in the new diagnostic logs.

### Changes in this repair

- `backend/app/sal/service.py`: bounded SDK backoff (two attempts per model, 30-second request timeout), then a configurable real Gemini fallback for transient 408/5xx/transport errors. Default primary remains `gemini-3.8-flash`; default fallback is `gemini-3.5-flash`, verified against the model listing and a live structured request. Both use the exact same prompt, history, RAG payload, JSON schema, validation, and DB doctor matching. Quota, authorization, invalid-model and response-validation failures do not trigger fallback. Explicit native JSON-schema output and disabled unused automatic function calling retain the existing response contract. Distinct failure stages preserve saved conversation IDs and known message-saving status.
- `backend/app/sal/errors.py`: sanitized category, exception type, and upstream code logging; structured errors for generation, configuration/quota, retrieval, catalog, and persistence.
- `backend/app/config.py` and `backend/.env.example`: optional `GEMINI_FALLBACK_MODEL` (empty disables it). No secret changes.
- `backend/app/main.py`: CORS allows only configured `APP_ORIGIN`; existing exact-origin CSRF checks remain intact. `localhost:3107` is not used in this setup and is intentionally not added to the allowlist.
- `src/app/api/[...path]/route.ts` and `src/lib/api/client.ts`: preserve structured error metadata, identify proxy/backend failure, leave auth refresh/cookie handling unchanged.
- `src/lib/api/sal-errors.ts` and `src/components/sal/sal-session.tsx`: localized Arabic/English/Hebrew diagnostic messages, retained drafts and saved conversation IDs.
- `backend/tests/test_sal_failures.py` and `tests/sal-product.spec.ts`: fallback, no retry on permanent errors, empty KB/vector matches, real-record matching boundary, source filtering, saved-message metadata, CORS, privacy, and error-display regressions.

### Live evidence and limits

- Real signed-in flow: two SAL turns returned 200 (14.0s and 8.9s), four persisted messages were retrieved, refresh and subsequent session returned 200, logout and returning password login returned 200. Temporary synthetic account was removed. No real patient's history was used.
- Real RAG: `gemini-embedding-001` generated a normalized 1536-dimensional query vector and `clinic_match_knowledge` executed successfully, returning zero matches. There are no knowledge documents in the live database, so populated retrieval/citation relevance cannot be live-verified. Normal SAL correctly skips unnecessary embedding when there are no active completed documents.
- Doctor table currently contains zero records. Real database matching returns an empty list; no fake doctors were inserted. Recommendation and booking UI behavior is regression-tested with browser-only fixtures, not represented as a live populated-directory test. Guest booking and private-history API requests both return 401.
- The configured Gemini service can still reject requests with 503/504/429. Bounded recovery cannot guarantee provider availability or replenish quota. Failures are now classified and shown accurately instead of pretending the message succeeded.
- Frontend typecheck and lint passed. 21 backend tests and 18 auth/SAL browser tests passed. See the final task report for production build and last guest-browser result.

### Hydration

A new isolated Edge browser context with `--disable-extensions` loaded `/`, `/sal`, and `/auth?mode=signup&next=%2Fdashboard`. All rendered `<html lang="ar" dir="rtl">`, without the reported `crxemulator` attributes, and produced no hydration errors. This supports the reported extension-induced mismatch; no application mismatch was reproduced. Disable extension `bekkpoinfafbjglppgdobfdeckghdhlo` for the local app or use a clean profile. No `suppressHydrationWarning`, mount-only rendering hack, or layout change was added.

Auth router/service, auth form, confirmation component, provider, and root layout were hash-compared before/after and remained unchanged. Existing Google configuration was not touched; Google UI callback regression passed, but a new external Google account login was not performed during this SAL repair.

Final quality gate: `npm run build` completed successfully. The final extension-free guest attempt returned `AI_RATE_LIMITED` from Gemini before generation; uninterrupted guest multi-turn completion remains unverified. Earlier guest first turns and both signed-in turns returned real Gemini responses. Do not describe this as fully restored provider availability.

Quota diagnosis: a single no-retry diagnostic request confirmed `429` for `generativelanguage.googleapis.com/generate_content_free_tier_requests`, limit **20**, model `gemini-3.8-flash`. Google's message requests checking plan/billing and reports a retry delay; that delay does not establish which quota window will reset. Check the project in Google AI Studio's rate-limit view and increase the applicable quota/billing tier or wait for its reset. No quota or billing settings were changed.
