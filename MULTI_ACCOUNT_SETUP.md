# Multi-Account Google Drive Setup

This guide explains how to configure Pocket Booth to use **different Google accounts** for different event keys.

## Overview

Pocket Booth **requires** key-based multi-account Google Drive uploads:

- **Keys are REQUIRED** - No default/fallback account
- **Different keys → Different Google accounts**
- **Different keys → Different Google Drive folders**
- **Each key must be configured separately**

### Example Use Cases

1. **Wedding Event** (`?key=wedding`)
   - Uploads to bride's Google Drive account
   - Folder: `/Wedding Photos 2025/`
   - Photo limit: 10 strips

2. **Birthday Party** (`?key=birthday`)
   - Uploads to parent's Google Drive account
   - Folder: `/Birthday 2025/`
   - Photo limit: 20 strips

3. **Corporate Event** (`?key=corporate`)
   - Uploads to company Google Drive account
   - Folder: `/Company Events/Photo Booth/`
   - Photo limit: 50 strips

---

## How It Works

### Backend Flow

```
Frontend sends: { image: "...", filename: "...", key: "wedding" }
                        ↓
Backend looks for: GOOGLE_OAUTH_CREDENTIALS_WEDDING
                        ↓
                   Found? → Use wedding account
                        ↓
                   Not found? → ERROR (no fallback)
                        ↓
Backend looks for: GDRIVE_FOLDER_ID_WEDDING
                        ↓
                   Found? → Upload to wedding folder
                        ↓
                   Not found? → Upload to root directory
```

### Credential Storage

Credentials are stored separately per key:
- `/tmp/tokens/WEDDING.json` - Wedding account
- `/tmp/tokens/BIRTHDAY.json` - Birthday account
- `/tmp/tokens/CORPORATE.json` - Corporate account

**Note:** No default account - each key must be configured and authorized separately.

---

## Setup Instructions

### Step 1: Create Google OAuth Credentials

For **each Google account** you want to use:

