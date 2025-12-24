/**
 * IndexedDB Storage - More reliable than localStorage on mobile
 * Persists even when switching tabs or when memory is low
 */

const DB_NAME = "QuizlyDB"
const DB_VERSION = 1
const STORE_NAME = "userProgress"

interface DBSchema {
  userProgress: {
    key: string
    value: unknown
  }
}

let dbInstance: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance)

  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("IndexedDB not available"))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      dbInstance = request.result
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(value, key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error("IndexedDB setItem error:", error)
    // Fallback to localStorage
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch (e) {
        console.error("localStorage fallback failed:", e)
      }
    }
  }
}

export async function getItem<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result as T | null)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error("IndexedDB getItem error:", error)
    // Fallback to localStorage
    if (typeof window !== "undefined") {
      try {
        const item = localStorage.getItem(key)
        return item ? JSON.parse(item) : null
      } catch (e) {
        console.error("localStorage fallback failed:", e)
        return null
      }
    }
    return null
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error("IndexedDB removeItem error:", error)
    if (typeof window !== "undefined") {
      localStorage.removeItem(key)
    }
  }
}

export async function clear(): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error("IndexedDB clear error:", error)
    if (typeof window !== "undefined") {
      localStorage.clear()
    }
  }
}

// Migrate from localStorage to IndexedDB
export async function migrateFromLocalStorage(key: string): Promise<void> {
  if (typeof window === "undefined") return

  try {
    const localStorageData = localStorage.getItem(key)
    if (localStorageData) {
      const data = JSON.parse(localStorageData)
      await setItem(key, data)
      console.log("Migrated data from localStorage to IndexedDB")
    }
  } catch (error) {
    console.error("Migration error:", error)
  }
}

