import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  try {
    console.log("Setting up Vite in development mode...");
    const serverOptions = {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true as true,
    };

    console.log("Creating Vite server with options:", JSON.stringify(serverOptions));
    const vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      customLogger: {
        ...viteLogger,
        error: (msg, options) => {
          console.error("Vite error:", msg);
          viteLogger.error(msg, options);
          process.exit(1);
        },
      },
      server: serverOptions,
      appType: "custom",
    });
    console.log("Vite server created successfully");

    // Apply Vite middlewares only to non-API requests
    app.use((req, res, next) => {
      // Skip Vite for API routes - let Express handle them
      if (req.path.startsWith('/api/')) {
        return next();
      }
      // For all other routes, use Vite middleware
      vite.middlewares(req, res, next);
    });
    console.log("Vite middlewares attached to Express app with API route exclusion");
    
    // Modified catch-all to exclude API routes
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;

      // Skip processing for API routes
      if (url.startsWith('/api/')) {
        return next();
      }
      
      console.log(`Vite handling URL: ${url}`);

      try {
        const clientTemplate = path.resolve(
          __dirname,
          "..",
          "client",
          "index.html",
        );
        console.log(`Looking for client template at: ${clientTemplate}`);

        // always reload the index.html file from disk incase it changes
        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        console.log("Template file loaded successfully");
        
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`,
        );
        const page = await vite.transformIndexHtml(url, template);
        console.log("HTML transformed successfully, serving page");
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        console.error("Error serving Vite-processed HTML:", e);
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
    console.log("Vite catch-all route handler set up with API exclusion");
  } catch (error) {
    console.error("Failed to set up Vite:", error);
    throw error;
  }
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  // but exclude API routes
  app.use("*", (req, res, next) => {
    // Skip for API routes - let Express handle them
    if (req.originalUrl.startsWith('/api/')) {
      return next();
    }
    
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
