import { useEffect, useState } from "react";
import { CheckCircle2, Download, Smartphone, WifiOff } from "lucide-react";
import "./InstallApp.css";

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/** Installation is optional. Offline-ready means the worker confirmed its cache. */
export default function InstallApp() {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [offlineReady, setOfflineReady] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(
    null,
  );
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installMessage, setInstallMessage] = useState("");
  const [updateReady, setUpdateReady] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [savingFailed, setSavingFailed] = useState(false);
  const supported =
    import.meta.env.PROD &&
    "serviceWorker" in navigator &&
    window.isSecureContext;

  useEffect(() => {
    let active = true;
    const cleanup: (() => void)[] = [];
    const standalone = window.matchMedia("(display-mode: standalone)");
    const isStandalone = () =>
      standalone.matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    const refreshInstalled = () => setInstalled(isStandalone());
    refreshInstalled();
    setIos(
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
    );
    const connectionChanged = () => setOnline(navigator.onLine);
    const savingError = () => setSavingFailed(true);
    const canInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPrompt);
    };
    const didInstall = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setInstallMessage("Added to your home screen.");
    };
    window.addEventListener("online", connectionChanged);
    window.addEventListener("offline", connectionChanged);
    window.addEventListener("coqui-offline-error", savingError);
    window.addEventListener("beforeinstallprompt", canInstall);
    window.addEventListener("appinstalled", didInstall);
    standalone.addEventListener("change", refreshInstalled);
    cleanup.push(() => {
      window.removeEventListener("online", connectionChanged);
      window.removeEventListener("offline", connectionChanged);
      window.removeEventListener("coqui-offline-error", savingError);
      window.removeEventListener("beforeinstallprompt", canInstall);
      window.removeEventListener("appinstalled", didInstall);
      standalone.removeEventListener("change", refreshInstalled);
    });

    if (supported) {
      const checkCache = () =>
        navigator.serviceWorker.controller?.postMessage({
          type: "COQUI_CACHE_STATUS",
        });
      const cacheMessage = (event: MessageEvent) => {
        if (
          event.data?.type === "COQUI_OFFLINE_READY" &&
          event.source === navigator.serviceWorker.controller
        )
          setOfflineReady(true);
      };
      navigator.serviceWorker.addEventListener("message", cacheMessage);
      navigator.serviceWorker.addEventListener("controllerchange", checkCache);
      cleanup.push(() => {
        navigator.serviceWorker.removeEventListener("message", cacheMessage);
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          checkCache,
        );
      });
      checkCache();
      void navigator.serviceWorker.ready
        .then((registration) => {
          if (!active) return;
          checkCache();
          const detectWaiting = () => {
            if (!active) return;
            const waiting = navigator.serviceWorker.controller
              ? registration.waiting
              : null;
            setWaitingWorker(waiting);
            setUpdateReady(Boolean(waiting));
          };
          const watchInstall = () => {
            const worker = registration.installing;
            if (!worker) return;
            worker.addEventListener("statechange", detectWaiting);
            cleanup.push(() =>
              worker.removeEventListener("statechange", detectWaiting),
            );
          };
          registration.addEventListener("updatefound", watchInstall);
          cleanup.push(() =>
            registration.removeEventListener("updatefound", watchInstall),
          );
          watchInstall();
          detectWaiting();
        })
        .catch(() => {
          /* Remain honest: do not display offline-ready on failure. */
        });
    }
    return () => {
      active = false;
      cleanup.forEach((remove) => remove());
    };
  }, [supported]);

  async function install() {
    if (!installPrompt || installing) return;
    const prompt = installPrompt;
    setInstalling(true);
    setInstallMessage("");
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted")
        setInstallMessage("Follow your browser’s install steps.");
    } catch {
      setInstallMessage(
        "Use your browser’s menu to add this app to your home screen.",
      );
    } finally {
      setInstallPrompt(null);
      setInstalling(false);
    }
  }

  function applyUpdate() {
    if (!waitingWorker) return;
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => window.location.reload(),
      { once: true },
    );
    waitingWorker.postMessage({ type: "COQUI_ACTIVATE_UPDATE" });
  }

  const status = offlineReady
    ? online
      ? "Ready for offline practice"
      : "Offline · practice is ready"
    : !online
      ? "Offline · reconnect to finish saving the app"
      : savingFailed
        ? "Offline saving paused · reconnect and reload to try again"
        : supported
          ? "Preparing this device for offline practice…"
          : "Play in this browser · offline saving is unavailable here";

  return (
    <aside className="install-app" aria-label="Use Coquí Kickoff anywhere">
      <div className="install-app__status" role="status" aria-live="polite">
        {!online ? (
          <WifiOff size={18} aria-hidden="true" />
        ) : offlineReady ? (
          <CheckCircle2 size={18} aria-hidden="true" />
        ) : (
          <Smartphone size={18} aria-hidden="true" />
        )}
        <span>
          <strong>{status}</strong>
          {offlineReady && (
            <small>
              Lessons, Spanish audio, and football stay on this device.
            </small>
          )}
          {updateReady && (
            <small>
              A new version is ready, including the latest sound and lessons.
            </small>
          )}
        </span>
      </div>
      {updateReady && (
        <button
          type="button"
          className="install-app__button install-app__button--update"
          onClick={applyUpdate}
        >
          Update now
        </button>
      )}
      {!installed && installPrompt && (
        <button
          type="button"
          className="install-app__button"
          onClick={() => void install()}
          disabled={installing}
        >
          <Download size={16} aria-hidden="true" />
          {installing ? "Opening install…" : "Add to home screen"}
        </button>
      )}
      {!installed && ios && !installPrompt && (
        <details className="install-app__ios">
          <summary>Add to iPhone or iPad</summary>
          <p>
            Open this page in Safari. Tap Share, then{" "}
            <strong>Add to Home Screen</strong>. If it appears, turn on{" "}
            <strong>Open as Web App</strong>, then tap Add.
          </p>
        </details>
      )}
      {installMessage && (
        <p className="install-app__message" role="status">
          {installMessage}
        </p>
      )}
    </aside>
  );
}
