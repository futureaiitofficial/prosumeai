import express from 'express';
import rateLimit from 'express-rate-limit';
import { requireUser } from '../../middleware/auth';
import { requireFeatureAccess, trackFeatureUsage } from '../../middleware/feature-access';
import { sanitizeAIInput, sanitizeAIResponse, validateAIResponseStructure, createSafeAIPrompt } from '../utils/ai-input-sanitizer';
import { analyzeJobDescription } from './ai';

const router = express.Router();

// Rate limiting for AI endpoints
const aiGeneralLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: { error: 'Too many AI requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiAnalysisLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 25, // 25 analysis requests per hour
  message: { error: 'Too many job analysis requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export function registerEnhancedAIRoutes(app: express.Express) {
  // Apply rate limiting to all AI routes
  app.use('/api/ai', aiGeneralLimit);

  // Enhanced analyze-job-description route
  app.post('/api/ai/analyze-job-description', 
    aiAnalysisLimit,
    requireUser,
    requireFeatureAccess('ai_generation'),
    trackFeatureUsage('ai_generation'),
    async (req, res) => {
      try {
        if (!req.user) {
          console.log('[SECURITY] AI Route UNAUTHORIZED_ACCESS_ATTEMPT: analyze-job-description');
          return res.status(401).json({ 
            message: 'Authentication required',
            error: 'UNAUTHORIZED'
          });
        }

        // Validate request body structure
        if (!req.body || typeof req.body !== 'object') {
          console.log('[SECURITY] AI Route INVALID_REQUEST_BODY');
          return res.status(400).json({
            message: 'Invalid request format',
            error: 'INVALID_REQUEST'
          });
        }

        // Sanitize input with comprehensive security checks
        let sanitizedInput;
        try {
          sanitizedInput = sanitizeAIInput(req.body);
        } catch (error: any) {
          if (error.message.includes('SECURITY_VIOLATION')) {
            console.log(`[SECURITY] AI Route INPUT_SANITIZATION_FAILED for user ${req.user.id}: ${error.message}`);
            return res.status(400).json({ 
              message: 'Invalid or potentially malicious input detected',
              error: 'SANITIZATION_FAILED'
            });
          }
          
          if (error.message.includes('VALIDATION_ERROR')) {
            return res.status(400).json({ 
              message: error.message.replace('VALIDATION_ERROR: ', ''),
              error: 'VALIDATION_FAILED'
            });
          }
          
          throw error;
        }

        // Log successful sanitization
        console.log(`[SECURITY] AI Route INPUT_SANITIZED successfully for user ${req.user.id}: ${sanitizedInput.jobDescription.length} chars`);

        // Create safe AI prompt
        let result;
        try {
          // Use the original analyzeJobDescription function but with sanitized input
          result = await analyzeJobDescription(sanitizedInput.jobDescription);
          
          if (!result || typeof result !== 'object') {
            throw new Error('Invalid AI response format');
          }

          // Validate response structure
          validateAIResponseStructure(result);
          
          // Sanitize the AI response before sending to client
          const sanitizedResult = sanitizeAIResponse(result);
          
          console.log(`[SECURITY] AI Route ANALYSIS_COMPLETED successfully for user ${req.user.id}`);
          
          return res.json(sanitizedResult);
          
        } catch (aiError: any) {
          console.error(`[SECURITY] AI Route ANALYSIS_ERROR for user ${req.user.id}:`, aiError.message);
          
          // Provide specific error responses based on error type
          if (aiError.message.includes('API key')) {
            return res.status(500).json({ 
              message: 'AI service configuration error. Please contact support.',
              error: 'API_KEY_ERROR'
            });
          } else if (aiError.message.includes('Rate limit')) {
            return res.status(429).json({ 
              message: 'AI service rate limit exceeded. Please try again later.',
              error: 'RATE_LIMIT'
            });
          } else if (aiError.message.includes('token')) {
            return res.status(429).json({
              message: 'Token usage limit exceeded. Please try again later or upgrade your plan.',
              error: 'TOKEN_LIMIT_EXCEEDED'
            });
          } else if (aiError.message.includes('VALIDATION_ERROR')) {
            return res.status(400).json({
              message: aiError.message.replace('VALIDATION_ERROR: ', ''),
              error: 'RESPONSE_VALIDATION_FAILED'
            });
          }
          
          return res.status(500).json({ 
            message: 'Failed to analyze job description. Please try again.',
            error: 'ANALYSIS_ERROR'
          });
        }
      } catch (error: any) {
        console.error(`[SECURITY] AI Route CRITICAL_ERROR for user ${req.user?.id}:`, error);
        return res.status(500).json({ 
          message: 'Internal server error processing your request',
          error: 'SERVER_ERROR'
        });
      }
    }
  );

  // Enhanced general AI generation route
  app.post('/api/ai/generate', 
    requireUser,
    requireFeatureAccess('ai_generation'),
    trackFeatureUsage('ai_generation'),
    async (req, res) => {
      try {
        if (!req.user) {
          console.log('[SECURITY] AI Route UNAUTHORIZED_ACCESS_ATTEMPT: generate');
          return res.status(401).json({ 
            message: 'Authentication required',
            error: 'UNAUTHORIZED'
          });
        }

        // Sanitize input for general AI prompts
        let sanitizedInput;
        try {
          sanitizedInput = sanitizeAIInput({ 
            jobDescription: req.body.prompt || '',
            prompt: req.body.prompt 
          });
        } catch (error: any) {
          if (error.message.includes('SECURITY_VIOLATION')) {
            console.log(`[SECURITY] AI Route PROMPT_SANITIZATION_FAILED for user ${req.user.id}: ${error.message}`);
            return res.status(400).json({ 
              message: 'Invalid or potentially malicious prompt detected',
              error: 'SANITIZATION_FAILED'
            });
          }
          
          return res.status(400).json({ 
            message: error.message.replace('VALIDATION_ERROR: ', ''),
            error: 'VALIDATION_FAILED'
          });
        }

        // For security, we'll limit the types of generation allowed
        const allowedGenerationTypes = [
          'cover_letter',
          'resume_summary', 
          'job_skills',
          'achievement_description'
        ];

        const prompt = sanitizedInput.prompt || sanitizedInput.jobDescription;
        
        // Detect generation type and ensure it's allowed
        const generationType = detectGenerationType(prompt);
        if (!allowedGenerationTypes.includes(generationType)) {
          console.log(`[SECURITY] AI Route DISALLOWED_GENERATION_TYPE for user ${req.user.id}: ${generationType}`);
          return res.status(400).json({
            message: 'This type of content generation is not supported for security reasons',
            error: 'UNSUPPORTED_GENERATION_TYPE'
          });
        }

        // Create a safe, templated prompt
        const safePrompt = createSafeGenerationPrompt(prompt, generationType);
        
        console.log(`[SECURITY] AI Route SAFE_GENERATION_STARTED for user ${req.user.id}: ${generationType}`);
        
        // For now, return a placeholder response - you would integrate with your actual AI service here
        const response = {
          content: `[Safe AI-generated content for ${generationType}]`,
          type: generationType,
          generated: true
        };

        const sanitizedResponse = sanitizeAIResponse(response);
        return res.json(sanitizedResponse);

      } catch (error: any) {
        console.error(`[SECURITY] AI Route GENERATION_ERROR for user ${req.user?.id}:`, error);
        return res.status(500).json({ 
          message: 'Failed to generate content. Please try again.',
          error: 'GENERATION_ERROR'
        });
      }
    }
  );

  // Health check endpoint for AI service
  app.get('/api/ai/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      service: 'AI Routes Enhanced',
      timestamp: new Date().toISOString(),
      security: 'enabled'
    });
  });
}

