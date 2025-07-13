/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_GOOGLE_DRIVE_CLIENT_ID: string
  readonly VITE_GOOGLE_CLOUD_PROJECT_ID: string
  readonly VITE_GOOGLE_DRIVE_API_KEY: string
  readonly VITE_ENABLE_OFFLINE_MODE: string
  readonly VITE_DEBUG_MODE: string
  readonly VITE_ENCRYPTION_ITERATIONS: string
  readonly VITE_MAX_IMAGE_SIZE: string
  readonly VITE_MAX_FILE_SIZE: string
  readonly VITE_SUPPORTED_IMAGE_FORMATS: string
  readonly VITE_OCR_LANGUAGE: string
  readonly VITE_OCR_CONFIDENCE_THRESHOLD: string
  readonly VITE_SESSION_TIMEOUT: string
  readonly VITE_AUTO_LOCK_TIMEOUT: string
  readonly VITE_DRIVE_FOLDER_NAME: string
  readonly VITE_DRIVE_API_VERSION: string
  readonly VITE_FIREBASE_EMULATOR_HOST: string
  readonly VITE_FIREBASE_EMULATOR_PORT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
