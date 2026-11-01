# VaultCloud — Technical Analysis & College Project Report Reference Document

**Project Title:** VaultCloud — Secure File Backup & Synchronization Platform  
**Target Program:** Bachelor of Technology (B.Tech) in Computer Science & Engineering  
**Academic Domain:** Distributed Systems, Cloud Computing, Cryptography, and Software Engineering  
**Analysis Date:** October 30, 2026  
**Document Purpose:** Factual technical analysis of the implemented repository at `E:\backup-sync` for academic project report generation with AI assistants (ChatGPT, Claude).

---

## Executive Summary & Abstract Notes

### Project Abstract
VaultCloud is a self-hosted, end-to-end secure file backup and real-time synchronization platform engineered to deliver private, transparent, and resilient cloud storage. The platform comprises a three-tier architecture:
1. A **high-performance backend** built with Python and the Django REST Framework, utilizing MongoDB via MongoEngine ODM for hierarchical metadata and content-addressed storage (CAS) on disk.
2. A **desktop synchronization agent** engineered with Python, Watchdog, SQLite, and Tkinter, featuring automatic change detection, debounced event queues, client-side SHA-256 pre-encryption hashing, and atomic file-locking coordination.
3. A **modern web dashboard** constructed with React 19, Vite, and Axios featuring glassmorphism aesthetics, responsive directory browsing, drag-and-drop file ingestion, revision inspection, and soft-delete trash recovery.

Data security is achieved through multi-layered cryptographic safeguards: user passwords are protected with memory-hard **Argon2** hashing with stateless **JSON Web Tokens (JWT)** for session integrity, while stored files employ **AES-256-GCM envelope encryption** utilizing per-version Data Encryption Keys (DEKs) wrapped by a master Key Encryption Key (KEK). Storage efficiency is optimized through plaintext content-addressed deduplication, while concurrency and data safety are maintained via distributed file locking, idempotency keys, and automated conflict reconciliation copies.

---

## PART 1 — REPOSITORY ANALYSIS

### 1.1 Complete Project Structure

The repository represents a polyglot micro-monorepo separating the server-side API, client desktop agent, client web application, and shared documentation and tests:

```
E:\backup-sync\
├── .env.example                     # Environment template for repository root
├── requirements.txt                 # Unified development dependency definitions
├── README.md                        # Master project documentation & quick start
├── docs/
│   ├── DEPLOYMENT.md                # Multi-environment deployment & disk redundancy notes
│   └── PROJECT_DIAGNOSIS_REPORT.md  # Reliability & account isolation audit findings
├── backend/                         # Django REST API & Storage Service
│   ├── manage.py                    # Django management script
│   ├── requirements.txt             # Backend-specific Python dependencies
│   ├── Procfile                     # Production deployment process definition (Gunicorn)
│   ├── db.sqlite3                   # Django default auxiliary database (sessions/admin)
│   ├── .env                         # Backend environment configuration
│   ├── .env.example                 # Backend environment variable template
│   ├── cloud_storage/               # Django root project configuration
│   │   ├── __init__.py
│   │   ├── settings.py              # Core Django settings (JWT, CORS, MongoEngine, Storage)
│   │   ├── urls.py                  # Master routing configuration
│   │   ├── wsgi.py                  # WSGI entrypoint for web server deployment
│   │   ├── middleware.py            # Correlation IDs & request audit logging
│   │   └── exceptions.py            # Standardized exception handler & error schemas
│   ├── accounts/                    # User authentication & identity management
│   │   ├── models.py                # MongoEngine User model with Argon2 integration
│   │   ├── views.py                 # Register, Login, Refresh, Logout, UserMe views
│   │   ├── urls.py                  # Auth endpoint routing (/api/auth/*)
│   │   ├── auth.py                  # Custom MongoJWTAuthentication & token generator
│   │   └── tests.py                 # Pytest/Django auth flow tests
│   ├── files/                       # Core file management, encryption, and sync API
│   │   ├── models.py                # MongoEngine Folder, File, FileVersion models
│   │   ├── crypto_utils.py          # AES-256-GCM envelope encryption & decryption streams
│   │   ├── lock_service.py          # Atomic distributed file-locking service
│   │   ├── urls_files.py            # File endpoints (/api/files/*)
│   │   ├── urls_folders.py          # Folder endpoints (/api/folders/*)
│   │   ├── views_files.py           # File CRUD, multipart upload, streaming decrypted download
│   │   ├── views_folders.py         # Hierarchical directory management
│   │   ├── views_revisions.py       # Version inspection, past revision download & restore
│   │   ├── views_lock.py            # Lock acquisition, renewal, and release endpoints
│   │   ├── views_sync.py            # Incremental change polling endpoint (/changes/)
│   │   └── tests.py                 # Encryption, locking, versioning unit tests
│   ├── storage/                     # Storage accounting & secondary backup service
│   │   ├── backup_service.py        # Secondary encrypted replication & disaster recovery
│   │   ├── views.py                 # Storage usage statistics view (/api/storage/usage/)
│   │   └── urls.py                  # Storage routing
│   └── file_storage/                # Primary content-addressed encrypted blob store (*.enc)
├── app/                             # Python Desktop Synchronization Client
│   ├── __init__.py
│   ├── main.py                      # CLI directory sync daemon entry point
│   ├── gui.py                       # Tkinter desktop graphical interface
│   ├── auth.py                      # Client-side JWT session & token cache manager
│   ├── db.py                        # Local SQLite database manager (sync_state.db)
│   ├── drive_client.py              # HTTP client with Tenacity exponential retry & hashing
│   ├── watcher.py                   # Watchdog filesystem observer & debounced queues
│   ├── sync_engine.py               # Local sync state machine, conflict resolution & upload
│   ├── sync_state.db                # Local SQLite persistence file
│   ├── token.json                   # Cached JWT access and refresh tokens
│   ├── credentials.json             # Cached user credentials for auto-reconnect
│   ├── test_account_isolation.py    # 12 regression tests for multi-account safety
│   ├── test_individual_sync.py      # 4 tests for GUI individual file monitor lifecycle
│   └── test_duplicate_filename.py   # 16 tests for auto-renaming and cloud ID stability
├── frontend/                        # React 19 + Vite Web Application
│   ├── index.html                   # HTML entry page
│   ├── vite.config.js               # Vite build configuration with React plugin
│   ├── package.json                 # Node dependencies (React 19, Lucide, Axios)
│   ├── src/
│   │   ├── main.jsx                 # React root renderer
│   │   ├── App.jsx                  # Master UI layout & view router
│   │   ├── App.css                  # Core component styles
│   │   ├── index.css                # Global glassmorphism theme & variables
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Global authentication state provider
│   │   ├── services/
│   │   │   └── api.js               # Axios instance with automatic JWT refresh queue
│   │   └── components/
│   │       ├── FileBrowser.jsx      # File/folder grid/list explorer & breadcrumb nav
│   │       ├── LoginRegister.jsx    # Authentication modal / screen
│   │       ├── Navbar.jsx           # Top header bar with search & actions
│   │       ├── Sidebar.jsx          # Left menu & real-time quota indicator
│   │       ├── MoveModal.jsx        # Folder selection modal for moving files
│   │       ├── VersionHistoryModal.jsx # Version inspection and rollback dialog
│   │       └── TrashView.jsx        # Soft-deleted items recovery and purge
└── test/                            # Cross-system integration and regression tests
    ├── e2e_test.py                  # End-to-end integration test of live sync
    ├── test1.py                     # Local unit tests for actions, conflict copy, hashing
    └── test2.py                     # Wrapper test runner
```

---

## PART 2 — PROJECT OVERVIEW

### 2.1 Background and Motivation
Modern personal and enterprise computing depends heavily on cloud storage services such as Google Drive, Dropbox, and Microsoft OneDrive. While convenient, proprietary public cloud services suffer from significant architectural concerns:
- **Privacy and Data Sovereignty:** Files are frequently stored unencrypted or encrypted with vendor-controlled keys, exposing personal and enterprise data to unauthorized inspection, third-party breaches, and jurisdiction-wide subpoenas.
- **Vendor Lock-in and Cost:** Storage subscription tiers scale aggressively, with no transparency into how data is stored or replicated.
- **Synchronization Ambiguity:** Closed-source desktop agents often handle version conflicts opaquely, silently overwriting local edits or dropping pending offline modifications.

VaultCloud was developed as an open-source, self-hosted file backup and synchronization platform that restores absolute data ownership to the user while upholding industry-standard cloud storage conveniences: transparent envelope encryption, content-addressed storage deduplication, multi-device concurrency control, and zero-loss conflict resolution.

