# Delivery state

2026-09-22 — Public educational release in validation. Live app: https://coqui-kickoff.pages.dev. New audio and scoreboard changes are local until the deployment evidence below is updated.

## Current scope

- Seven beginner lessons, 42 phrases, 84 core answer prompts, 45 bundled Puerto Rican Spanish clips, local progress and repeatable spaced reviews.
- Unlimited football with all 30 active 1997 teams, including Giants, and any different opponent. Three-return challenge; six points per touchdown. A persistent scoreboard shows points, touchdowns, and return count.
- Bundled original Eleven Music v2.5 instrumental salsa track, synthesized crowd and event effects, and device-voice commentary naming the selected team. Mute, volume, and individual music/crowd/commentary controls. Pausing or leaving cancels audio and pending calls.
- Public source authorized with Luis Betancourt attribution only. Publication excludes personal documents, contacts, credentials, local paths, and earlier private Git history. Earlier local history remains preserved separately.

## Validation and release evidence

Pending current release checks, public repository creation, hosted CI, and Cloudflare deployment. No release completion is claimed until these fields are reconciled.

## Historical baseline

The initial app launched September 21, 2026. The September 22 team-selection release moved the public app to Cloudflare Pages. Its production deployment was e0d4a91c-5935-496f-ba95-15e2fe6fd348. That release passed 77 unit tests, production build, 320/390-pixel browser checks, and independent live-resource hash verification. It did not include the new game audio in this release.

## Device acceptance and limits

This is an installable web app, not an App Store binary. Core lessons, audio, and football work offline after the app reports readiness; the optional celebration video is excluded. Progress is local to the browser and address, with no account or synchronization. Physical iOS/Android installation, microphone permissions, actual speaker output, and human Puerto Rican pronunciation review remain device acceptance checks. Desktop browser checks do not prove those outcomes. Public source availability does not grant a general redistribution license; see LICENSE.
