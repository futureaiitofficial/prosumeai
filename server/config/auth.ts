import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(
  providedPassword: string,
  storedPassword: string
) {
  const [hashedPassword, salt] = storedPassword.split(".");
  const hashedBuffer = Buffer.from(hashedPassword, "hex");
  const derivedKey = (await scryptAsync(providedPassword, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuffer, derivedKey);
}

export function setupAuth(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET || "prosume-secret-key";
  
  // Configure more robust session settings
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'lax' as 'lax', // Explicitly set SameSite
      path: '/' // Ensure cookie is available across the entire site
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Attempt to authenticate user: ${username}`);
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.log(`Authentication failed: User ${username} not found`);
          return done(null, false);
        }
        
        const passwordMatch = await comparePasswords(password, user.password);
        if (!passwordMatch) {
          console.log(`Authentication failed: Invalid password for ${username}`);
          return done(null, false);
        }
        
        console.log(`User authenticated successfully: ${username} (ID: ${user.id})`);
        return done(null, user);
      } catch (error) {
        console.error(`Authentication error for ${username}:`, error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    console.log(`Serializing user to session: ${user.username} (ID: ${user.id})`);
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log(`Deserializing user from session ID: ${id}`);
      const user = await storage.getUser(id);
      
      if (!user) {
        console.log(`Deserialization failed: User with ID ${id} not found`);
        return done(new Error(`User with ID ${id} not found`));
      }
      
      console.log(`User deserialized successfully: ${user.username} (ID: ${user.id})`);
      done(null, user);
    } catch (error) {
      console.error(`Deserialization error for user ID ${id}:`, error);
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUsername = await storage.getUserByUsername(req.body.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        const { password, ...userData } = user;
        console.log(`New user registered and logged in: ${user.username} (ID: ${user.id})`);
        res.status(201).json(userData);
      });
    } catch (error) {
      console.error("Registration error:", error);
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      req.login(user, (err) => {
        if (err) {
          console.error("Session login error:", err);
          return next(err);
        }
        
        const { password, ...userData } = user;
        console.log(`User logged in: ${user.username} (ID: ${user.id})`);
        
        // Set session cookie more explicitly
        if (req.session) {
          // Don't try to add custom properties to session
          // Just save the session to ensure cookie is set
          req.session.save((err) => {
            if (err) {
              console.error("Error saving session:", err);
            }
          });
        }
        
        res.status(200).json(userData);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    const userId = req.user?.id;
    const username = req.user?.username;
    
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return next(err);
      }
      
      // Destroy the session completely
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
          return next(err);
        }
        
        console.log(`User logged out: ${username} (ID: ${userId})`);
        res.sendStatus(200);
      });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      console.log("Unauthenticated request to /api/user");
      return res.sendStatus(401);
    }
    
    console.log(`Current authenticated user: ${req.user.username} (ID: ${req.user.id})`);
    const { password, ...userData } = req.user;
    res.json(userData);
  });
  
  // Add a debug endpoint to check session status
  app.get("/api/debug/session", (req, res) => {
    res.json({
      isAuthenticated: req.isAuthenticated(),
      user: req.user ? { 
        id: req.user.id, 
        username: req.user.username,
        email: req.user.email 
      } : null,
      sessionID: req.sessionID,
      // Don't expose the full session for security reasons
      sessionExists: !!req.session
    });
  });
}