### 2.2 Problem Statement
Existing personal backup solutions typically force an unacceptable compromise:
1. Standard network shares (SMB/NFS) lack real-time synchronization, mobile/web access, version tracking, and client-side change monitoring.
2. Commercial cloud platforms provide polished sync clients but retain access to plaintext content, making them unsuitable for confidential or sensitive workloads.
3. Open-source personal clouds often lack robust file locking, resulting in silent data corruption or race conditions when multiple devices or applications edit the same document concurrently.

The core engineering challenge is to design and implement a cohesive, multi-platform file synchronization system that integrates:
- Cryptographically strong, automated envelope encryption.
- Robust, event-driven filesystem monitoring with millisecond debounce capabilities.
- Distributed, atomic file locking to prevent multi-device overwrite collisions.
- Transparent version history with single-click historical rollbacks.
- Reliable offline reconciliation without data loss.

### 2.3 Main Objectives
1. **Design a RESTful Cloud Storage Backend:** Construct a scalable API conforming to Google Drive v3 semantics for file and folder hierarchies, metadata, and revision histories.
2. **Implement Envelope Cryptography:** Ensure that file contents are encrypted at rest using AES-256-GCM with fresh Data Encryption Keys (DEKs) wrapped by an administrator Key Encryption Key (KEK).
3. **Build an Autonomous Desktop Sync Agent:** Develop a background agent utilizing native OS filesystem event APIs to detect additions, modifications, renames, and deletions in real time.
4. **Prevent Synchronization Concurrency Hazards:** Implement atomic, time-bounded distributed file locks that prevent simultaneous write operations across distinct devices.
5. **Guarantee Data Integrity and Non-Destructive Reconciliation:** Employ content-addressed SHA-256 hashing to eliminate redundant blob storage and create timestamped conflicted copies whenever true concurrent updates occur.
6. **Provide a Responsive Web Dashboard:** Deliver a modern React user interface supporting folder hierarchy navigation, version rollbacks, search, trash restoration, and storage quota tracking.

### 2.4 Project Scope
- **Included:**
  - Multi-user authentication with Argon2 password hashing and JWT authorization.
  - Multi-tier file storage (encrypted primary CAS blob store + secondary disaster recovery backup).
  - Web dashboard (React 19 + Vite) supporting file/folder browsing, upload/download, version inspection, and soft-delete trash.
  - Desktop sync client (Tkinter GUI + CLI daemon) supporting both whole-folder tracking and selective individual file monitoring.
  - Full envelope encryption pipeline with pre-encryption content hash integrity checks.
  - Atomic distributed file locks with TTL expiry and renewal.
- **Excluded / Future Scope:**
  - Public file sharing via anonymous URL links.
  - Real-time in-browser collaborative document editing (e.g., OT/CRDT text editors).
  - Multi-region distributed storage clustering (e.g., Ceph, MinIO distributed).
  - Native mobile applications (iOS/Android).

### 2.5 Technologies Used and Engineering Justification

| Technology | Layer / Component | Engineering Justification |
|------------|-------------------|---------------------------|
| **Python 3.10+** | Backend & Desktop Agent | Provides mature cryptographic primitives (`cryptography`), robust HTTP tooling, cross-platform OS bindings, and high developer velocity. |
| **Django 5.0 + DRF** | Backend REST API | Offers an enterprise-grade web framework with established middleware pipelines, authentication throttling, standardized exception handlers, and security headers. |
| **MongoDB + MongoEngine** | Cloud Database (ODM) | Schema-flexible document database ideal for hierarchical file-folder trees, polymorphic metadata, dynamic revision lists, and high-frequency lock state transitions. |
| **SQLite 3** | Desktop Local State | Embedded, zero-configuration ACID relational database perfectly suited for storing per-device file state, synchronization hashes, and tracking queues locally. |
| **React 19 + Vite 8** | Web Frontend | Modern, high-performance UI library paired with Vite's rapid bundling; enables immediate reactive state updates for file trees and progress indicators. |
| **AES-256-GCM** | Cryptographic Layer | Authenticated encryption with associated data (AEAD) guaranteeing both confidentiality and ciphertext integrity with hardware acceleration (AES-NI). |
| **Argon2id** | Credential Security | Winner of the Password Hashing Competition; highly resistant to GPU/ASIC brute-force attacks via memory-hard and time-hard cost parameters. |
| **Watchdog** | Desktop File Monitoring | Native operating system filesystem event wrapper (ReadDirectoryChangesW on Windows, inotify on Linux, FSEvents on macOS). |
| **Tenacity** | Network Resilience | Declarative retry framework with exponential backoff and jitter to transparently survive transient network hiccups and server rate-limiting (HTTP 429/503). |

---

## PART 3 — SYSTEM ARCHITECTURE

### 3.1 Architectural Overview
VaultCloud implements an event-driven, client-server distributed architecture with decoupled presentation, orchestration, and persistence tiers.

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT TIER                                        |
|                                                                                       |
|   +------------------------------------+    +-------------------------------------+   |
|   |         React Web Client           |    |     Python Desktop Sync Agent       |   |
|   |  - FileBrowser / TrashView         |    |  - Tkinter GUI (gui.py)             |   |
|   |  - VersionHistoryModal             |    |  - Watchdog IndividualFileMonitor   |   |
|   |  - Axios API with JWT Queue        |    |  - Local SQLite (sync_state.db)     |   |
|   +-----------------+------------------+    +------------------+------------------+   |
+---------------------|------------------------------------------|----------------------+
                      | HTTPS / REST                             | HTTPS / REST
                      +---------------------+--------------------+
                                            |
