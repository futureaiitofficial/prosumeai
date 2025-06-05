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
        // Test if Chrome can be executed with a simple version check
        // Use a shorter timeout and suppress stderr to avoid hanging
        const version = execSync(`${chromePath} --version`, {
          encoding: "utf8",
          timeout: 3000,
          stdio: ["pipe", "pipe", "ignore"],
        }).trim()

        console.log(`✓ Found working Chrome: ${chromePath} (${version})`)
        return {
          path: chromePath,
          version,
          available: true,
        }
      } catch (error) {
        console.warn(`✗ Chrome found but not working: ${chromePath}`)
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
 * Get Chrome launch options for Puppeteer optimized for Docker environments
 * @returns Puppeteer launch options object
 */
export function getChromeOptions() {
  const chromePath = detectChrome().path

  // Base options optimized for Docker environments
  const baseOptions = {
    headless: true, // Use standard headless mode for compatibility
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage", // Overcome limited /dev/shm in Docker
      "--disable-accelerated-2d-canvas",
      "--disable-gpu", // Disable GPU in headless mode
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-default-apps",
      "--disable-sync",
      "--disable-translate",
      "--hide-scrollbars",
      "--metrics-recording-only",
      "--mute-audio",
      "--no-first-run",
      "--safebrowsing-disable-auto-update",
      "--no-zygote", // Important for Docker
      "--single-process", // Important for Docker
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
      "--disable-ipc-flooding-protection",
      "--disable-features=TranslateUI",
      "--run-all-compositor-stages-before-draw",
      // Memory-specific settings
      "--disable-features=site-per-process", // Reduce memory usage
      "--js-flags=--max-old-space-size=512", // Limit JS memory
    ],
    ignoreHTTPSErrors: true,
    timeout: 30000, // 30 seconds timeout
    protocolTimeout: 30000,
    dumpio: false, // Set to true for debugging
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

/**
 * Get minimal Chrome launch options as a fallback for problematic environments
 * @returns Minimal Puppeteer launch options object
 */
export function getMinimalChromeOptions() {
  const chromePath = detectChrome().path

  // Minimal options to reduce chance of crashes
  const minimalOptions = {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox", 
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run"
    ],
    ignoreHTTPSErrors: true,
    timeout: 15000,
    protocolTimeout: 15000,
    dumpio: false,
  }

  // Only set executablePath if we found a valid Chrome installation
  if (chromePath) {
    return {
      ...minimalOptions,
      executablePath: chromePath,
    }
  }

  return minimalOptions
}

/**
 * Validates Chrome installation with a more thorough test
 * @returns Boolean indicating if Chrome is working properly
 */
export async function validateChromeInstallation(): Promise<boolean> {
  try {
    const puppeteer = await import("puppeteer")
    const options = getChromeOptions()
    
    console.log("Validating Chrome installation with options:", JSON.stringify(options, null, 2))
    
    const browser = await puppeteer.default.launch(options)
    
    // Create a page and test basic functionality
    const page = await browser.newPage()
    await page.setContent("<html><body><h1>Chrome Test</h1></body></html>")
    
    // Test getting the page title instead of screenshot (less resource intensive)
    const title = await page.title()
    console.log(`Chrome validation page title: "${title}"`)
    
    await browser.close()
    console.log("✓ Chrome validation successful")
    return true
  } catch (error) {
    console.error("✗ Chrome validation failed:", error)
    
    // Provide more specific error guidance
    if (error instanceof Error) {
      if (error.message.includes("Target closed") || error.message.includes("ProtocolError")) {
        console.error("Suggestion: Chrome may be crashing due to insufficient resources or incompatible flags")
        console.error("Try reducing Chrome flags or increasing container memory")
      } else if (error.message.includes("Browser was not found")) {
        console.error("Suggestion: Chrome executable not found at expected paths")
      }
    }
    
    return false
  }
}
