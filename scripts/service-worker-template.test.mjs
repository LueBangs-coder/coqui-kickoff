import vm from "node:vm";
import { describe, expect, it, vi } from "vitest";
import { renderServiceWorker } from "./service-worker-template.mjs";

function workerHarness(cacheNames, markerAwareCaches = []) {
  const listeners = new Map();
  const windowClient = {
    url: "https://coqui-kickoff.pages.dev/",
    navigate: vi.fn().mockResolvedValue(undefined),
    postMessage: vi.fn(),
  };
  const openedCaches = new Map();
  const cacheFor = (name) => {
    if (!openedCaches.has(name)) {
      openedCaches.set(name, {
        addAll: vi.fn().mockResolvedValue(undefined),
        put: vi.fn().mockResolvedValue(undefined),
        match: vi.fn(async request =>
          markerAwareCaches.includes(name) && request === "/__coqui-update-ui-v1"
            ? new Response("ready")
            : undefined,
        ),
      });
    }
    return openedCaches.get(name);
  };
  const self = {
    addEventListener: (name, listener) => listeners.set(name, listener),
    skipWaiting: vi.fn().mockResolvedValue(undefined),
    clients: {
      claim: vi.fn().mockResolvedValue(undefined),
      matchAll: vi.fn().mockResolvedValue([windowClient]),
    },
    location: { origin: "https://coqui-kickoff.pages.dev" },
  };
  const caches = {
    open: vi.fn(async name => cacheFor(name)),
    keys: vi.fn().mockResolvedValue(cacheNames),
    delete: vi.fn().mockResolvedValue(true),
    has: vi.fn().mockResolvedValue(true),
  };
  vm.runInNewContext(
    renderServiceWorker({
      version: "next-version",
      urls: ["/", "/offline"],
      forceUpdateFrom: ["coqui-kickoff-static-legacy-version"],
    }),
    { self, caches, URL, Response, Set, Promise },
  );

  async function fire(name, event = {}) {
    let work;
    listeners.get(name)({
      ...event,
      waitUntil: (promise) => {
        work = promise;
      },
    });
    await work;
  }

  return { fire, self, caches, windowClient, openedCaches };
}

describe("service-worker updates", () => {
  it("replaces any legacy build that cannot present the update control", async () => {
    const harness = workerHarness(["coqui-kickoff-static-unknown-legacy"]);
    await harness.fire("install");
    expect(harness.self.skipWaiting).toHaveBeenCalledOnce();

    await harness.fire("activate");
    expect(harness.self.clients.claim).toHaveBeenCalledOnce();
    expect(harness.windowClient.navigate).toHaveBeenCalledWith(
      "https://coqui-kickoff.pages.dev/",
    );
  });

  it("marks this build as update-aware and lets future versions wait", async () => {
    const current = "coqui-kickoff-static-current-version";
    const harness = workerHarness([current], [current]);
    await harness.fire("install");
    expect(harness.self.skipWaiting).not.toHaveBeenCalled();
    expect(harness.openedCaches.get("coqui-kickoff-static-next-version").put)
      .toHaveBeenCalledWith("/__coqui-update-ui-v1", expect.any(Response));

    await harness.fire("message", { data: { type: "COQUI_ACTIVATE_UPDATE" } });
    expect(harness.self.skipWaiting).toHaveBeenCalledOnce();
  });

  it("does not force a refresh on a first install", async () => {
    const harness = workerHarness([]);
    await harness.fire("install");
    expect(harness.self.skipWaiting).not.toHaveBeenCalled();
  });
});
