# VaultCloud — Secure File Backup & Sync Platform

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.0%2B-green.svg)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-19.2-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.2-purple.svg)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Local-13aa52.svg)](https://www.mongodb.com/)
[![Security](https://img.shields.io/badge/Encryption-AES--256--GCM-red.svg)](https://en.wikipedia.org/wiki/Galois/Counter_Mode)

A self-hosted, end-to-end secure alternative to Google Drive featuring a **Django REST API** backend, **MongoDB** database (via `mongoengine`), **AES-256-GCM envelope encryption**, a **React 19 (Vite) web dashboard**, and a **multi-threaded Python desktop synchronization client** conforming to Google Drive API v3 semantics.

---

## Key Features

- **AES-256-GCM Envelope Encryption**: Every file revision is encrypted on disk with a fresh, random 256-bit Data Encryption Key (DEK). DEKs are wrapped using a master Key Encryption Key (KEK).
- **Content-Addressed Storage & Deduplication**: Plaintext SHA-256 hashes are computed pre-encryption. Identical file blobs are stored physically only once on disk.
- **Atomic Distributed File Locking**: Prevents multi-device write collisions with device-bound atomic locks and 300-second TTL auto-expiry.
- **Autonomous Desktop Sync Agent**: Event-driven filesystem monitoring with millisecond debouncing, atomic save handling, and offline change reconciliation.
- **Zero-Loss Conflict Resolution**: Generates timestamped conflicted copies whenever true concurrent updates collide (HTTP 409 Conflict).
- **Collision-Safe Duplicate Naming**: Automatically renames colliding uploads within the same cloud folder (`file (1).ext`), correctly preserving multi-dot extensions (e.g. `archive.tar.gz`).
- **Version History & Rollback**: Track revisions, inspect SHA-256 hashes, download past revisions, or restore historical snapshots.
- **Soft-Delete Trash**: Move items to trash with full restoration or permanent deletion options.
- **Argon2 Password Hashing & JWT Auth**: Secure authentication with SimpleJWT, token refresh queuing, and rate limiting.
- **Modern Glassmorphism Web UI**: Sleek React dashboard with grid/list toggles, folder breadcrumbs, drag-and-drop ingestion, and live storage quota indicator.

---

## Repository Structure

```
backup-sync/
├── app/                           # Desktop Sync Agent (Watcher, Engine, SQLite, GUI)
│   ├── gui.py                     # Tkinter desktop graphical interface
│   ├── main.py                    # CLI directory sync daemon
│   ├── watcher.py                 # Watchdog observer & debounced event queues
│   ├── sync_engine.py             # Sync state machine & conflict reconciliation
│   ├── drive_client.py            # HTTP client with Tenacity exponential retry
│   ├── db.py                      # Local SQLite persistence manager
│   ├── auth.py                    # Client session & JWT token manager
│   └── test_*.py                  # Automated test suites (isolation, naming)
├── backend/                       # Django REST API & Storage Backend
│   ├── accounts/                  # User authentication & Argon2 password hashing
│   ├── files/                     # Files, folders, revisions, and locking API
│   ├── storage/                   # Storage quota & secondary disaster recovery
│   ├── cloud_storage/             # Django settings, URLs, and middleware
│   ├── manage.py                  # Django CLI management script
│   └── Procfile                   # Production deployment process definition
├── frontend/                      # React 19 + Vite Web Application
│   ├── src/
│   │   ├── components/            # FileBrowser, Sidebar, Navbar, VersionModal, Trash
│   │   ├── services/              # Axios client with JWT refresh queue
│   │   └── context/               # Global AuthContext
│   ├── package.json
│   └── vite.config.js
├── docs/                          # Architecture & Deployment Documentation
│   ├── DEPLOYMENT.md              # Deployment guide & disk configuration
│   └── PROJECT_DIAGNOSIS_REPORT.md# Reliability audit & verification findings
├── PROJECT_TECHNICAL_ANALYSIS.md  # Comprehensive project report reference
├── requirements.txt               # Unified Python dependencies
└── .gitignore                     # Multi-tier secret and cache exclusions
```

---

## Quick Start Guide

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher & npm
- MongoDB 6.0+ running locally or MongoDB Atlas URI

---

### 1. Backend Setup

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env with your MongoDB URI, SECRET_KEY, and FILE_ENCRYPTION_KEK
# (See Environment Configuration section below)

# Install dependencies
pip install -r requirements.txt

# Run system checks and tests
python manage.py check
python manage.py test

# Start the development server
python manage.py runserver 8000
```
Backend REST API will be accessible at `http://localhost:8000/api/`.

---

### 2. Frontend Setup

```bash
cd frontend

# Copy environment template
cp .env.example .env

# Install Node dependencies
npm install

# Start the development server
npm run dev
```
Frontend web application will be accessible at `http://localhost:5173/`.

To build for production:
```bash
npm run build
```

---

### 3. Desktop Sync Agent

To launch the graphical desktop synchronization agent:
```bash
# From the project root
python app/gui.py
```

To run as a headless background CLI directory daemon:
```bash
python -m app.main <path_to_local_sync_folder>
```

---

## Environment & Security Configuration

> **IMPORTANT:** Never commit `.env`, `credentials.json`, or `token.json` files to Git. The project `.gitignore` excludes all environment and secret files by default.

Configure secrets in `backend/.env` for local development, or in your hosting provider's environment variables dashboard for production:

| Variable | Description | Example / Generation |
|----------|-------------|----------------------|
| `MONGO_URI` | MongoDB connection URI | `mongodb+srv://<user>:<pwd>@cluster.mongodb.net/cloud_storage_db` |
| `SECRET_KEY` | Django cryptographic signing key | Strong random string |
| `JWT_SIGNING_KEY` | Key for signing authentication JWTs | Strong random string |
| `FILE_ENCRYPTION_KEK` | 32-byte Base64 Master Key Encryption Key | `python -c "import os,base64; print(base64.b64encode(os.urandom(32)).decode())"` |
| `DEBUG` | Set to `False` in production | `True` (dev) / `False` (prod) |
| `ALLOWED_HOSTS` | Comma-separated allowed hostnames | `localhost,127.0.0.1,api.yourdomain.com` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed client origins | `http://localhost:5173,https://yourdomain.com` |
| `STORAGE_ROOT` | Primary encrypted blob directory | `./file_storage` |
| `SECONDARY_BACKUP_ROOT` | Secondary backup destination | `D:\VaultCloudBackup` (or network share / NAS) |

---

## Running Automated Tests

```bash
# 1. Run Account Isolation & Watcher Lifecycle Tests (16 tests)
python -m unittest app.test_account_isolation app.test_individual_sync -v

# 2. Run Duplicate Filename Handling Tests (16 tests)
python -m unittest app.test_duplicate_filename -v

# 3. Run Backend API Tests
cd backend && python manage.py test

# 4. Verify Django System Health
cd backend && python manage.py check
```

---

## Production Deployment

### Backend (Render / Heroku / DigitalOcean / Railway)
The backend includes a `Procfile` utilizing `gunicorn`:
1. Connect repository to PAAS provider with root or `backend/` directory.
2. Set all required environment variables in the provider dashboard.
3. Build command: `pip install -r requirements.txt`.
4. Start command: `gunicorn cloud_storage.wsgi --log-file -`.

### Frontend (Vercel / Netlify)
1. Connect repository with root directory set to `frontend/`.
2. Build command: `npm run build`.
3. Output directory: `dist`.
4. Environment variable: `VITE_API_BASE_URL=https://api.yourdomain.com/api`.

Detailed deployment notes and disaster recovery documentation can be found in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

---

## License

This project was developed for educational and academic research purposes as part of the B.Tech Computer Science & Engineering degree program.