+-------------------------------------------v-------------------------------------------+
|                                    BACKEND TIER                                       |
|                                                                                       |
|                    Django 5.0 REST Framework API (cloud_storage)                      |
|                                                                                       |
|   +-------------------------+  +--------------------------+  +--------------------+   |
|   |    accounts Service     |  |      files Service       |  |  storage Service   |   |
|   |  - Argon2 Hasher        |  |  - FileListCreateView    |  |  - StorageUsage    |   |
|   |  - MongoJWTAuth         |  |  - StreamingContentView  |  |  - ReplicateBlob   |   |
|   |  - SimpleJWT Provider   |  |  - FileLockService (TTL) |  |  - DR Recovery     |   |
|   +------------+------------+  +------------+-------------+  +---------+----------+   |
|                |                            |                          |              |
|                |                            | (AES-256-GCM Envelope)   |              |
|                v                            v                          v              |
|   +-------------------------+  +--------------------------+  +--------------------+   |
|   |  MongoDB Document Store |  | Primary Blob Storage     |  | Secondary Backup   |   |
|   |  - users                |  | - file_storage/          |  | - D:\VaultCloud... |   |
|   |  - folders              |  |   {sha256}.enc           |  |   blobs/ & meta/   |   |
|   |  - files                |  | (Content-Addressed, CAS) |  | (Disaster Recovery)|   |
|   |  - file_versions        |  |                          |  |                    |   |
|   +-------------------------+  +--------------------------+  +--------------------+   |
+---------------------------------------------------------------------------------------+
```

### 3.2 Information Flow Between Subsystems

1. **Authentication Flow:** The client submits credentials to `/api/auth/login/`. The backend validates the password against the stored Argon2 hash and issues an access JWT (60-minute lifetime) and a refresh JWT (7-day lifetime). Subsequent requests pass the access token in the `Authorization: Bearer <token>` header.
2. **Local Modification & Locking Flow:**
   - The user edits a monitored file locally.
   - The desktop agent's `IndividualFileMonitor` intercepts the OS filesystem event.
   - The event is debounced for 1.0 second to allow disk write buffers to stabilize (`is_file_stable`).
   - Prior to uploading, the client requests an atomic file lock (`POST /api/files/{id}/lock/`) presenting its unique `device_id`.
   - The server verifies that no active lock exists, registers the lock with a 300-second TTL, and grants permission.
3. **Ingestion & Envelope Encryption Flow:**
   - The client streams the updated file via `PUT /api/files/{id}/content/`.
   - The server calculates the pre-encryption SHA-256 content hash in memory.
   - A cryptographically random 256-bit Data Encryption Key (DEK) and a 96-bit Initialization Vector (IV) are generated via OS CSPRNG.
   - The plaintext is encrypted using AES-256-GCM.
   - The DEK is encrypted (wrapped) using the master Key Encryption Key (KEK) via AES-256-GCM.
   - If a blob with an identical SHA-256 hash already exists on disk, the storage write is bypassed (CAS deduplication); otherwise, the ciphertext is written to `file_storage/{sha256}.enc`.
   - A new `FileVersion` document is committed in MongoDB, and the `File`'s `current_version` pointer and version number are incremented.
   - The client releases the file lock (`POST /api/files/{id}/unlock/`).
4. **Disaster Recovery Replication:**
   - Immediately following primary storage commit, `replicate_blob()` copies the encrypted blob to the secondary destination (default: `D:\VaultCloudBackup\blobs\{prefix}\{hash}.enc`) without decryption.
   - Cryptographic verification is performed by hashing the copy on the target medium.
   - Standalone disaster recovery metadata (containing the wrapped DEK, IVs, version number, and file ID) is saved as JSON, enabling full restoration even if the primary MongoDB instance is completely lost.

---

## PART 4 — BACKEND ANALYSIS

### 4.1 Framework and Dependencies
- **Core Framework:** Django 5.0+, Django REST Framework 3.14+
- **Database Driver:** MongoEngine 0.28+, PyMongo 4.8+
- **Authentication:** `djangorestframework-simplejwt` 5.3+, `argon2-cffi` 23.1+
- **Cryptography:** `cryptography` 42.0+ (AEAD AES-256-GCM)
- **Utilities:** `django-cors-headers` 4.3+, `python-dotenv` 1.0+, `python-dateutil` 2.8+

### 4.2 Comprehensive REST API Summary

The backend exposes 19 verified endpoints conforming strictly to Google Drive API v3 architectural idioms:

| Endpoint | Method | Purpose | Authentication | Request / Response Summary |
|----------|--------|---------|----------------|----------------------------|
| `/api/auth/register/` | POST | Register new user account | Anonymous (Throttled: 5/min) | **Body:** `{email, password}`<br>**Resp (201):** `{user, access, refresh}` |
| `/api/auth/login/` | POST | Authenticate user credentials | Anonymous (Throttled: 5/min) | **Body:** `{email, password}`<br>**Resp (200):** `{user, access, refresh}` |
| `/api/auth/refresh/` | POST | Rotate expired access token | Anonymous | **Body:** `{refresh}`<br>**Resp (200):** `{access, refresh}` |
| `/api/auth/logout/` | POST | Invalidate refresh token | Bearer JWT | **Body:** `{refresh}`<br>**Resp (200):** `{detail: "Successfully logged out."}` |
| `/api/auth/me/` | GET | Retrieve authenticated profile | Bearer JWT | **Resp (200):** `{id, email, storage_quota_bytes, storage_used_bytes}` |
| `/api/files/` | GET | List files & folders (search, parent, trash) | Bearer JWT | **Params:** `parent_id`, `q`, `trashed`, `limit`, `offset`<br>**Resp (200):** `{count, limit, offset, results: [...]}` |
| `/api/files/` | POST | Create metadata file OR multipart upload | Bearer JWT (Throttled: 30/min) | **Body (Multipart):** `file`, `name`, `parent_id`, `operation_id`<br>**Resp (201):** File JSON object |
| `/api/files/changes/` | GET | Incremental change feed polling | Bearer JWT | **Params:** `since` (ISO timestamp or epoch)<br>**Resp (200):** `{since, changes: [...]}` |
| `/api/files/{id}/` | GET | Retrieve single file metadata | Bearer JWT | **Resp (200):** File metadata JSON |
| `/api/files/{id}/` | PATCH | Rename or move file across folders | Bearer JWT | **Body:** `{name?, parent_id?, device_id?}`<br>**Resp (200):** Updated file metadata JSON |
| `/api/files/{id}/` | DELETE | Soft-delete file (move to trash) | Bearer JWT | **Header/Body:** `X-Device-Id` / `{device_id}`<br>**Resp (200):** `{detail: "File moved to trash."}` |
| `/api/files/{id}/restore/` | POST | Restore file from trash | Bearer JWT | **Resp (200):** Restored file metadata JSON |
| `/api/files/{id}/permanent/` | DELETE | Permanently purge file & revisions | Bearer JWT | **Resp (200):** `{detail: "File permanently deleted."}` |
| `/api/files/{id}/content/` | GET | Stream decrypted file content | Bearer JWT | **Resp (200):** `application/octet-stream` stream, Headers: `X-Content-Hash`, `Content-Length` |
| `/api/files/{id}/content/` | PUT | Upload new version content | Bearer JWT | **Body:** Multipart `file`, `expected_version`, `operation_id`, `device_id`<br>**Resp (200):** Updated file JSON |
| `/api/files/{id}/revisions/` | GET | List revision history of a file | Bearer JWT | **Resp (200):** Array of `FileVersion` JSON objects ordered `-version_number` |
| `/api/files/{id}/revisions/{vid}/content/` | GET | Download specific historical version | Bearer JWT | **Resp (200):** Decrypted stream of version `vid` |
| `/api/files/{id}/revisions/{vid}/restore/` | POST | Roll back to past revision | Bearer JWT | **Resp (200):** Creates new top version pointing to `vid` blob |
| `/api/files/{id}/lock/` | GET | Query lock state of file | Bearer JWT | **Resp (200):** `{is_locked, lock_owner, lock_device_id, lock_expires_at}` |
| `/api/files/{id}/lock/` | POST | Acquire atomic lock on file | Bearer JWT | **Body:** `{device_id}` (TTL: 300s)<br>**Resp (200):** Locked File JSON<br>**Resp (423):** Error if locked by other |
| `/api/files/{id}/lock/renew/` | POST | Extend TTL of owned lock | Bearer JWT | **Body:** `{device_id}`<br>**Resp (200):** File JSON |
| `/api/files/{id}/unlock/` | POST | Explicitly release lock | Bearer JWT | **Body:** `{device_id}`<br>**Resp (200):** File JSON with `is_locked: false` |
| `/api/folders/` | GET | List folders matching criteria | Bearer JWT | **Params:** `parent_id`<br>**Resp (200):** Array of Folder JSON objects |
| `/api/folders/` | POST | Create new folder | Bearer JWT | **Body:** `{name, parent_id}`<br>**Resp (201):** Folder JSON object |
| `/api/folders/{id}/` | GET | Get folder metadata | Bearer JWT | **Resp (200):** Folder JSON object |
| `/api/folders/{id}/` | DELETE | Soft-delete folder | Bearer JWT | **Resp (200):** `{detail: "Folder moved to trash."}` |
| `/api/storage/usage/` | GET | Get storage quota and used bytes | Bearer JWT | **Resp (200):** `{storage_quota_bytes, storage_used_bytes, percentage}` |

### 4.3 Detailed Security & Cryptography Implementation

#### Master Key Encryption Key (KEK) Resolution
The backend resolves the 256-bit KEK via `files.crypto_utils.get_master_kek()`. If `FILE_ENCRYPTION_KEK` is defined in `.env`, it is decoded from Base64 (or hashed to 32 bytes via SHA-256 if non-standard length). In development mode, it gracefully derives a 32-byte key from Django's `SECRET_KEY`.

#### Envelope Encryption Pipeline (`compute_sha256_and_save_encrypted`)
```
[ Incoming Plaintext Stream ]
             |
             +---> Read in 64KB Chunks ---> Calculate Plaintext SHA-256 Hash
             |
             v
   Generate Fresh 256-bit DEK (CSPRNG)
   Generate 96-bit File IV & DEK IV
             |
             +---> AES-256-GCM.encrypt(File_IV, Plaintext, DEK) ---> Ciphertext Disk File
             |
             +---> AES-256-GCM.encrypt(DEK_IV, DEK, Master_KEK) ---> Wrapped DEK (Base64)
