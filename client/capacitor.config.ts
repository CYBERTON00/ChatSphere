import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chatsphere.app',
  appName: 'ChatSphere',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    url: 'https://chatsphere-r3fz.onrender.com',
    cleartext: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1a1a',
      showSpinner: false
    }
  }
};

export default config;
