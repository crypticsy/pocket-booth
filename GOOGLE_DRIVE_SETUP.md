# Google Drive Upload Setup (Apps Script)

This guide explains how to configure Pocket Booth to upload photo strips to
Google Drive using a **Google Apps Script Web App** — no backend hosting,
no OAuth flow, no server to maintain.

## Overview

- **Keys are optional** — without a `?key=` in the URL, uploads are simply
  disabled and the app works as a local-only photo booth.
- **Different keys → different Apps Script deployments** — each key can
  point at a script deployed under a different Google account, so events
  can upload to entirely separate Drives.
- **No credentials in the frontend** — the Apps Script runs "as you", so
  there's nothing to authorize from the browser.

### Example Use Cases

1. **Wedding Event** (`?key=wedding`)
   - Uploads via a script deployed under the couple's Google account
   - Photo limit: 10 strips

2. **Birthday Party** (`?key=birthday`)
   - Uploads via a script deployed under a parent's Google account
   - Photo limit: 20 strips

---

## How It Works

```
Frontend takes a photo strip
        ↓
Looks up VITE_APPS_SCRIPT_URL_{KEY}
        ↓
   Found? → POST the image to that Apps Script deployment
        ↓
   Not found? → Upload button hidden, local download still works
        ↓
Apps Script (running as the deploying account) saves the file to Drive
```

Each key/account combination is fully independent — the script has no
knowledge of "keys" at all, it just uploads whatever it receives to the
folder configured in its own Script Properties.

---

## Setup Instructions

Repeat these steps once **per Google account** you want photos uploaded to.

### Step 1: Create the Apps Script project

1. Sign in to [script.google.com](https://script.google.com/) with the
   target Google account.
2. Create a **New project**.
3. Delete the placeholder code and paste in the contents of
   [`apps-script/Code.gs`](./apps-script/Code.gs) from this repo.

### Step 2: (Optional) Point it at a specific Drive folder

By default the script uploads to the account's My Drive root. To use a
specific folder instead:

1. Open the target folder in Google Drive and copy the folder ID from the
   URL (`https://drive.google.com/drive/folders/<FOLDER_ID>`).
2. In the Apps Script editor: **Project Settings** → **Script Properties**
   → **Add script property**.
3. Key: `FOLDER_ID`, Value: the folder ID from above.

### Step 3: Deploy as a Web App

1. Click **Deploy** → **New deployment**.
2. Select type **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy** and authorize the requested Drive permissions.
5. Copy the generated **Web app URL** (ends in `/exec`).

### Step 4: Configure the frontend

Add the deployment URL to your `.env.production` (gitignored), keyed by
the same name used in `VITE_CONFIG_{KEY}`:

```bash
# Photo limits (existing config)
VITE_CONFIG_WEDDING=10
VITE_CONFIG_BIRTHDAY=20

# Apps Script deployment per key
VITE_APPS_SCRIPT_URL_WEDDING=https://script.google.com/macros/s/AKfycb.../exec
VITE_APPS_SCRIPT_URL_BIRTHDAY=https://script.google.com/macros/s/AKfycb.../exec
```

Deploy the frontend:

```bash
yarn deploy
```

---

## Usage

### Normal Mode (No Key)
```
URL: https://yoursite.com/
- Upload: No upload button (no key)
- Limits: Unlimited photos
- Storage: Local download only
```

### Key-Based Mode
```
URL: https://yoursite.com/?key=wedding
- Uses: VITE_APPS_SCRIPT_URL_WEDDING (if set)
- Limits: VITE_CONFIG_WEDDING
- Upload: Upload button appears if the script URL is configured
- Storage: Google Drive + local download
```

If a key has a photo limit configured (`VITE_CONFIG_{KEY}`) but no Apps
Script URL, the app runs in limited mode without the upload button.

---

## Updating or Revoking Access

- **Change the target folder:** update the `FOLDER_ID` script property —
  it takes effect immediately for the existing deployment.
- **Revoke access entirely:** in the Apps Script project, go to
  **Deploy** → **Manage deployments** → archive/delete the deployment, or
  revoke access from the account's
  [Google Account permissions page](https://myaccount.google.com/permissions).

---

## Troubleshooting

### Upload button doesn't appear
Check that `VITE_APPS_SCRIPT_URL_{KEY}` is set for the key in use and that
the frontend was rebuilt/redeployed after adding it.

### "Upload failed" / network error
- Confirm the deployment's **Who has access** is set to **Anyone**.
- Confirm the URL ends in `/exec` (not `/dev`).
- Open the URL directly in a browser — it should return a small JSON
  health response from `doGet`.

### Photos land in the wrong folder
- Check the `FOLDER_ID` script property for that deployment.
- If unset, uploads go to the account's My Drive root.

---

## Environment Variable Reference

| Variable | Purpose | Required | Example |
|----------|---------|----------|---------|
| `VITE_CONFIG_{KEY}` | Photo limit for a key | No | `10` |
| `VITE_APPS_SCRIPT_URL_{KEY}` | Apps Script deployment URL for a key | No (upload disabled without it) | `https://script.google.com/macros/s/.../exec` |