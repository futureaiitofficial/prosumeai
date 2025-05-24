/**
 * Utilities for device identification and management
 */

/**
 * Generate a unique device identifier based on browser and device information
 * This is intentionally not using fingerprinting techniques that would
 * require user consent, but creates a reasonably unique identifier
 * for trusted device recognition.
 * 
 * @returns A string identifier for the current device
 */
export function generateDeviceId(): string {
  const navigatorInfo = [
    navigator.userAgent,
    navigator.language,
    navigator.hardwareConcurrency,
    navigator.platform,
    screen.colorDepth,
    screen.width,
    screen.height,
    screen.availWidth,
    screen.availHeight,
    new Date().getTimezoneOffset()
  ].join('|');
  
  // Create a hash from the navigator info
  let hash = 0;
  for (let i = 0; i < navigatorInfo.length; i++) {
    const char = navigatorInfo.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to a hex string
  const hashString = Math.abs(hash).toString(16);
  
  // Add a random part for additional entropy
  const randomPart = Math.random().toString(36).substring(2, 10);
  
  return `${hashString}-${randomPart}`;
}

/**
 * Store the device identifier in local storage
 * @param deviceId The device identifier to store
 */
export function storeDeviceId(deviceId: string): void {
  try {
    localStorage.setItem('device_id', deviceId);
  } catch (error) {
    console.error('Error storing device ID:', error);
  }
}

/**
 * Retrieve the device identifier from local storage
 * @returns The stored device identifier or null if not found
 */
export function retrieveDeviceId(): string | null {
  try {
    return localStorage.getItem('device_id');
  } catch (error) {
    console.error('Error retrieving device ID:', error);
    return null;
  }
}

/**
 * Get the device identifier, generating and storing one if needed
 * @returns A device identifier string
 */
export function getOrCreateDeviceId(): string {
  const existingId = retrieveDeviceId();
  if (existingId) {
    return existingId;
  }
  
  const newId = generateDeviceId();
  storeDeviceId(newId);
  return newId;
}

export default {
  generateDeviceId,
  storeDeviceId,
  retrieveDeviceId,
  getOrCreateDeviceId
}; 