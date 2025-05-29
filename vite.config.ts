import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if we're running in a tunnel environment
const isTunnel = process.env.VITE_IS_TUNNEL === 'true';

// Get the local network IP address
function getLocalNetworkIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalNetworkIP();
const isDevelopment = process.env.NODE_ENV !== "production";

// Determine the API URL based on environment
const getApiUrl = () => {
  if (process.env.API_URL) {
    return process.env.API_URL;
  }
  
  if (isDevelopment) {
    // In development, use localhost for the API
    return 'http://localhost:3000';
  }
  
  return 'http://localhost:3000';
};

// Determine the proxy target - use localhost since both servers run on the same machine
const getProxyTarget = () => {
  return 'http://localhost:3000';
};

export default defineConfig({
  plugins: [
    react(),
    themePlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV === 'production' ? false : true,
  },
  publicDir: path.resolve(__dirname, "public"),
  server: {
    host: '0.0.0.0',
    port: 5173, // Using Vite's default port instead of 3000
    strictPort: true, // Ensure we use exactly port 5173
    proxy: {
      // Proxy API requests to the backend server
      '/api': {
        target: getProxyTarget(),
        changeOrigin: true,
        secure: false,
      },
      // Proxy authentication requests
      '/auth': {
        target: getProxyTarget(),
        changeOrigin: true,
        secure: false,
      }
    },
    hmr: {
      overlay: false,
      host: '0.0.0.0',
      protocol: 'ws',
      // Disable HMR for network access to improve mobile compatibility
      clientPort: process.env.VITE_HMR_PORT ? parseInt(process.env.VITE_HMR_PORT) : undefined,
    },
    // Allow all hosts when in tunnel mode
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    allowedHosts: isTunnel ? true : undefined,
  },
  define: {
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      API_URL: JSON.stringify(getApiUrl()),
      LOCAL_IP: JSON.stringify(localIP),
      // Add any other environment variables your client code needs access to
      IS_TUNNEL: JSON.stringify(isTunnel),
    },
  },
  base: '/', // Ensure assets are served from the root path
  optimizeDeps: {
    esbuildOptions: {
      jsx: 'automatic',
    }
  }
});
