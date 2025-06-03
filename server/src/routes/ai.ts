import express from 'express';
import { truncateText } from '../../openai';
import { ApiKeyService } from '../utils/ai-key-service';
import { OpenAIApi, parseResume as aiParseResume } from '../../openai';  // Import the parseResume function from openai.ts
import { db } from '../../config/db';
import { eq, sql, and } from 'drizzle-orm';
import { featureUsage, features } from '@shared/schema';
import { requireUser } from '../../middleware/auth';
import { requireFeatureAccess, trackFeatureUsage } from '../../middleware/feature-access';
import { planFeatures } from '@shared/schema';
import { extractDocumentText } from '../../simple-parser'; // Import the extractDocumentText function
import { extractSkills, generateSkillsForPosition } from '../utils/ai-resume-utils-new'; // Import AI utility functions
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Use latest model for AI calls
const MODEL = "gpt-4o"; // Using same model as in ai-resume-utils.ts

/**
 * Helper function to clean and format bullet points
 */
function formatBulletPoint(text: string): string {
  // Remove quotes, trim whitespace, remove existing bullet points
  let cleaned = text.replace(/^["']|["']$/g, '').trim().replace(/^[-•*]\s+/, '');
  
  // Ensure proper ending punctuation
  if (!/[.!?]$/.test(cleaned)) {
    if (cleaned.endsWith(',')) {
      cleaned = cleaned.slice(0, -1) + '.';
    } else {
      cleaned = cleaned + '.';
    }
  }
  
  // Add consistent bullet point format
  return `• ${cleaned}`;
}

/**
 * Extracts important keywords and skills from a job description
 */
export async function extractKeywordsFromJobDescription(
  jobDescription: string
): Promise<string[]> {
  try {
    // If job description is empty, return empty array
    if (!jobDescription || jobDescription.trim() === '') {
      return [];
    }

    // Validate input length
    if (jobDescription.length < 50) {
      console.warn('Job description too short for reliable keyword extraction');
      return [];
    }

    const prompt = `
As an expert resume ATS analyst, extract ONLY high-value professional keywords that would significantly impact ATS scoring.

CRITICAL EXTRACTION CRITERIA:
1. Extract ONLY skills, technologies, tools, and qualifications that would appear in a resume
2. EXCLUDE: company names, job titles, locations, generic phrases, and non-skill requirements
3. PRIORITIZE: specific technical skills, software/tools, certifications, and concrete abilities
4. FORMAT: Standard resume terminology (e.g., "JavaScript" not "javascript coding")
5. FOCUS: Keywords that ATS systems specifically scan for in resumes
6. QUALITY over QUANTITY: Extract 10-15 high-impact keywords rather than many low-value ones

EXCLUDE these categories:
- Company names and proper nouns (except technologies/tools)
- Job titles and role descriptions
- Geographic locations
- Years of experience requirements
- Degree levels (extract field of study instead)
- Generic soft skills without specificity
- Action verbs and job responsibilities
- Benefits and compensation mentions

INCLUDE these categories:
- Programming languages and frameworks
- Software applications and tools
- Technical methodologies and processes
- Industry-specific skills and knowledge
- Certifications and professional qualifications
- Specific hard skills and competencies
- Measurable capabilities

Return ONLY a clean list of 10-15 high-impact keywords, one per line.
No explanations, categories, or formatting.

Job Description:
${truncateText(jobDescription, 2000)}
`;

    try {
      const response = await OpenAIApi.chat({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.1, // Lower temperature for more consistent results
      });

      if (!response.choices || response.choices.length === 0) {
        console.error('OpenAI API returned empty choices array');
        return [];
      }

      const content = response.choices[0]?.message?.content?.trim() || "";
      
      if (!content) {
        console.warn('OpenAI returned empty content for keyword extraction');
        return [];
      }

      // Split by newlines and clean up each keyword
      let keywords = content
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .map((line: string) => {
          // Remove any numbering, bullets, or extra formatting
          return line.replace(/^\d+\.?\s*/, '').replace(/^[-•*]\s*/, '').trim();
        });

      // Additional post-processing for quality control
      keywords = keywords.filter(skill => {
        const lowerSkill = skill.toLowerCase();
        
        // Filter out patterns that indicate non-skills
        const invalidPatterns = [
          // Experience and temporal requirements
          /\d+\+?\s*(years?|months?)\s*(of\s*)?(experience|exp)/i,
          /experience\s*(in|with|of)/i,
          /minimum\s*\d+\s*years?/i,
          
          // Educational requirements
          /bachelor'?s?\s*(degree|in)/i,
          /master'?s?\s*(degree|in)/i,
          /degree\s*in/i,
          
          // Generic phrases
          /ability\s*to/i,
          /knowledge\s*of/i,
          /understanding\s*of/i,
          /experience\s*with/i,
          /familiarity\s*with/i,
          /working\s*knowledge/i,
          
          // Company and location indicators
          /based\s*in/i,
          /located\s*in/i,
          /\b(inc|llc|corp|ltd|company)\b/i,
          
          // Job logistics
          /full[- ]?time/i,
          /part[- ]?time/i,
          /remote/i,
          /hybrid/i,
          /on[- ]?site/i,
          
          // Overly generic terms
          /^(team|work|job|role|position|company|business)$/i,
          /^(good|great|excellent|strong|solid)$/i,
          /^(skills?|requirements?|qualifications?)$/i
        ];
        
        // Check if skill matches any invalid pattern
        if (invalidPatterns.some(pattern => pattern.test(skill))) {
          return false;
        }
        
        // Filter by length and content
        if (
          skill.length < 2 || // Too short
          skill.length > 50 || // Too long to be a single skill
          lowerSkill.split(' ').length > 5 || // Too many words
          /^\d+$/.test(skill) || // Just a number
          /^[^a-zA-Z]*$/.test(skill) // No letters
        ) {
          return false;
        }
        
        return true;
      });

      // Remove duplicates and normalize
      const uniqueKeywords = Array.from(new Set(
        keywords.map(keyword => {
          // Normalize common variations
          let normalized = keyword.trim();
          
          // Handle common technology name variations
          const normalizations: { [key: string]: string } = {
            'js': 'JavaScript',
            'javascript': 'JavaScript',
            'ts': 'TypeScript',
            'typescript': 'TypeScript',
            'py': 'Python',
            'python': 'Python',
            'node': 'Node.js',
            'nodejs': 'Node.js',
            'node.js': 'Node.js',
            'react': 'React',
            'reactjs': 'React',
            'angular': 'Angular',
            'angularjs': 'Angular',
            'vue': 'Vue.js',
            'vuejs': 'Vue.js',
            'css3': 'CSS',
            'html5': 'HTML',
            'sql': 'SQL',
            'mysql': 'MySQL',
            'postgresql': 'PostgreSQL',
            'postgres': 'PostgreSQL',
            'aws': 'AWS',
            'amazon web services': 'AWS',
            'azure': 'Microsoft Azure',
            'gcp': 'Google Cloud Platform',
            'google cloud': 'Google Cloud Platform'
          };
          
          const normalizedLower = normalized.toLowerCase();
          if (normalizations[normalizedLower]) {
            normalized = normalizations[normalizedLower];
          } else {
            // Capitalize first letter of each word for consistency
            normalized = normalized.split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');
          }
          
          return normalized;
        })
      ));

      // Limit to reasonable number of keywords for ATS scoring
      return uniqueKeywords.slice(0, 20);

    } catch (apiError: any) {
      console.error('OpenAI API Error in keyword extraction:', apiError.message);
      
      if (apiError.status === 401) {
        throw new Error('Authentication error: Invalid API key or token. Please check your OPENAI_API_KEY.');
      } else if (apiError.status === 429) {
        throw new Error('Rate limit exceeded or quota exceeded on your OpenAI account.');
      } else if (apiError.status === 500) {
        throw new Error('OpenAI server error. Please try again later.');
      }
      
      throw apiError;
    }
  } catch (error: any) {
    console.error('Error extracting keywords:', error);
    throw new Error(`Failed to extract keywords: ${error.message}`);
  }
}

/**
 * Analyzes a job description and categorizes keywords with improved quality and error handling
 */
export async function analyzeJobDescription(
  jobDescription: string
): Promise<{
  technicalSkills: string[];
  softSkills: string[];
  education: string[];
  responsibilities: string[];
  industryTerms: string[];
  tools: string[];
  certifications: string[];
}> {
  try {
    // Validate input
    if (!jobDescription || jobDescription.trim() === '') {
      return {
        technicalSkills: [],
        softSkills: [],
        education: [],
        responsibilities: [],
        industryTerms: [],
        tools: [],
        certifications: []
      };
    }

    // Check for minimum content length for meaningful analysis
    if (jobDescription.trim().length < 100) {
      console.warn('Job description too short for detailed analysis');
      // Try basic keyword extraction as fallback
      const basicKeywords = await extractKeywordsFromJobDescription(jobDescription);
      return {
        technicalSkills: basicKeywords.slice(0, 5),
        softSkills: [],
        education: [],
        responsibilities: [],
        industryTerms: [],
        tools: [],
        certifications: []
      };
    }

    const prompt = `
As a professional ATS optimization expert, categorize skills and qualifications from this job description for resume optimization.

CATEGORIZATION GUIDELINES:

1. technicalSkills: Programming languages, methodologies, frameworks, and hard technical abilities
   Examples: JavaScript, Python, Machine Learning, Data Analysis, REST APIs, Agile, DevOps, SQL

2. tools: Specific software, platforms, applications, and development tools
   Examples: React, AWS, Docker, Figma, Salesforce, JIRA, Excel, Git, Jenkins

3. softSkills: Interpersonal abilities and professional traits (only specific, measurable ones)
   Examples: Leadership, Project Management, Communication, Problem Solving, Team Collaboration

4. certifications: Professional certifications, licenses, and formal credentials
   Examples: AWS Solutions Architect, PMP, Scrum Master, CPA, Security+, Google Analytics

5. education: Academic requirements and educational qualifications
   Examples: Computer Science, Engineering, Business Administration, Statistics

6. industryTerms: Domain-specific knowledge areas and business concepts
   Examples: Supply Chain, Healthcare Compliance, Financial Services, E-commerce, SaaS

7. responsibilities: Key job functions and duties (for context, not for resume skills)
   Examples: Code Review, System Architecture, Customer Support, Budget Management

QUALITY CRITERIA:
- Extract ONLY terms that could legitimately appear in a resume skills section
- Use standard industry terminology and proper capitalization
- Avoid generic phrases, company names, and job titles
- Focus on specific, searchable keywords that ATS systems target
- Prioritize skills over general concepts
- Limit each category to the most impactful 5-10 items

Format response as valid JSON with arrays for each category.

Job Description:
${truncateText(jobDescription, 2500)}
`;

    try {
      const response = await OpenAIApi.chat({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1200,
        temperature: 0.1, // Lower temperature for more consistent categorization
        response_format: { type: "json_object" }
      });

      if (!response.choices || response.choices.length === 0) {
        console.error('OpenAI API returned empty choices array');
        throw new Error('API Error: No response choices returned');
      }

      const content = response.choices[0]?.message?.content?.trim() || "{}";
      
      if (!content) {
        throw new Error('OpenAI returned empty content');
      }

      // Parse and validate the JSON response
      let parsedResult: any;
      try {
        // Clean up the content in case it contains markdown or other formatting
        let cleanedContent = content;
        
        // Remove markdown code blocks if present
        if (cleanedContent.includes('```')) {
          const codeBlockMatch = cleanedContent.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (codeBlockMatch && codeBlockMatch[1]) {
            cleanedContent = codeBlockMatch[1].trim();
          }
        }
        
        // Ensure we have valid JSON structure
        if (!cleanedContent.startsWith('{')) {
          cleanedContent = '{}';
        }
        
        parsedResult = JSON.parse(cleanedContent);
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.log('Raw content:', content);
        
        // Fallback to basic keyword extraction
        const fallbackKeywords = await extractKeywordsFromJobDescription(jobDescription);
        return categorizeKeywordsBasic(fallbackKeywords);
      }
      
      // Validate and clean each category
      const cleanCategory = (items: any[]): string[] => {
        if (!Array.isArray(items)) return [];
        
        return items
          .filter(item => typeof item === 'string' && item.trim().length > 0)
          .map(item => item.trim())
          .filter(item => {
            // Additional filtering for quality
            const lowerItem = item.toLowerCase();
            return (
              item.length >= 2 && 
              item.length <= 50 &&
              !lowerItem.includes('experience with') &&
              !lowerItem.includes('knowledge of') &&
              !lowerItem.includes('ability to') &&
              !/\d+\+?\s*years?/i.test(item) &&
              !/degree in/i.test(item)
            );
          })
          .slice(0, 10); // Limit each category
      };
      
      // Process and validate all categories
      const result = {
        technicalSkills: cleanCategory(parsedResult.technicalSkills || []),
        softSkills: cleanCategory(parsedResult.softSkills || []),
        education: cleanCategory(parsedResult.education || []),
        responsibilities: cleanCategory(parsedResult.responsibilities || []),
        industryTerms: cleanCategory(parsedResult.industryTerms || []),
        tools: cleanCategory(parsedResult.tools || []),
        certifications: cleanCategory(parsedResult.certifications || [])
      };
      
      // Quality check: if we got very few results, supplement with fallback
      const totalExtracted = Object.values(result).reduce((sum, arr) => sum + arr.length, 0);
      
      if (totalExtracted < 5) {
        console.warn('AI extraction yielded few results, supplementing with fallback');
        const fallbackKeywords = await extractKeywordsFromJobDescription(jobDescription);
        const fallbackCategorized = categorizeKeywordsBasic(fallbackKeywords);
        
        // Merge results, prioritizing AI results but filling gaps
        Object.keys(result).forEach(key => {
          const typedKey = key as keyof typeof result;
          if (result[typedKey].length === 0 && fallbackCategorized[typedKey].length > 0) {
            result[typedKey] = fallbackCategorized[typedKey];
          }
        });
      }
      
      return result;
      
    } catch (apiError: any) {
      console.error('OpenAI API Error in job analysis:', apiError);
      
      if (apiError.status === 401) {
        throw new Error('Authentication error: Invalid API key or token. Please check your OPENAI_API_KEY.');
      } else if (apiError.status === 429) {
        throw new Error('Rate limit exceeded or quota exceeded on your OpenAI account.');
      } else if (apiError.status === 500) {
        throw new Error('OpenAI server error. Please try again later.');
      }
      
      // Fallback to basic extraction on API errors
      console.log('Falling back to basic keyword extraction due to API error');
      const fallbackKeywords = await extractKeywordsFromJobDescription(jobDescription);
      return categorizeKeywordsBasic(fallbackKeywords);
    }
  } catch (error: any) {
    console.error('Error analyzing job description:', error);
    
    // Final fallback - return basic categorization
    try {
      const fallbackKeywords = await extractKeywordsFromJobDescription(jobDescription);
      return categorizeKeywordsBasic(fallbackKeywords);
    } catch (fallbackError) {
      console.error('Fallback extraction also failed:', fallbackError);
      // Return empty structure as last resort
      return {
        technicalSkills: [],
        softSkills: [],
        education: [],
        responsibilities: [],
        industryTerms: [],
        tools: [],
        certifications: []
      };
    }
  }
}

/**
 * Basic keyword categorization as fallback when AI fails
 */
function categorizeKeywordsBasic(keywords: string[]): {
  technicalSkills: string[];
  softSkills: string[];
  education: string[];
  responsibilities: string[];
  industryTerms: string[];
  tools: string[];
  certifications: string[];
} {
  const technicalPatterns = [
    /\b(javascript|python|java|c\+\+|c#|php|ruby|go|swift|kotlin|rust|scala)\b/i,
    /\b(react|angular|vue|node|express|django|spring|laravel)\b/i,
    /\b(sql|nosql|mongodb|mysql|postgresql|redis|elasticsearch)\b/i,
    /\b(html|css|sass|less|bootstrap|tailwind)\b/i,
    /\b(api|rest|graphql|soap|microservices|devops|cicd)\b/i,
    /\b(machine learning|ai|artificial intelligence|data science|analytics)\b/i,
    /\b(agile|scrum|kanban|waterfall|lean)\b/i
  ];
  
  const toolPatterns = [
    /\b(aws|azure|google cloud|gcp|docker|kubernetes|terraform)\b/i,
    /\b(git|github|gitlab|bitbucket|jenkins|travis|circleci)\b/i,
    /\b(jira|confluence|slack|teams|zoom)\b/i,
    /\b(excel|powerpoint|word|outlook|sharepoint)\b/i,
    /\b(photoshop|illustrator|figma|sketch|canva)\b/i,
    /\b(salesforce|hubspot|zendesk|freshworks)\b/i
  ];
  
  const softSkillPatterns = [
    /\b(leadership|management|communication|collaboration)\b/i,
    /\b(problem solving|critical thinking|analytical)\b/i,
    /\b(project management|time management|organization)\b/i,
    /\b(creativity|innovation|adaptability|flexibility)\b/i
  ];
  
  const certificationPatterns = [
    /\b(aws certified|azure certified|google certified)\b/i,
    /\b(pmp|scrum master|product owner|csm|cpo)\b/i,
    /\b(cissp|security\+|network\+|ceh)\b/i,
    /\b(cpa|cfa|frm|phr|sphr)\b/i
  ];
  
  const result = {
    technicalSkills: [] as string[],
    softSkills: [] as string[],
    education: [] as string[],
    responsibilities: [] as string[],
    industryTerms: [] as string[],
    tools: [] as string[],
    certifications: [] as string[]
  };
  
  keywords.forEach(keyword => {
    const lowerKeyword = keyword.toLowerCase();
    
    if (certificationPatterns.some(pattern => pattern.test(keyword))) {
      result.certifications.push(keyword);
    } else if (technicalPatterns.some(pattern => pattern.test(keyword))) {
      result.technicalSkills.push(keyword);
    } else if (toolPatterns.some(pattern => pattern.test(keyword))) {
      result.tools.push(keyword);
    } else if (softSkillPatterns.some(pattern => pattern.test(keyword))) {
      result.softSkills.push(keyword);
    } else {
      // Default to industry terms for unmatched keywords
      result.industryTerms.push(keyword);
    }
  });
  
  return result;
}

/**
 * Tracks token usage for AI operations by a specific user
 * @param userId The user ID to track usage for
 * @param featureCode The feature code (must match a code in the features table)
 * @param tokensUsed The number of tokens used in this operation
 * @returns The updated or created feature usage record, or null if an error occurred
 */
async function trackTokenUsage(
  userId: number, 
  featureCode: string, 
  tokensUsed: number
): Promise<typeof featureUsage.$inferSelect | null> {
  try {
    // First, fetch the feature ID for the given feature code
    const featureResult = await db.select({ id: features.id })
      .from(features)
      .where(eq(features.code, featureCode))
      .limit(1);

    // If feature doesn't exist, log an error and return
    if (!featureResult.length) {
      console.error(`Feature with code '${featureCode}' not found for token usage tracking`);
      return null;
    }

    const featureId = featureResult[0].id;
    
    // Check if featureId is valid (not 0, undefined, or null)
    if (!featureId) {
      console.error(`Invalid feature ID for feature code '${featureCode}'`);
      return null;
    }

    // Now insert/update with the correct feature ID
    const existingUsage = await db.select({
      id: featureUsage.id,
      userId: featureUsage.userId,
      featureId: featureUsage.featureId,
      aiTokenCount: featureUsage.aiTokenCount
    })
      .from(featureUsage)
      .where(and(
        eq(featureUsage.userId, userId),
        eq(featureUsage.featureId, featureId)
      ))
      .limit(1);

    if (existingUsage.length) {
      // Update existing usage record
      const updated = await db.update(featureUsage)
        .set({
          aiTokenCount: sql`${featureUsage.aiTokenCount} + ${tokensUsed}`,
          lastUsed: new Date()
        })
        .where(eq(featureUsage.id, existingUsage[0].id))
        .returning();
      
      return updated[0] || null;
    } else {
      // Create new usage record with correct feature ID
      const inserted = await db.insert(featureUsage)
        .values({
          userId: userId,
          featureId: featureId,
          aiTokenCount: tokensUsed,
          usageCount: 0,
          lastUsed: new Date(),
          resetDate: new Date()
        })
        .returning();
      
      return inserted[0] || null;
    }
  } catch (error) {
    console.error('Error tracking token usage:', error);
    return null;
  }
}

// Create router
const router = express.Router();

// Add any AI-related routes here
router.post('/extract-keywords', 
  requireUser,
  requireFeatureAccess('ai_generation'),
  trackFeatureUsage('ai_generation'),
  async (req, res) => {
    try {
      const { jobDescription } = req.body;
      
      if (!jobDescription) {
        return res.status(400).json({ 
          message: 'Job description is required',
          error: 'MISSING_JOB_DESCRIPTION'
        });
      }
      
      try {
        const keywords = await extractKeywordsFromJobDescription(jobDescription);
        
        // Track token usage for AI-specific metrics
        if (req.isAuthenticated && req.isAuthenticated() && req.user) {
          const tokensUsed = 350; // Estimate tokens used
          try {
            await trackTokenUsage(req.user.id, 'ai_generation', tokensUsed);
          } catch (tokenError) {
            console.error('Error tracking token usage:', tokenError);
            // Continue with the response even if token tracking fails
          }
        }
        
        return res.json({ keywords });
      } catch (error: any) {
        console.error('Error extracting keywords:', error);
        
        // Provide more specific error response based on error type
        if (error.message.includes('API key')) {
          return res.status(500).json({ 
            message: 'OpenAI API key configuration error. Please contact support.',
            error: 'API_KEY_ERROR'
          });
        } else if (error.message.includes('Rate limit')) {
          return res.status(429).json({ 
            message: 'OpenAI API rate limit exceeded. Please try again later.',
            error: 'RATE_LIMIT'
          });
        }
        
        return res.status(500).json({ 
          message: 'Failed to extract keywords. Please try again.',
          error: 'EXTRACTION_ERROR'
        });
      }
    } catch (error: any) {
      console.error('Error in extract-keywords route:', error);
      return res.status(500).json({ 
        message: 'Internal server error processing your request',
        error: 'SERVER_ERROR'
      });
    }
});

// Add analyze-job-description route
router.post('/analyze-job-description', 
  requireUser,
  requireFeatureAccess('ai_generation'),
  trackFeatureUsage('ai_generation'),
  async (req, res) => {
    try {
      const { jobDescription } = req.body;
      
      if (!jobDescription) {
        return res.status(400).json({ 
          message: 'Job description is required',
          error: 'MISSING_JOB_DESCRIPTION'
        });
      }

      // Check if the job description is too long
      const MAX_DESCRIPTION_LENGTH = 5000;
      if (jobDescription.length > MAX_DESCRIPTION_LENGTH) {
        return res.status(400).json({
          message: `Job description is too long (${jobDescription.length} characters). Maximum length is ${MAX_DESCRIPTION_LENGTH} characters.`,
          error: 'DESCRIPTION_TOO_LONG'
        });
      }

      // Check token usage BEFORE making the API call
      if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        try {
          // Get current usage to check against limits
          const userId = req.user.id;
          const feature = await db.select()
            .from(features)
            .where(eq(features.code, 'ai_generation'))
            .limit(1);

          if (feature.length === 0) {
            return res.status(500).json({
              message: 'Feature configuration error. Please contact support.',
              error: 'FEATURE_NOT_FOUND'
            });
          }

          const featureId = feature[0].id;
          
          const usage = await db.select()
            .from(featureUsage)
            .where(and(
              eq(featureUsage.userId, userId),
              eq(featureUsage.featureId, featureId)
            ))
            .limit(1);
          
          // Check if user has enough tokens available
          if (usage.length > 0) {
            const currentUsage = usage[0].aiTokenCount || 0;
            
            // Safely get token limit from associated plan feature (via an additional query)
            const planFeature = await db.select({ limitValue: planFeatures.limitValue })
              .from(planFeatures)
              .where(eq(planFeatures.featureId, featureId))
              .limit(1);
            
            const tokenLimit = planFeature.length > 0 ? (planFeature[0].limitValue || 0) : 0;
            const estimatedTokens = 1000; // Estimate tokens for analyze job
            
            if (tokenLimit > 0 && currentUsage + estimatedTokens > tokenLimit) {
              return res.status(429).json({
                message: 'You have reached your token usage limit. Please try again later or upgrade your plan.',
                error: 'TOKEN_LIMIT_EXCEEDED',
                currentUsage,
                tokenLimit
              });
            }
          }
        } catch (tokenCheckError) {
          console.error('Error checking token usage:', tokenCheckError);
          // Continue processing but log the error
        }
      }
      
      try {
        // Note: Feature usage tracking is now handled by the middleware
        const result = await analyzeJobDescription(jobDescription);
        
        // Validate the result to ensure it contains expected data
        if (!result || typeof result !== 'object') {
          throw new Error('Invalid response format from AI service');
        }

        // Ensure all categories exist
        const expectedCategories = [
          'technicalSkills', 'softSkills', 'education', 
          'responsibilities', 'industryTerms', 'tools', 'certifications'
        ];
        
        const validatedResult: any = {};
        expectedCategories.forEach(category => {
          validatedResult[category] = Array.isArray(result[category as keyof typeof result]) 
            ? result[category as keyof typeof result] 
            : [];
        });
        
        // Track token usage for AI-specific metrics
        if (req.isAuthenticated && req.isAuthenticated() && req.user) {
          const tokensUsed = 1000; // Estimate tokens used
          try {
            await trackTokenUsage(req.user.id, 'ai_generation', tokensUsed);
          } catch (tokenError) {
            console.error('Error tracking token usage:', tokenError);
            // Continue with the response even if token tracking fails
          }
        }
        
        return res.json(validatedResult);
      } catch (error: any) {
        console.error('Error analyzing job description:', error);
        
        // Provide more specific error response based on error type
        if (error.message.includes('API key')) {
          return res.status(500).json({ 
            message: 'OpenAI API key configuration error. Please contact support.',
            error: 'API_KEY_ERROR'
          });
        } else if (error.message.includes('Rate limit')) {
          return res.status(429).json({ 
            message: 'OpenAI API rate limit exceeded. Please try again later.',
            error: 'RATE_LIMIT'
          });
        } else if (error.message.includes('token')) {
          return res.status(429).json({
            message: 'Token usage limit exceeded. Please try again later or upgrade your plan.',
            error: 'TOKEN_LIMIT_EXCEEDED'
          });
        }
        
        return res.status(500).json({ 
          message: 'Failed to analyze job description. Please try again.',
          error: 'ANALYSIS_ERROR'
        });
      }
    } catch (error: any) {
      console.error('Error in analyze-job-description route:', error);
      return res.status(500).json({ 
        message: 'Internal server error processing your request',
        error: 'SERVER_ERROR'
      });
    }
});

// General content generation route
router.post('/generate', 
  requireUser,
  requireFeatureAccess('ai_generation'),
  trackFeatureUsage('ai_generation'),
  async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ 
          message: 'Prompt is required',
          error: 'MISSING_PROMPT'
        });
      }
      
      try {
        // Determine if this is a cover letter request
        const isCoverLetterRequest = prompt.toLowerCase().includes('cover letter') || 
                                   prompt.toLowerCase().includes('position at');
        
        // Configure system message based on request type
        let systemMessage;
        if (isCoverLetterRequest) {
          systemMessage = `You are an expert career coach who specializes in writing personalized, persuasive cover letters. 
Follow these critical guidelines when generating cover letter content:
1. NEVER include a header with contact information
2. NEVER include a greeting/salutation line (like "Dear Hiring Manager")
3. NEVER include any closing phrases (like "Sincerely" or "Best regards")
4. NEVER include a signature line with the applicant's name at the end
5. NEVER use placeholders like [Your Name], [Company Address], etc.
6. Use the EXACT personal details provided in the prompt, not placeholders
7. Start directly with the first paragraph of the body content
8. End with the last paragraph of the body content without signature

Your response should ONLY contain the body paragraphs that would go between the greeting and signature in a traditional cover letter.`;
        } else {
          systemMessage = "You are a helpful assistant that provides high-quality, accurate content based on user requests.";
        }

        const response = await OpenAIApi.chat({
          model: MODEL,
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        });

        if (!response.choices || response.choices.length === 0) {
          throw new Error('API Error: No response choices returned');
        }

        const content = response.choices[0]?.message?.content?.trim() || "";
        
        // Track token usage for AI-specific metrics
        if (req.isAuthenticated && req.isAuthenticated() && req.user) {
          const tokensUsed = response.usage?.total_tokens || 0;
          // Always use ai_generation feature code for all AI operations
          try {
            await trackTokenUsage(req.user.id, 'ai_generation', tokensUsed);
          } catch (tokenError) {
            console.error('Error tracking token usage:', tokenError);
            // Continue with the response even if token tracking fails
          }
        }
        
        return res.json({ content });
      } catch (error: any) {
        console.error('Error generating content:', error);
        
        // Provide more specific error response based on error type
        if (error.message.includes('API key')) {
          return res.status(500).json({ 
            message: 'OpenAI API key configuration error. Please contact support.',
            error: 'API_KEY_ERROR'
          });
        } else if (error.message.includes('Rate limit')) {
          return res.status(429).json({ 
            message: 'OpenAI API rate limit exceeded. Please try again later.',
            error: 'RATE_LIMIT'
          });
        }
        
        return res.status(500).json({ 
          message: 'Failed to generate content. Please try again.',
          error: 'GENERATION_ERROR'
        });
      }
    } catch (error: any) {
      console.error('Error in generate route:', error);
      return res.status(500).json({ 
        message: 'Internal server error processing your request',
        error: 'SERVER_ERROR'
      });
    }
});