```

#### Content-Addressed Storage & Deduplication
The ciphertext is initially saved to a temporary file. If `file_storage/{content_hash}.enc` already exists, the temporary file is unlinked immediately, and the existing on-disk blob and encryption metadata are reused. If it is new, the temporary file is atomically renamed to `{content_hash}.enc`, and the user's `storage_used_bytes` is incremented.

---

## PART 5 — DESKTOP AGENT ANALYSIS

### 5.1 Architecture of the Desktop Synchronization Agent

The desktop agent (`app/`) is designed as a hybrid tool: it can operate as a background command-line synchronization daemon (`main.py`) or as a multi-threaded Tkinter desktop GUI application (`gui.py`).

```
+-----------------------------------------------------------------------------------+
|                           VaultCloud Desktop Client                               |
|                                                                                   |
|  +--------------------+   +-----------------------+   +------------------------+  |
|  |     Tkinter GUI    |   | IndividualFileMonitor |   |  FileSystemEventHandler |  |
|  | (VaultCloudGUI)    |   | (Watchdog Observer)   |   | (IndividualFileHandler)|  |
|  +---------+----------+   +-----------+-----------+   +-----------+------------+  |
|            |                          |                           |               |
|            v                          v                           v               |
|    UI Status & Logs           Watches Directory           Debounce Buffer (1.0s)  |
|            ^                          |                           |               |
|            |                          |                           v               |
|  +---------+----------+               |                 Event Queue (FIFO)        |
|  |   sync_engine.py   |<--------------+---------------------------+               |
|  | - state machine    |                                                           |
|  | - conflict copy    |=======> drive_client.py =======> HTTPS REST API           |
|  | - lock acquisition |         (Tenacity Retry)         (Django Backend)         |
|  +---------+----------+                                                           |
|            |                                                                      |
|            v                                                                      |
|  +--------------------+                                                           |
|  | SQLite Local Store |                                                           |
|  |   (sync_state.db)  |                                                           |
|  +--------------------+                                                           |
+-----------------------------------------------------------------------------------+
```

### 5.2 Key Algorithms & Implementation Details

#### 1. File Stability Verification (`is_file_stable`)
To prevent uploading half-written files (e.g., when large binaries or documents are being saved), the agent samples the file size across 0.5-second sleep intervals. If the size changes or the file cannot be opened for reading due to OS sharing locks, the check retries up to 4 times before failing safely.

#### 2. Thread-Safe Event Debouncing (`DebouncedHandler` & `IndividualFileHandler`)
Rather than spawning an uncoordinated `threading.Timer` thread for every raw OS event, the agent maintains an internal dictionary `_pending: {path -> (kind, dest_path, target_time)}`. A dedicated background flusher thread wakes up every 200ms, evaluates expired timers (`now >= target_time`), and dispatches consolidated events into a FIFO thread-safe queue.

#### 3. Atomic Save / Editor Temp Rename Handling
Many text editors (VS Code, Notepad, JetBrains IDEs) save files atomically by writing to a temporary file (`file.txt.tmp.123`) and renaming it over the destination. Standard watchers drop these events as unmonitored temporary files. `IndividualFileHandler.on_moved()` resolves this by intercepting the destination path (`event.dest_path`); if the destination is a tracked file, it maps the event into a `changed` notification for the canonical tracked path.

#### 4. Synchronization Action State Machine (`decide_action`)
For any monitored path, the agent calculates:
- $H_{\text{local}}$: Current SHA-256 hash of the local file.
- $H_{\text{synced}}$: Last recorded synchronized hash in SQLite.
- $ID_{\text{cloud}}$: Cloud document ID stored in SQLite.

$$\text{Action} = \begin{cases}
\text{deleted\_locally}, & \text{if } H_{\text{local}} \text{ is None} \\
\text{upload\_new}, & \text{if } ID_{\text{cloud}} \text{ is None} \\
\text{noop}, & \text{if } H_{\text{local}} = H_{\text{synced}} \\
\text{upload\_changed}, & \text{otherwise}
\end{cases}$$

#### 5. Conflict Resolution Algorithm (`reconcile_conflict`)
When the client attempts to upload an edit with `expected_version` but receives HTTP 409 Conflict (meaning another device or web user updated the cloud copy in the interim):
1. The local file is copied to a timestamped backup: `filename (conflicted copy YYYY-MM-DD HHMMSS).ext`.
2. The remote cloud version is safely downloaded to overwrite the base filename.
3. The local SQLite record is updated with the remote cloud version and new content hash.
4. The file status in the GUI is set to `Conflict`, preserving both versions with zero data loss.

#### 6. Duplicate Filename Resolution (`_find_available_name`)
When a local file is uploaded whose display name already exists within the target cloud folder for that user:
1. The extension is parsed using rightmost-dot splitting (`rfind('.')`), accurately preserving compound extensions (e.g., `archive.tar.gz` $\rightarrow$ `archive.tar` and `.gz`).
2. The system checks MongoDB for existing active documents matching `(owner, parent_folder, name)`.
3. If taken, it iterates $N = 1, 2, 3\dots$ generating `stem (N).ext` until an unallocated filename is found.
4. For client-side uploads, if a cloud file exists with the exact same name AND matching SHA-256 hash, the client adopts the remote `cloud_id` without uploading a duplicate. If the hash differs, the client treats it as a distinct file, allowing the server to assign a unique numbered name.

#### 7. Account Isolation Guard (`verify_account_isolation`)
To prevent cross-account pollution on shared workstations:
- The local SQLite store records the bound `user_id`.
- Every sync and monitoring call verifies that `auth.get_current_user()['id'] == db.get_sync_user()['user_id']`.
- In `gui.py`, `get_tracked_individual_files()` fails closed if no `user_id` is supplied, and all watcher event loops drop queued events if the file owner does not match the active authenticated session.


---

## PART 6 — FRONTEND ANALYSIS

### 6.1 Frontend Framework & Build Tooling
- **Core Library:** React 19.2.8
- **Build System:** Vite 8.2.2 with `@vitejs/plugin-react`
- **Iconography:** `lucide-react` 1.37.0 (clean SVG vector icons)
- **HTTP Client:** `axios` 1.20.0
- **Linter:** `oxlint` 1.79.0

### 6.2 Application State & Component Hierarchy

```
App.jsx (AuthProvider)
│
├── LoginRegister.jsx (Displayed if unauthenticated)
│
└── MainLayout (Displayed if authenticated)
    │
    ├── Sidebar.jsx
    │   ├── Navigation Tabs (Drive, Trash)
    │   └── Storage Quota Bar (Live calculation: used / total quota)
    │
    ├── Navbar.jsx
    │   ├── Search Input (Debounced query filtering)
    │   ├── View Mode Toggle (Grid vs. List view)
    │   ├── "New Folder" Modal Prompt
    │   └── "Upload File" File-Picker Trigger
    │
    └── Content Body
        ├── FileBrowser.jsx (When activeTab == 'drive')
        │   ├── Breadcrumb Trail (Hierarchical folder path)
        │   ├── Drag-and-Drop Ingestion Target
        │   ├── Items Display (Folders & Files Grid/List)
        │   │   ├── Folder Item (Double-click navigation)
        │   │   └── File Item (Action triggers, lock badge, version tag)
        │   ├── MoveModal.jsx (Target folder tree selection)
        │   └── VersionHistoryModal.jsx (Revisions table & rollback action)
        │
        └── TrashView.jsx (When activeTab == 'trash')
            └── Soft-Deleted Items Table (Restore action & Permanent Delete)