// Helper function to detect generation type from prompt
function detectGenerationType(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('cover letter') || lowerPrompt.includes('position at')) {
    return 'cover_letter';
  } else if (lowerPrompt.includes('resume summary') || lowerPrompt.includes('professional summary')) {
    return 'resume_summary';
  } else if (lowerPrompt.includes('skills') || lowerPrompt.includes('abilities')) {
    return 'job_skills';
  } else if (lowerPrompt.includes('achievement') || lowerPrompt.includes('accomplishment')) {
    return 'achievement_description';
  }
  
  return 'general';
}

// Helper function to create safe, templated prompts
function createSafeGenerationPrompt(userInput: string, type: string): string {
  const templates = {
    cover_letter: `Generate a professional cover letter section based on the following user input. Focus only on professional qualifications and experience. Do not include personal information, contact details, or inappropriate content.

User input: ${userInput}

Generate only the body paragraphs of a professional cover letter.`,

    resume_summary: `Generate a professional resume summary based on the following user input. Focus on professional skills, experience, and career objectives. Keep it concise and professional.

User input: ${userInput}

Generate a 2-3 sentence professional summary.`,

    job_skills: `List relevant job skills based on the following user input. Focus only on professional, technical, and transferable skills relevant to employment.

User input: ${userInput}

Generate a list of relevant professional skills.`,

    achievement_description: `Help describe a professional achievement based on the following user input. Focus on quantifiable results and professional impact.

User input: ${userInput}

Generate a professional achievement description.`,

    general: `Provide professional assistance based on the following user input. Focus only on career and professional development content.

User input: ${userInput}

Provide helpful, professional guidance.`
  };

  return templates[type as keyof typeof templates] || templates.general;
}

// Security monitoring function
export function logAISecurityEvent(userId: number, eventType: string, details: string) {
  const timestamp = new Date().toISOString();
  console.log(`[SECURITY] AI Route ${eventType} | User: ${userId} | Time: ${timestamp} | Details: ${details}`);
  
  // In production, you might want to send this to a security monitoring service
  // or write to a dedicated security log file
}

export default router; 