// Add route to enhance experience bullets
router.post('/enhance-experience', 
  requireUser,
  requireFeatureAccess('ai_generation'),
  trackFeatureUsage('ai_generation'),
  async (req, res) => {
    try {
      const { 
        jobTitle, 
        jobDescription, 
        experienceItem,
        existingSkills,
        missingKeywords,
        optimizationTarget 
      } = req.body;
      
      if (!jobTitle || !jobDescription || !experienceItem) {
        return res.status(400).json({ 
          message: 'Job title, description, and experience information are required',
          error: 'MISSING_REQUIRED_DATA'
        });
      }
      
      try {
        const { position, company, description, achievements } = experienceItem;
        
        // Prepare the experience context
        const experienceContext = {
          position,
          company,
          description
        };
        
        // Extract existing content from achievements
        const existingContent = Array.isArray(achievements) && achievements.length > 0
          ? achievements.join('\n')
          : description || '';
          
        // Extract keywords from job description for better matching
        const keywordsResult = await analyzeJobDescription(jobDescription);
        const jobKeywords = [
          ...keywordsResult.technicalSkills,
          ...keywordsResult.softSkills,
          ...keywordsResult.tools
        ];
        
        // If we have missing keywords from ATS analysis, prioritize those
        const priorityKeywords = Array.isArray(missingKeywords) && missingKeywords.length > 0
          ? missingKeywords
          : jobKeywords;
        
        // Determine how closely the positions align
        const positionLower = position?.toLowerCase() || '';
        const jobTitleLower = jobTitle?.toLowerCase() || '';
        
        // Calculate overlap between position and target job title
        const positionWords = positionLower.split(/\s+/).filter((word: string) => word.length > 3);
        const jobTitleWords = jobTitleLower.split(/\s+/).filter((word: string) => word.length > 3);
        
        let overlapCount = 0;
        for (const word of positionWords) {
          if (jobTitleWords.includes(word)) {
            overlapCount++;
          }
        }
        
        // Calculate percentage of matching significant words
        const positionWordCount = Math.max(1, positionWords.length);
        const jobTitleWordCount = Math.max(1, jobTitleWords.length);
        const overlapPercentage = Math.min(
          (overlapCount / positionWordCount) * 100,
          (overlapCount / jobTitleWordCount) * 100
        );
        
        // Based on overlap percentage, determine if it's a career change
        const isCareerChange = overlapPercentage < 30;
        
        // Generate appropriate prompt
        let prompt = '';
        if (isCareerChange) {
          prompt = `
As an expert resume writer, create 3-5 authentic bullet points for a career transition.

CURRENT ROLE: ${position} at ${company}
TARGET POSITION: ${jobTitle}

PRIORITY KEYWORDS TO INCORPORATE (where authentic and applicable):
${priorityKeywords.join(', ')}

OPTIMIZATION STRATEGY: ${optimizationTarget || "balance keywords naturally"}

⚠️ CRITICAL INSTRUCTIONS ⚠️
These positions are in different career fields. You must:
1. Write bullet points that HONESTLY reflect work done as a ${position} at ${company} ONLY
2. Focus on REAL achievements and responsibilities from the ${position} role
3. DO NOT fabricate skills or experience that wouldn't be part of a ${position} role
4. DO NOT write as if the person has worked in the target role or target company
5. Mention skills that naturally transfer to ${jobTitle} ONLY if authentic
6. Strategically incorporate 1-2 priority keywords per bullet point, but ONLY if they genuinely apply
7. Quantify achievements with numbers/percentages where appropriate
8. Balance keyword optimization with authentic experience description
9. Each bullet point should be CONCISE (15-25 words) and follow this format:
   "[Action verb] [what you did] by [how you did it], resulting in [measurable outcome with metrics]"
10. DO NOT use quotation marks around bullet points
11. Ensure each bullet point is a COMPLETE SENTENCE that ends with proper punctuation

For example:
• Spearheaded research projects by implementing agile methodologies, reducing development cycles by 25% and increasing stakeholder satisfaction.
• Overhauled customer service protocols through data-driven analysis, resulting in 42% improvement in resolution rates.

Keep each bullet point concise, specific, achievement-focused, and starting with a strong action verb.
Return ONLY the bullet points with no explanations.

Current Content:
${truncateText(existingContent, 300)}
`;
        } else {
          const alignmentLevel = overlapPercentage > 70 ? "highly similar" : 
                                overlapPercentage > 50 ? "related" : 
                                "somewhat related";
          
          prompt = `
You are an expert resume writer enhancing work experience for a ${alignmentLevel} position.

CURRENT ROLE: ${position} at ${company}
TARGET POSITION: ${jobTitle}

Job Description:
${truncateText(jobDescription, 800)}

PRIORITY ATS KEYWORDS TO INCORPORATE:
${priorityKeywords.join(', ')}

OPTIMIZATION STRATEGY: ${optimizationTarget || "balance keywords naturally"}

⚠️ CRITICAL INSTRUCTIONS ⚠️
1. Write authentic bullet points that accurately represent responsibilities as a ${position} at ${company} ONLY
2. Emphasize aspects of ${position} that naturally relate to ${jobTitle}
3. NEVER suggest the person already worked at the target company or in the target role
4. Strategically incorporate 1-2 relevant keywords per bullet point
5. Include metrics and quantifiable achievements where possible (percentages, numbers)
6. Begin each bullet with a strong action verb (achieved, delivered, implemented, etc.)
7. DO NOT fabricate experiences that wouldn't be part of the ${position} role
8. Balance ATS keyword optimization with natural, readable language
9. Each bullet point should be CONCISE (15-25 words) and follow this format:
   "[Action verb] [what you did] by [how you did it], resulting in [measurable outcome with metrics]"
10. DO NOT use quotation marks around bullet points
11. Ensure each bullet point is a COMPLETE SENTENCE that ends with proper punctuation

For example:
• Spearheaded research projects by implementing agile methodologies, reducing development cycles by 25% and increasing stakeholder satisfaction.
• Overhauled customer service protocols through data-driven analysis, resulting in 42% improvement in resolution rates.

Create 3-5 powerful bullet points that are concise, specific, and achievement-focused.
Format your response as a list of bullet points only, with no additional text.

Current Content:
${truncateText(existingContent, 300)}
`;
        }
        
        // Call OpenAI to generate the enhanced bullets
        const response = await OpenAIApi.chat({
          model: MODEL,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
          temperature: 0.7,
        });
        
        if (!response.choices || response.choices.length === 0) {
          throw new Error('API Error: No response choices returned');
        }
        
        // Process the response to extract bullet points
        const content = response.choices[0]?.message?.content?.trim() || "";
        
        // Split by newlines and clean up each bullet point
        const bullets = content
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .map(line => formatBulletPoint(line))
          // Enforce maximum bullet point length (truncate to last complete word)
          .map(bullet => {
            const MAX_BULLET_LENGTH = 160; // Reduced from 200 for more concise bullets
            if (bullet.length <= MAX_BULLET_LENGTH) return bullet;
            
            // Try to find the last sentence boundary
            const truncated = bullet.substring(0, MAX_BULLET_LENGTH);
            const lastSentenceEnd = Math.max(
              truncated.lastIndexOf('. '),
              truncated.lastIndexOf('? '),
              truncated.lastIndexOf('! ')
            );
            
            if (lastSentenceEnd > MAX_BULLET_LENGTH * 0.7) {
              // If we found a sentence boundary that's at least 70% into the text
              return formatBulletPoint(bullet.substring(0, lastSentenceEnd + 1));
            }
            
            // Truncate at the last word boundary
            const lastSpaceIndex = truncated.lastIndexOf(' ');
            if (lastSpaceIndex > 0) {
              return formatBulletPoint(bullet.substring(0, lastSpaceIndex));
            }
            
            return bullet.substring(0, MAX_BULLET_LENGTH);
          });
        
        // Track token usage for AI-specific metrics
        if (req.isAuthenticated && req.isAuthenticated() && req.user) {
          const tokensUsed = response.usage?.total_tokens || 500;
          try {
            await trackTokenUsage(req.user.id, 'ai_generation', tokensUsed);
          } catch (tokenError) {
            console.error('Error tracking token usage:', tokenError);
          }
        }
        
        return res.json({ enhancedBullets: bullets });
      } catch (error: any) {
        console.error('Error enhancing experience bullets:', error);
        
        // Provide more specific error response based on error type
        if (error.message.includes('API key')) {
          return res.status(500).json({ 
            message: 'OpenAI API key configuration error. Please contact support.',
            error: 'API_KEY_ERROR'
          });
        } else if (error.message.includes('Rate limit')) {
          return res.status(429).json({ 
            message: 'OpenAI API rate limit exceeded. Please try again later.',
            error: 'RATE_LIMIT'
          });
        }
        
        return res.status(500).json({ 
          message: 'Failed to enhance experience bullets. Please try again.',
          error: 'ENHANCEMENT_ERROR'
        });
      }
    } catch (error: any) {
      console.error('Error in enhance-experience route:', error);
      return res.status(500).json({ 
        message: 'Internal server error processing your request',
        error: 'SERVER_ERROR'
      });
    }
});

