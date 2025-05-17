import express from 'express';
import { truncateText } from '../../openai';
import { ApiKeyService } from '../utils/ai-key-service';
import { OpenAIApi } from '../../openai';  // Import the named export
import { db } from '../../config/db';
import { eq, sql, and } from 'drizzle-orm';
import { featureUsage, features } from '@shared/schema';
import { requireUser } from '../../middleware/auth';
import { requireFeatureAccess, trackFeatureUsage } from '../../middleware/feature-access';

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

    const prompt = `
As an expert resume skills analyst, extract ONLY legitimate professional skills from this job description that would be appropriate to list in a resume's skills section.

IMPORTANT GUIDELINES:
1. Extract ONLY actual professional skills, competencies, and abilities
2. EXCLUDE company names, job titles, locations, and non-skill requirements
3. EXCLUDE generic phrases like "ability to" - extract just the skill itself
4. EXCLUDE vague descriptions that aren't specific skills
5. FOCUS on hard skills, technical abilities, and concrete soft skills
6. Ensure each skill is expressed in standard resume format (1-3 words typically)
7. Format skills consistently (e.g., "JavaScript" not "javascript", "Python" not "python coding")
8. Prioritize specific skills over general ones (e.g., "React" is better than "frontend development")
9. Include only skills that could legitimately appear in a skills section of a resume
10. Differentiate between tools/technologies and skills when appropriate

Return ONLY a list of 15-20 legitimate skills, with each on a new line.
No numbering, bullet points, categories, or explanations.

Job Description:
${truncateText(jobDescription, 2000)}
`;

    try {
      const response = await OpenAIApi.chat({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 350,
        temperature: 0.2,
      });

      if (!response.choices || response.choices.length === 0) {
        console.error('OpenAI API returned empty choices array');
        return ['API Error: No response choices returned'];
      }

      const content = response.choices[0]?.message?.content?.trim() || "";
      
      // Split by newlines and clean up each keyword
      let keywords = content
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0);

      // Additional post-processing to exclude common non-skills
      keywords = keywords.filter(skill => {
        const lowerSkill = skill.toLowerCase();
        
        // Filter out common non-skills markers
        if (
          // Employment terms and logistical items
          lowerSkill.includes(' years of experience') ||
          lowerSkill.includes('degree in') ||
          lowerSkill.includes('salary') ||
          lowerSkill.includes('full-time') ||
          lowerSkill.includes('part-time') ||
          lowerSkill.includes('remote') ||
          lowerSkill.includes('hybrid') ||
          lowerSkill.includes('location') ||
          
          // Generic phrases
          lowerSkill.includes('ability to') ||
          lowerSkill.includes('experience with') ||
          lowerSkill.includes('knowledge of') ||
          lowerSkill.includes('understanding of') ||
          
          // Overly general terms
          lowerSkill === 'experience' ||
          lowerSkill === 'skills' ||
          lowerSkill === 'qualifications' ||
          lowerSkill === 'requirements' ||
          
          // Too long to be a standard skill
          lowerSkill.split(' ').length > 4
        ) {
          return false;
        }
        
        return true;
      });

      return keywords;
    } catch (apiError: any) {
      // Log specific OpenAI API errors
      console.error('OpenAI API Error:', apiError.message);
      
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
 * Analyzes a job description and categorizes keywords
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
    // If job description is empty, return empty categories
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

    const prompt = `
As a professional resume analyst, categorize skills and qualifications from this job description specifically for resume use.

Extract keywords into these categories:

1. technicalSkills: Concrete technical abilities, programming languages, methodologies, and hard skills
   Examples: JavaScript, Python, Data Analysis, SEO, Machine Learning, DevOps, REST APIs, Accounting

2. softSkills: Specific interpersonal abilities, character traits, and professional attributes 
   Examples: Leadership, Communication, Problem Solving, Conflict Resolution, Time Management

3. tools: Specific software, platforms, frameworks, and technologies used in the role
   Examples: Adobe Photoshop, React, AWS, Docker, Kubernetes, Excel, Salesforce, JIRA

4. certifications: Professional certifications, licenses, and formal qualifications
   Examples: AWS Certified Solutions Architect, PMP, CISSP, CPA, Scrum Master

5. education: Required degrees and academic qualifications (not for listing as skills)
   Examples: Bachelor's in Computer Science, MBA, Associate's Degree

6. industryTerms: Industry-specific knowledge areas (NOT company names or job titles)
   Examples: Supply Chain Management, Product Lifecycle, UX Design, Financial Analysis

7. responsibilities: Key duties and functions (not for listing as skills, for context only)
   Examples: Project Management, Team Leadership, Content Creation, Customer Support

CRITICAL CRITERIA FOR RESUME-APPROPRIATE SKILLS:
- Include ONLY items that could legitimately appear in a resume skills section
- Extract items as they would appear in a resume (short, 1-3 words typically)
- Format consistently and professionally (e.g., "JavaScript" not "javascript")
- EXCLUDE generic phrases like "ability to" - extract just the skill itself
- EXCLUDE company names, job titles, locations, and descriptions
- EXCLUDE subjective qualities or personality traits that cannot be objectively demonstrated
- PRIORITIZE specific skills over general skill areas

Format response as a valid JSON object with array properties for each category.

Job Description:
${truncateText(jobDescription, 2000)}
`;

    try {
      const response = await OpenAIApi.chat({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.2,
        response_format: { type: "json_object" }
      });

      if (!response.choices || response.choices.length === 0) {
        console.error('OpenAI API returned empty choices array');
        throw new Error('API Error: No response choices returned');
      }

      const content = response.choices[0]?.message?.content?.trim() || "{}";
      
      // Parse the JSON response
      try {
        // Clean up the content in case it contains markdown code blocks or other formatting
        let cleanedContent = content;
        
        // Remove markdown code blocks if present (```json ... ```)
        if (cleanedContent.startsWith("```") && cleanedContent.endsWith("```")) {
          const codeBlockMatch = cleanedContent.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (codeBlockMatch && codeBlockMatch[1]) {
            cleanedContent = codeBlockMatch[1].trim();
          }
        }
        
        // Try to ensure we have valid JSON
        if (!cleanedContent.startsWith("{")) {
          cleanedContent = "{}";
        }
        
        console.log("Cleaned content before parsing:", cleanedContent);
        const parsedResult = JSON.parse(cleanedContent);
        
        // Post-process the extracted skills for additional filtering
        // Function to filter skills based on common criteria
        const filterSkills = (skills: string[]): string[] => {
          if (!Array.isArray(skills)) return [];
          
          return skills.filter(skill => {
            const lowerSkill = skill.toLowerCase();
            
            // Filter out common non-skills markers 
            if (
              // Employment terms and logistical items
              lowerSkill.includes(' years of experience') ||
              lowerSkill.includes('degree in') ||
              lowerSkill.includes('salary') ||
              lowerSkill.includes('full-time') ||
              lowerSkill.includes('part-time') ||
              lowerSkill.includes('remote') ||
              lowerSkill.includes('hybrid') ||
              lowerSkill.includes('location') ||
              
              // Generic phrases
              lowerSkill.includes('ability to') ||
              lowerSkill.includes('experience with') ||
              lowerSkill.includes('knowledge of') ||
              lowerSkill.includes('understanding of') ||
              
              // Overly general terms
              lowerSkill === 'experience' ||
              lowerSkill === 'skills' ||
              lowerSkill === 'qualifications' ||
              lowerSkill === 'requirements' ||
              
              // Too long to be a standard skill
              lowerSkill.split(' ').length > 4
            ) {
              return false;
            }
            
            return true;
          });
        };
        
        // Ensure all categories exist and apply filtering
        const result = {
          technicalSkills: filterSkills(parsedResult.technicalSkills || []),
          softSkills: filterSkills(parsedResult.softSkills || []),
          education: Array.isArray(parsedResult.education) ? parsedResult.education : [],
          responsibilities: Array.isArray(parsedResult.responsibilities) ? parsedResult.responsibilities : [],
          industryTerms: filterSkills(parsedResult.industryTerms || []),
          tools: filterSkills(parsedResult.tools || []),
          certifications: Array.isArray(parsedResult.certifications) ? parsedResult.certifications : []
        };
        
        return result;
      } catch (parseError) {
        console.error('Error parsing OpenAI response:', parseError);
        
        // Fall back to basic keyword extraction
        const keywords = await extractKeywordsFromJobDescription(jobDescription);
        
        // Simple categorization logic - this is just a fallback
        const technicalKeywords = ['javascript', 'python', 'java', 'html', 'css', 'api', 'sql', 'nosql', 
          'react', 'angular', 'vue', 'node', 'aws', 'azure', 'cloud', 'data', 'analytics', 'machine learning'];
        
        const softKeywords = ['communication', 'leadership', 'teamwork', 'collaboration', 'problem solving', 
          'time management', 'critical thinking', 'creativity', 'project management'];
          
        const toolKeywords = ['excel', 'powerpoint', 'word', 'photoshop', 'illustrator', 'figma', 'jira', 
          'confluence', 'git', 'docker', 'kubernetes', 'terraform', 'jenkins'];
        
        // Simple categorization based on keyword matches
        const result = {
          technicalSkills: keywords.filter(k => 
            technicalKeywords.some(tk => k.toLowerCase().includes(tk))
          ),
          softSkills: keywords.filter(k => 
            softKeywords.some(sk => k.toLowerCase().includes(sk))
          ),
          tools: keywords.filter(k => 
            toolKeywords.some(tk => k.toLowerCase().includes(tk))
          ),
          education: [],
          responsibilities: [],
          industryTerms: keywords.filter(k => 
            !technicalKeywords.some(tk => k.toLowerCase().includes(tk)) &&
            !softKeywords.some(sk => k.toLowerCase().includes(sk)) &&
            !toolKeywords.some(tk => k.toLowerCase().includes(tk))
          ),
          certifications: []
        };
        
        return result;
      }
    } catch (apiError: any) {
      // Log specific OpenAI API errors
      console.error('OpenAI API Error:', apiError.message);
      
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
    console.error('Error analyzing job description:', error);
    throw new Error(`Failed to analyze job description: ${error.message}`);
  }
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
      
      try {
        const result = await analyzeJobDescription(jobDescription);
        
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
        
        return res.json(result);
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

export default router; 