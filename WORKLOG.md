# Delivery state

2026-09-29 — PUBLIC AND DEPLOYED. Live app: https://coqui-kickoff.pages.dev. Public source: https://github.com/LueBangs-coder/coqui-kickoff.

## Current scope

- Seven beginner lessons, 42 phrases, 84 core answer prompts, 45 bundled Puerto Rican Spanish clips, local progress and repeatable spaced reviews.
- Unlimited football with all 30 active 1997 teams, including Giants, and any different opponent. Three-return challenge; six points per touchdown. A persistent scoreboard shows points, touchdowns, and return count.
- Bundled original Eleven Music v2.5 instrumental salsa track, synthesized crowd and event effects, and device-voice commentary naming the selected team. Mute, volume, and individual music/crowd/commentary controls. Pausing or leaving football cancels stadium effects and pending calls.
- Soundtrack follow-up: music is enabled on the opening page and continues through lessons and football. The app attempts playback immediately and retries on the first tap or keypress for browser autoplay policies. A labeled Sound On/Off header control replaces the ambiguous icon-only control. Stadium effects and commentary still stop on pause/exit without stopping the app soundtrack.
- Public source authorized with Luis Betancourt attribution only. Publication excludes personal documents, contacts, credentials, local paths, and earlier private Git history. Earlier local history remains preserved separately.

## Validation and release evidence

- Current production source `7b8c042082a8647fe13780b5dc88af84a03fabc9` is published on protected public `main` through PR #3: https://github.com/LueBangs-coder/coqui-kickoff/pull/3. GitHub Actions run 36611800349 passed `check` and `deploy` on that exact merge commit and Cloudflare reported immutable deployment https://6407b176.coqui-kickoff.pages.dev. The canonical app remains https://coqui-kickoff.pages.dev.
- The September 29 release passed `npm run check` locally and in the protected-main workflow: the public-source scan inspected 115 selected files, 93 tests passed across nine files, and TypeScript, production build, offline-worker generation, and whitespace checks passed. The new regression proves that any legacy cache without the update-capability marker is replaced and reloaded, while a marked build still waits for explicit learner activation.
- Current-build browser acceptance passed on desktop and at a phone viewport with no console warnings or horizontal overflow. The home screen showed the labelled sound control and offline-ready state; Day 1 loaded with normal and slow Puerto Rican Spanish controls; a pronunciation request completed without a browser error; football showed the scoreboard and touch controls; a full return ended at 22 yards; and `Next return` advanced to return two. The app browser's pointer bridge stopped targeting buttons after the Phaser field took focus, while keyboard activation advanced the real app state; this was a test-harness limitation rather than an application change.
- Post-deploy resource acceptance matched the canonical and immutable deployments byte-for-byte for service worker SHA-256 `a08b111c053169ef0458b5a48a37bd9ce701fe2b954c210af6b73c798fe7416a`. Both returned worker version `8b02ed564bf2b75c`, `Cache-Control: no-cache`, the update-capability marker, `/assets/index-CFfQSWtl.js`, and HTTP 200 for `/audio/game/boricua-kickoff.mp3`.
- Post-deploy live browser acceptance on the canonical site showed `SOUND ON`, `Ready for offline practice`, and the saved New York Giants vs Dallas Cowboys matchup. The UI bundle is the same `index-CFfQSWtl.js` artifact exercised by the desktop and phone lesson/game smoke above; this release changes only update coordination and its documentation.
- Legacy clients whose offline cache cannot present the update control receive a one-time forced activation and refresh, regardless of their old version hash. This build stores an update-capability marker so later updates remain controlled: the app displays an update-ready notice and activates the waiting worker only when the learner chooses `Update now`.
- Initial public release source `c1c81dcef94eb53c4d910f4abb90bf4b5786ac58` is the single root commit on public `main`, authored and committed by Luis Betancourt with GitHub no-reply email. Earlier private history remains only on the local `main` branch and was not pushed. Its 88-test validation, GitHub Actions run 35697169581, and deployment `e9d512c7-da06-40a9-97d2-81bfc25de6f0` remain historical baseline evidence.

## Historical baseline

The initial app launched September 21, 2026. The earlier September 22 team-selection release moved the public app to Cloudflare Pages. Its production deployment was e0d4a91c-5935-496f-ba95-15e2fe6fd348. That release passed 77 unit tests, production build, 320/390-pixel browser checks, and independent live-resource hash verification. It did not include the game audio in the current release.

## Device acceptance and limits

This is an installable web app, not an App Store binary. Core lessons, audio, and football work offline after the app reports readiness; the optional celebration video is excluded. Progress is local to the browser and address, with no account or synchronization. Physical iOS/Android installation, microphone permissions, actual speaker output, and human Puerto Rican pronunciation review remain device acceptance checks. Desktop browser checks do not prove those outcomes. Public source availability does not grant a general redistribution license; see LICENSE.