// Parse resume from uploaded file
router.post('/parse-resume', 
  requireUser,
  requireFeatureAccess('ai_generation'),
  trackFeatureUsage('ai_generation'),
  async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // Set up temporary storage for the uploaded file
      const tempDir = path.join(os.tmpdir(), 'resume-uploads');
      // Ensure the directory exists
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Set up storage configuration
      const storage = multer.diskStorage({
        destination: (req: any, file: any, cb: any) => {
          cb(null, tempDir);
        },
        filename: (req: any, file: any, cb: any) => {
          // Use unique filename to avoid collisions
          const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
          cb(null, uniqueName);
        }
      });
      
      // Set up multer to handle file upload with size limit
      const upload = multer({
        storage: storage,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
        fileFilter: (req: any, file: any, cb: any) => {
          // Accept docx files
          const ext = path.extname(file.originalname).toLowerCase();
          if (ext !== '.docx' && ext !== '.pdf' && ext !== '.doc' && ext !== '.txt') {
            return cb(new Error('Only .docx, .pdf, .doc, and .txt files are supported'), false);
          }
          cb(null, true);
        }
      }).single('resume');
      
      // Handle file upload using promise wrapper
      const uploadPromise = new Promise((resolve, reject) => {
        upload(req, res, (err: any) => {
          if (err) {
            console.error('File upload error:', err);
            reject(err);
          } else {
            resolve(req.file);
          }
        });
      });
      
      try {
        // Wait for file to be uploaded
        const file: any = await uploadPromise;
        
        // If no file was uploaded, return an error
        if (!file) {
          return res.status(400).json({ 
            message: "No file was uploaded.", 
            error: "MISSING_FILE" 
          });
        }
        
        console.log(`File uploaded to ${file.path}. Parsing resume...`);
        
        try {
          // First use the simple parser to extract text from the document
          const extractedText = await extractDocumentText(file.path);
          
          if (!extractedText || extractedText.trim().length === 0) {
            throw new Error("Could not extract text from document. The file may be corrupted or password-protected.");
          }
          
          // Use the OpenAI-based parser on the extracted text
          const resumeData = await aiParseResume(extractedText);
          
          // Clean up the temporary file after parsing
          fs.unlinkSync(file.path);
          
          // Track token usage for AI-specific metrics
          if (req.isAuthenticated() && req.user) {
            // Approximate token usage for sophisticated parsing
            const estimatedTokens = Math.min(extractedText.length / 4, 10000);
            await trackTokenUsage(req.user.id, 'ai_generation', estimatedTokens);
          }
          
          return res.json(resumeData);
        } catch (parseError: any) {
          // Clean up the file
          if (file?.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
          
          // Handle specific OpenAI error types
          if (parseError.name === 'AuthenticationError' || 
              (parseError.error && parseError.error.type === 'invalid_request_error') ||
              parseError.message.includes('API key')) {
            console.error('OpenAI API key error:', parseError);
            return res.status(503).json({
              message: "AI service configuration error. Please contact an administrator to set up the OpenAI API key.",
              error: "API_CONFIGURATION_ERROR"
            });
          }
          
          // Handle rate limits
          if (parseError.status === 429 || parseError.message.includes('rate limit')) {
            return res.status(429).json({
              message: "AI service is currently overloaded. Please try again in a few minutes.",
              error: "RATE_LIMIT_EXCEEDED"
            });
          }
          
          // Re-throw for general error handler
          throw parseError;
        }
      } catch (uploadError: any) {
        // Handle multer/upload specific errors
        if (uploadError.message.includes('Only .docx')) {
          return res.status(400).json({ 
            message: "Only .docx, .pdf, .doc, and .txt files are supported", 
            error: "UNSUPPORTED_FILE_TYPE" 
          });
        } else if (uploadError.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            message: "File size limit exceeded (max 5MB)", 
            error: "FILE_TOO_LARGE" 
          });
        }
        
        throw uploadError; // Re-throw for general error handler
      }
    } catch (error: any) {
      console.error('Error parsing resume:', error);
      
      // For known OpenAI-related errors that might have been re-thrown
      if (error.name === 'AuthenticationError' || error.message.includes('API key')) {
        return res.status(503).json({
          message: "AI service is not properly configured. Please contact support.",
          error: "AI_SERVICE_ERROR"
        });
      }
      
      return res.status(500).json({ 
        message: "Failed to parse resume: " + (error.message || "Unknown error"), 
        error: "PARSING_ERROR" 
      });
    }
  }
);