1. Sign in to [Google Cloud Console](https://console.cloud.google.com/) with that account
2. Create a new project or select existing one
3. Enable **Google Drive API**
4. Go to **APIs & Services** → **Credentials**
5. Create **OAuth 2.0 Client ID**:
   - Application type: **Web application**
   - Name: `Pocket Booth - [Event Name]`
   - Authorized redirect URIs:
     - `https://your-vercel-app.vercel.app/oauth2callback`
6. **Download the JSON** (click ⬇️ button)
7. Save as `oauth_[eventname].json` (e.g., `oauth_wedding.json`)

Repeat for each event/key you want.

---

### Step 2: Configure Vercel Environment Variables

Go to your Vercel project → **Settings** → **Environment Variables**.

#### Key-Specific Accounts (REQUIRED for each key)

Add one pair for each key you want to use:

**Wedding Key:**
```bash
GOOGLE_OAUTH_CREDENTIALS_WEDDING={"web":{"client_id":"...wedding..."}}
GDRIVE_FOLDER_ID_WEDDING=abc123xyz456
```

**Birthday Key:**
```bash
GOOGLE_OAUTH_CREDENTIALS_BIRTHDAY={"web":{"client_id":"...birthday..."}}
GDRIVE_FOLDER_ID_BIRTHDAY=def789uvw012
```

**Corporate Key:**
```bash
GOOGLE_OAUTH_CREDENTIALS_CORPORATE={"web":{"client_id":"...corporate..."}}
GDRIVE_FOLDER_ID_CORPORATE=ghi345jkl678
```

**Important:**
- Key names must be **UPPERCASE** in environment variables
- Key names are **case-insensitive** in URLs (`?key=wedding` or `?key=WEDDING` both work)
- Each account needs its own OAuth JSON
- **Key parameter is REQUIRED** - no default account

---

### Step 3: Authorize Each Account

Visit the authorization URL for **each key** (**key parameter is REQUIRED**):

```
# Wedding account
https://your-vercel-app.vercel.app/authorize?key=wedding

# Birthday account
https://your-vercel-app.vercel.app/authorize?key=birthday

# Corporate account
https://your-vercel-app.vercel.app/authorize?key=corporate
```

**Note:** Visiting `/authorize` without `?key=` will show an error requiring a key.

For each:
1. Click **"Authorize Backend Access"**
2. Sign in with the **corresponding Google account**
3. Grant permissions
4. You'll see **"Authorized!"** with the key name

---

### Step 4: Configure Frontend Keys

Create `.env.production` locally (gitignored):

```bash
# Frontend config
VITE_VERCEL_API_URL=https://your-vercel-app.vercel.app

# Key-based photo limits
VITE_CONFIG_WEDDING=10
VITE_CONFIG_BIRTHDAY=20
VITE_CONFIG_CORPORATE=50
```

Deploy:
```bash
yarn deploy
```

---

## Usage

### Normal Mode (No Key)
```
URL: https://yoursite.com/
- Upload: No upload button (key required)
- Limits: Unlimited photos
- Storage: Local download only
```

### Key-Based Mode (REQUIRED for Google Drive)
```
URL: https://yoursite.com/?key=wedding
- Uses: GOOGLE_OAUTH_CREDENTIALS_WEDDING (required)
- Folder: GDRIVE_FOLDER_ID_WEDDING (optional, defaults to root)
- Limits: VITE_CONFIG_WEDDING=10
- Upload: Upload button appears
- Storage: Google Drive + local download
```

---

## Verification

### Check Authorization Status

Visit the main page for each key (**key parameter required**):

```
https://your-vercel-app.vercel.app/?key=wedding
https://your-vercel-app.vercel.app/?key=birthday
```

Should show:
- ✅ **Authorized!** Backend connected to Google Drive.
- Key name displayed in subtitle (e.g., "WEDDING")

**Note:** Visiting `/` without `?key=` will show "Key Required" error.

### Test Upload

1. Open: `https://yoursite.com/?key=wedding`
2. Take a photo
3. Click **"Upload to Google Drive"**
4. Check the wedding Google Drive account - photos should be in the wedding folder

---

## Folder Structure Examples

### Same Account, Different Folders

If you want all keys to use the same Google account but different folders:

**Vercel Environment Variables:**
```bash
# Same Google account for multiple keys
GOOGLE_OAUTH_CREDENTIALS_WEDDING={"web":{"client_id":"...account..."}}
GOOGLE_OAUTH_CREDENTIALS_BIRTHDAY={"web":{"client_id":"...account..."}}  # Same JSON

# Different folders per key
GDRIVE_FOLDER_ID_WEDDING=folder_id_1
GDRIVE_FOLDER_ID_BIRTHDAY=folder_id_2
```

**Authorize each key separately** (even though same account):
```
https://your-vercel-app.vercel.app/authorize?key=wedding
https://your-vercel-app.vercel.app/authorize?key=birthday
```

All keys will use the same account but upload to different folders.

---

### Separate Accounts

If you want completely separate Google accounts:

**Vercel Environment Variables:**
```bash
# Each key has its own account
GOOGLE_OAUTH_CREDENTIALS_WEDDING={"web":{"client_id":"...account1..."}}
GDRIVE_FOLDER_ID_WEDDING=folder_in_account1

GOOGLE_OAUTH_CREDENTIALS_BIRTHDAY={"web":{"client_id":"...account2..."}}
GDRIVE_FOLDER_ID_BIRTHDAY=folder_in_account2

GOOGLE_OAUTH_CREDENTIALS_CORPORATE={"web":{"client_id":"...account3..."}}
GDRIVE_FOLDER_ID_CORPORATE=folder_in_account3
```

**Authorize each separately:**
```
https://your-vercel-app.vercel.app/authorize?key=wedding
https://your-vercel-app.vercel.app/authorize?key=birthday
https://your-vercel-app.vercel.app/authorize?key=corporate
```

Each key uses a completely different Google account.

---

## Revoking Access

### Revoke Specific Key

```
https://your-vercel-app.vercel.app/revoke?key=wedding
```

This only revokes the wedding account, leaving others intact.

### Revoke All

Visit each revoke URL (**key parameter required**):
```
https://your-vercel-app.vercel.app/revoke?key=wedding
https://your-vercel-app.vercel.app/revoke?key=birthday
https://your-vercel-app.vercel.app/revoke?key=corporate
```

Or manually revoke in [Google Account Settings](https://myaccount.google.com/permissions).

**Note:** Visiting `/revoke` without `?key=` will show an error.

---

## Troubleshooting

### "Backend not authorized for key 'wedding'"

**Solution:** Visit `/authorize?key=wedding` and authorize with the wedding Google account.

### Photos uploading to wrong folder

**Check:**
1. Is `GDRIVE_FOLDER_ID_WEDDING` set correctly?
2. Did you authorize the correct account for that key?
3. Visit `/health` to see which folders are configured

### Key-specific credentials not found

**Error:** Backend will return error if `GOOGLE_OAUTH_CREDENTIALS_{KEY}` not found.

**Solution:**
1. Add `GOOGLE_OAUTH_CREDENTIALS_WEDDING` to Vercel environment variables
2. Redeploy backend
3. Visit `/authorize?key=wedding` to authorize

---

## Environment Variable Reference

### OAuth Credentials

| Variable | Purpose | Required | Example |
|----------|---------|----------|---------|
| `GOOGLE_OAUTH_CREDENTIALS_WEDDING` | Wedding OAuth JSON | ✅ Yes | `{"web":{...}}` |
| `GOOGLE_OAUTH_CREDENTIALS_BIRTHDAY` | Birthday OAuth JSON | ✅ Yes | `{"web":{...}}` |
| `GOOGLE_OAUTH_CREDENTIALS_{KEY}` | Any key OAuth JSON | ✅ Yes (per key) | `{"web":{...}}` |

**Note:** Each key requires its own OAuth credentials. No default/fallback.

### Folder IDs

| Variable | Purpose | Required | Example |
|----------|---------|----------|---------|
| `GDRIVE_FOLDER_ID_WEDDING` | Wedding folder ID | ❌ Optional | `abc123xyz456` |
| `GDRIVE_FOLDER_ID_BIRTHDAY` | Birthday folder ID | ❌ Optional | `def789uvw012` |
| `GDRIVE_FOLDER_ID_{KEY}` | Any key folder ID | ❌ Optional | `ghi345jkl678` |

**Note:** If not set, uploads go to root directory.

### Frontend Config

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_VERCEL_API_URL` | Backend URL | `https://your-app.vercel.app` |
| `VITE_CONFIG_WEDDING` | Wedding photo limit | `10` |
| `VITE_CONFIG_BIRTHDAY` | Birthday photo limit | `20` |
| `VITE_CONFIG_{KEY}` | Any key-specific limit | `50` |

---

## Summary

✅ **Multi-account support** - Each key uses a different Google account
✅ **Multi-folder support** - Each key uploads to a different folder
✅ **Keys required** - No default/fallback account (enforced)
✅ **Independent authorization** - Authorize each key separately
✅ **Automatic key detection** - Frontend sends key, backend selects account
✅ **Secure isolation** - Each key's credentials stored separately

Each event **must** have its own configured Google Drive account!
