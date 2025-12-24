/**
 * Service Worker Registration and Management
 */

export function registerServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return
  }

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      })

      console.log("Service Worker registered successfully:", registration.scope)

      // Handle updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing
        if (!newWorker) return

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            // New service worker available
            console.log("New service worker available")
            // You could show a notification to the user here
            if (confirm("Phiên bản mới có sẵn. Tải lại trang?")) {
              newWorker.postMessage({ type: "SKIP_WAITING" })
              window.location.reload()
            }
          }
        })
      })

      // Handle controller change
      let refreshing = false
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return
        refreshing = true
        window.location.reload()
      })
    } catch (error) {
      console.error("Service Worker registration failed:", error)
    }
  })
}

export function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return Promise.resolve(false)
  }

  return navigator.serviceWorker.getRegistration().then((registration) => {
    if (registration) {
      return registration.unregister()
    }
    return false
  })
}

export async function checkForUpdates(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return
  }

  const registration = await navigator.serviceWorker.getRegistration()
  if (registration) {
    await registration.update()
  }
}

// Request permission for background sync
export async function requestBackgroundSync(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return
  }

  try {
    const registration = await navigator.serviceWorker.ready
    if ("sync" in registration) {
      await (registration as any).sync.register("sync-progress")
      console.log("Background sync registered")
    }
  } catch (error) {
    console.error("Background sync registration failed:", error)
  }
}

