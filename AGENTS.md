# Coquí Kickoff

Owner: Luis Betancourt. Source of truth: this repository.

Build a mobile-first, teen-friendly Puerto Rican Spanish learning app with accessible lessons and an original retro football game. Football is ALWAYS freely playable, with no tickets, lesson prerequisites or play limits. All 30 active 1997 teams, including New York Giants, are selectable. Giants are the default opponent for other teams; the learner may choose any different opponent, including when playing as the Giants. Preserve the 1997 franchise roster and historical city names. Bundled audio uses the documented es-PR-VictorNeural voice; never claim human pronunciation review from metadata alone.

Use React, TypeScript, Vite, and Phaser. Keep lesson data, progress rules, pronunciation, and game simulation separate. No accounts, advertising, analytics, paid APIs, or server storage are required. Progress stays on the current browser. Microphone practice is optional and recordings stay in memory.

Validation: npm run test, npm run build, git diff --check, desktop/mobile browser lesson and game smoke. Run deployment only after validation. Verify the deployed artifact and document live evidence in WORKLOG.md. Cloudflare Pages setup lives in wrangler.jsonc; the public app uses coqui-kickoff.pages.dev. Do not modify the account-wide Workers subdomain or unrelated Cloudflare projects. Do not delete files or branches for cleanup without exact authority.

README.md is the operating guide; WORKLOG.md owns current delivery state; docs/LEARNING.md owns research and curriculum rationale. Update these together at closeout.

Public-source boundary: publish only this app, its educational content, original app assets, and project documentation. Do not publish personal documents, local filesystem paths, credentials, private contact details, or earlier private Git history. Use the owner's GitHub no-reply address for commit metadata. The name Luis Betancourt is approved for attribution. Check npm run privacy-check before pushing.
