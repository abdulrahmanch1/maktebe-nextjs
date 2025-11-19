import 'dotenv/config';
import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl =
  process.env.CAP_SERVER_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://YOUR-PRODUCTION-DOMAIN.com';

const config: CapacitorConfig = {
  appId: 'com.daralqurra.app',
  appName: 'دار القراء',
  bundledWebRuntime: false,
  webDir: 'public',
  server: {
    url: serverUrl,
    cleartext: false,
    allowNavigation: ['localhost', '127.0.0.1', '10.0.2.2'],
  },
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: process.env.NODE_ENV !== 'production',
  },
};

export default config;
