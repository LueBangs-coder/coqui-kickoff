# Coquí Kickoff

Live app: **https://coqui-kickoff.pages.dev**

A mobile-first Puerto Rican Spanish learning camp for teen beginners, paired with an original retro football game. Hear a phrase, learn its meaning, recall it in both directions, revisit it, and play with any 1997 team, including the Giants. Football is always free to play, without tickets, prerequisites, or play limits.

On a phone, open the link and add it to the home screen. Stay online until the app says **Ready for offline practice**. Try Day 1 for 8–12 minutes; use Game day whenever you want. Progress is saved on that browser/device.

## Run

Requires Node.js 22.12+ (tested with Node 24).

```sh
npm ci
npm run dev
npm run check
```

`npm run build` creates `dist/` and its content-versioned offline service worker. `npm run preview` serves the production build locally. `npm run deploy` checks the app, then deploys the static build to the Cloudflare Pages project configured in `wrangler.jsonc` using the operator's Wrangler login. Production branch is `main`. Use the Pages command in the package script; `wrangler deploy` targets Workers and would reintroduce the account's Workers hostname.

## Learning

- Seven lessons, six phrases each: greetings, football, family, food, town, directions and game day.
- Each lesson has six phrase-learning cards, six Spanish-to-English questions, and six English-to-Spanish responses. Across the starter week: 42 phrases and 84 core answer prompts, plus optional speaking/listening, retries, and repeatable spaced reviews. This is the first beginner week; further curriculum is not yet included.
- 45 bundled Puerto Rican Spanish audio clips using Microsoft's es-PR-VictorNeural voice, including all 42 lesson phrases. Normal and slower playback work without installed system voices. These are synthesized, not human recordings. See [audio provenance](docs/AUDIO.md).
- Optional local microphone recording for listening back; no speech-recognition grading.
- Spanish → English meaning checks and English → Spanish typed recall. Missed phrases return until corrected. Accent keys help typing; omitted acute accents and punctuation are accepted, with model spelling shown. The letter ñ remains distinct from n.
- Finished lessons/reviews earn XP; they never gate football. Progress and review intervals (1, 3, 7 days) are stored in this browser.
- A searchable phrase playbook and replayable lessons. Use one lesson a day, with a few due review phrases. This is a starter week, not a complete course or a fluency promise.

Read [learning sources and curriculum rationale](docs/LEARNING.md).

## Football

Choose any of the 30 active teams from 1997, including the New York Giants, then choose any different team as the opponent. The default rival is the Giants, or Cowboys when playing as the Giants. Both selections are saved. The scoreboard, defender colors, and end zones follow the chosen matchup. Three kickoff returns, keyboard or touch controls, sprint, pause, and unlimited rematches. Play anytime from Game day. Original retro art; no official logos or Madden assets. An independent educational fan project, not affiliated with the NFL, teams, EA or Madden. Historical Washington display uses 'Washington · 1997'.

## Privacy and devices

No account, backend database, advertising or analytics. Progress is browser-local, not synced; clearing site storage clears progress. Optional recordings are held in memory, never uploaded by the app, and are released on leaving the exercise. Browser/OS speech voices can be network-backed. HTTPS is required for microphone access except on localhost. Voice and microphone support varies by device. Learning remains available without microphone permission.

Browser progress belongs to the address where it was saved and does not automatically transfer between deployments or devices.

Best use: open the deployed HTTPS link on your phone. Use the install control on supported Android browsers, or Share → Add to Home Screen in iPhone Safari. Wait for 'Ready for offline practice' before disconnecting: lessons, audio, and the football game are cached for offline use. Browser storage eviction can require another online visit. The optional celebration clip is excluded from the initial offline download. Tap audio buttons directly on iPhone/iPad. Actual speaker output, home-screen installation, and microphone permission should be checked on that device.

## Game audio and scoreboard

The scoreboard shows both teams, points, touchdowns, and the current return. Each touchdown earns six points; this is a three-return arcade challenge, so the defending team does not run an offense. Music, synthesized crowd reactions, tackle/touchdown effects, and team-name commentary start after a user interaction. Mute, volume, music, crowd, and commentary preferences persist locally. Pausing, switching away, and leaving the game stop stadium audio and pending calls. The global game-sound mute leaves requested Spanish pronunciation playback available.

Commentary uses an available English device voice and says the selected team's name, including “The New York Giants score a touchdown!” It is not a recording or clone of John Madden. Device voices may need network access. See [audio sources and limits](docs/AUDIO.md).

## Structure and delivery

- `src/data/`: curated curriculum and historical teams.
- `src/lib/`: progress, review, answer and voice rules.
- `src/components/`: learning screens, speech/recording and game shell.
- `src/game/`: deterministic football rules and Phaser renderer.
- `public/assets/`: original artwork; `docs/design/`: design reference.
- `WORKLOG.md`: current release evidence and remaining gates.

Created by Luis Betancourt. [Public source](https://github.com/LueBangs-coder/coqui-kickoff). GitHub Actions runs the privacy check, unit tests, and production build; deployment is a separate operator-run step. Current release evidence is recorded in WORKLOG.md. Public visibility does not grant a general redistribution license; see LICENSE and the third-party notices.
