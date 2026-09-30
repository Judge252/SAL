# SAL consultation redesign — 2026-09-30

This change updates the existing frontend. Backend code, FastAPI routes, Supabase schema, authentication contracts, and Gemini/RAG implementation were not modified during this work. The checkout contained substantial uncommitted work before this change; it was preserved.

## Experience

- Homepage and `/sal` share an open consultation stage with a prominent official character, navy typography, cyan light, and a floating composer.
- Official poses map to welcome, listening, thinking, explaining, and booking guidance. All five files in `public/images/sal/` were verified with SHA256 against their originals in `sal 3d/`. Original assets were not edited.
- Guests use the existing real SAL API. No simulated responses or doctors were added to the application.
- Voice and attachment controls are disabled and labelled as coming soon. No unsupported upload or voice functionality is implied.
- Recommendations retain the real doctor, location, language, service, availability, and match-context APIs, with refined presentation.
- Header links and guest booking links open the existing email/Google authentication form in a modal. After email login, the selected booking destination and visit mode are restored. Direct `/auth` routes remain available.
- The modal handles keyboard focus cycling, Escape, backdrop dismissal, scroll locking, and focus restoration. An unsent guest draft survives opening and dismissing it.
- Arabic, English, and Hebrew remain supported, including RTL layouts and reduced motion. Mobile keeps SAL above the conversation and composer.
- Secondary doctor search, specialties, and consultation services remain accessible through a shorter homepage and navigation.

## Verification

- `npm run typecheck`, `npm run lint`, and `npm run build`: passed.
- Final Playwright suite: 26 passed, 1 skipped. The skipped test needs an approved live doctor.
- Browser checks include 320×568 and 390×844 in all three languages, desktop character prominence, reduced motion, modal focus and draft preservation, authentication callbacks, API error recovery, recommendation data, and guest-to-login-to-appointment submission.
- Booking submission and recommendation tests use isolated test-browser API fixtures; these never enter the application or live database.
- Live guest SAL: a real Arabic response was displayed through the Next.js proxy and existing FastAPI/Gemini/RAG path. An upstream 504 was handled by the backend's existing fallback before the successful HTTP 200 response. This is evidence of a successful call, not a guarantee of provider reliability.
- Live email API checks: confirmation, HttpOnly cookies, profile retrieval, token refresh, logout, and returning password login passed. The temporary account was removed.
- Live browser check: email login through the new modal, return to the consultation, real authenticated SAL response (HTTP 200), and a saved conversation passed with no page errors. The temporary account was removed. Evidence: `work/sal-redesign-live-session.json`.
- The Google entry endpoint currently returns an authorization URL. The isolated callback test passed; a real Google account login was not performed.
- Live directory: zero approved doctors. Real doctor recommendations and live appointment creation therefore remain unverified. No synthetic doctor or appointment was published.

## Preview

Local frontend: http://127.0.0.1:3107/

Visual checks: `work/sal-redesign-desktop.png`, `work/sal-redesign-mobile.png`, and `work/sal-redesign-live-response.png`.

Authentication callback tests wait for DOM readiness and assert the exchange and destination directly. Full-load waits previously timed out when a character image request was cancelled during the immediate callback navigation.
