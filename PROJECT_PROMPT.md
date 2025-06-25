Project: “SecureCardr” – Zero-Knowledge Card Vault Web App

Objective:
Build a single-page web application that lets users securely store, organize, and retrieve arbitrary “cards” (credit, debit, ID, loyalty, membership, etc.) by typing in details or snapping a photo—all encrypted client-side and saved directly to the user’s own Google Drive folder. You never see or touch unencrypted data; the user owns and controls everything.

Key Features & Requirements:

Authentication & Setup

Firebase Authentication (Google provider) or direct OAuth 2.0 Google Sign-In

Request only the drive.file scope (or drive.appdata for a hidden folder)

On first login: create a “SecureCardr” folder in the user’s Drive; save its folder ID locally (or in a tiny Firestore doc keyed by UID)

Show a one-time “Data Ownership & Liability” modal:

“All data is encrypted in your browser and stored only in your Drive. We have zero access or liability. If you lose your passphrase or delete your folder, your data is unrecoverable.”

Client-Side Encryption (Zero-Knowledge)

On signup, prompt user to choose a strong passphrase

Use the Web Crypto API (PBKDF2 + HKDF) to derive an AES-GCM key from that passphrase

Encrypt all card JSON blobs and image files before upload; store only ciphertext, IV, salt, and encrypted metadata

Decrypt on demand in browser—user must re-enter passphrase each session (or cache in memory)

No server-side key storage, no backup of unencrypted data

Adding & Categorizing Cards

Manual Entry Form:

Category dropdown: Credit, Debit, Loyalty, ID, Other

Nickname (text)

Number / ID field (text)

Expiry or Issue date (optional)

Notes (optional)

Image Capture:

“Take Photo” button → <input type="file" accept="image/*" capture>

Client-side cropping/rotation (e.g. Cropper.js)

Optional light OCR via Tesseract.js to prefill number—always allow manual correction

Metadata Extraction: last4 digits, file type, upload timestamp, category, nickname

Storage & File Model in Google Drive

File Types:

card.json files for manual entries (ciphertext + metadata fields)

card.jpg (or .png) for photos (encrypted binary blobs)

File Properties / AppProperties: store metadata (category, nickname, last4, addedAt)

Use Drive REST API (files.create, files.update, files.list, files.get) scoped to the “SecureCardr” folder only

Only encrypted bytes ever transit or reside on your servers (if you use Firestore, store only folder IDs, never card content)

Browsing & Retrieval

List files in the “SecureCardr” folder, show thumbnails (for images) or icons (for JSON cards) with nickname and category

On “View Details,” fetch the encrypted file, decrypt in browser, and render full data or full-size image

Provide “Edit” and “Delete” actions (re-encrypt on save, or remove file via Drive API)

Handle OAuth token expiry, quota errors, and revoked permissions with clear “Reconnect to Drive” flows

UX & Legal

Minimal, mobile-friendly UI (React / Vue / Svelte + Tailwind)

Light onboarding tour:

Sign in → grant Drive access

Create vault folder

Set passphrase → encrypt/decrypt demo

Add a card manually or via photo

Browse & view vault contents

Persistent “Help & Terms” page explaining: zero-knowledge encryption, no liability, user data ownership, passphrase backup

Optional Enhancements

LocalStorage caching of encrypted index for faster UI loads (still encrypted)

Bulk-export of all encrypted files as a ZIP (user-driven)

Dark mode & theming

Bookmarklet or browser extension for quick “Save to SecureCardr” from web pages

Tech Stack:

Frontend: React (or next) + Tailwind CSS

Auth: Firebase Auth (Google) or direct Google OAuth 2.0

Encryption: Web Crypto API (AES-GCM + PBKDF2/HKDF)

Storage API: Google Drive REST API (drive.file or drive.appdata)

(Optional) Firestore: store only { uid → driveFolderId } and user prefs

OCR/Cropping: Tesseract.js + Cropper.js

Success Criteria:

Users can add/view/edit/delete cards entirely client-side

All data remains encrypted in transit, at rest, and in your code you never see unencrypted content

Users clearly understand their sole ownership of data and liability for passphrase/folder maintenance

No storage costs or PCI scope for you—everything lives in users’ Drive quotas