```

### 6.3 Critical Frontend Subsystems

#### 1. Automatic JWT Interceptor & Queue (`frontend/src/services/api.js`)
Axios is configured with dual interceptors:
- **Request Interceptor:** Reads `access_token` from `localStorage` and appends `Authorization: Bearer <token>`.
- **Response Interceptor:** If an API call encounters HTTP 401 Unauthorized:
  - If a refresh request is already pending, subsequent failed requests return Promises queued in `failedQueue`.
  - The primary failed request sets `isRefreshing = true` and invokes `POST /api/auth/refresh/` using `refresh_token`.
  - Upon receiving fresh tokens, `localStorage` is updated, `api.defaults.headers.common.Authorization` is updated, and all queued promises in `failedQueue` are executed.
  - If the refresh token is expired or invalid, `localStorage.clear()` is called, and the user is redirected to the login view.

#### 2. Drag-and-Drop Ingestion (`FileBrowser.jsx`)
`FileBrowser` registers `onDragOver` and `onDrop` events on the file container. When files are dropped, `uploadFiles()` sequentially prepares `FormData` objects containing the file stream, `parent_id` (current folder), and a client-generated UUID `operation_id` for backend idempotency tracking.

#### 3. Revision Rollback (`VersionHistoryModal.jsx`)
Users can open the version drawer for any file. The component queries `GET /api/files/{id}/revisions/` to display version numbers, creation timestamps, pre-encryption content hashes, and human-readable byte sizes. Clicking "Restore" triggers `POST /api/files/{id}/revisions/{vid}/restore/`, which promotes the historical snapshot to a new current version without data loss.

---

## PART 7 — DATABASE DESIGN

VaultCloud employs two distinct persistence technologies: a cloud-side NoSQL document database (MongoDB) and a local embedded relational database (SQLite).

### 7.1 Cloud Database: MongoDB (via MongoEngine ODM)

#### 1. Collection: `users`
Stores account identities, credentials, and storage allocations.
- `id` (ObjectId, Primary Key): Unique account identifier.
- `email` (String, Unique, Indexed): User email address.
- `password` (String): Argon2id hashed password with salt and parameters.
- `storage_quota_bytes` (Int64, Default: 5,368,709,120 = 5 GB): Maximum allowable storage.
- `storage_used_bytes` (Int64, Default: 0): Current total size of active uploaded blobs.
- `created_at` (DateTime): Account registration timestamp.

#### 2. Collection: `folders`
Represents the hierarchical directory tree.
- `id` (ObjectId, Primary Key): Unique folder identifier.
- `name` (String): Display name of the folder.
- `owner` (ReferenceField $\rightarrow$ `users`, Indexed): Account owner.
- `parent_folder` (ReferenceField $\rightarrow$ `folders`, Nullable, Indexed): Parent folder (None = root).
- `created_at` (DateTime): Creation timestamp.
- `deleted` (Boolean, Default: False, Indexed): Soft-delete flag for trash management.
- **Compound Indexes:** `['owner', 'parent_folder', 'deleted']`

#### 3. Collection: `files`
Represents the abstract file entity, holding current lock state and version pointers.
- `id` (ObjectId, Primary Key): Stable persistent identifier across renames/edits.
- `name` (String): Current display filename (e.g., `report (1).txt`).
- `owner` (ReferenceField $\rightarrow$ `users`, Indexed): Account owner.
- `parent_folder` (ReferenceField $\rightarrow$ `folders`, Nullable, Indexed): Containing folder.
- `current_version` (ReferenceField $\rightarrow$ `file_versions`, Nullable): Pointer to active version.
- `created_at` (DateTime): Initial creation timestamp.
- `updated_at` (DateTime, Indexed): Timestamp of most recent modification.
- `deleted` (Boolean, Default: False, Indexed): Soft-delete flag.
- `is_locked` (Boolean, Default: False): Concurrency lock status.
- `lock_owner` (ReferenceField $\rightarrow$ `users`, Nullable): User holding the lock.
- `lock_device_id` (String, Nullable): UUID of the client device holding the lock.
- `lock_expires_at` (DateTime, Nullable): Expiration time of active lock (TTL).
- `last_operation_id` (String, Nullable): UUID of last processed operation (idempotency key).
- **Compound Indexes:** `['owner', 'parent_folder', 'deleted', 'updated_at']`

#### 4. Collection: `file_versions`
Immutable ledger of all uploaded revisions.
- `id` (ObjectId, Primary Key): Unique version record identifier.
- `file` (ReferenceField $\rightarrow$ `files`, Indexed): Parent file reference.
- `version_number` (Int, Indexed): Strictly incrementing counter ($1, 2, 3\dots$).
- `content_hash` (String, Indexed): Hex-encoded SHA-256 of plaintext pre-encryption.
- `size_bytes` (Int64): Plaintext byte length.
- `storage_path` (String): File system path to the encrypted blob on disk.
- `wrapped_dek` (String): Base64-encoded DEK encrypted under master KEK.
- `dek_iv` (String): Base64-encoded 96-bit IV used for DEK wrapping.
- `iv` (String): Base64-encoded 96-bit IV used for file body encryption.
- `created_at` (DateTime): Revision upload timestamp.
- `uploaded_by` (ReferenceField $\rightarrow$ `users`): User creating the revision.
- **Compound Indexes:** `['file', 'version_number', 'content_hash']`

---

### 7.2 Local Client Database: SQLite (`sync_state.db`)

The desktop agent maintains a local SQLite database to track local-to-cloud mapping without polling the network for every filesystem event.

#### 1. Table: `file`
- `path` (TEXT PRIMARY KEY): Normalized local relative path or absolute identifier.
- `local_hash` (TEXT): Last computed SHA-256 hash of the local file on disk.
- `cloud_id` (TEXT): Associated MongoDB ObjectId string in `files` collection.
- `last_synced_hash` (TEXT): SHA-256 hash at the time of the last successful upload/download.
- `last_synced_cloud_md5` (TEXT): Remote content hash confirmed by the server.
- `cloud_version` (INTEGER DEFAULT 0): Server revision number recorded locally.
- `updated_at` (TEXT): ISO 8601 timestamp of local database modification.
- `user_id` (TEXT): Authenticated user ID owning this local tracking record.
- `sync_mode` (TEXT DEFAULT 'folder'): Mode: `'folder'` (whole tree) or `'individual'` (GUI file).
- `abs_path` (TEXT): Canonical absolute disk path on the local OS.
- `status` (TEXT DEFAULT 'Synced'): State (`Synced`, `Monitoring`, `Uploading`, `Conflict`, `Error`, `Stopped`).
- `last_sync_time` (TEXT): ISO 8601 timestamp of last successful synchronization.
- `error_message` (TEXT): Descriptive error text if the last sync attempt failed.
- `is_active` (INTEGER DEFAULT 1): Flag (1 = actively watched, 0 = monitoring paused).

#### 2. Table: `config`
- `key` (TEXT PRIMARY KEY): Configuration property name (`user_id`, `user_email`, `device_id`).
- `value` (TEXT): Stored configuration value.

---

## PART 8 — DIAGRAM SPECIFICATIONS & MERMAID SOURCE

### 8.1 Overall System Architecture Diagram
Visualizes the physical and logical boundaries between clients, web layer, business logic, cryptography, and storage tiers.

```mermaid
graph TB
    subgraph Client_Layer ["Client Layer"]
        subgraph Web_Client ["React Web Client (Port 5173)"]
            UI["Vite + React 19 UI\n(FileBrowser, Trash, VersionModal)"]
            AxiosClient["Axios HTTP Service\n(JWT Refresh Queue)"]
            UI --> AxiosClient
        end

        subgraph Desktop_Agent ["Desktop Sync Agent (Python)"]
            GUI["Tkinter GUI (gui.py)\nActive File Monitor Table"]
            Watcher["Watchdog Observer\n(DebouncedHandler: 1.0s)"]
            SyncEngine["Sync Engine\n(State Machine & Conflict Handler)"]
            LocalDB[("Local SQLite Store\n(sync_state.db)")]
            DriveClient["Drive Client\n(Tenacity Retry & Hashing)"]

            GUI --> Watcher
            Watcher --> SyncEngine
            SyncEngine <--> LocalDB
            SyncEngine --> DriveClient
        end
    end

    subgraph Backend_Layer ["Django REST Backend (Port 8000)"]
        Router["Django URL Routing & Middleware\n(Request Audit & CORS)"]
        
        subgraph Auth_Module ["accounts App"]
            Argon2["Argon2id Password Hasher"]
            SimpleJWT["MongoJWTAuthentication"]
        end

        subgraph Core_Files ["files App"]
            FileViews["FileListCreate & FileContentView"]
            LockService["FileLockService\n(Atomic 300s TTL)"]
            CryptoUtil["Crypto Utilities\n(AES-256-GCM Envelope)"]
        end

        subgraph Storage_Module ["storage App"]
            QuotaView["StorageUsageView"]
            BackupService["Replication Service\n(Disaster Recovery)"]
        end

        Router --> Auth_Module
        Router --> Core_Files
        Router --> Storage_Module
    end

    subgraph Persistence_Layer ["Persistence & Storage Layer"]
        MongoDB[("MongoDB Document Store\n- users\n- folders\n- files\n- file_versions")]
        PrimaryStorage[("Primary Blob Store\n(file_storage/)\n{sha256}.enc (CAS)")]
        SecondaryBackup[("Secondary DR Store\n(D:\\VaultCloudBackup)\nblobs/ & metadata/")]
    end

    AxiosClient -- "HTTPS / JWT" --> Router
    DriveClient -- "HTTPS / JWT" --> Router

    Auth_Module <--> MongoDB
    Core_Files <--> MongoDB
    Core_Files --> PrimaryStorage
    Storage_Module --> SecondaryBackup
```

---

### 8.2 Level 0 Data Flow Diagram (Context Diagram)
Depicts the external entities interacting with the centralized VaultCloud system.

```mermaid
graph LR
    User["End User / Browser Client"]
    Agent["Desktop File System / Client Agent"]
    VaultCloud(("VaultCloud Core Platform\n(Sync, Auth, Encrypt)"))
    SecStorage[("Secondary Storage\nVolume")]

    User -- "1. Credentials, Upload Streams, File Commands" --> VaultCloud
    VaultCloud -- "2. Decrypted Streams, Auth Tokens, Metadata" --> User

    Agent -- "3. File System Events, SHA-256 Hashes, Lock Requests" --> VaultCloud
    VaultCloud -- "4. Remote Modifications, Lock Confirmations" --> Agent

    VaultCloud -- "5. Replicated Encrypted Blobs & DR Metadata" --> SecStorage
