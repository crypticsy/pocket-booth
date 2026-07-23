# Pocket Booth

<p style="text-align: justify;"> Pocket Booth is like having a tiny photo booth right in your pocket. Snap instant photo strips, relive the fun of those classic photo booths, and keep your memories safe - all stored locally on your device. </p> 

<br/> 

<div align="center" style="flex-direction: column;">
   <img src="./public/demo.gif" alt="App Demo" width="100%"/>
   <div style="font-size: 0.8em; color: gray;">Home Screen</div>
</div> 

<br/> 

<p style="text-align: justify;"> Built with React, TypeScript, and Tailwind, Pocket Booth lets you capture photo strips, preview them in real-time, and save them directly to your device. A little digital nostalgia, instantly available anytime, without the hassle of a real one. </p>
<br/>

### Quick Start

#### Prerequisites

- Node.js 18+
- npm or yarn
- Modern browser with camera support

#### Option 1: Basic Deployment (GitHub Pages Only)
**Free hosting with local browser storage only**

```bash
# Install dependencies
yarn install

# Build and deploy to GitHub Pages
yarn deploy
```

This deploys only the frontend. Photos are stored in browser's localStorage.

#### Option 2: Full Deployment (GitHub Pages + Google Apps Script)
**With Google Drive cloud upload support**

1. **Deploy Frontend to GitHub Pages:**
   ```bash
   yarn deploy
   ```

2. **Deploy an Apps Script Web App:**
   - Paste [`apps-script/Code.gs`](./apps-script/Code.gs) into a new project at
     [script.google.com](https://script.google.com/)
   - Deploy it as a Web App (Execute as: Me, Who has access: Anyone)
   - Copy the deployment URL

3. **Connect Frontend to the Script:**
   - Create `.env.production` locally (gitignored, won't be committed)
   - Add: `VITE_APPS_SCRIPT_URL_{KEY}=https://script.google.com/macros/s/.../exec`
   - Redeploy frontend: `yarn deploy`

📖 **Full guide**: [GOOGLE_DRIVE_SETUP.md](./GOOGLE_DRIVE_SETUP.md)

<br/>

### Local Development

```bash
yarn install
yarn dev
```

Visit `http://localhost:5173`

<br/>

### Usage Modes

Pocket Booth supports two modes:

#### 1. **Normal Mode (No Key)**
Access: `https://yoursite.com/pocket-booth/`

- ✅ Unlimited photos
- ✅ Download photos locally
- ❌ No Google Drive upload
- ❌ No photo limits

Perfect for personal use or casual photo booth sessions.

#### 2. **Key-Based Mode (With Valid Key)**
Access: `https://yoursite.com/pocket-booth/?key=wedding`

- ✅ Photo limits enforced (configurable per key)
- ✅ Google Drive upload enabled
- ✅ Photos tracked in localStorage per key
- ✅ Access blocked when limit reached

Perfect for events with controlled photo counts.


**How it works:**
- User opens the app with a `?key=` parameter in the URL
- App validates the key against environment variables (e.g., `VITE_CONFIG_WEDDING`)
- If key is valid:
  - Photo limit is enforced using localStorage
  - Google Drive upload button appears
  - Access is blocked when limit is reached (button disabled + redirect)
- If key is invalid or missing:
  - Normal mode with unlimited photos
  - No Google Drive upload

<br/>

### Architecture

#### Basic Setup (GitHub Pages Only)
```
┌─────────────────┐
│  GitHub Pages   │  Static website hosting (free)
│   (Frontend)    │  - React + Vite
└────────┬────────┘  - Camera API
         │
         │ localStorage
         ▼
┌─────────────────┐
│  Browser        │  Local storage
│  localStorage   │  - Photo strips (base64)
└─────────────────┘  - Gallery data
                     - Photo count per key
```

#### Full Setup (with Google Drive Upload)
```
┌─────────────────┐
│  GitHub Pages   │  Frontend (React + Vite)
│   (Frontend)    │  - Camera API
└────────┬────────┘  - Photo capture
         │
         │ POST (per-key script URL)
         ▼
┌─────────────────┐
│  Apps Script    │  Web App (runs as the deploying
│   Web App       │  Google account — no OAuth flow)
└────────┬────────┘
         │
         │ Drive API (same account)
         ▼
┌─────────────────┐
│  Google Drive   │  Cloud storage
│                 │  - Photo backup
└─────────────────┘
```

<br/>