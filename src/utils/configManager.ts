/**
 * Configuration Manager
 *
 * Handles key-based configuration via URL parameters and session management.
 * When a URL has ?key=VALUE, it looks up the configuration in environment
 * variables and stores it in sessionStorage.
 */

const SESSION_KEY_NAME = 'picapal_config_key';
const SESSION_URL_NAME = 'picapal_session_url';

export interface SessionConfig {
  isKeyBased: boolean;
  photoLimit?: number; // Maximum number of photo strips allowed (undefined = unlimited)
}

/**
 * Parse URL parameters and check for key-based configuration
 */
export const initializeConfigFromURL = (): void => {
  const urlParams = new URLSearchParams(window.location.search);
  const key = urlParams.get('key');

  // Get current URL without query params
  const currentBaseURL = window.location.origin + window.location.pathname;
  const previousBaseURL = sessionStorage.getItem(SESSION_URL_NAME);

  // If URL has changed (new session), clear previous key
  if (previousBaseURL && previousBaseURL !== currentBaseURL) {
    sessionStorage.removeItem(SESSION_KEY_NAME);
    sessionStorage.removeItem(SESSION_URL_NAME);
  }

  // Store current base URL
  sessionStorage.setItem(SESSION_URL_NAME, currentBaseURL);

  // Check if URL contains key=VALUE
  if (key) {
    const configKey = key.toUpperCase();
    const envVarName = `VITE_CONFIG_${configKey}`;

    // Try to get configuration from environment variable
    const configValue = (import.meta.env as any)[envVarName];

    if (configValue) {
      // Store the key in sessionStorage
      sessionStorage.setItem(SESSION_KEY_NAME, key);
      console.log(`Configuration loaded for key: ${key}`);
    } else {
      console.warn(`No configuration found for key: ${key}`);
      sessionStorage.removeItem(SESSION_KEY_NAME);
    }
  }
};

/**
 * Get the current configuration key from sessionStorage
 */
export const getCurrentConfigKey = (): string | null => {
  return sessionStorage.getItem(SESSION_KEY_NAME);
};

/**
 * Check if the current session is using key-based configuration
 */
export const isKeyBasedConfig = (): boolean => {
  return getCurrentConfigKey() !== null;
};

/**
 * Parse configuration string from environment variable
 * Format: "photoLimit" (just a number, or empty for unlimited)
 */
const parseConfigString = (configString: string): Omit<SessionConfig, 'isKeyBased'> | null => {
  if (!configString) return { photoLimit: undefined };

  const trimmed = configString.trim();

  // If empty, unlimited photos
  if (trimmed === '') {
    return { photoLimit: undefined };
  }

  // Parse as number
  const photoLimit = parseInt(trimmed, 10);

  if (isNaN(photoLimit) || photoLimit < 0) {
    console.error('Invalid config format. Expected: a positive number or empty for unlimited');
    return null;
  }

  return {
    photoLimit: photoLimit || undefined,
  };
};

/**
 * Get session configuration based on URL key parameter
 */
export const getSessionConfig = (): SessionConfig => {
  // Check for key-based configuration
  const configKey = getCurrentConfigKey();
  if (configKey) {
    const envVarName = `VITE_CONFIG_${configKey.toUpperCase()}`;
    const configValue = (import.meta.env as any)[envVarName];

    if (configValue !== undefined) {
      const parsedConfig = parseConfigString(configValue);
      if (parsedConfig) {
        return {
          ...parsedConfig,
          isKeyBased: true,
        };
      }
    }
  }

  // No configuration found - return default state (unlimited)
  return {
    isKeyBased: false,
    photoLimit: undefined,
  };
};

/**
 * Clear the current configuration key
 * (Useful when user wants to switch to manual config)
 */
export const clearConfigKey = (): void => {
  sessionStorage.removeItem(SESSION_KEY_NAME);
};

/**
 * Get the storage key for tracking photo count for the current config key
 */
const getPhotoCountStorageKey = (): string => {
  const configKey = getCurrentConfigKey();
  if (configKey) {
    return `picapal_photo_count_${configKey}`;
  }
  return 'picapal_photo_count_default';
};

/**
 * Get the number of photos taken for the current key
 */
export const getPhotosTaken = (): number => {
  const key = getPhotoCountStorageKey();
  const count = localStorage.getItem(key);
  return count ? parseInt(count, 10) : 0;
};

/**
 * Increment the photo count for the current key
 */
export const incrementPhotoCount = (): void => {
  const key = getPhotoCountStorageKey();
  const current = getPhotosTaken();
  localStorage.setItem(key, (current + 1).toString());
};

/**
 * Check if the user has reached the photo limit
 * Returns true if limit is reached, false otherwise
 */
export const hasReachedPhotoLimit = (): boolean => {
  const config = getSessionConfig();

  // If no photo limit is set, user can take unlimited photos
  if (!config.photoLimit) {
    return false;
  }

  const photosTaken = getPhotosTaken();
  return photosTaken >= config.photoLimit;
};

/**
 * Get the number of photos remaining
 * Returns undefined if there's no limit
 */
export const getPhotosRemaining = (): number | undefined => {
  const config = getSessionConfig();

  if (!config.photoLimit) {
    return undefined;
  }

  const photosTaken = getPhotosTaken();
  const remaining = config.photoLimit - photosTaken;
  return Math.max(0, remaining);
};
