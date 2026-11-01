# VaultCloud Desktop Agent — Deployment Guide

## Prerequisites

| Component | Requirement |
|-----------|-------------|
| Python | 3.10 or later |
| Node.js | 18 or later (for frontend build) |
| MongoDB | Atlas or self-hosted 5.x+ |
| Operating System | Windows 10/11 (desktop agent); Linux/Windows (backend) |

---

## Backend Setup

```bash
cd backend
pip install -r requirements.txt
# Copy and edit the environment file
cp .env.example .env
python manage.py check        # must report 0 errors
python manage.py runserver
```

### Required environment variables (`backend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | `django-insecure-...` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SIGNING_KEY` | HS256 signing key for JWTs | (random 32+ bytes, base64) |
| `FILE_ENCRYPTION_KEK` | AES-256 Key-Encryption Key (base64, 32 bytes) | `base64url(...)` |
| `DEBUG` | Set to `False` in production | `False` |
| `STORAGE_ROOT` | Primary encrypted-blob storage path | `./file_storage` |
| `SECONDARY_BACKUP_ROOT` | Secondary backup destination | `D:\VaultCloudBackup` |

---

## Storage Configuration

### Primary storage

The primary encrypted blob store is controlled by the `STORAGE_ROOT` environment variable in `backend/.env`.  
Default value: `./file_storage` (relative to the `backend/` directory).  
Resolved absolute path in the current deployment: `E:\backup-sync\backend\file_storage`.

To relocate, set `STORAGE_ROOT` to an absolute path before starting the server:

```
STORAGE_ROOT=D:\SomeOtherDrive\vaultcloud_storage
```

### Secondary (backup) storage

The secondary backup destination is controlled by the `SECONDARY_BACKUP_ROOT` environment variable.  
Default value (fallback in `backend/settings.py`): `D:\VaultCloudBackup`.

To override, add to `backend/.env`:

```
SECONDARY_BACKUP_ROOT=\\nas-server\vaultcloud-backup
```

or point it to an external drive, NAS share, or remote-mounted path.

> [!CAUTION]
> **Single-disk limitation — current deployment**
>
> The current deployment stores the primary and secondary copies on different partitions of the same physical disk. This provides a second copy but does not protect against physical disk failure. For production deployment, configure the secondary backup on an independent physical disk, NAS, or remote storage service.

---

## Desktop Agent Setup

```bash
cd app
pip install -r requirements.txt   # or use the top-level venv
python gui.py
```

The desktop agent reads the backend URL from `app/config.py` (default: `http://127.0.0.1:8000`).  
Credentials are cached in `app/credentials.json` after first login.

> [!WARNING]
> `app/credentials.json` stores the user's password in plaintext. This is a known risk logged in the reliability audit. Do not deploy to shared machines without replacing this with OS-level credential storage (e.g., Windows Credential Manager).

---

## Frontend Setup

```bash
cd frontend
npm install
npm run build       # production bundle written to frontend/dist/
```

Serve `frontend/dist/` from any static file host or configure Django to serve it.

---

## Running Tests

```bash
# Account-isolation + individual-sync regression suite (16 tests)
python -m unittest app.test_account_isolation app.test_individual_sync -v

# Duplicate filename handling suite (16 tests)
python -m unittest app.test_duplicate_filename -v

# Cryptographic / backup-consistency audit (10 tests)
python scratch/audit_crypto_backup.py

# Django system check
cd backend && python manage.py check
```

---

## Production Checklist

- [ ] Set `DEBUG=False` in `backend/.env`
- [ ] Replace `SECRET_KEY` and `JWT_SIGNING_KEY` with strong random values
- [ ] Rotate `FILE_ENCRYPTION_KEK` and re-encrypt existing DEKs if necessary
- [ ] Point `SECONDARY_BACKUP_ROOT` at a **separate physical disk or NAS**
- [ ] Replace `app/credentials.json` plaintext storage with OS credential manager
- [ ] Configure HTTPS (TLS certificate) for the backend
- [ ] Set `ALLOWED_HOSTS` appropriately in `backend/settings.py`
- [ ] Remove or restrict the Django admin interface

