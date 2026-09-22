import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  FORCE_UPDATE_FROM,
  renderServiceWorker,
} from "./service-worker-template.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const outputDirectory = path.join(projectRoot, "dist");
const supported =
  /\.(?:html|js|css|json|webmanifest|svg|png|webp|jpe?g|gif|ico|woff2?|ttf|mp3|ogg|wav|m4a|wasm)$/i;
const budget = 24 * 1024 * 1024;

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) return collect(file);
      if (
        !entry.isFile() ||
        !supported.test(entry.name) ||
        entry.name === "sw.js"
      )
        return [];
      // Preserve source PNGs for provenance; mobile clients use the optimized WebP.
      if (
        directory === path.join(outputDirectory, "assets") &&
        ["coqui-coach.png", "football-preview.png"].includes(entry.name)
      )
        return [];
      return [file];
    }),
  );
  return files.flat().sort();
}

const files = await collect(outputDirectory);
for (const required of ["index.html", "offline.html", "manifest.webmanifest"]) {
  if (!files.includes(path.join(outputDirectory, required)))
    throw new Error(
      `Offline build is missing ${required}. Run vite build first.`,
    );
}
let total = 0;
const digest = createHash("sha256");
digest.update(await readFile(fileURLToPath(import.meta.url)));
digest.update(
  await readFile(new URL("./service-worker-template.mjs", import.meta.url)),
);
const urls = [];
for (const file of files) {
  const relative = path
    .relative(outputDirectory, file)
    .split(path.sep)
    .join("/");
  const bytes = await readFile(file);
  total += (await stat(file)).size;
  digest.update(relative).update("\0").update(bytes).update("\0");
  // Pages redirects HTML filenames; cache their canonical URLs so navigation
  // never receives a redirected response from the service worker.
  urls.push(
    relative === "index.html"
      ? "/"
      : relative === "offline.html"
        ? "/offline"
        : "/" + relative.split("/").map(encodeURIComponent).join("/"),
  );
}
if (total > budget)
  throw new Error(
    `Offline assets exceed the 24 MiB limit (${(total / 1048576).toFixed(1)} MiB). Optimize core assets before release.`,
  );
const version = digest.digest("hex").slice(0, 16);

const worker = renderServiceWorker({
  version,
  urls,
  forceUpdateFrom: FORCE_UPDATE_FROM,
});

await writeFile(path.join(outputDirectory, "sw.js"), worker, "utf8");
console.log(
  `Offline worker ${version}: ${urls.length} core assets, ${(total / 1048576).toFixed(2)} MiB. Optional videos stay online-only.`,
);
