import { Express, Request, Response, NextFunction } from "express";
import { TwoFactorService } from "server/services/two-factor-service";
import { getAppName } from "server/services/settings-service";

/**
 * Middleware to check if 2FA is required but not set up
 */
export const checkTwoFactorRequired = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.isAuthenticated() || !req.user) {
    return next();
  }

  try {
    const twoFactorRequired = await TwoFactorService.isTwoFactorRequired(
      req.user.id,
      req.user.isAdmin
    );

    if (twoFactorRequired) {
      // Set a flag that can be checked by the client
      res.locals.twoFactorRequired = true;
    }

    next();
  } catch (error) {
    console.error("Error checking if 2FA is required:", error);
    next();
  }
};

/**
 * Register routes for user 2FA setup and verification
 * @param app Express application
 */
export function registerTwoFactorRoutes(app: Express) {
  // Middleware to inject 2FA requirement flag into responses
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Store the original send method
    const originalSend = res.send;

    // Override the send method
    res.send = function (body) {
      // Only modify JSON responses from specific endpoints
      const url = req.originalUrl;
      if (
        res.locals.twoFactorRequired &&
        res.statusCode === 200 &&
        (url === "/api/user" || url.startsWith("/api/user/"))
      ) {
        try {
          // If it's a JSON response, add the 2FA required flag
          const parsedBody =
            typeof body === "string" ? JSON.parse(body) : body;
          
          // Only add if it's an object
          if (typeof parsedBody === "object" && parsedBody !== null) {
            parsedBody.twoFactorRequired = true;
            return originalSend.call(this, JSON.stringify(parsedBody));
          }
        } catch (e) {
          // If there's an error parsing the JSON, just send the original response
          console.error("Error modifying response to add 2FA flag:", e);
        }
      }

      // Call the original send method
      return originalSend.call(this, body);
    };

    next();
  });

  /**
   * Get the current user's 2FA configuration
   */
  app.get("/api/two-factor/status", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const twoFactorConfig = await TwoFactorService.getUserTwoFactorConfig(req.user!.id);
      
      // Check if 2FA is required based on policy
      const isRequired = await TwoFactorService.isTwoFactorRequired(
        req.user!.id,
        req.user!.isAdmin
      );

      // Get app name for authenticator setup
      const appName = await getAppName();
      
      res.json({
        ...twoFactorConfig,
        required: isRequired,
        appName
      });
    } catch (error) {
      console.error("Error getting 2FA configuration:", error);
      res.status(500).json({
        error: "Failed to get 2FA configuration",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * Set up email-based 2FA
   */
  app.post("/api/two-factor/email/setup", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      // Get email from request body or user's email
      let email = req.body.email;
      
      // If email is not provided in request or doesn't appear to be valid, use user's email
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        email = req.user!.email;
      }

      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: "A valid email is required" });
      }

      // Set up email-based 2FA
      await TwoFactorService.setupEmailTwoFactor(req.user!.id, email);

      // Generate and send verification code
      const result = await TwoFactorService.generateAndSendEmailVerificationCode(
        req.user!.id,
        email // Explicitly pass the validated email
      );

      res.json(result);
    } catch (error) {
      console.error("Error setting up email 2FA:", error);
      res.status(500).json({
        error: "Failed to set up email 2FA",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * Generate and send a new verification code for email-based 2FA
   */
  app.post("/api/two-factor/email/send-code", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      // Get email from request body or user's email
      let email = req.body.email;
      
      // If email is not provided or doesn't look valid, it will be handled by the service
      // which will attempt to find the appropriate email to use
      // Generate and send verification code
      const result = await TwoFactorService.generateAndSendEmailVerificationCode(
        req.user!.id,
        email 
      );

      res.json(result);
    } catch (error) {
      console.error("Error sending 2FA code:", error);
      res.status(500).json({
        error: "Failed to send verification code",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * Verify email-based 2FA code to complete setup
   */
  app.post("/api/two-factor/email/verify", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({ error: "Verification code is required" });
      }

      // Verify the code
      const verified = await TwoFactorService.verifyEmailCode(
        req.user!.id,
        code
      );

      if (!verified) {
        return res.status(400).json({ error: "Invalid or expired verification code" });
      }

      res.json({
        success: true,
        message: "Email 2FA enabled successfully",
      });
    } catch (error) {
      console.error("Error verifying email code:", error);
      res.status(500).json({
        error: "Failed to verify email code",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * Set up authenticator app-based 2FA
   */
  app.post("/api/two-factor/authenticator/setup", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      // Get app name for authenticator app
      const appName = await getAppName();
      
      // Set up authenticator app-based 2FA
      const setupInfo = await TwoFactorService.setupAuthenticatorTwoFactor(
        req.user!.id,
        appName
      );

      res.json(setupInfo);
    } catch (error) {
      console.error("Error setting up authenticator 2FA:", error);
      res.status(500).json({
        error: "Failed to set up authenticator 2FA",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * Verify authenticator token to complete setup
   */
  app.post("/api/two-factor/authenticator/verify", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: "Verification token is required" });
      }

      // Verify the token
      const verified = await TwoFactorService.verifyAndEnableAuthenticator(
        req.user!.id,
        token
      );

      if (!verified) {
        return res.status(400).json({ error: "Invalid verification token" });
      }

      // Get backup codes
      const backupCodes = await TwoFactorService.getBackupCodes(req.user!.id);

      res.json({
        success: true,
        message: "Authenticator 2FA enabled successfully",
        backupCodes,
      });
    } catch (error) {
      console.error("Error verifying authenticator token:", error);
      res.status(500).json({
        error: "Failed to verify authenticator token",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * Get backup codes
   */
  app.get("/api/two-factor/backup-codes", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const codes = await TwoFactorService.getBackupCodes(req.user!.id);
      res.json(codes);
    } catch (error) {
      console.error("Error getting backup codes:", error);
      res.status(500).json({
        error: "Failed to get backup codes",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * Disable 2FA
   */
  app.post("/api/two-factor/disable", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      // Check if 2FA is required for this user
      const isRequired = await TwoFactorService.isTwoFactorRequired(
        req.user!.id,
        req.user!.isAdmin
      );

      if (isRequired) {
        return res.status(403).json({
          error: "Cannot disable 2FA",
          message: "Two-factor authentication is required by your organization's policy",
        });
      }

      // Disable 2FA
      await TwoFactorService.disableTwoFactor(req.user!.id);

      res.json({
        success: true,
        message: "Two-factor authentication disabled successfully",
      });
    } catch (error) {
      console.error("Error disabling 2FA:", error);
      res.status(500).json({
        error: "Failed to disable 2FA",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * Handle 2FA verification during login
   * This endpoint is called after regular authentication succeeds
   */
  app.post("/api/two-factor/verify", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { method, code, rememberDevice, deviceId } = req.body;

      // Check if 2FA is enabled for this user
      const isEnabled = await TwoFactorService.isEnabled(req.user!.id);
      if (!isEnabled) {
        // If 2FA is not enabled, just return success
        return res.json({
          success: true,
          message: "2FA not enabled for this user",
        });
      }

      // If device is remembered, verify the device token
      if (deviceId && req.cookies['2fa_remember']) {
        const remembered = await TwoFactorService.isDeviceRemembered(
          req.user!.id,
          deviceId,
          req.cookies['2fa_remember']
        );

        if (remembered) {
          return res.json({
            success: true,
            message: "Device is remembered, 2FA skipped",
          });
        }
      }

      if (!method || !code) {
        return res.status(400).json({
          error: "Missing required fields",
          message: "Method and code are required",
        });
      }

      let verified = false;

      // Verify based on method
      if (method === "EMAIL") {
        verified = await TwoFactorService.verifyEmailCode(req.user!.id, code);
      } else if (method === "AUTHENTICATOR_APP") {
        verified = await TwoFactorService.verifyAuthenticatorToken(
          req.user!.id,
          code
        );
      } else if (method === "BACKUP_CODE") {
        verified = await TwoFactorService.verifyBackupCode(req.user!.id, code);
      } else {
        return res.status(400).json({
          error: "Invalid method",
          message: "Method must be EMAIL, AUTHENTICATOR_APP, or BACKUP_CODE",
        });
      }

      if (!verified) {
        return res.status(400).json({
          error: "Verification failed",
          message: "Invalid or expired code",
        });
      }

      // If remember device is requested and device ID is provided
      if (rememberDevice && deviceId) {
        const rememberToken = await TwoFactorService.rememberDevice(
          req.user!.id,
          deviceId
        );

        // Get policy to know how long to remember
        const policy = await TwoFactorService.getPolicy();
        const maxAge = policy.rememberDeviceDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds

        // Set cookie to remember this device
        res.cookie("2fa_remember", rememberToken, {
          maxAge,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });
      }

      res.json({
        success: true,
        message: "2FA verification successful",
      });
    } catch (error) {
      console.error("Error verifying 2FA:", error);
      res.status(500).json({
        error: "Failed to verify 2FA",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
}

export default registerTwoFactorRoutes; 