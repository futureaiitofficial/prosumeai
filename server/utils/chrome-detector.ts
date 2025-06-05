import fs from "fs"
import { execSync } from "child_process"

export interface ChromeInfo {
  path: string
  version: string
  available: boolean
}

/**
 * Detects available Chrome/Chromium installations
 * @returns ChromeInfo object with path and version
 */
export function detectChrome(): ChromeInfo {
  const possiblePaths = [
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/snap/bin/chromium",
    process.env.CHROME_BIN,
    process.env.PUPPETEER_EXECUTABLE_PATH,
  ].filter(Boolean) as string[]

  for (const chromePath of possiblePaths) {
    if (fs.existsSync(chromePath)) {
      try {
        // Test if Chrome can be executed
        const version = execSync(`${chromePath} --version`, {
          encoding: "utf8",
          timeout: 5000,
          stdio: "pipe",
        }).trim()

        console.log(`✓ Found working Chrome: ${chromePath} (${version})`)
        return {
          path: chromePath,
          version,
          available: true,
        }
      } catch (error) {
        console.warn(`✗ Chrome found but not working: ${chromePath}`, error)
        continue
      }
    }
  }

  console.error("✗ No working Chrome installation found")
  return {
    path: "",
    version: "",
    available: false,
  }
}

/**
 * Get Chrome launch options for Puppeteer
 * @returns Puppeteer launch options object
 */
export function getChromeOptions() {
  const chromePath = detectChrome().path

  const baseOptions = {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
      "--disable-gpu",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
      "--disable-extensions",
    ],
  }

  // Only set executablePath if we found a valid Chrome installation
  if (chromePath) {
    return {
      ...baseOptions,
      executablePath: chromePath,
    }
  }

  return baseOptions
}
