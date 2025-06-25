/**
 * Environment configuration utility for SecureCardr
 * Safely loads and validates environment variables
 */

interface AppConfig {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  google: {
    driveClientId: string;
  };
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
  };
  security: {
    encryptionIterations: number;
    sessionTimeout: number;
  };
}

/**
 * Get required environment variable
 */
function getRequiredEnvVar(name: string): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Get optional environment variable with default
 */
function getEnvVar(name: string, defaultValue: string): string {
  return import.meta.env[name] || defaultValue;
}

/**
 * Validate environment and create configuration
 */
function createConfig(): AppConfig {
  try {
    return {
      firebase: {
        apiKey: getRequiredEnvVar('VITE_FIREBASE_API_KEY'),
        authDomain: getRequiredEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
        projectId: getRequiredEnvVar('VITE_FIREBASE_PROJECT_ID'),
        storageBucket: getRequiredEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
        messagingSenderId: getRequiredEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
        appId: getRequiredEnvVar('VITE_FIREBASE_APP_ID'),
      },
      google: {
        driveClientId: getRequiredEnvVar('VITE_GOOGLE_DRIVE_CLIENT_ID'),
      },
      app: {
        name: getEnvVar('VITE_APP_NAME', 'SecureCardr'),
        version: getEnvVar('VITE_APP_VERSION', '0.0.0'),
        environment: getEnvVar('VITE_APP_ENVIRONMENT', 'development') as 'development' | 'staging' | 'production',
      },
      security: {
        encryptionIterations: parseInt(getEnvVar('VITE_ENCRYPTION_KEY_ITERATIONS', '100000'), 10),
        sessionTimeout: parseInt(getEnvVar('VITE_SESSION_TIMEOUT', '3600000'), 10),
      },
    };
  } catch (error) {
    console.error('Configuration error:', error);
    throw error;
  }
}

// Export the configuration
export const config = createConfig();

// Export utility functions for testing
export { getRequiredEnvVar, getEnvVar };

// Development mode checks
if (config.app.environment === 'development') {
  console.log('SecureCardr running in development mode');
  console.log('Config loaded:', {
    ...config,
    firebase: { ...config.firebase, apiKey: '[REDACTED]' },
    google: { ...config.google, driveClientId: '[REDACTED]' },
  });
}