// Extract skills with custom categories
router.post('/extract-skills-comprehensive', 
  requireUser,
  requireFeatureAccess('ai_generation'),
  trackFeatureUsage('ai_generation'),
  async (req, res) => {
    try {
      const { jobTitle, jobDescription, customCategories } = req.body;
      
      if (!jobTitle || !jobDescription) {
        return res.status(400).json({ 
          message: 'Job title and description are required',
          error: 'MISSING_REQUIRED_DATA'
        });
      }
      
      console.log('Extracting skills with custom categories:', customCategories);
      
      // Default categories if none provided
      const categories = customCategories && customCategories.length > 0 
        ? customCategories 
        : ['Technical Skills', 'Soft Skills', 'Tools', 'Programming Languages'];
      
      const prompt = `
You are an expert resume ATS specialist. Extract relevant skills from the following job description for a "${jobTitle}" position and categorize them into the specified categories.

Job Description:
${truncateText(jobDescription, 2000)}

CATEGORIES TO USE:
${categories.map((cat: string) => `- ${cat}`).join('\n')}

Please categorize the skills you find into the above categories. If a category doesn't have any relevant skills, include an empty array.

Format your response as a JSON object with category names as keys and arrays of skills as values.

IMPORTANT:
- Extract only skills that are explicitly mentioned or strongly implied in the job description
- Use exact keywords from the job description where possible
- Each skill should be 1-3 words maximum
- Include 5-10 skills per category when possible
- Be specific (e.g., "React.js" not just "frontend")

Example format:
{
  "Technical Skills": ["JavaScript", "Python", "REST APIs"],
  "Tools": ["Docker", "AWS", "Git"],
  "Programming Languages": ["Python", "JavaScript", "SQL"],
  "Soft Skills": ["Communication", "Leadership", "Problem Solving"]
}

Do not include explanations, just the JSON object.
`;

      const response = await OpenAIApi.chat({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.5,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content?.trim() || "{}";
      const categorizedSkills = JSON.parse(content);
      
      // Clean and validate the categorized skills
      const cleanedSkills: { [category: string]: string[] } = {};
      categories.forEach((category: string) => {
        const skills = categorizedSkills[category] || [];
        if (Array.isArray(skills)) {
          cleanedSkills[category] = skills
            .filter((skill: any) => typeof skill === 'string' && skill.trim().length > 0)
            .map((skill: string) => skill.trim())
            .slice(0, 10); // Limit to 10 skills per category
        } else {
          cleanedSkills[category] = [];
        }
      });

      // Track token usage
      if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        const tokensUsed = response.usage?.total_tokens || 400;
        try {
          await trackTokenUsage(req.user.id, 'ai_generation', tokensUsed);
        } catch (tokenError) {
          console.error('Error tracking token usage:', tokenError);
        }
      }

      res.json({ categorizedSkills: cleanedSkills });
    } catch (error) {
      console.error('Error extracting skills with categories:', error);
      res.status(500).json({ 
        message: 'Failed to extract skills with custom categories',
        error: 'SKILL_EXTRACTION_ERROR'
      });
    }
  }
);

// Generate skills with custom categories
router.post('/generate-skills-comprehensive', 
  requireUser,
  requireFeatureAccess('ai_generation'),
  trackFeatureUsage('ai_generation'),
  async (req, res) => {
    try {
      const { jobTitle, customCategories } = req.body;
      
      if (!jobTitle) {
        return res.status(400).json({ 
          message: 'Job title is required',
          error: 'MISSING_REQUIRED_DATA'
        });
      }
      
      console.log('Generating skills with custom categories:', customCategories);
      
      // Default categories if none provided
      const categories = customCategories && customCategories.length > 0 
        ? customCategories 
        : ['Technical Skills', 'Soft Skills', 'Tools', 'Programming Languages'];
      
      const prompt = `
You are an expert resume ATS specialist. Generate relevant skills that would be expected for a "${jobTitle}" position and categorize them into the specified categories.

CATEGORIES TO USE:
${categories.map((cat: string) => `- ${cat}`).join('\n')}

Please generate skills that would be relevant for this job role and categorize them into the above categories. If a category doesn't apply to this role, include an empty array.

Format your response as a JSON object with category names as keys and arrays of skills as values.

IMPORTANT:
- Include specific technical skills relevant to this job position
- Include industry-standard terminology for this role
- Be precise and focus on skills that would actually appear in job descriptions
- Include both fundamental and advanced skills for this role
- Each skill should be 1-3 words maximum
- Include 6-12 skills per relevant category

Example format:
{
  "Programming Languages": ["JavaScript", "Python", "TypeScript"],
  "Tools": ["Docker", "AWS", "Git", "Jenkins"],
  "Technical Skills": ["REST APIs", "Database Design", "CI/CD"],
  "Soft Skills": ["Communication", "Leadership", "Problem Solving"]
}

Do not include explanations, just the JSON object.
`;

      const response = await OpenAIApi.chat({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.5,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content?.trim() || "{}";
      const categorizedSkills = JSON.parse(content);
      
      // Clean and validate the categorized skills
      const cleanedSkills: { [category: string]: string[] } = {};
      categories.forEach((category: string) => {
        const skills = categorizedSkills[category] || [];
        if (Array.isArray(skills)) {
          cleanedSkills[category] = skills
            .filter((skill: any) => typeof skill === 'string' && skill.trim().length > 0)
            .map((skill: string) => skill.trim())
            .slice(0, 12); // Limit to 12 skills per category
        } else {
          cleanedSkills[category] = [];
        }
      });

      // Track token usage
      if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        const tokensUsed = response.usage?.total_tokens || 400;
        try {
          await trackTokenUsage(req.user.id, 'ai_generation', tokensUsed);
        } catch (tokenError) {
          console.error('Error tracking token usage:', tokenError);
        }
      }

      res.json({ categorizedSkills: cleanedSkills });
    } catch (error) {
      console.error('Error generating skills with categories:', error);
      res.status(500).json({ 
        message: 'Failed to generate skills with custom categories',
        error: 'SKILL_GENERATION_ERROR'
      });
    }
  }
);

// Update existing extract-skills endpoint to support custom categories
router.post('/extract-skills', 
  requireUser,
  requireFeatureAccess('ai_generation'),
  trackFeatureUsage('ai_generation'),
  async (req, res) => {
    try {
      const { jobTitle, jobDescription, customCategories } = req.body;
      
      if (!jobTitle || !jobDescription) {
        return res.status(400).json({ 
          message: 'Job title and description are required',
          error: 'MISSING_REQUIRED_DATA'
        });
      }
      
      console.log('Extracting skills (legacy format) with custom categories:', customCategories);
      
      // Use the enhanced categorized extraction
      if (customCategories && customCategories.length > 0) {
        const categories = customCategories;
        
        const prompt = `
You are an expert resume ATS specialist. Extract relevant skills from the following job description for a "${jobTitle}" position and provide both traditional categorization and custom categorization.

Job Description:
${truncateText(jobDescription, 2000)}

CUSTOM CATEGORIES:
${categories.map((cat: string) => `- ${cat}`).join('\n')}

Please provide skills in both formats:
1. Traditional format (technicalSkills and softSkills)
2. Custom categorized format

Format your response as a JSON object with both formats:

{
  "technicalSkills": ["skill1", "skill2"],
  "softSkills": ["skill1", "skill2"],
  "categorizedSkills": {
    "CustomCategory1": ["skill1", "skill2"],
    "CustomCategory2": ["skill1", "skill2"]
  }
}

IMPORTANT:
- Extract only skills explicitly mentioned in the job description
- Use exact keywords where possible
- Include 8-12 skills total in traditional categories
- Distribute skills appropriately across custom categories
- Be specific and relevant

Do not include explanations, just the JSON object.
`;

        const response = await OpenAIApi.chat({
          model: MODEL,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 700,
          temperature: 0.5,
          response_format: { type: "json_object" }
        });

        const content = response.choices[0]?.message?.content?.trim() || "{}";
        const result = JSON.parse(content);
        
        // Clean the results
        const cleanedResult = {
          technicalSkills: (result.technicalSkills || []).slice(0, 12),
          softSkills: (result.softSkills || []).slice(0, 8),
          categorizedSkills: result.categorizedSkills || {}
        };

        // Track token usage
        if (req.isAuthenticated && req.isAuthenticated() && req.user) {
          const tokensUsed = response.usage?.total_tokens || 400;
          try {
            await trackTokenUsage(req.user.id, 'ai_generation', tokensUsed);
          } catch (tokenError) {
            console.error('Error tracking token usage:', tokenError);
          }
        }

        return res.json(cleanedResult);
      }
      
      // Fallback to original implementation for backward compatibility
      try {
        const extractedSkills = await extractSkills(jobTitle, jobDescription);
        res.json(extractedSkills);
      } catch (fallbackError) {
        // If the extractSkills function doesn't exist, create a basic response
        console.error('extractSkills function not available, using basic response:', fallbackError);
        res.json({ 
          technicalSkills: [], 
          softSkills: [],
          categorizedSkills: {
            "Technical Skills": [],
            "Soft Skills": []
          }
        });
      }
    } catch (error) {
      console.error('Error extracting skills:', error);
      res.status(500).json({ 
        message: 'Failed to extract skills from job description',
        error: 'SKILL_EXTRACTION_ERROR'
      });
    }
  }
);

// Update existing generate-position-skills endpoint to support custom categories
router.post('/generate-position-skills', 
  requireUser,
  requireFeatureAccess('ai_generation'),
  trackFeatureUsage('ai_generation'),
  async (req, res) => {
    try {
      const { jobTitle, customCategories } = req.body;
      
      if (!jobTitle) {
        return res.status(400).json({ 
          message: 'Job title is required',
          error: 'MISSING_REQUIRED_DATA'
        });
      }
      
      console.log('Generating position skills (legacy format) with custom categories:', customCategories);
      
      // Use the enhanced categorized generation
      if (customCategories && customCategories.length > 0) {
        const categories = customCategories;
        
        const prompt = `
You are an expert resume ATS specialist. Generate relevant skills for a "${jobTitle}" position and provide both traditional categorization and custom categorization.

CUSTOM CATEGORIES:
${categories.map((cat: string) => `- ${cat}`).join('\n')}

Please provide skills in both formats:
1. Traditional format (technicalSkills and softSkills)
2. Custom categorized format

Format your response as a JSON object with both formats:

{
  "technicalSkills": ["skill1", "skill2"],
  "softSkills": ["skill1", "skill2"],
  "categorizedSkills": {
    "CustomCategory1": ["skill1", "skill2"],
    "CustomCategory2": ["skill1", "skill2"]
  }
}

IMPORTANT:
- Include specific technical skills relevant to this job position
- Include industry-standard terminology for this role
- Include both fundamental and advanced skills
- Be precise and focus on skills that actually appear in job descriptions
- Include 8-12 skills total in traditional categories
- Distribute skills appropriately across custom categories

Do not include explanations, just the JSON object.
`;

        const response = await OpenAIApi.chat({
          model: MODEL,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 700,
          temperature: 0.5,
          response_format: { type: "json_object" }
        });

        const content = response.choices[0]?.message?.content?.trim() || "{}";
        const result = JSON.parse(content);
        
        // Clean the results
        const cleanedResult = {
          technicalSkills: (result.technicalSkills || []).slice(0, 12),
          softSkills: (result.softSkills || []).slice(0, 8),
          categorizedSkills: result.categorizedSkills || {}
        };

        // Track token usage
        if (req.isAuthenticated && req.isAuthenticated() && req.user) {
          const tokensUsed = response.usage?.total_tokens || 400;
          try {
            await trackTokenUsage(req.user.id, 'ai_generation', tokensUsed);
          } catch (tokenError) {
            console.error('Error tracking token usage:', tokenError);
          }
        }

        return res.json(cleanedResult);
      }
      
      // Fallback to original implementation for backward compatibility
      try {
        const generatedSkills = await generateSkillsForPosition(jobTitle);
        res.json(generatedSkills);
      } catch (fallbackError) {
        // If the generateSkillsForPosition function doesn't exist, create a basic response
        console.error('generateSkillsForPosition function not available, using basic response:', fallbackError);
        res.json({ 
          technicalSkills: [], 
          softSkills: [],
          categorizedSkills: {
            "Technical Skills": [],
            "Soft Skills": []
          }
        });
      }
    } catch (error) {
      console.error('Error generating position skills:', error);
      res.status(500).json({ 
        message: 'Failed to generate skills for job position',
        error: 'SKILL_GENERATION_ERROR'
      });
    }
  }
);

export default router; 