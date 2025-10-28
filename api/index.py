from flask import Flask, request, jsonify, redirect, render_template_string
import os
import json
import base64
from io import BytesIO
from datetime import datetime, timedelta
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload

app = Flask(__name__)

# CORS configuration - allow requests from GitHub Pages
@app.after_request
def after_request(response):
    """Add CORS headers to all responses"""
    origin = request.headers.get('Origin')
    # Allow requests from GitHub Pages and localhost
    if origin:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

# OAuth 2.0 scopes
SCOPES = ['https://www.googleapis.com/auth/drive.file']

# Global variable to cache client configs and credentials per key
_CLIENT_CONFIGS = {}  # key -> client_config
_CACHED_CREDENTIALS = {}  # key -> credentials

# Directory to store credentials (Vercel has /tmp directory that persists during function lifecycle)
CREDENTIALS_DIR = '/tmp/tokens'

# Session duration in hours (set to 24 hours for daily re-auth)
# Set to None to disable session expiration (tokens will last until manually revoked)
SESSION_DURATION_HOURS = int(os.environ.get('OAUTH_SESSION_DURATION_HOURS', '24'))

def get_client_config(key):
    """
    Get OAuth client configuration for a specific key.

    Args:
        key: Required key name (e.g., 'WEDDING', 'BIRTHDAY')

    Returns:
        Client configuration dict

    Raises:
        ValueError: If key is missing or credentials not found
    """
    global _CLIENT_CONFIGS

    # Enforce key requirement
    if not key:
        raise ValueError('Key is required. Visit /authorize?key=YOUR_KEY to authorize.')

    # Normalize key
    cache_key = key.upper()

    # Return cached config if available
    if cache_key in _CLIENT_CONFIGS:
        return _CLIENT_CONFIGS[cache_key]

    # Look for key-specific credentials only (no fallback)
    env_var_name = f'GOOGLE_OAUTH_CREDENTIALS_{cache_key}'
    credentials_json = os.environ.get(env_var_name)

    if not credentials_json:
        raise ValueError(
            f'Missing {env_var_name} environment variable.\n'
            f'Please configure OAuth credentials for key "{key}" in Vercel environment variables.\n'
            f'Then visit /authorize?key={key.lower()} to authorize.'
        )

    try:
        credentials = json.loads(credentials_json)

        # Handle both "web" and "installed" app types
        if 'web' in credentials:
            config = credentials['web']
        elif 'installed' in credentials:
            config = credentials['installed']
        else:
            raise ValueError('Invalid credentials format. Expected "web" or "installed" key in JSON.')

        # Ensure redirect_uris exists
        if 'redirect_uris' not in config:
            redirect_uri = os.environ.get('OAUTH_REDIRECT_URI', 'http://localhost:5000/oauth2callback')
            config['redirect_uris'] = [redirect_uri]

        # Cache the config
        client_config = {"web": config}
        _CLIENT_CONFIGS[cache_key] = client_config
        return client_config

    except json.JSONDecodeError as e:
        raise ValueError(f'Invalid JSON in {env_var_name}: {e}')
    except (ValueError, KeyError) as e:
        raise ValueError(f'Error parsing {env_var_name}: {e}')

def get_flow(key):
    """Create OAuth flow for a specific key

    Args:
        key: Required key name

    Raises:
        ValueError: If key is missing
    """
    if not key:
        raise ValueError('Key is required for OAuth flow.')

    client_config = get_client_config(key)
    flow = Flow.from_client_config(
        client_config,
        scopes=SCOPES,
        redirect_uri=client_config['web']['redirect_uris'][0]
    )
    return flow

