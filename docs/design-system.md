# The Clinic: product interface direction

## What changed

The initial homepage centered a conversational illustration and marketing steps. The redesign opens with a real doctor/specialty search, location choice, and consultation selector. Each entry point reaches an actual frontend flow. A doctor directory, interactive specialty directory, consultation explanation, SAL workflow, practical questions, and clinician workspace entry use distinct spatial structures.

## Core decisions

- Navigation prioritizes finding doctors, specialties, online consultation, SAL, and the patient's care space.
- Doctor listings put appointment actions beside specialty, location, language, and consultation type. They no longer display fictional ratings, testimonial quotes, or verification badges.
- A `portrait` field supports future approved clinician photography. Until real partner images exist, placeholders remain visibly illustrative.
- Homepage directory previews use a narrower list beside useful city links, avoiding excessively wide empty doctor cards.
- Online selection is retained through booking and displayed in the patient appointment. No real video call is started.
- SAL collects a structured visit brief. Its fixed demo destination is explicitly disclosed, and its urgent interruption remains intact.
- Desktop filters become an explicit mobile filter control. A persistent mobile bar prioritizes home, doctors, SAL, and appointments.
- The entire logo canvas is displayed proportionally; no clipping, negative offsets, recoloring, or asset edits are used.

## Tokens

Authoritative CSS values live in `src/app/globals.css` under `:root` and the Tailwind `@theme` block.

| Role | Value |
| --- | --- |
| Brand navy | `#071A3D` |
| Action blue | `#125CDB` (deeper UI shade of the supplied blue identity) |
| Main text | Navy / `#132D4B` |
| Secondary text | `#516277` |
| Canvas | `#F6F8FA` |
| Surface | White |
| Standard radius | 7 px |
| Spacing scale | 8, 16, 24, 32, 48, 64 px |
| Desktop primary heading | 58 px, weight 700–750 |
| Desktop section heading | 38 px, weight 700 |
| Body | 17 px desktop / 16 px mobile |
| Main actions | 16 px, weight 650, at least 51–54 px tall |

Fonts are bundled Inter, Noto Sans Arabic, and Heebo. Directional layout uses logical properties, mirrored arrows, locale-aware dates, and an SSR language cookie. Secondary labels are smaller than body copy, but primary instructions, inputs, doctor names, and actions remain prominent.

## Interaction and accessibility

Native labeled inputs, pressed states, focus outlines, semantic headings, live results, reduced-motion handling, and keyboard-operable disclosures support the main flows. Dashboard tabs use roving focus with arrow/Home/End controls and RTL-aware direction. Mobile SAL keeps its input and prototype notice above the bottom navigation at the standard phone viewport.

## Prototype boundaries

No backend, authentication, live AI, real doctor verification, payment, clinical triage engine, or video platform was added. Patient information stays in memory and resets on refresh. The doctor workspace remains a separate local simulation. Actual credentials, booking inventory, approved photography, translation review, secure records handling, and clinical governance are integration work for launch.
