# Delivery state

2026-09-22 — PUBLIC AND DEPLOYED. Live app: https://coqui-kickoff.pages.dev. Public source: https://github.com/LueBangs-coder/coqui-kickoff.

## Current scope

- Seven beginner lessons, 42 phrases, 84 core answer prompts, 45 bundled Puerto Rican Spanish clips, local progress and repeatable spaced reviews.
- Unlimited football with all 30 active 1997 teams, including Giants, and any different opponent. Three-return challenge; six points per touchdown. A persistent scoreboard shows points, touchdowns, and return count.
- Bundled original Eleven Music v2.5 instrumental salsa track, synthesized crowd and event effects, and device-voice commentary naming the selected team. Mute, volume, and individual music/crowd/commentary controls. Pausing or leaving football cancels stadium effects and pending calls.
- Soundtrack follow-up: music is enabled on the opening page and continues through lessons and football. The app attempts playback immediately and retries on the first tap or keypress for browser autoplay policies. A labeled Sound On/Off header control replaces the ambiguous icon-only control. Stadium effects and commentary still stop on pause/exit without stopping the app soundtrack.
- Public source authorized with Luis Betancourt attribution only. Publication excludes personal documents, contacts, credentials, local paths, and earlier private Git history. Earlier local history remains preserved separately.

## Validation and release evidence

- Release source `1547aae18ee84057bcd2a5ee8fbaa792e57df5e1` is published on protected public `main` through PR #1: https://github.com/LueBangs-coder/coqui-kickoff/pull/1. The branch requires the current `check` status and a pull request, blocks force-pushes and deletion, requires linear history and resolved conversations, and keeps an owner-recovery path.
- GitHub Actions run 35706073422 passed `check` and `deploy` on that exact merge commit: https://github.com/LueBangs-coder/coqui-kickoff/actions/runs/35706073422. The check job built and uploaded `dist`; the deploy job downloaded that verified artifact and published it through Wrangler using encrypted production-environment secrets.
- Cloudflare Pages reported the immutable production deployment https://81f58227.coqui-kickoff.pages.dev. The canonical app remains https://coqui-kickoff.pages.dev. The direct-upload Pages project is now deployed automatically after a protected-main merge; `npm run deploy` remains the documented owner-recovery command.
- Current validation passed: the public-source scan inspected 115 selected files, 92 tests passed across nine files, and TypeScript, production build, offline-worker generation, and whitespace checks passed. Regression coverage includes autoplay-blocked status reporting, one-time migration from the two known stale cache versions, and explicit activation for later updates.
- Public-resource acceptance found the current production bundle with the original `/audio/game/boricua-kickoff.mp3` track, the `Sound is ready. Tap to start audio` recovery state, and the `COQUI_ACTIVATE_UPDATE` service-worker message. The music URL returned HTTP 200. A cache-busted production worker reported version `3a08f3ea93e48348`; the ordinary worker response is marked `Cache-Control: no-cache`.
- Live browser acceptance passed on the canonical site: the home screen reported `SOUND ON` and `Ready for offline practice`; selecting the New York Giants automatically chose Dallas as the different opponent; the game showed a 0–0 New York Giants vs Dallas Cowboys scoreboard with touchdown and return counters; salsa music, crowd, team-call, mute, and volume controls were enabled; and a kickoff return started without console warnings or errors. Earlier local production acceptance also passed at 320 by 740 pixels with no horizontal overflow.
- Known stale clients using worker versions `b1f13d82d61cb513` or `e6b34349a9b3c0a9` receive a one-time forced activation and refresh. Later updates remain controlled: the app displays an update-ready notice and activates the waiting worker only when the learner chooses `Update now`.
- Initial public release source `c1c81dcef94eb53c4d910f4abb90bf4b5786ac58` is the single root commit on public `main`, authored and committed by Luis Betancourt with GitHub no-reply email. Earlier private history remains only on the local `main` branch and was not pushed. Its 88-test validation, GitHub Actions run 35697169581, and deployment `e9d512c7-da06-40a9-97d2-81bfc25de6f0` remain historical baseline evidence.

## Historical baseline

The initial app launched September 21, 2026. The earlier September 22 team-selection release moved the public app to Cloudflare Pages. Its production deployment was e0d4a91c-5935-496f-ba95-15e2fe6fd348. That release passed 77 unit tests, production build, 320/390-pixel browser checks, and independent live-resource hash verification. It did not include the game audio in the current release.

## Device acceptance and limits

This is an installable web app, not an App Store binary. Core lessons, audio, and football work offline after the app reports readiness; the optional celebration video is excluded. Progress is local to the browser and address, with no account or synchronization. Physical iOS/Android installation, microphone permissions, actual speaker output, and human Puerto Rican pronunciation review remain device acceptance checks. Desktop browser checks do not prove those outcomes. Public source availability does not grant a general redistribution license; see LICENSE.
