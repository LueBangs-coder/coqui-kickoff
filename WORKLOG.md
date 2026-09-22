# Delivery state

2026-09-22 — PUBLIC AND DEPLOYED. Live app: https://coqui-kickoff.pages.dev. Public source: https://github.com/LueBangs-coder/coqui-kickoff.

## Current scope

- Seven beginner lessons, 42 phrases, 84 core answer prompts, 45 bundled Puerto Rican Spanish clips, local progress and repeatable spaced reviews.
- Unlimited football with all 30 active 1997 teams, including Giants, and any different opponent. Three-return challenge; six points per touchdown. A persistent scoreboard shows points, touchdowns, and return count.
- Bundled original Eleven Music v2.5 instrumental salsa track, synthesized crowd and event effects, and device-voice commentary naming the selected team. Mute, volume, and individual music/crowd/commentary controls. Pausing or leaving cancels audio and pending calls.
- Public source authorized with Luis Betancourt attribution only. Publication excludes personal documents, contacts, credentials, local paths, and earlier private Git history. Earlier local history remains preserved separately.

## Validation and release evidence

- Release source `c1c81dcef94eb53c4d910f4abb90bf4b5786ac58` is the single root commit on public `main`, authored and committed by Luis Betancourt with GitHub no-reply email. Earlier private history remains only on the local `main` branch and was not pushed. The public-source check inspected 113 selected files and found no flagged private paths, personal email addresses, or credential patterns. The installed pre-commit secret guard passed without bypass.
- Local validation passed: 88 tests across eight files, TypeScript, production build, service-worker generation, and staged whitespace checks. Audio tests verify the exact 737,627-byte music asset and its SHA-256, team-name calls, muted/commentary behavior, source shutdown on pause/exit, late-download behavior, and an unavailable-Web-Audio fallback.
- GitHub Actions run 35697169581 passed on the exact release commit: https://github.com/LueBangs-coder/coqui-kickoff/actions/runs/35697169581.
- Cloudflare Pages production deployment `e9d512c7-da06-40a9-97d2-81bfc25de6f0` reports source `c1c81dc`; immutable preview: https://e9d512c7.coqui-kickoff.pages.dev. The exact deployment command passed the Ananke safety probe before execution.
- The release contains 74 core offline assets totaling 3.91 MiB; offline version `e6b34349a9b3c0a9`. The optional celebration video remains online-only. Canonical live HTML, the salsa MP3, and the service worker matched local production bytes by SHA-256. Live music SHA-256: `18df0f16ea7bd9fb189c97ca121e90975d22f77cd0256c78ba7495847b151a92`; live service-worker SHA-256: `4211be09690fe929dd4128c7cde27cb442a3cf3401c14b784a155e2c0acf4f0a`.
- Browser acceptance passed on the live deployment at 320 pixels: Giants versus Eagles loaded, the scoreboard exposed both scores, touchdowns, and return count, sound controls were present, and document width equaled scroll width at 305 pixels. Pronunciation playback entered its playing state, a correct answer produced its success state, and game start/pause worked without console errors. Existing canonical clients updated to the new service worker and then exposed the new global game-sound control.

## Historical baseline

The initial app launched September 21, 2026. The earlier September 22 team-selection release moved the public app to Cloudflare Pages. Its production deployment was e0d4a91c-5935-496f-ba95-15e2fe6fd348. That release passed 77 unit tests, production build, 320/390-pixel browser checks, and independent live-resource hash verification. It did not include the game audio in the current release.

## Device acceptance and limits

This is an installable web app, not an App Store binary. Core lessons, audio, and football work offline after the app reports readiness; the optional celebration video is excluded. Progress is local to the browser and address, with no account or synchronization. Physical iOS/Android installation, microphone permissions, actual speaker output, and human Puerto Rican pronunciation review remain device acceptance checks. Desktop browser checks do not prove those outcomes. Public source availability does not grant a general redistribution license; see LICENSE.
