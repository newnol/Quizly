/**
 * Auto-save hook for mobile browsers
 * Saves data when tab becomes hidden to prevent data loss
 */

import { useEffect, useRef } from "react"

interface AutoSaveOptions {
  onSave: () => void | Promise<void>
  debounceMs?: number
}

export function useAutoSave({ onSave, debounceMs = 500 }: AutoSaveOptions) {
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const isSavingRef = useRef(false)

  // Save when visibility changes (tab switching)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden && !isSavingRef.current) {
        // Tab is being hidden - save immediately
        isSavingRef.current = true
        try {
          await onSave()
        } catch (error) {
          console.error("Error auto-saving on visibility change:", error)
        } finally {
          isSavingRef.current = false
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [onSave])

  // Save before page unload
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (!isSavingRef.current) {
        isSavingRef.current = true
        try {
          await onSave()
        } catch (error) {
          console.error("Error auto-saving before unload:", error)
        } finally {
          isSavingRef.current = false
        }
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [onSave])

  // Save on blur (when window loses focus)
  useEffect(() => {
    const handleBlur = () => {
      // Debounce to avoid too many saves
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(async () => {
        if (!isSavingRef.current) {
          isSavingRef.current = true
          try {
            await onSave()
          } catch (error) {
            console.error("Error auto-saving on blur:", error)
          } finally {
            isSavingRef.current = false
          }
        }
      }, debounceMs)
    }

    window.addEventListener("blur", handleBlur)
    return () => {
      window.removeEventListener("blur", handleBlur)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [onSave, debounceMs])

  // Periodic auto-save (every 30 seconds)
  useEffect(() => {
    const intervalId = setInterval(async () => {
      if (!document.hidden && !isSavingRef.current) {
        isSavingRef.current = true
        try {
          await onSave()
        } catch (error) {
          console.error("Error in periodic auto-save:", error)
        } finally {
          isSavingRef.current = false
        }
      }
    }, 30000) // 30 seconds

    return () => clearInterval(intervalId)
  }, [onSave])
}

