import express from 'express';
import OpenAI from 'openai';
import { truncateText } from '../../openai';

// Initialize OpenAI client with better error handling
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Check for API key
if (!process.env.OPENAI_API_KEY) {
  console.error('WARNING: OPENAI_API_KEY is not set in environment variables');
}

const MODEL = "gpt-4o"; // Using same model as in ai-resume-utils.ts

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

    // Check for API key before making request
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured. Please check your environment variables.');
    }

    const prompt = `
Extract the most important keywords and skills from this job description. 
Focus on hard skills, technical requirements, and industry-specific terminology.
Return ONLY a list of 15-20 keywords/phrases, with each on a new line.
No numbering, bullet points, or explanations.

Job Description:
${truncateText(jobDescription, 2000)}
`;

    try {
      const response = await openai.chat.completions.create({
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
      const keywords = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

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

    // Check for API key before making request
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured. Please check your environment variables.');
    }

    const prompt = `
Analyze this job description and extract keywords into the following categories:
1. technicalSkills: Technical abilities and hard skills relevant to the job
2. softSkills: Interpersonal, communication, and character traits
3. education: Required degrees, educational qualifications, or academic background
4. responsibilities: Key duties and tasks for the role
5. industryTerms: Industry-specific jargon and terminology
6. tools: Software, technologies, platforms, or tools mentioned
7. certifications: Professional certifications, licenses, or qualifications

For each category, extract 3-10 relevant keywords or phrases.
Format your response as a valid JSON object with array properties for each category.
If a category has no relevant terms, return an empty array.

Job Description:
${truncateText(jobDescription, 2000)}
`;

    try {
      const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.2,
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
        
        // Ensure all categories exist
        const result = {
          technicalSkills: Array.isArray(parsedResult.technicalSkills) ? parsedResult.technicalSkills : [],
          softSkills: Array.isArray(parsedResult.softSkills) ? parsedResult.softSkills : [],
          education: Array.isArray(parsedResult.education) ? parsedResult.education : [],
          responsibilities: Array.isArray(parsedResult.responsibilities) ? parsedResult.responsibilities : [],
          industryTerms: Array.isArray(parsedResult.industryTerms) ? parsedResult.industryTerms : [],
          tools: Array.isArray(parsedResult.tools) ? parsedResult.tools : [],
          certifications: Array.isArray(parsedResult.certifications) ? parsedResult.certifications : []
        };
        
        return result;
      } catch (parseError) {
        console.error('Error parsing OpenAI response:', parseError);
        
        // Fall back to basic keyword extraction
        const keywords = await extractKeywordsFromJobDescription(jobDescription);
        
        // Simple categorization logic
        const result = {
          technicalSkills: keywords.filter(k => /^(programming|coding|development|software|web|api|database)/.test(k.toLowerCase())).slice(0, 10),
          softSkills: keywords.filter(k => /^(communication|leadership|teamwork|collaboration)/.test(k.toLowerCase())).slice(0, 10),
          education: [],
          responsibilities: [],
          industryTerms: keywords.filter(k => !/^(programming|coding|development|software|web|api|database|communication|leadership|teamwork|collaboration)/.test(k.toLowerCase())).slice(0, 10),
          tools: [],
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

// Create router
const router = express.Router();

// Add any AI-related routes here
router.post('/extract-keywords', async (req, res) => {
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
router.post('/analyze-job-description', async (req, res) => {
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
router.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        message: 'Prompt is required',
        error: 'MISSING_PROMPT'
      });
    }
    
    try {
      // Check for API key before making request
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key is not configured. Please check your environment variables.');
      }

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

      const response = await openai.chat.completions.create({
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

export default router; 