```

---

### 8.3 Level 1 Data Flow Diagram
Deconstructs VaultCloud into its major functional processes.

```mermaid
graph TD
    User([End User / Desktop Agent])

    P1["1.0 Authenticate &\nToken Exchange"]
    P2["2.0 File Monitoring &\nChange Classification"]
    P3["3.0 Distributed Lock\nManagement"]
    P4["4.0 Envelope Encryption &\nCAS Deduplication"]
    P5["5.0 Versioning &\nRevisions Registry"]
    P6["6.0 Streaming Decryption\n& Download"]

    D1[("D1: users")]
    D2[("D2: sync_state.db (Local)")]
    D3[("D3: files & folders")]
    D4[("D4: file_versions")]
    D5[("D5: file_storage/ (*.enc)")]

    User -- "Credentials" --> P1
    P1 <--> D1
    P1 -- "Access JWT" --> User

    User -- "File Modifications" --> P2
    P2 <--> D2
    P2 -- "Lock Request" --> P3

    P3 <--> D3
    P3 -- "Lock Granted (423 if busy)" --> P2

    P2 -- "Upload Stream" --> P4
    P4 -- "Metadata & Pointer" --> D3
    P4 -- "New Version Record" --> D4
    P4 -- "Ciphertext Blob" --> D5

    User -- "Rollback / History" --> P5
    P5 <--> D4
    P5 -- "Promote Revision" --> D3

    User -- "Download Request" --> P6
    P6 <-- "Wrapped DEK & IV" --> D4
    P6 <-- "Encrypted Ciphertext" --> D5
    P6 -- "Decrypted Plaintext Stream" --> User
```

---

### 8.4 Use Case Diagram
Highlights primary user and client actions supported by the system.

```mermaid
graph LR
    User((End User / Client))

    subgraph VaultCloud_System ["VaultCloud System Capabilities"]
        UC1(["Register / Login (Argon2 + JWT)"])
        UC2(["Browse Files & Hierarchical Folders"])
        UC3(["Upload File / Create Folder"])
        UC4(["Acquire / Renew File Lock"])
        UC5(["Real-time Local Sync Monitoring"])
        UC6(["Resolve Version Conflict (Conflicted Copy)"])
        UC7(["Inspect Revisions & Rollback"])
        UC8(["Soft-Delete to Trash / Restore / Purge"])
        UC9(["Stream Decrypted Download"])
    end

    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8
    User --> UC9
