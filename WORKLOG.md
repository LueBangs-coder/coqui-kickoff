# Delivery state

2026-09-22 — PUBLIC AND DEPLOYED. Live app: https://coqui-kickoff.pages.dev. Public source: https://github.com/LueBangs-coder/coqui-kickoff.

## Current scope

- Seven beginner lessons, 42 phrases, 84 core answer prompts, 45 bundled Puerto Rican Spanish clips, local progress and repeatable spaced reviews.
- Unlimited football with all 30 active 1997 teams, including Giants, and any different opponent. Three-return challenge; six points per touchdown. A persistent scoreboard shows points, touchdowns, and return count.
- Bundled original Eleven Music v2.5 instrumental salsa track, synthesized crowd and event effects, and device-voice commentary naming the selected team. Mute, volume, and individual music/crowd/commentary controls. Pausing or leaving football cancels stadium effects and pending calls.
- Soundtrack follow-up: music is enabled on the opening page and continues through lessons and football. The app attempts playback immediately and retries on the first tap or keypress for browser autoplay policies. A labeled Sound On/Off header control replaces the ambiguous icon-only control. Stadium effects and commentary still stop on pause/exit without stopping the app soundtrack.
- Public source authorized with Luis Betancourt attribution only. Publication excludes personal documents, contacts, credentials, local paths, and earlier private Git history. Earlier local history remains preserved separately.

## Validation and release evidence

- Continuous-soundtrack source `46d3fa730a907192ff4afbfb2887189eeac6d48d` is published on public `main`. GitHub Actions run 35700557793 passed on that exact source: https://github.com/LueBangs-coder/coqui-kickoff/actions/runs/35700557793.
- Cloudflare Pages production deployment `76b220a2-f0b2-4387-9f27-1cfac16d71bb` reports source `46d3fa7`; immutable deployment: https://76b220a2.coqui-kickoff.pages.dev. The exact deployment command passed the Ananke safety probe before execution.
- Current local validation passed: the public-source scan inspected 113 selected files, 89 tests passed across eight files, and TypeScript, production build, service-worker generation, and whitespace checks passed. The added regression proves the app soundtrack remains active when stadium effects stop. The build contains 74 core offline assets totaling 3.92 MiB with offline version `bdabffcbb6f16072`.
- Canonical and immutable live HTML matched local production bytes by SHA-256: `5da73691d935229fa5ed088f36577a74eedc3b12433e3076ecf3a7780c37c0cb`. Canonical service-worker SHA-256 is `101533be641f83e36d6d3f99c4c9b363d9af10338534e12bed330e27053f9b5d`; canonical music SHA-256 is `18df0f16ea7bd9fb189c97ca121e90975d22f77cd0256c78ba7495847b151a92`.
- Browser acceptance passed on the exact live deployment at 320 by 740 pixels: the opening page requested the bundled music before lesson or game navigation; the labeled `ON` control remained present through practice and football; the football scoreboard showed both scores, touchdowns, and return count; document width equaled scroll width at 305 pixels; and the console had no warnings or errors. The service worker deliberately keeps an already-open lesson on one coherent version, so an older open tab activates the update after all Coquí Kickoff tabs or app windows close and the app reopens.
- Initial public release source `c1c81dcef94eb53c4d910f4abb90bf4b5786ac58` is the single root commit on public `main`, authored and committed by Luis Betancourt with GitHub no-reply email. Earlier private history remains only on the local `main` branch and was not pushed. Its 88-test validation, GitHub Actions run 35697169581, and deployment `e9d512c7-da06-40a9-97d2-81bfc25de6f0` remain historical baseline evidence.

## Historical baseline

The initial app launched September 21, 2026. The earlier September 22 team-selection release moved the public app to Cloudflare Pages. Its production deployment was e0d4a91c-5935-496f-ba95-15e2fe6fd348. That release passed 77 unit tests, production build, 320/390-pixel browser checks, and independent live-resource hash verification. It did not include the game audio in the current release.

## Device acceptance and limits

This is an installable web app, not an App Store binary. Core lessons, audio, and football work offline after the app reports readiness; the optional celebration video is excluded. Progress is local to the browser and address, with no account or synchronization. Physical iOS/Android installation, microphone permissions, actual speaker output, and human Puerto Rican pronunciation review remain device acceptance checks. Desktop browser checks do not prove those outcomes. Public source availability does not grant a general redistribution license; see LICENSE.
