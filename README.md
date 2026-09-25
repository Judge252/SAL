# The Clinic

Arabic-first healthcare navigation frontend built with Next.js App Router, TypeScript, Tailwind CSS, and React. All application files are in `D:\my  business\TheClinic`.

## Run locally

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

For a different port (the preview uses 3107):

```sh
node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3107
```

```sh
npm run lint
npm run typecheck
npm run build
npm start
```

## Experiences

| Route | Experience |
| --- | --- |
| `/` | Working care search, directory previews, specialty browsing, online consultations and SAL entry points |
| `/sal` | Guided demo intake, progress, summary, urgent phrase interruption |
| `/doctors` | Search, specialty/city/language/consultation/availability filters, sorting, saved doctors |
| `/doctors/[id]` | Clearly fictional clinician profiles, consultation options, booking entry |
| `/booking/[id]` | Consultation type and slot selection, validated demo details, confirmation |
| `/dashboard` | Session appointments and cancellation, saved doctors, SAL history, local document metadata |
| `/specialties` | Interactive specialty directory and relevant profiles |
| `/online` | Video-capable doctor discovery and booking |
| `/information/[section]` | About, prototype privacy, and demo terms |
| `/doctor-dashboard` | Demo patient requests, acceptance/decline, availability toggles, profile editor |

Arabic is the default. English and Hebrew are available from the header. The locale cookie is read during server rendering so page language and direction remain consistent on reload. Typography is bundled locally, without third-party font requests. Layouts use logical properties for RTL and LTR.

## Protected brand assets

The two original PNG files at the project root remain untouched. Exact copies are served from `public/brand/`. Both have alpha transparency. No alternate versions, fonts, photos, or brand files were present at initial inspection.

| Original | Role | Dimensions | SHA-256 |
| --- | --- | --- | --- |
| `logo.png` | Primary The Clinic wordmark; header and footer | 1672 × 941 | `1396DD8BA1BAF91D31698CBE7C2FA63EC574DEC86FE96A3B9ABA27A62D896659` |
| `sal.png` | SAL standalone mark; assistant, journey, loading, mobile navigation, favicon/apple icon | 1254 × 1254 | `17704C3DFA42C763F8BF8D2C7B58E137AC71DB025B74FC4CE5DDED60D43C6E40` |

The wordmark component displays the complete original transparent canvas with proportional sizing and no clipping or negative offsets. There was no separate company icon-only file, so SAL's provided standalone mark is the app icon. Doctor avatars are intentional initials placeholders rather than fictional photographs.

## Architecture

- `src/app/`: route entry points, metadata, error/loading/not-found states, design tokens and responsive CSS.
- `src/components/`: reusable identity/UI components, navigation, provider, and feature views.
- `src/lib/types.ts`: domain contracts for doctors, intake, messages, and appointments.
- `src/lib/data.ts`: clearly fictional, localized demonstration data.
- `src/lib/services.ts`: typed service interface and mock adapter; replace this boundary with authenticated backend calls.
- `tests/`: browser tests for the connected product journeys and responsive layouts.

## Intentional frontend boundaries

There is no backend, authentication, live AI, clinical triage, verification service, real appointment booking, or document upload. SAL follows a fixed intake script and always uses family medicine as an explicitly labeled example destination. Its urgent-phrase checks only demonstrate an interruption flow and are not clinically comprehensive. Do not use this prototype for medical decisions.

Doctors, availability, and experience are fictional. Artificial ratings, testimonials and verification badges have been removed. All sensitive input and application state are held in React memory and cleared on full refresh. Booking contact fields are discarded after confirmation. Documents are not read or uploaded; the UI keeps filename/size metadata only while the dashboard stays mounted. Only the language preference is persisted in a cookie. No analytics are installed.

The doctor workspace is a separate local simulation: accepting requests changes its schedule; edits do not publish to the public directory. Availability slots in this prototype are illustrative and are not synchronized between doctor and patient views. Production slot locking, time-zone handling, permissions, validation, clinical governance, localization review, and secure storage belong in the future backend integration.

## Browser verification

Start a production server on port 3107, then:

```sh
npx playwright install chromium
npm run test:e2e
```

Tests cover language direction/persistence; filtering and empty results; saving, booking, and cancellation; SAL intake and urgent interruption; file metadata; doctor requests/profile/availability; all main screens at 1440, 390, and 320 pixels, mobile layouts in all three languages, full-logo rendering, home search, specialty discovery, and video-booking continuity. Test traces are retained for failures.

To use an existing Chrome installation instead of downloading Playwright Chromium, set `PLAYWRIGHT_CHANNEL=chrome` before running tests (PowerShell: `$env:PLAYWRIGHT_CHANNEL='chrome'`).

Framework setup follows the official [Next.js installation guide](https://nextjs.org/docs/app/getting-started/installation) and [Tailwind Next.js guide](https://tailwindcss.com/docs/installation/framework-guides/nextjs). Exact installed versions are recorded in `package-lock.json`.

## Product redesign

The homepage now starts with a functional doctor/specialty/city search and a clinic/video selector. Directory rows show consultation options and appointment actions, specialty browsing is interactive, and the doctor profile omits fabricated ratings and verification signals. Desktop and mobile share clear typography tokens, with larger labels, body copy, and controls. Dashboard tabs support arrow/Home/End keyboard navigation with RTL-aware direction.

The original project path has two spaces in `my  business`; all changes stay in that existing directory. The one-space path in the redesign brief does not exist.

The illustrative consultation photo is generated, is labeled accordingly, and is not a clinician endorsement. See `docs/image-generation.md` for its source and complete generation prompt. Doctor images remain honest placeholders; populate the optional `Doctor.portrait` field with approved local partner images later.
"# SAL" 