def save_credentials(credentials, key):
    """
    Save credentials for a specific key with session tracking.
    File storage is used for persistence across function invocations.

    Args:
        credentials: Google OAuth credentials
        key: Required key name (e.g., 'WEDDING', 'BIRTHDAY')

    Raises:
        ValueError: If key is missing
    """
    global _CACHED_CREDENTIALS

    if not key:
        raise ValueError('Key is required to save credentials.')

    # Normalize key
    cache_key = key.upper()

    # Cache in memory
    _CACHED_CREDENTIALS[cache_key] = credentials

    # Save to file in /tmp (persists during Vercel function lifecycle)
    try:
        # Create directory if it doesn't exist
        os.makedirs(CREDENTIALS_DIR, exist_ok=True)

        # Track when credentials were first authorized
        # This is used for session expiration
        authorization_time = datetime.utcnow().isoformat()

        creds_data = {
            'token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'token_uri': credentials.token_uri,
            'client_id': credentials.client_id,
            'client_secret': credentials.client_secret,
            'scopes': credentials.scopes,
            'expiry': credentials.expiry.isoformat() if credentials.expiry else None,
            'authorized_at': authorization_time  # Track when this session was authorized
        }

        credentials_file = os.path.join(CREDENTIALS_DIR, f'{cache_key}.json')

        # Preserve authorized_at from existing file if present (don't reset on refresh)
        if os.path.exists(credentials_file):
            try:
                with open(credentials_file, 'r') as f:
                    existing_data = json.load(f)
                    # Keep the original authorization time
                    if 'authorized_at' in existing_data:
                        creds_data['authorized_at'] = existing_data['authorized_at']
            except Exception:
                pass  # If we can't read existing file, use new timestamp

        with open(credentials_file, 'w') as f:
            json.dump(creds_data, f)

        print(f"Credentials saved for key '{key}' with refresh token: {bool(credentials.refresh_token)}")
    except Exception as e:
        print(f"Warning: Could not save credentials to file: {e}")

def get_credentials(key):
    """
    Get credentials for a specific key from cache, file, or environment variable.

    Priority:
    1. Memory cache (fastest)
    2. Token file in /tmp/tokens/{KEY}.json
    3. GOOGLE_OAUTH_TOKEN_{KEY} environment variable (manual override)

    Automatically refreshes expired tokens.

    Args:
        key: Required key name (e.g., 'WEDDING', 'BIRTHDAY')

    Returns:
        Credentials object or None

    Raises:
        ValueError: If key is missing
    """
    global _CACHED_CREDENTIALS

    if not key:
        raise ValueError('Key is required to get credentials.')

    # Normalize key
    cache_key = key.upper()

    # Check memory cache first
    if cache_key in _CACHED_CREDENTIALS:
        credentials = _CACHED_CREDENTIALS[cache_key]
        if credentials.valid:
            return credentials
        elif credentials.expired and credentials.refresh_token:
            try:
                credentials.refresh(Request())
                save_credentials(credentials, key)
                return credentials
            except Exception as e:
                print(f"Error refreshing cached credentials for key '{key}': {e}")
                del _CACHED_CREDENTIALS[cache_key]

    # Try loading from file
    credentials_file = os.path.join(CREDENTIALS_DIR, f'{cache_key}.json')
    if os.path.exists(credentials_file):
        try:
            with open(credentials_file, 'r') as f:
                creds_data = json.load(f)

            # Check session expiration if enabled
            if SESSION_DURATION_HOURS and creds_data.get('authorized_at'):
                authorized_at = datetime.fromisoformat(creds_data['authorized_at'])
                session_age = datetime.utcnow() - authorized_at

                if session_age > timedelta(hours=SESSION_DURATION_HOURS):
                    print(f"Session expired for key '{key}' (age: {session_age.total_seconds() / 3600:.1f} hours)")
                    # Remove expired session
                    os.remove(credentials_file)
                    if cache_key in _CACHED_CREDENTIALS:
                        del _CACHED_CREDENTIALS[cache_key]
                    return None

            # Check if refresh token is present
            if not creds_data.get('refresh_token'):
                print(f"Warning: No refresh token found for key '{key}'. Re-authorization may be required.")

            credentials = Credentials(
                token=creds_data['token'],
                refresh_token=creds_data.get('refresh_token'),
                token_uri=creds_data['token_uri'],
                client_id=creds_data['client_id'],
                client_secret=creds_data['client_secret'],
                scopes=creds_data.get('scopes', SCOPES)
            )

            # Check if valid or can be refreshed
            if credentials.valid:
                _CACHED_CREDENTIALS[cache_key] = credentials
                return credentials
            elif credentials.refresh_token:
                # Token expired but we have refresh token
                try:
                    print(f"Refreshing access token for key '{key}'...")
                    credentials.refresh(Request())
                    # Save refreshed credentials (preserves authorized_at)
                    save_credentials(credentials, key)
                    print(f"Access token refreshed successfully for key '{key}'")
                    return credentials
                except Exception as refresh_error:
                    print(f"Error refreshing token for key '{key}': {refresh_error}")
                    # Remove invalid credentials
                    os.remove(credentials_file)
                    if cache_key in _CACHED_CREDENTIALS:
                        del _CACHED_CREDENTIALS[cache_key]
                    return None
            else:
                print(f"No refresh token available for key '{key}'. Re-authorization required.")
                return None
        except Exception as e:
            print(f"Error loading credentials from file for key '{key}': {e}")

    # Try environment variable (manual override for initial setup)
    env_var_name = f'GOOGLE_OAUTH_TOKEN_{cache_key}'
    token_json = os.environ.get(env_var_name)

    if token_json:
        try:
            creds_data = json.loads(token_json)
            credentials = Credentials(**creds_data)

            if credentials.valid:
                save_credentials(credentials, key)
                return credentials
            elif credentials.expired and credentials.refresh_token:
                credentials.refresh(Request())
                save_credentials(credentials, key)
                return credentials
        except Exception as e:
            print(f"Error loading credentials from environment for key '{key}': {e}")

    return None