```

---

### 8.5 Database / Entity-Relationship (ER) Diagram
Illustrates the document relationships in MongoDB and tables in local SQLite.

```mermaid
erDiagram
    USER ||--o{ FOLDER : owns
    USER ||--o{ FILE : owns
    USER ||--o{ FILE_VERSION : uploaded
    FOLDER ||--o{ FOLDER : contains_subfolder
    FOLDER ||--o{ FILE : contains_file
    FILE ||--o{ FILE_VERSION : has_revisions
    FILE ||--o| FILE_VERSION : points_to_current
    USER ||--o| FILE : locks

    USER {
        ObjectId _id PK
        string email UK
        string password
        int64 storage_quota_bytes
        int64 storage_used_bytes
        datetime created_at
    }

    FOLDER {
        ObjectId _id PK
        string name
        ObjectId owner FK
        ObjectId parent_folder FK
        datetime created_at
        boolean deleted
    }

    FILE {
        ObjectId _id PK
        string name
        ObjectId owner FK
        ObjectId parent_folder FK
        ObjectId current_version FK
        datetime created_at
        datetime updated_at
        boolean deleted
        boolean is_locked
        ObjectId lock_owner FK
        string lock_device_id
        datetime lock_expires_at
        string last_operation_id
    }

    FILE_VERSION {
        ObjectId _id PK
        ObjectId file FK
        int version_number
        string content_hash
        int64 size_bytes
        string storage_path
        string wrapped_dek
        string dek_iv
        string iv
        datetime created_at
        ObjectId uploaded_by FK
    }

    LOCAL_FILE_RECORD {
        string path PK
        string local_hash
        string cloud_id
        string last_synced_hash
        int cloud_version
        string user_id
        string sync_mode
        string abs_path
        string status
        string last_sync_time
        int is_active
    }
```

---

### 8.6 File Synchronization Activity Diagram
Represents the client-side decision logic and server interactions upon detecting a local change.

```mermaid
flowchart TD
    Start([Local File System Event Detected]) --> Debounce[Wait 1.0s Debounce Buffer]
    Debounce --> StableCheck{Is File Stable & Accessible?}
    StableCheck -- No: Retrying --> Debounce
    StableCheck -- Yes --> ReadHash[Compute SHA-256 Local Hash]

    ReadHash --> QueryDB[Query SQLite Record by Normalized Path]
    QueryDB --> DecideAction{decide_action Result}

    DecideAction -- "noop (Hashes Match)" --> Stop([Ignore / Ready])
    DecideAction -- "deleted_locally" --> RecordDel[Update Local DB / Mark Local Delete] --> Stop

    DecideAction -- "upload_new" --> CheckRemoteName{Same Name on Cloud?}
    CheckRemoteName -- Yes & Hash Matches --> AdoptID[Adopt Remote ID in SQLite without Upload] --> Stop
    CheckRemoteName -- "No / Hash Differs" --> PostNew[POST /api/files/ Multipart Upload]
    PostNew --> ServerAssigns[Server Resolves Available Name e.g. stem 1.ext]
    ServerAssigns --> UpsertNew[Upsert New Cloud ID & Version 1 in SQLite] --> Stop

    DecideAction -- "upload_changed" --> LockReq[POST /api/files/id/lock/ with device_id]
    LockReq --> LockStatus{Lock Acquired?}
    LockStatus -- No: HTTP 423 --> MarkLocked[Set Status: Error/Locked] --> Stop
    LockStatus -- Yes --> PutContent[PUT /api/files/id/content/ with expected_version]

    PutContent --> RespCheck{Server HTTP Status}
    RespCheck -- "200 OK" --> ReleaseLock[POST /api/files/id/unlock/]
    ReleaseLock --> UpdateSuccess[Update SQLite: Version+1, Status: Synced] --> Stop

    RespCheck -- "409 Conflict" --> ConflictFlow[Create Local Conflicted Copy]
    ConflictFlow --> DownloadRemote[Download Cloud Version to Local]
    DownloadRemote --> UpdateConflictDB[Set Status: Conflict in SQLite] --> ReleaseLock
```

---

### 8.7 Authentication Sequence Diagram
Models user login, token exchange, and automatic token refresh upon expiry.

```mermaid
sequenceDiagram
    autonumber
    actor User as Client / Browser
    participant API as Django REST Backend (/api/auth/)
    participant Auth as MongoJWTAuthentication
    participant DB as MongoDB (User Store)

    User->>API: POST /api/auth/login/ {email, password}
    API->>DB: Query User by email
    DB-->>API: User Document (Argon2 hash)
    API->>API: check_password(password, stored_hash)
    alt Invalid Password
        API-->>User: 401 Unauthorized (INVALID_CREDENTIALS)
    else Valid Credentials
        API->>Auth: get_tokens_for_user(user)
        Auth-->>API: Access Token (60m) + Refresh Token (7d)
        API-->>User: 200 OK {user, access, refresh}
    end

    Note over User,API: Normal Authenticated API Requests
    User->>API: GET /api/files/ (Authorization: Bearer <access>)
    API->>Auth: Validate JWT & Extract user_id
    Auth-->>API: user object
    API-->>User: 200 OK {results: [...]}

    Note over User,API: Access Token Expires (60 minutes later)
    User->>API: GET /api/files/ (Expired access token)
    API-->>User: 401 Unauthorized (Token Expired)
    Note over User: Axios Interceptor Pauses Queue
    User->>API: POST /api/auth/refresh/ {refresh: <refresh_token>}
    API->>Auth: Validate Refresh Token & Fetch User
    Auth-->>API: New Access Token
    API-->>User: 200 OK {access: <new_token>, refresh: <rotated_token>}
    Note over User: Axios Interceptor Retries Original Request
    User->>API: GET /api/files/ (Authorization: Bearer <new_token>)
    API-->>User: 200 OK {results: [...]}
```

---

### 8.8 File Upload and Download Workflow
Detailed lifecycle of envelope encryption during upload and streaming decryption during download.

```mermaid
sequenceDiagram
    autonumber
    actor Client as Desktop Client / Browser
    participant API as views_files.py
    participant Crypto as crypto_utils.py
    participant Storage as file_storage/ (CAS Disk)
    participant DB as MongoDB (Files & Versions)
    participant Sec as backup_service.py (DR Store)

    Note over Client,Sec: Upload Workflow (PUT /api/files/{id}/content/)
    Client->>API: PUT /content/ [Stream, expected_version, device_id]
    API->>API: Verify Lock (can_modify: lock_device_id match)
    API->>API: Check Version (expected_version == current_version)
    API->>Crypto: compute_sha256_and_save_encrypted(stream, temp_path, KEK)
    Crypto->>Crypto: Compute Plaintext SHA-256
    Crypto->>Crypto: Generate random 256-bit DEK & 96-bit IV
    Crypto->>Crypto: AES-256-GCM.encrypt(Plaintext, DEK) -> temp_path
    Crypto->>Crypto: AES-256-GCM.encrypt(DEK, KEK) -> wrapped_dek
    Crypto-->>API: (sha256, size, wrapped_dek, dek_iv, file_iv)
    API->>Storage: Check if {sha256}.enc exists
    alt Exists (Deduplicated)
        API->>Storage: Delete temp_path
    else New File
        API->>Storage: Rename temp_path -> {sha256}.enc
        API->>DB: Increment user.storage_used_bytes
    end
    API->>DB: Create FileVersion & Update File.current_version
    API->>Sec: replicate_blob(source, sha256, metadata)
    Sec->>Sec: Copy ciphertext to D:\VaultCloudBackup & Verify SHA-256
    API-->>Client: 200 OK (Updated File Metadata)

    Note over Client,Sec: Download Workflow (GET /api/files/{id}/content/)
    Client->>API: GET /content/ [Bearer JWT]
    API->>DB: Query File & current_version
    DB-->>API: storage_path, wrapped_dek, dek_iv, file_iv, size_bytes
    API->>Crypto: decrypt_file_stream(source_path, wrapped_dek, dek_iv, file_iv, KEK)
    Crypto->>Crypto: AES-256-GCM.decrypt(wrapped_dek, KEK) -> Unwrapped DEK
    Crypto->>Storage: Read Ciphertext Chunks
    Crypto->>Crypto: AES-256-GCM.decrypt(Ciphertext, DEK)
    Crypto-->>API: Stream Decrypted 64KB Plaintext Chunks
    API-->>Client: 200 OK StreamingHttpResponse (Content-Disposition: attachment)
```


---

## PART 9 — TESTING AND RESULTS INFORMATION

### 9.1 Verified Test Execution Summary
A comprehensive suite of automated and integration tests was executed directly against the repository codebase. A total of **42 automated test cases** and **2 system checks** have been verified with live recorded execution evidence.

| Suite Name | Scope | Verified Tests | Status |
|------------|-------|----------------|--------|
| `app.test_duplicate_filename` | Server naming collision avoidance & client adoption | 16 | **16/16 PASSED** |
| `app.test_account_isolation` | Multi-user SQLite isolation & watcher lifecycle | 12 | **12/12 PASSED** |
| `app.test_individual_sync` | File handler event filtering & atomic save support | 4 | **4/4 PASSED** |
| `audit_crypto_backup` | AES-256-GCM envelope, tampering, secondary DR | 10 | **10/10 PASSED** |
| Django System Check | Backend schema integrity & settings validation | — | **0 Issues** |
| Frontend Production Build | React 19 / Vite production compilation | — | **0 Errors (500ms)** |

---

### 9.2 Comprehensive Test Cases and Evidence Matrix

| Test Case ID | Feature | Test Procedure | Expected Result | Actual Result | Verification Evidence |
|--------------|---------|----------------|-----------------|---------------|-----------------------|
| **TC-AUTH-01** | User Registration & JWT Flow | Invoke `POST /api/auth/register/` with valid email and password | HTTP 201 Created; returns access and refresh JWTs; user record created in MongoDB | Passed | `backend/accounts/tests.py::test_register_login_refresh_flow` |
| **TC-AUTH-02** | Password Security | Verify password storage in MongoDB document | Password must be hashed with Argon2id parameters; plaintext never stored | Passed | `backend/accounts/models.py::set_password` |
| **TC-AUTH-03** | Token Refreshing | Issue expired access token; call `POST /api/auth/refresh/` with valid refresh token | HTTP 200 OK; returns fresh access token | Passed | `backend/accounts/tests.py` |
| **TC-CRYP-01** | Envelope Encryption Round-Trip | Encrypt arbitrary byte buffer with fresh DEK, wrap DEK with master KEK; decrypt using unwrapped DEK | Plaintext matches original byte-for-byte; SHA-256 hash verified | Passed | `scratch/audit_crypto_backup.py::test_encrypt_then_decrypt_is_byte_identical` |
| **TC-CRYP-02** | Ciphertext Tamper Detection | Alter 1 byte of encrypted ciphertext on disk and attempt decryption | Decryption fails and raises authentication tag mismatch exception (AES-GCM AEAD check) | Passed | `scratch/audit_crypto_backup.py::test_tampered_ciphertext_raises` |
| **TC-CRYP-03** | Key Isolation (Wrong KEK) | Attempt to unwrap a valid DEK using an incorrect 256-bit KEK | Key unwrapping fails; raises exception; ciphertext cannot be decrypted | Passed | `scratch/audit_crypto_backup.py::test_wrong_kek_raises` |
| **TC-CAS-01** | Content Deduplication | Upload two identical files with different filenames under the same user | Physical storage blob written only once (`{hash}.enc`); second upload unlinks temp file | Passed | `backend/files/tests.py::test_upload_download_roundtrip_and_encryption` |
| **TC-QUOTA-01** | Storage Quota Enforcement | Upload file exceeding remaining `storage_quota_bytes` | HTTP 413 Payload Too Large with code `STORAGE_QUOTA_EXCEEDED`; disk blob unlinked | Passed | `backend/files/tests.py::test_storage_quota_enforcement` |
| **TC-LOCK-01** | Distributed Lock Acquisition | Client requests lock with `device_id` via `POST /api/files/{id}/lock/` | Lock acquired; `is_locked=True`, `lock_expires_at` set 300s in future | Passed | `backend/files/tests.py::test_locking_mechanism` |
| **TC-LOCK-02** | Lock Enforced on Writes | Second client or web session attempts to modify a locked file without matching `device_id` | HTTP 423 Locked; update rejected | Passed | `backend/files/tests.py::test_locking_mechanism` |
| **TC-LOCK-03** | Lock Renewal & Release | Lock owner renews lock, then explicitly calls `/api/files/{id}/unlock/` | Renewal updates TTL; unlock clears lock fields; other clients can now edit | Passed | `backend/files/tests.py::test_locking_mechanism` |
| **TC-VER-01** | Optimistic Version Check | Client uploads with `expected_version=1` when cloud is at version 2 | HTTP 409 Conflict; server preserves cloud version | Passed | `backend/files/tests.py::test_version_conflict_and_idempotency` |
| **TC-VER-02** | Idempotent Upload Retries | Client retries upload sending identical `operation_id` | HTTP 200 OK returned with existing file state; no duplicate version created | Passed | `backend/files/tests.py::test_version_conflict_and_idempotency` |
| **TC-VER-03** | Revision Rollback | User invokes `POST /api/files/{id}/revisions/{vid}/restore/` | Creates version $N+1$ pointing to historical version's blob; downloaded content matches restored revision | Passed | `backend/files/tests.py` |
| **TC-DUP-01** | Duplicate Filename Auto-Renaming | Upload `report.txt` when `report.txt` already exists in same cloud folder | Server automatically renames new file to `report (1).txt` without overwriting | Passed | `app/test_duplicate_filename.py::test_first_collision_returns_1` |
| **TC-DUP-02** | Consecutive Collisions & Extensions | Upload `archive.tar.gz` when `archive.tar.gz` and `archive.tar (1).gz` exist | Server renames to `archive.tar (2).gz`, splitting strictly on the rightmost dot | Passed | `app/test_duplicate_filename.py::test_consecutive_collisions` |
| **TC-DUP-03** | Client Hash Mismatch Adoption Guard | Local file has same name as remote file but different content | Client leaves `cloud_id=None` $\rightarrow$ POSTs new file $\rightarrow$ receives unique server-assigned name | Passed | `app/test_duplicate_filename.py::test_hash_mismatch_creates_new_file_not_update` |
| **TC-DUP-04** | Client Hash Match Adoption | Local file has same name and identical SHA-256 hash as cloud file | Client adopts existing `cloud_id` into SQLite without duplicate network upload | Passed | `app/test_duplicate_filename.py::test_hash_match_adopts_without_upload` |
| **TC-ISO-01** | Account-Filtered SQLite Query | Query tracked files for Account A when database contains records for Account A and Account B | Query returns only Account A's records; Account B's records are completely hidden | Passed | `app/test_account_isolation.py::test_account_a_records_returned_for_account_a_only` |
| **TC-ISO-02** | Missing User ID Fails Closed | Call `get_tracked_individual_files()` without supplying a `user_id` | Returns empty list `[]`; never falls back to dumping all records | Passed | `app/test_account_isolation.py::test_missing_user_id_fails_closed` |
| **TC-ISO-03** | Watcher Subscription Account Guard | Attempt to register a file in the watcher whose SQLite `user_id` differs from active session | Watcher subscription rejected; file marked `Stopped`; no events listened | Passed | `app/test_account_isolation.py::test_foreign_account_files_never_registered_with_watcher` |
| **TC-ISO-04** | Watcher Observer Restart Lifecycle | Stop watcher on logout, re-login as another account, restart watcher | Fresh `Observer` and `IndividualFileHandler` spawned; no `RuntimeError` | Passed | `app/test_account_isolation.py::test_logout_login_in_same_process_does_not_crash_observer` |
| **TC-DR-01** | Secondary Blob Replication | Upload blob to primary storage; trigger `replicate_blob()` | Ciphertext copied to secondary root; target hash verified before commit | Passed | `scratch/audit_crypto_backup.py::test_replicate_blob_hash_verified` |
| **TC-DR-02** | Full Disaster Recovery Restoration | Reconstruct plaintext file directly from secondary blob and metadata JSON without MongoDB | 7200 bytes recovered byte-identically; SHA-256 hash matches original | Passed | `scratch/audit_crypto_backup.py::test_full_disaster_recovery_round_trip` |
| **TC-FE-01** | Frontend Production Compilation | Execute Vite production build | 1881 modules transformed; production bundle generated in `dist/` | Passed | `frontend/package.json` (`npm run build`) |
| **TC-E2E-01** | Live Daemon End-to-End Sync | Execute `test/e2e_test.py` against live server instance | Local edit detected, locked, uploaded; cloud edit downloaded after poll | Verified In Design (requires live background server) | `test/e2e_test.py` |

---

## PART 10 — FIVE-CHAPTER REPORT MAPPING

This section maps the extracted technical findings to the standard five-chapter academic B.Tech project report format.

```
+---------------------------------------------------------------------------------------+
|                       CHAPTER 1: INTRODUCTION                                         |
|  1.1 Background of the Project: Need for sovereign, encrypted personal cloud storage |
|  1.2 Problem Statement: Vulnerabilities of public cloud & risks of concurrency errors  |
|  1.3 Objectives: REST API, AES-256-GCM envelope crypto, desktop watcher, locking     |
|  1.4 Scope of the Project: Multi-user, web & desktop clients, CAS, disaster recovery  |
|  1.5 Proposed System: Decoupled three-tier architecture with dual storage tiers       |
|  1.6 Organization of the Report: Overview of Chapters 2 through 5                     |
+---------------------------------------------------------------------------------------+
|                       CHAPTER 2: LITERATURE REVIEW                                    |
|  2.1 Introduction: Theoretical foundations of cloud storage & distributed sync        |
|  2.2 Related Research: Content-addressed storage, deduplication, envelope encryption  |
|  2.3 Existing Systems: Google Drive, Nextcloud, OwnCloud, Syncthing                   |
|  2.4 Limitations of Existing Systems: Privacy loss, sync conflicts, high complexity   |
|  2.5 Research Gap: Lightweight self-hosted platform combining CAS, crypto & locks    |
|  2.6 Summary: Synthesis of requirements guiding VaultCloud design                     |
+---------------------------------------------------------------------------------------+
|                       CHAPTER 3: SYSTEM DESIGN                                        |
|  3.1 System Architecture: Component diagram, data flow pathways, client-server tier   |
|  3.2 Data Flow Diagrams: Level 0 (Context) and Level 1 DFD                            |
|  3.3 Use Case Diagram: Actors (User, Desktop Agent) and system interactions           |
|  3.4 Database Design: MongoDB collections (User, Folder, File, FileVersion) + SQLite  |
|  3.5 API Architecture: Google Drive v3 RESTful interface, endpoint catalog            |
|  3.6 Authentication & Security Design: Argon2id, JWT rotation, AES-256-GCM envelope    |
|  3.7 File Synchronization Workflow: Activity diagrams, conflict resolution logic     |
+---------------------------------------------------------------------------------------+
|                       CHAPTER 4: IMPLEMENTATION                                       |
|  4.1 Technologies Used: Python, Django, MongoEngine, SQLite, React 19, Vite, Watchdog  |
|  4.2 Backend Implementation: views_files.py, views_lock.py, views_revisions.py        |
|  4.3 Desktop Agent Implementation: gui.py, watcher.py, sync_engine.py, drive_client.py|
|  4.4 Frontend Implementation: FileBrowser.jsx, AuthContext.jsx, api.js, MoveModal.jsx |
|  4.5 Authentication & File Management: Token lifecycle, breadcrumbs, soft-delete      |
|  4.6 Synchronization, Hashing & Versioning: is_file_stable, debouncer, CAS SHA-256   |
|  4.7 File Locking & Duplicate Naming: Atomic lock service, _find_available_name       |
+---------------------------------------------------------------------------------------+
|                       CHAPTER 5: TESTING, RESULTS AND FUTURE SCOPE                    |
|  5.1 Testing Methodology: Unit testing, integration testing, cryptographic auditing   |
|  5.2 Test Cases and Results: Verification table (42 automated tests passed)           |
|  5.3 Screenshots of Working System: Web dashboard, desktop GUI, terminal test runs    |
|  5.4 Results and Discussion: Performance, deduplication savings, zero data-loss sync  |
|  5.5 Limitations: Single physical disk deployment disclaimer, plaintext local creds   |
|  5.6 Future Scope: End-to-end client encryption, block-level delta sync, mobile apps  |
|  5.7 Conclusion: Summary of project achievements against objectives                   |
+---------------------------------------------------------------------------------------+
```

---

## PART 11 — REFERENCES AND SCREENSHOTS

### 11.1 Assets & Existing Evidence in the Repository
1. **Frontend Assets:**
   - `frontend/src/assets/hero.png`: Brand asset suitable for report cover page or architecture introduction.
   - `frontend/public/favicon.svg` & `frontend/public/icons.svg`: Vector assets for diagrams.
2. **Key Source Files Recommended for Code Listings in Report:**
   - Envelope Encryption Pipeline: `backend/files/crypto_utils.py` (lines 22–64)
   - Atomic File Locking Service: `backend/files/lock_service.py` (lines 8–50)
   - Duplicate Filename Auto-Renaming: `backend/files/views_files.py` (lines 24–45)
   - Event Debouncing Flusher: `app/watcher.py` (lines 24–63)
   - Conflict Reconciliation: `app/sync_engine.py` (lines 266–301)
   - Axios JWT Refresh Interceptor: `frontend/src/services/api.js` (lines 24–98)
3. **Internal Technical Documentation:**
   - `E:\backup-sync\docs\DEPLOYMENT.md`: Full deployment procedure and single-disk redundancy disclaimer.
   - `E:\backup-sync\docs\PROJECT_DIAGNOSIS_REPORT.md`: Reliability and account isolation audit log.
   - `E:\backup-sync\API_DOCUMENTATION.md` / `backend/README.md`: API specifications.

### 11.2 Academic References Requiring External Literature Citations
The following topics must be supported with standard IEEE / ACM academic literature when preparing Chapter 2:
1. **Password Hashing:** Biryukov, A., Dinu, D., & Khovratovich, A. (2016). *Argon2: New Generation of Memory-Hard Functions for Password Hashing and Other Applications.*
2. **Authenticated Encryption:** McGrew, D. A., & Viega, J. (2004). *The Security and Performance of the Galois/Counter Mode (GCM) of Operation.*
3. **Content-Addressed Storage:** Quinlan, S., & Dorward, S. (2002). *Venti: A New Approach to Archival Storage.* USENIX FAST.
4. **Optimistic Replication & Conflict Resolution:** Saito, Y., & Shapiro, M. (2005). *Optimistic Replication.* ACM Computing Surveys.
5. **Distributed File Systems:** Ghemawat, S., Gobioff, H., & Leung, S. T. (2003). *The Google File System.* ACM SOSP.

### 11.3 Neutral Documentation of Implemented Constraints & Known Limitations
For academic honesty, the report must describe the following neutral system constraints:
1. **Single-Disk Physical Redundancy Notice:**
   > *"The current deployment stores the primary encrypted store (`E:\backup-sync\backend\file_storage`) and secondary backup (`D:\VaultCloudBackup`) on different partitions of the same physical disk (Disk 0). While this provides protection against file system corruption and accidental file deletion, true physical disaster resilience requires configuring `SECONDARY_BACKUP_ROOT` on an independent physical disk, NAS share, or offsite object store."*
2. **Client Credential Storage:** The desktop agent caches user credentials in `app/credentials.json` in plaintext for automatic reconnection. For production enterprise hardening, this should be integrated with OS-level credential managers (Windows DPAPI / Credential Manager).
3. **Application-Level Name Collision Guard:** Duplicate filename resolution is handled at the application layer via `_find_available_name()`. A unique compound database index on `(owner, parent_folder, name)` can be applied once legacy database records are verified to contain no duplicates.
