# Coquí Kickoff visual system

Design reference: concept.png, generated with built-in Image Gen on 2026-09-21. Audience: teen beginner, Puerto Rican family. Primary screen: training camp dashboard with top navigation, open heading, green practice panel and coquí mascot, dark retro football preview, seven-day route, daily phrase and pronunciation, subtle footer. Follow the same type and spacing system on lesson, playbook and game-day screens.

Palette: warm ivory #f7f5ef; forest #164b38; ink #17251e; golden yellow #f3ca50; navy #07182f. Headings: Anton and Barlow Condensed; body: DM Sans. Fonts are self-hosted. Controls: 44px minimum target where practical, visible focus, green/gold primary action. No essential timed learning; reduced-motion support.

Artwork: public/assets/coqui-coach.png is a generated standalone mascot matched to the design. Original pixel stadium preview and football sprites belong to the game module. Puerto Rican flags use five stripes, blue hoist triangle, one white star. No official league/game assets.

Responsive: desktop split 65/35; mobile stacked panels, horizontal day route, single-column exercises and touch game controls. Added functional states use this same design system.

Key copy: Coquí Kickoff; Training camp / Playbook / Game day; A little Spanish. A lot of game.; Build your Spanish. Rep your roots. Take on the Giants.; Your first words. Your first drive.; Start with a hello. Finish in the end zone.; Start today's practice; Next matchup; Play the Giants; Puerto Rican roots. Real-world Spanish. The owner's later instruction supersedes the concept's ticket: football is always freely playable.

Production decisions: actual selected team replaces conceptual 'Your team'; live progress replaces conceptual static day; privacy/help and actual voice availability are necessary functional details. No visual acceptance by the user is presumed from code completion.

September 22 update: all 30 teams, including Giants, and any different opponent are selectable. The matchup card, game uniforms, field, and copy follow the chosen teams. The seven-practice/42-phrase scope is visible beneath the learning route. The public home is coqui-kickoff.pages.dev.

Mobile delivery uses full-size WebP copies at quality 94: coquí 341,362 bytes and stadium 572,606 bytes, down 78.57% combined. Alpha is identical; both outputs were visually inspected. Original PNGs are preserved but excluded from the offline download.

The optional five-second celebration was generated with Higgsfield Kling 2.5 Turbo from the original coquí start frame. App copy: public/assets/coqui-celebration.mp4 (540 square, H.264, 662,979 bytes, fast-start, silent). First, middle, and end frames were inspected for mascot integrity. Generated motion changes the jersey number; a US flag appears in the stadium background while the mascot wears the Puerto Rican flag. This decorative clip is not instructional material. It is optional, never autoplayed, and excluded from core offline caching.
