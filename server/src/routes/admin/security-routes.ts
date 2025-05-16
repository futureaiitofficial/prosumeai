import { Router } from 'express';
import { requireAdmin } from '../../../middleware/admin';
import { 
  getEncryptionConfig, 
  updateEncryptionConfig, 
  setEncryptionEnabled,
  logEncryptionStatus
} from '../../../middleware/data-encryption';
import { rotateEncryptionKeys } from '../../../utils/encryption';
import { appSettings } from '@shared/schema';
import { db } from '../../../config/db';
import { eq } from 'drizzle-orm';
import { loadSessionConfig, saveSessionConfig, SessionConfig } from '../../../middleware/session-security';

const router = Router();

/**
 * Security settings routes for admin dashboard
 */


// Encryption status debug endpoint
router.get('/encryption/status', requireAdmin, logEncryptionStatus, async (req, res) => {
  try {
    const config = getEncryptionConfig();
    
    // Get encryption key settings
    const [encryptionKeySettings] = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, 'encryption_key'))
      .limit(1);
      
    const keyData = encryptionKeySettings?.value;
    const hasEncryptionKey = !!keyData;
      
    res.json({
      message: 'Encryption status check',
      enabled: config.enabled,
      hasEncryptionKey,
      modelConfigs: config.config
    });
  } catch (error) {
    console.error('Error checking encryption status:', error);
    res.status(500).json({ message: 'Failed to check encryption status' });
  }
});

// Get encryption configuration and status
router.get('/encryption', requireAdmin, async (req, res) => {
  try {
    const config = getEncryptionConfig();
    res.json(config);
  } catch (error) {
    console.error('Error getting encryption configuration:', error);
    res.status(500).json({ message: 'Failed to get encryption configuration' });
  }
});

// Update data encryption configuration
router.put('/encryption/config', requireAdmin, async (req, res) => {
  try {
    const config = req.body.config;
    if (!config) {
      return res.status(400).json({ message: 'Configuration data is required' });
    }
    
    await updateEncryptionConfig(config);
    res.json({ message: 'Encryption configuration updated successfully' });
  } catch (error) {
    console.error('Error updating encryption configuration:', error);
    res.status(500).json({ message: 'Failed to update encryption configuration' });
  }
});

// Enable or disable encryption
router.post('/encryption/toggle', requireAdmin, async (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ message: 'Enabled status is required (boolean)' });
    }
    
    await setEncryptionEnabled(enabled);
    res.json({ 
      message: `Encryption ${enabled ? 'enabled' : 'disabled'} successfully`,
      enabled 
    });
  } catch (error) {
    console.error('Error toggling encryption:', error);
    res.status(500).json({ message: 'Failed to toggle encryption' });
  }
});

// Rotate encryption keys
router.post('/encryption/rotate-keys', requireAdmin, async (req, res) => {
  try {
    await rotateEncryptionKeys();
    res.json({ message: 'Encryption keys rotated successfully' });
  } catch (error) {
    console.error('Error rotating encryption keys:', error);
    res.status(500).json({ message: 'Failed to rotate encryption keys' });
  }
});

// Get password policy settings
router.get('/password-policy', requireAdmin, async (req, res) => {
  try {
    const [setting] = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, 'password_policy'))
      .limit(1);
    
    if (!setting) {
      return res.status(404).json({ message: 'Password policy settings not found' });
    }
    
    res.json(setting.value);
  } catch (error) {
    console.error('Error getting password policy:', error);
    res.status(500).json({ message: 'Failed to get password policy' });
  }
});

// Update password policy settings
router.put('/password-policy', requireAdmin, async (req, res) => {
  try {
    const policy = req.body;
    if (!policy) {
      return res.status(400).json({ message: 'Password policy data is required' });
    }
    
    await db.update(appSettings)
      .set({
        value: policy,
        updatedAt: new Date()
      })
      .where(eq(appSettings.key, 'password_policy'));
    
    res.json({ message: 'Password policy updated successfully' });
  } catch (error) {
    console.error('Error updating password policy:', error);
    res.status(500).json({ message: 'Failed to update password policy' });
  }
});

// Get session configuration settings
router.get('/session-config', requireAdmin, async (req, res) => {
  try {
    // Use our new loadSessionConfig function instead of direct DB access
    const sessionConfig = await loadSessionConfig();
    
    if (!sessionConfig) {
      return res.status(404).json({ message: 'Session configuration not found' });
    }
    
    res.json(sessionConfig);
  } catch (error) {
    console.error('Error getting session configuration:', error);
    res.status(500).json({ message: 'Failed to get session configuration' });
  }
});

// Update session configuration settings
router.put('/session-config', requireAdmin, async (req, res) => {
  try {
    const config = req.body as Partial<SessionConfig>;
    if (!config) {
      return res.status(400).json({ message: 'Session configuration data is required' });
    }
    
    // Validate configuration values
    if (config.maxAge !== undefined && (typeof config.maxAge !== 'number' || config.maxAge < 60000)) {
      return res.status(400).json({ message: 'maxAge must be a number greater than 60000 ms (1 minute)' });
    }
    
    if (config.inactivityTimeout !== undefined && (typeof config.inactivityTimeout !== 'number' || config.inactivityTimeout < 60000)) {
      return res.status(400).json({ message: 'inactivityTimeout must be a number greater than 60000 ms (1 minute)' });
    }
    
    // Save using our new saveSessionConfig function
    await saveSessionConfig(config);
    
    res.json({ 
      message: 'Session configuration updated successfully',
      note: 'Changes to session timeouts will be applied immediately to all new requests'
    });
  } catch (error) {
    console.error('Error updating session configuration:', error);
    res.status(500).json({ message: 'Failed to update session configuration' });
  }
});

// Get all security settings in one call
router.get('/all', requireAdmin, async (req, res) => {
  try {
    const securitySettings = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.category, 'security'));
    
    const settings = securitySettings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>);
    
    res.json(settings);
  } catch (error) {
    console.error('Error getting security settings:', error);
    res.status(500).json({ message: 'Failed to get security settings' });
  }
});

// Session security debug endpoint
router.get('/session-status', requireAdmin, async (req, res) => {
  try {
    const sessionConfig = await loadSessionConfig();
    
    // Get session info from the request
    const sessionInfo = {
      id: req.sessionID,
      cookie: req.session?.cookie,
      lastActivity: (req.session as any)?.lastActivity,
      createdAt: (req.session as any)?.createdAt,
      currentTime: Date.now()
    };
    
    // Calculate time remaining
    const timeRemaining = {
      maxAge: req.session?.cookie?.maxAge,
      inactivityTimeout: sessionConfig.inactivityTimeout - (Date.now() - ((req.session as any)?.lastActivity || Date.now())),
      absoluteTimeout: sessionConfig.absoluteTimeout - (Date.now() - ((req.session as any)?.createdAt || Date.now())),
    };
    
    res.json({
      sessionInfo,
      sessionConfig,
      timeRemaining,
      debug: {
        isAuthenticated: req.isAuthenticated(),
        user: req.user ? `${req.user.username} (ID: ${req.user.id})` : 'Not authenticated'
      }
    });
  } catch (error) {
    console.error('Error checking session status:', error);
    res.status(500).json({ message: 'Failed to check session status' });
  }
});

export default router; 