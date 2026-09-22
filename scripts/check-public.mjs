import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Inspect only files selected for this repository, never machine-wide files.
const files = [...new Set(execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' }).split('\0').filter(Boolean))];
const rules = [
  ['local user path', /\b[A-Z]:[\\/](?:Users|Spanish for Me)[\\/\s.]|\/Users\/[\w.-]+\//i],
  ['personal email', /[\w.+-]+@(?!users\.noreply\.github\.com)[\w.-]+\.[a-z]{2,}/i],
  ['credential', /\bgh[pousr]_[a-zA-Z0-9]{25,}|\bsk-[a-zA-Z0-9_-]{25,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
];
let failures = 0;
for (const file of files) {
  if (/(?:^|\/)(?:\.env(?:\..*)?|\.dev\.vars(?:\..*)?|\.wrangler|node_modules|artifacts)(?:\/|$)/.test(file)) {
    console.error(`Excluded path selected for publication: ${file}`); failures++;
  }
  const bytes = readFileSync(file);
  if (bytes.includes(0)) continue;
  for (const [kind, pattern] of rules) {
    if (pattern.test(bytes.toString('utf8'))) { console.error(`${file}: ${kind} requires review`); failures++; }
  }
}
if (failures) process.exitCode = 1;
else console.log(`Public-source check passed: ${files.length} files; no flagged private paths, emails, or credential patterns.`);
