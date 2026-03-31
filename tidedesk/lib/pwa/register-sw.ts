/**
 * Registers the service worker and returns a handle for update management.
 * Safe to call in the browser only — no-ops on the server.
 */

export type SWRegistrationState = {
  registration: ServiceWorkerRegistration | null;
  updateAvailable: boolean;
};

let _reg: ServiceWorkerRegistration | null = null;

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    _reg = reg;

    reg.addEventListener("updatefound", () => {
      const newWorker = reg.installing;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        if (
          newWorker.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          window.dispatchEvent(new CustomEvent("sw-update-available"));
        }
      });
    });

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "SYNC_COMPLETE") {
          window.dispatchEvent(
            new CustomEvent("sync-complete", {
              detail: { remaining: event.data.remaining },
            })
          );
        }
      });
    }

    return reg;
  } catch (err) {
    console.error("SW registration failed:", err);
    return null;
  }
}

export function getRegistration() {
  return _reg;
}

export function skipWaiting() {
  _reg?.waiting?.postMessage("SKIP_WAITING");
}

export function retrySyncQueue() {
  navigator.serviceWorker.controller?.postMessage("RETRY_SYNC");
}
