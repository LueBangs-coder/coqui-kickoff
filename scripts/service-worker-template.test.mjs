import vm from "node:vm";
import { describe, expect, it, vi } from "vitest";
import { renderServiceWorker } from "./service-worker-template.mjs";

function workerHarness(cacheNames) {
  const listeners = new Map();
  const windowClient = {
    url: "https://coqui-kickoff.pages.dev/",
    navigate: vi.fn().mockResolvedValue(undefined),
    postMessage: vi.fn(),
  };
  const cache = {
    addAll: vi.fn().mockResolvedValue(undefined),
    match: vi.fn().mockResolvedValue(undefined),
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
    open: vi.fn().mockResolvedValue(cache),
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

  return { fire, self, caches, windowClient };
}

describe("service-worker updates", () => {
  it("replaces the known stale audio build and reloads its open client", async () => {
    const harness = workerHarness(["coqui-kickoff-static-legacy-version"]);
    await harness.fire("install");
    expect(harness.self.skipWaiting).toHaveBeenCalledOnce();

    await harness.fire("activate");
    expect(harness.self.clients.claim).toHaveBeenCalledOnce();
    expect(harness.windowClient.navigate).toHaveBeenCalledWith(
      "https://coqui-kickoff.pages.dev/",
    );
  });

  it("keeps future versions waiting unless the learner chooses to update", async () => {
    const harness = workerHarness(["coqui-kickoff-static-current-version"]);
    await harness.fire("install");
    expect(harness.self.skipWaiting).not.toHaveBeenCalled();

    await harness.fire("message", { data: { type: "COQUI_ACTIVATE_UPDATE" } });
    expect(harness.self.skipWaiting).toHaveBeenCalledOnce();
  });
});
