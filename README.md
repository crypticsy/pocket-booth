# Pocket Booth 📸

Your pocket-sized photo booth application that captures instant photo strips with local storage.

<br/>

## ✨ Features

- 📷 **Photo Strip Capture** - Take 1-4 photos with countdown timer
- 🎨 **Multiple Filters** - Black & White, Trippy, Blue Tint, and more
- 🌙 **Dark Mode** - Beautiful dark theme support
- 📱 **Mobile Optimized** - Works great on phones and tablets
- 🔒 **Photo Limits** - Configurable limits per event/key
- 🎯 **Instagram Detection** - Warns users to open in regular browser
- 💾 **Offline Gallery** - View all photos in local storage
- ⬇️ **Download Photos** - Save photo strips as JPEG files
- ☁️ **Google Drive Upload** - Optional cloud storage with OAuth (requires Vercel backend)

<br/><br/>

## 🚀 Quick Start

### Option 1: Basic Deployment (GitHub Pages Only)
**Free hosting with local browser storage only**

```bash
# Install dependencies
yarn install

# Build and deploy to GitHub Pages
yarn deploy
```

This deploys only the frontend. Photos are stored in browser's localStorage.

### Option 2: Full Deployment (GitHub Pages + Vercel)
**With Google Drive cloud upload support**

1. **Deploy Frontend to GitHub Pages:**
   ```bash
   yarn deploy
   ```

2. **Deploy Backend to Vercel:**
   - Create project in Vercel dashboard
   - Download OAuth JSON from Google Cloud Console
   - Set `GOOGLE_OAUTH_CREDENTIALS` environment variable
   - **Note**: Vercel deployment is manual via their web dashboard

3. **Connect Frontend to Backend:**
   - Create `.env.production` locally (gitignored, won't be committed)
   - Add: `VITE_VERCEL_API_URL=https://your-vercel-url.vercel.app`
   - Redeploy frontend: `yarn deploy`

📖 **Full guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)

### Local Development

```bash
yarn install
yarn dev
```

Visit `http://localhost:5173`

<br/><br/>

## 🎮 How to Use

### Basic Usage

1. **Start the Booth**
   - Click **"INSERT COIN"** button
   - Allow camera permissions when prompted

2. **Capture Photos**
   - Countdown begins (3 seconds)
   - Multiple photos captured automatically
   - 2.5 seconds between each shot

3. **Download & Share**
   - View your photo strip
   - Download as JPEG
   - Photos saved in browser's local storage

4. **Gallery**
   - Access all saved photo strips
   - Download or delete strips

### Advanced Features

- **Filters**: Choose from 4 different photo filters
- **Strip Length**: Select 1-4 photos per strip
- **Camera Flip**: Switch between front/back camera (mobile)
- **Dark Mode**: Toggle light/dark theme

<br/><br/>

## 🔧 Configuration

### Environment Variables

Create `.env` file for development or production:

```bash
# Key-Based Photo Limit Configuration
# Format: VITE_CONFIG_[KEY_NAME]=[photoLimit]

# Example configurations:
VITE_CONFIG_MYEVENT=10
VITE_CONFIG_WEDDING=5
VITE_CONFIG_BIRTHDAY=20
VITE_CONFIG_DEMO=3
VITE_CONFIG_UNLIMITED=
```

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

### Multiple Events/Keys

Configure different photo limits for different events:

```bash
VITE_CONFIG_WEDDING=10
VITE_CONFIG_BIRTHDAY=20
VITE_CONFIG_CORPORATE=50
```

Access with: `https://yoursite.com/pocket-booth/?key=wedding`

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

<br/><br/>

## 🏗️ Architecture

### Basic Setup (GitHub Pages Only)
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

### Full Setup (with Google Drive Upload)
```
┌─────────────────┐
│  GitHub Pages   │  Frontend (React + Vite)
│   (Frontend)    │  - Camera API
└────────┬────────┘  - Photo capture
         │
         │ API Calls
         ▼
┌─────────────────┐
│     Vercel      │  Backend (Python Flask)
│   (Backend)     │  - OAuth 2.0 flow
└────────┬────────┘  - Photo upload API
         │
         │ Google Drive API
         ▼
┌─────────────────┐
│  Google Drive   │  Cloud storage
│                 │  - Photo backup
└─────────────────┘  - 24hr OAuth sessions
```

<br/><br/>

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Modern browser with camera support

### Local Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/pocket-booth.git
cd pocket-booth

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173`

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Deploy

```bash
# Deploy to GitHub Pages (frontend only)
yarn deploy
```

**Important**: `yarn deploy` only deploys the React frontend to GitHub Pages. For Vercel backend deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md).