def get_folder_id(key):
    """
    Get Google Drive folder ID for a specific key.

    Args:
        key: Required key name (e.g., 'WEDDING', 'BIRTHDAY')

    Returns:
        Folder ID string or None (None = upload to root)

    Raises:
        ValueError: If key is missing
    """
    if not key:
        raise ValueError('Key is required to get folder ID.')

    # Normalize key
    cache_key = key.upper()

    # Look for key-specific folder ID only (no fallback)
    env_var_name = f'GDRIVE_FOLDER_ID_{cache_key}'
    folder_id = os.environ.get(env_var_name)

    return folder_id

# Authorization UI HTML
AUTH_UI_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Google Drive Authorization - Pocket Booth</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 40px;
            max-width: 500px;
            width: 100%;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }
        .status {
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 25px;
            font-size: 14px;
        }
        .status.authorized {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .status.unauthorized {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
        }
        .status-icon {
            font-size: 20px;
            margin-right: 10px;
        }
        .info-box {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 25px;
            border-left: 4px solid #667eea;
        }
        .info-box h3 {
            color: #333;
            margin-bottom: 10px;
            font-size: 16px;
        }
        .info-box ul {
            margin-left: 20px;
            color: #666;
            font-size: 14px;
            line-height: 1.8;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 600;
            transition: transform 0.2s, box-shadow 0.2s;
            border: none;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
            text-align: center;
        }
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        .button.secondary {
            background: #6c757d;
            margin-top: 10px;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        .session-info {
            background: #e7f3ff;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-size: 14px;
            color: #004085;
            border: 1px solid #b8daff;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📸 Pocket Booth</h1>
        <p class="subtitle">Google Drive Authorization{% if key %} - {{ key_display }}{% endif %}</p>

        {% if authorized %}
        <div class="status authorized">
            <span class="status-icon">✓</span>
            <strong>Authorized!</strong> Backend connected to Google Drive.
        </div>
        <div class="session-info">
            ✅ Pocket Booth can now upload photos automatically!
        </div>
        <div class="info-box">
            <h3>What's Next?</h3>
            <ul>
                <li>Photos from Pocket Booth will automatically upload to Google Drive</li>
                <li>Users don't need to authorize - the backend handles everything</li>
                <li>Authorization persists until manually revoked</li>
                <li>Tokens are automatically refreshed when needed</li>
            </ul>
        </div>
        <a href="{{ revoke_url }}" class="button secondary">Revoke Backend Access</a>
        {% else %}
        <div class="status unauthorized">
            <span class="status-icon">⚠</span>
            <strong>Not Authorized.</strong> Backend needs Google Drive access{% if key %} for {{ key_display }}{% endif %}.
        </div>
        <div class="info-box">
            <h3>What You're Authorizing:</h3>
            <ul>
                <li><strong>Admin-only:</strong> This is a one-time setup for the Pocket Booth backend</li>
                {% if key %}
                <li>Upload photos for <strong>{{ key_display }}</strong> key to your Google Drive</li>
                {% else %}
                <li>Upload photos from all Pocket Booth users to your Google Drive</li>
                {% endif %}
                <li>Users won't see OAuth prompts - the backend handles uploads</li>
                <li>Tokens are stored securely and refreshed automatically</li>
                <li>You can revoke access at any time</li>
            </ul>
        </div>
        <a href="{{ authorize_url }}" class="button">Authorize Backend Access{% if key %} ({{ key_display }}){% endif %}</a>
        {% endif %}

        <div class="footer">
            Pocket Booth uses OAuth 2.0 for secure backend authorization<br>
            Backend credentials persist and auto-refresh<br>
            <a href="/health" style="color: #667eea; text-decoration: none; margin-top: 10px; display: inline-block;">System Health Check →</a>
        </div>
    </div>
</body>
</html>
"""

@app.route('/')
def index():
    """Main authorization page - requires key parameter

    Query params:
        key: Required key name (e.g., ?key=wedding)
    """
    try:
        # Get key from query parameter
        key = request.args.get('key')

        # Enforce key requirement
        if not key:
            return """
            <html>
            <head>
                <title>Key Required</title>
                <style>
                    body { font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; background: #f5f5f5; }
                    .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    h1 { color: #d32f2f; }
                    code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
                    a { color: #667eea; text-decoration: none; }
                    a:hover { text-decoration: underline; }
                    .example { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🔑 Key Required</h1>
                    <p><strong>A key parameter is required to access this page.</strong></p>
                    <p>Pocket Booth uses keys to manage different events and Google Drive accounts.</p>
                    <hr>
                    <h3>How to access:</h3>
                    <div class="example">
                        <p>Add <code>?key=YOUR_KEY</code> to the URL:</p>
                        <p>Example: <code>/?key=wedding</code></p>
                    </div>
                    <h3>Available keys:</h3>
                    <p>Keys are configured in Vercel environment variables:</p>
                    <ul>
                        <li><code>GOOGLE_OAUTH_CREDENTIALS_WEDDING</code> → <code>?key=wedding</code></li>
                        <li><code>GOOGLE_OAUTH_CREDENTIALS_BIRTHDAY</code> → <code>?key=birthday</code></li>
                        <li><code>GOOGLE_OAUTH_CREDENTIALS_[KEY]</code> → <code>?key=[key]</code></li>
                    </ul>
                    <p><a href="/health">→ Check system health</a></p>
                </div>
            </body>
            </html>
            """, 400

        # Check if OAuth is configured for this key
        try:
            get_client_config(key)
            oauth_configured = True
        except Exception as e:
            oauth_configured = False
            config_error = str(e)

        if not oauth_configured:
            return """
            <html>
            <head>
                <title>Setup Required</title>
                <style>
                    body { font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; background: #f5f5f5; }
                    .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    h1 { color: #d32f2f; }
                    code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
                    a { color: #667eea; text-decoration: none; }
                    a:hover { text-decoration: underline; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>⚙️ Setup Required</h1>
                    <p><strong>Google OAuth credentials are not configured.</strong></p>
                    <p>The Flask app is running, but needs configuration to work.</p>
                    <hr>
                    <h3>Steps to configure:</h3>
                    <ol>
                        <li>Go to <strong>Vercel Dashboard</strong> → Your Project</li>
                        <li>Navigate to <strong>Settings</strong> → <strong>Environment Variables</strong></li>
                        <li>Add <code>GOOGLE_OAUTH_CREDENTIALS</code> with your OAuth JSON</li>
                        <li>Add <code>SECRET_KEY</code> with a random string</li>
                        <li>Redeploy the project</li>
                    </ol>
                    <p><a href="/health">→ Check system health for details</a></p>
                </div>
            </body>
            </html>
            """

        credentials = get_credentials(key)
        authorized = credentials and credentials.valid

        # Build authorize URL with key parameter
        authorize_url = f'/authorize?key={key}' if key else '/authorize'
        revoke_url = f'/revoke?key={key}' if key else '/revoke'

        # Get key display name
        key_display = key.upper() if key else 'DEFAULT'

        return render_template_string(
            AUTH_UI_HTML,
            authorized=authorized,
            key=key,
            key_display=key_display,
            authorize_url=authorize_url,
            revoke_url=revoke_url
        )
    except Exception as e:
        return f"""
        <html>
        <head><title>Error</title></head>
        <body style="font-family: sans-serif; padding: 40px;">
            <h1>Error</h1>
            <p>{str(e)}</p>
            <p><a href="/health">Check system health</a></p>
        </body>
        </html>
        """, 500

@app.route('/authorize')
def authorize():
    """Initiate OAuth flow - admin authorization only

    Query params:
        key: Required key name (e.g., ?key=wedding)
    """
    try:
        # Get key from query parameter
        key = request.args.get('key')

        # Enforce key requirement
        if not key:
            return f"""
            <html>
            <head><title>Key Required</title></head>
            <body style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
                <h1>🔑 Key Required</h1>
                <p><strong>You must provide a key to authorize.</strong></p>
                <hr>
                <h3>How to authorize:</h3>
                <p>Add <code>?key=YOUR_KEY</code> to the URL:</p>
                <p>Example: <code>/authorize?key=wedding</code></p>
                <p><a href="/">← Back to home</a></p>
            </body>
            </html>
            """, 400

        flow = get_flow(key)

        # Generate state with key encoded
        # The state will be: {random_state}__KEY__{key_name}
        # Request offline access to get refresh token
        # Force consent to ensure we always get a refresh token
        authorization_url, state = flow.authorization_url(
            access_type='offline',  # Required for refresh tokens
            include_granted_scopes='true',
            prompt='consent'  # Force consent screen to guarantee refresh token
        )

        print(f"Initiating OAuth flow for key '{key}' with refresh token request")

        # Replace the state parameter with our encoded version
        # This ensures we only have ONE state parameter
        encoded_state = f'{state}__KEY__{key}'
        authorization_url = authorization_url.replace(f'state={state}', f'state={encoded_state}')

        return redirect(authorization_url)
    except Exception as e:
        return f"""
        <html>
        <head><title>Configuration Error</title></head>
        <body style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
            <h1>⚠️ Configuration Error</h1>
            <p><strong>OAuth credentials are not configured correctly.</strong></p>
            <p>Error: {str(e)}</p>
            <hr>
            <h3>How to fix:</h3>
            <ol>
                <li>Go to Vercel Dashboard → Your Project → Settings → Environment Variables</li>
                <li>Set <code>GOOGLE_OAUTH_CREDENTIALS</code> with your OAuth JSON</li>
                <li>Redeploy the project</li>
            </ol>
            <p><a href="/health">Check system health</a></p>
        </body>
        </html>
        """, 500

@app.route('/oauth2callback')
def oauth2callback():
    """OAuth callback handler - saves credentials persistently"""
    try:
        # Check for error in callback
        error = request.args.get('error')
        if error:
            error_description = request.args.get('error_description', 'Unknown error')
            return f"""
            <html>
            <head><title>Authorization Error</title></head>
            <body style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
                <h1>❌ Authorization Failed</h1>
                <p><strong>Error:</strong> {error}</p>
                <p><strong>Description:</strong> {error_description}</p>
                <hr>
                <h3>Common Issues:</h3>
                <ul>
                    <li><strong>redirect_uri_mismatch:</strong> The redirect URI must match exactly in both Google Cloud Console and your app configuration</li>
                    <li><strong>access_denied:</strong> You cancelled the authorization</li>
                </ul>
                <p><a href="/">← Back to authorization page</a></p>
                <p><a href="/health">Check system health</a></p>
            </body>
            </html>
            """, 400

        # Extract key from state parameter
        state = request.args.get('state', '')
        key = None
        if '__KEY__' in state:
            # State format: {oauth_state}__KEY__{key_name}
            key = state.split('__KEY__')[1]

        flow = get_flow(key)
        flow.fetch_token(authorization_response=request.url)

        credentials = flow.credentials

        # Verify we got a refresh token
        if not credentials.refresh_token:
            print(f"WARNING: No refresh token received for key '{key}'. This may cause issues.")
            print("This usually happens if the user was already authorized. Revoking and re-authorizing may help.")
        else:
            print(f"Successfully obtained refresh token for key '{key}'")

        # Save credentials persistently for this key (marks authorization time)
        save_credentials(credentials, key)

        # Redirect back with key parameter if present
        redirect_url = f'/?key={key}' if key else '/'
        return redirect(redirect_url)
    except Exception as e:
        return f"""
        <html>
        <head><title>OAuth Error</title></head>
        <body style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
            <h1>⚠️ OAuth Callback Error</h1>
            <p><strong>Error:</strong> {str(e)}</p>
            <hr>
            <h3>How to fix:</h3>
            <ol>
                <li>Check that redirect_uris in GOOGLE_OAUTH_CREDENTIALS matches your Vercel URL</li>
                <li>Go to Google Cloud Console and verify Authorized redirect URIs</li>
                <li>Format: https://your-app.vercel.app/oauth2callback</li>
            </ol>
            <p><a href="/">← Try again</a></p>
        </body>
        </html>
        """, 500

@app.route('/revoke')
def revoke():
    """Revoke backend OAuth credentials for a specific key

    Query params:
        key: Required key name (e.g., ?key=wedding)
    """
    global _CACHED_CREDENTIALS

    # Get key from query parameter
    key = request.args.get('key')

    # Enforce key requirement
    if not key:
        return """
        <html>
        <head><title>Key Required</title></head>
        <body style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
            <h1>🔑 Key Required</h1>
            <p><strong>You must provide a key to revoke credentials.</strong></p>
            <hr>
            <h3>How to revoke:</h3>
            <p>Add <code>?key=YOUR_KEY</code> to the URL:</p>
            <p>Example: <code>/revoke?key=wedding</code></p>
        </body>
        </html>
        """, 400

    cache_key = key.upper()

    # Clear memory cache for this key
    if cache_key in _CACHED_CREDENTIALS:
        del _CACHED_CREDENTIALS[cache_key]

    # Remove credentials file for this key
    try:
        credentials_file = os.path.join(CREDENTIALS_DIR, f'{cache_key}.json')
        if os.path.exists(credentials_file):
            os.remove(credentials_file)
    except Exception as e:
        print(f"Error removing credentials file: {e}")

    # Redirect back with key parameter
    return redirect(f'/?key={key}')

@app.route('/health')
def health():
    """Health check endpoint - verify Flask is running on Vercel"""
    try:
        # Test if OAuth config can be loaded
        config_loaded = False
        client_id = 'Not set'
        config_error = None

        try:
            client_config = get_client_config()
            config_loaded = client_config and 'web' in client_config
            if config_loaded:
                client_id = client_config.get('web', {}).get('client_id', 'Not set')[:20] + '...'
        except Exception as e:
            config_error = str(e)

        return jsonify({
            'status': 'healthy',
            'service': 'Pocket Booth API',
            'platform': 'Vercel',
            'oauth_configured': config_loaded,
            'oauth_error': config_error,
            'client_id_preview': client_id,
            'endpoints': {
                'authorization': '/authorize',
                'oauth_callback': '/oauth2callback',
                'status_check': '/api/status',
                'upload': '/api/upload (POST)',
                'health': '/health'
            },
            'environment': {
                'secret_key_set': bool(app.secret_key and app.secret_key != 'dev-secret-key-change-in-production'),
                'gdrive_folder_configured': bool(os.environ.get('GDRIVE_FOLDER_ID')),
                'google_oauth_credentials_set': bool(os.environ.get('GOOGLE_OAUTH_CREDENTIALS'))
            }
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'service': 'Pocket Booth API',
            'error': str(e)
        }), 500

@app.route('/api/status')
def api_status():
    """Check backend authorization status (for admin verification)"""
    credentials = get_credentials()
    return jsonify({
        'authorized': credentials and credentials.valid,
        'message': 'Backend authorized with Google Drive' if (credentials and credentials.valid) else 'Backend not authorized - admin needs to visit /authorize'
    })

@app.route('/api/status', methods=['OPTIONS'])
def api_status_options():
    """Handle CORS preflight for status endpoint"""
    return '', 204

@app.route('/api/upload', methods=['POST', 'OPTIONS'])
def api_upload():
    """Upload image to Google Drive - uses key-specific backend credentials

    Request body:
        image: Base64 encoded image data
        filename: Filename for the upload
        key: Optional key name (e.g., 'wedding')
    """
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return '', 204

    try:
        # Get request data
        data = request.get_json()

        if not data or 'image' not in data or 'filename' not in data:
            return jsonify({'error': 'Missing required fields: image and filename'}), 400

        # Get key from request (frontend sends this)
        key = data.get('key')

        # Get backend credentials for this key (saved by admin)
        credentials = get_credentials(key)
        if not credentials or not credentials.valid:
            key_msg = f' for key "{key}"' if key else ''
            return jsonify({
                'success': False,
                'error': f'Backend not authorized{key_msg}. Admin needs to visit /authorize?key={key} to grant access.'
            }), 401

        # Get folder ID for this key
        folder_id = get_folder_id(key)

        # Decode base64 image
        image_data = data['image']
        filename = data['filename']

        # Handle base64 data URI format
        if ',' in image_data:
            image_data = image_data.split(',')[1]

        image_bytes = base64.b64decode(image_data)

        # Determine mimetype
        mimetype = 'image/png'
        if filename.lower().endswith(('.jpg', '.jpeg')):
            mimetype = 'image/jpeg'
        elif filename.lower().endswith('.gif'):
            mimetype = 'image/gif'
        elif filename.lower().endswith('.webp'):
            mimetype = 'image/webp'

        # Build Drive service
        drive_service = build('drive', 'v3', credentials=credentials)

        # Create file metadata
        file_metadata = {'name': filename}
        if folder_id:
            file_metadata['parents'] = [folder_id]

        # Upload file
        media = MediaIoBaseUpload(
            BytesIO(image_bytes),
            mimetype=mimetype,
            resumable=True
        )

        file = drive_service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, name, webViewLink'
        ).execute()

        return jsonify({
            'success': True,
            'file_id': file.get('id'),
            'file_name': file.get('name'),
            'web_view_link': file.get('webViewLink'),
            'message': 'Image uploaded successfully'
        })

    except Exception as e:
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

# Export app for Vercel
# Vercel will automatically detect and use the 'app' object
# No need for a custom handler - Vercel handles Flask apps natively

if __name__ == '__main__':
    # For local development only
    app.run(debug=True, host='0.0.0.0', port=5000)
