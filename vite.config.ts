import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if we're running in a tunnel environment
const isTunnel = process.env.VITE_IS_TUNNEL === 'true';

export default defineConfig({
  plugins: [
    react(),
    // Only include the runtime error overlay when not in tunnel mode
    ...(!isTunnel ? [runtimeErrorOverlay()] : []),
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
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      // Proxy authentication requests
      '/auth': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      }
    },
    hmr: isTunnel ? false : {
      overlay: false,
      host: '0.0.0.0',
      protocol: 'ws'
    },
    // Allow all hosts when in tunnel mode
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    allowedHosts: isTunnel ? true : undefined,
  },
  define: {
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      API_URL: JSON.stringify('http://localhost:4000'),
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
