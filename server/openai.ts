// Import OpenAI
import OpenAILib from 'openai';
import { ApiKeyManager } from './src/utils/api-key-manager';
import { db } from './config/db';
import { apiKeys } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';

// Use a different variable name to avoid collision
const OpenAI = OpenAILib;

// Cache for storing the API key to reduce DB calls
let cachedApiKey: { key: string; expires: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes in milliseconds

// Initialize with a placeholder, will be updated with actual key when needed
const openaiClient = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || 'placeholder',
  timeout: 60 * 1000, // 60 second timeout
  maxRetries: 2, // Retry failed requests up to 2 times
});

// Function to update the API key
export async function updateApiKey(): Promise<boolean> {
  try {
    // Check if we have a valid cached key
    if (cachedApiKey && cachedApiKey.expires > Date.now()) {
      openaiClient.apiKey = cachedApiKey.key;
      return true;
    }
    
    // First try to get the key from the manager
    const apiKey = await ApiKeyManager.getKeyWithFallback('openai', 'OPENAI_API_KEY');
    
    if (apiKey) {
      // Use the API key from the manager
      openaiClient.apiKey = apiKey;
      
      // Cache the key
      cachedApiKey = {
        key: apiKey,
        expires: Date.now() + CACHE_TTL
      };
      
      return true;
    }
    
    // If no key from manager, try to fetch an active API key from the database
    const dbKeys = await db.select()
      .from(apiKeys)
      .where(and(
        eq(apiKeys.service, 'openai'),
        eq(apiKeys.isActive, true)
      ))
      .orderBy(desc(apiKeys.id))
      .limit(1);
    
    if (dbKeys && dbKeys.length > 0) {
      const dbKey = dbKeys[0].key;
      
      // Update the in-memory client with the database key
      openaiClient.apiKey = dbKey;
      
      // Cache the key
      cachedApiKey = {
        key: dbKey,
        expires: Date.now() + CACHE_TTL
      };
      
      // Update the last used timestamp
      await db.update(apiKeys)
        .set({ lastUsed: new Date() })
        .where(eq(apiKeys.id, dbKeys[0].id));
      
      console.log('Successfully retrieved API key from database');
      return true;
    }
    
    console.error('No valid OpenAI API key found in environment or database');
    return false;
  } catch (error) {
    console.error('Error updating API key:', error);
    
    // Clear the cache on error to force a fresh attempt next time
    cachedApiKey = null;
    
    return false;
  }
}

// Wrapper for chat completions
export async function createChatCompletion(params: any) {
  try {
    const keyUpdated = await updateApiKey();
    if (!keyUpdated) {
      throw new Error('OpenAI API key is not configured. Please check your environment variables or database settings.');
    }
    
    return await openaiClient.chat.completions.create(params);
  } catch (error: any) {
    console.error('Error in OpenAI chat completion:', error);
    
    // Provide more specific error messages based on the error type
    if (error.status === 401 || error.status === 403) {
      throw new Error('API key authentication failed. Please check your OpenAI API key.');
    } else if (error.status === 429) {
      throw new Error('OpenAI rate limit exceeded. Please try again later.');
    } else if (error.message && error.message.includes('API key')) {
      throw new Error('OpenAI API key is not configured or is invalid.');
    } else {
      throw new Error(`OpenAI API error: ${error.message || 'Unknown error'}`);
    }
  }
}

// Wrapper for completions
export async function createCompletion(params: any) {
  try {
    const keyUpdated = await updateApiKey();
    if (!keyUpdated) {
      throw new Error('OpenAI API key is not configured. Please check your environment variables or database settings.');
    }
    
    return await openaiClient.completions.create(params);
  } catch (error: any) {
    console.error('Error in OpenAI completion:', error);
    
    // Provide more specific error messages based on the error type
    if (error.status === 401 || error.status === 403) {
      throw new Error('API key authentication failed. Please check your OpenAI API key.');
    } else if (error.status === 429) {
      throw new Error('OpenAI rate limit exceeded. Please try again later.');
    } else if (error.message && error.message.includes('API key')) {
      throw new Error('OpenAI API key is not configured or is invalid.');
    } else {
      throw new Error(`OpenAI API error: ${error.message || 'Unknown error'}`);
    }
  }
}

// Wrapper for embeddings
export async function createEmbedding(params: any) {
  try {
    const keyUpdated = await updateApiKey();
    if (!keyUpdated) {
      throw new Error('OpenAI API key is not configured. Please check your environment variables or database settings.');
    }
    
    return await openaiClient.embeddings.create(params);
  } catch (error: any) {
    console.error('Error in OpenAI embedding:', error);
    
    // Provide more specific error messages based on the error type
    if (error.status === 401 || error.status === 403) {
      throw new Error('API key authentication failed. Please check your OpenAI API key.');
    } else if (error.status === 429) {
      throw new Error('OpenAI rate limit exceeded. Please try again later.');
    } else if (error.message && error.message.includes('API key')) {
      throw new Error('OpenAI API key is not configured or is invalid.');
    } else {
      throw new Error(`OpenAI API error: ${error.message || 'Unknown error'}`);
    }
  }
}

// Export a named export for better TypeScript imports
export const OpenAIApi = {
  chat: createChatCompletion,
  completions: createCompletion,
  embeddings: createEmbedding
};

// Also export as default for backward compatibility
export default OpenAIApi;

// Function to truncate text to a reasonable token limit
export function truncateText(text: string, maxChars: number = 4000): string {
  if (!text) return '';
  return text.length > maxChars ? text.substring(0, maxChars) + '...' : text;
}

/**
 * Advanced parse resume text into structured data using a sophisticated two-pass system
 * First pass: Extract raw information with AI understanding of resume context
 * Second pass: Structure the extracted information to a defined format
 */
export async function parseResume(resumeText: string): Promise<any> {
  try {
    // Prepare the resumeText for processing
    console.log(`Analyzing resume with ${resumeText.length} characters`);
    
    // Check and update API key before proceeding
    const apiKeyUpdated = await updateApiKey();
    if (!apiKeyUpdated) {
      throw new Error('No valid OpenAI API key available. Please configure an API key in the admin panel.');
    }
    
    // Let's use a two-pass system: first extract raw fields, then interpret them
    console.log('Starting two-pass resume parsing with advanced NLP...');
    
    // Truncate text to handle token limits
    const truncatedText = truncateText(resumeText, 14000);

    // FIRST PASS: Deep analysis of the resume with minimal structure constraints
    try {
      console.log("Starting two-pass resume parsing with advanced NLP...");
      
      // First pass - extract raw information without strict formatting
      const firstPassPrompt = `
        You are an advanced resume analyzer with exceptional detail extraction capabilities.
        
        TASK:
        Deeply analyze this resume text and EXTRACT ALL INFORMATION THAT IS ACTUALLY PRESENT.
        
        CRITICALLY IMPORTANT:
        - DO NOT INVENT OR GENERATE ANY INFORMATION THAT IS NOT IN THE DOCUMENT
        - DO NOT USE PLACEHOLDERS LIKE "John Doe" OR "Not specified"
        - If you cannot find certain information, explicitly state "NOT FOUND IN DOCUMENT"
        - You must only extract what is actually written in the text
        - DO NOT create descriptions for job experiences if only bullet points are provided
        - PAY EXTREMELY CLOSE ATTENTION TO ANY DATES, LOCATIONS, NAMES mentioned
        
        CONTEXT:
        This text was extracted from a document and may have formatting issues. 
        Information might appear in ANY order with ANY labeling style.
        Your job is to understand the semantic meaning regardless of format.

        ESPECIALLY IMPORTANT FOR SECTIONS DETECTION:
        - Pay close attention to ALL CAPS text like "EDUCATION", "SKILLS", "EXPERIENCE" which are likely section headers
        - Check for NESTED STRUCTURE within sections (like multiple jobs under EXPERIENCE)
        - For EDUCATION, extract specific details about:
          * Institution name (e.g., University of Michigan)
          * Degree type (e.g., Bachelor of Science, Masters, Ph.D)
          * Field of study (e.g., Computer Science, Business Administration)
          * Dates attended (including months if available)
          * GPA if provided
          * Honors, awards, or other academic achievements
        
        FOCUS ON FINDING THESE TYPES OF INFORMATION:
        
        1. PERSON: Who is this person? Name, contact info, location, links
        
        2. PROFILE SUMMARY: Any professional overview
        
        3. WORK HISTORY: For each position, extract:
           - Company name (EXACTLY as written)
           - Job title (EXACTLY as written)
           - Location (city, state, country, remote)
           - PRECISE start and end dates (include month and year if available)
           - Whether the position is current/present
           - Full description text OR separate bullet points
           - DO NOT combine bullet points into paragraphs
        
        4. EDUCATION: For each institution:
           - Full institution name (EXACTLY as written)
           - PRECISE degree information (degree type, field)
           - PRECISE dates (start year, graduation/end year)
           - Location if provided
           - GPA, honors, relevant coursework if mentioned
        
        5. SKILLS: Abilities and competencies:
           - List ALL technical skills (programming languages, tools, platforms)
           - List ALL soft skills (communication, leadership, etc.)
           - If skills are categorized in the document, preserve those categories
           - If certification dates are mentioned, include them
        
        6. PROJECTS: For each project:
           - Project name
           - Description
           - Technologies/tools used
           - Dates if provided
           - URL/link if provided
        
        7. CERTIFICATIONS: For each certification:
           - Full certification name (EXACTLY as written)
           - Issuing organization
           - Date received and expiration date if provided
        
        OUTPUT INSTRUCTIONS:
        - Organize your findings into clearly labeled semantic categories
        - Include ONLY information actually found in the document VERBATIM
        - For any field where information is missing, explicitly state that it's not found
        - Quote exact text when possible to show it came from the document
        - PRESERVE all bullet points EXACTLY as they appear
        - If dates are provided in the document, include BOTH month and year when available
        
        RESUME TEXT:
        ${truncatedText}
      `;

      const firstPassResponse = await openaiClient.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an advanced resume analysis system with exceptional information extraction capabilities. Your primary goal is STRICT ADHERENCE to only extracting information that is explicitly present in the document. NEVER add information that is not directly in the document. ALWAYS include EXACT dates when they are mentioned, preserving the PRECISE format (like 'May 2019 - June 2023' rather than just '2019-2023'). Pay special attention to extracting education details - even from minimal mentions."
          },
          {
            role: "user",
            content: firstPassPrompt
          }
        ],
        max_tokens: 4000
      }, {
        timeout: 45000 // 45 second timeout for complex parsing
      });

      const firstPassContent = firstPassResponse.choices[0].message.content;
      if (!firstPassContent) {
        throw new Error("Empty response from OpenAI in first pass");
      }

      // SECOND PASS: Structure the extracted information into the required format
      const secondPassPrompt = `
        You are a resume structuring expert. Take this raw information extracted from a resume and structure it precisely.
        
        CRITICALLY IMPORTANT:
        - DO NOT INVENT ANY INFORMATION that wasn't provided in the first pass
        - When the first pass shows "NOT FOUND IN DOCUMENT" or similar, use empty strings or arrays in your JSON
        - Keep all dates in the EXACT format they were extracted (e.g., if "May 2019 - Present" was found, use that format)
        - Preserve all bullets points exactly as they appear
        - For skills, separate technical skills from soft skills where possible
        
        Raw extracted resume information:
        ${firstPassContent}
        
        Structure this information into the following JSON format with extreme attention to detail:
        {
          "personalInfo": {
            "fullName": "Actual name from document or empty string",
            "email": "Actual email from document or empty string",
            "phone": "Actual phone from document or empty string",
            "location": "Actual location from document or empty string",
            "country": "Actual country from document or empty string",
            "city": "Actual city from document or empty string",
            "linkedinUrl": "Actual LinkedIn URL or empty string",
            "portfolioUrl": "Actual Portfolio URL or empty string"
          },
          "summary": "Actual summary from document or empty string",
          "workExperience": [
            {
              "id": "exp-1",
              "company": "Actual company name",
              "position": "Actual job title",
              "location": "Actual job location or empty string",
              "startDate": "EXACT start date as mentioned in document",
              "endDate": "EXACT end date as mentioned in document or null if current",
              "current": true/false based on document,
              "description": "Job description paragraph if present",
              "achievements": ["Achievement 1", "Achievement 2"] 
            }
          ],
          "education": [
            {
              "id": "edu-1",
              "institution": "Actual institution name",
              "degree": "Actual degree type",
              "fieldOfStudy": "Actual field of study",
              "startDate": "EXACT start date as mentioned",
              "endDate": "EXACT end date as mentioned or null if current",
              "current": true/false based on document,
              "description": "Additional education details"
            }
          ],
          "skills": ["All skills found in document"],
          "technicalSkills": ["Technical skills found in document"],
          "softSkills": ["Soft skills found in document"],
          "certifications": [
            {
              "id": "cert-1",
              "name": "Actual certification name",
              "issuer": "Actual issuing organization",
              "date": "EXACT date of certification as mentioned",
              "expires": true/false based on document,
              "expiryDate": "EXACT expiry date as mentioned or null"
            }
          ],
          "projects": [
            {
              "id": "proj-1",
              "name": "Actual project name",
              "description": "Actual project description",
              "technologies": ["Tech 1", "Tech 2"],
              "startDate": "EXACT date as mentioned",
              "endDate": "EXACT date as mentioned or null if ongoing",
              "current": true/false based on document,
              "url": "Actual project URL or null"
            }
          ]
        }
        
        CRITICAL INSTRUCTIONS:
        1. DO NOT INVENT DATA - if information is missing, use empty strings or arrays
        2. Keep sections empty (empty arrays) if no information was found
        3. Preserve the EXACT date formats from the document 
        4. Do not standardize or reformat dates unless they're ambiguous
        5. When a date is just a year (e.g., "2020"), leave it as "2020" not "2020-01-01"
        6. Do not create fake IDs with random numbers - just use sequential identifiers like "exp-1", "exp-2"
      `;

      const secondPassResponse = await openaiClient.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a resume formatting specialist who takes raw extracted resume information and structures it into consistent JSON. ABSOLUTELY NEVER invent information that wasn't in the first pass. Use empty strings or arrays for missing information. MOST IMPORTANTLY - keep all dates in EXACTLY the format they were extracted (like 'March 2018 - Present' rather than formatting to YYYY-MM)."
          },
          {
            role: "user",
            content: secondPassPrompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 4000
      }, {
        timeout: 45000 // 45 second timeout for complex parsing
      });

      const secondPassContent = secondPassResponse.choices[0].message.content;
      if (!secondPassContent) {
        throw new Error("Empty response from OpenAI in second pass");
      }

      console.log("Successfully completed two-pass parsing");
      
      const parsedData = JSON.parse(secondPassContent);
      
      // Ensure all arrays exist and fix any structural issues
      if (!parsedData.workExperience) parsedData.workExperience = [];
      if (!parsedData.education) parsedData.education = [];
      if (!parsedData.skills) parsedData.skills = [];
      if (!parsedData.technicalSkills) parsedData.technicalSkills = [];
      if (!parsedData.softSkills) parsedData.softSkills = [];
      if (!parsedData.certifications) parsedData.certifications = [];
      if (!parsedData.projects) parsedData.projects = [];
      
      // Ensure personal info fields exist
      if (!parsedData.personalInfo) {
        parsedData.personalInfo = {
          fullName: "",
          email: "",
          phone: "",
          location: "",
          country: "",
          city: "",
          linkedinUrl: "",
          portfolioUrl: ""
        };
      }
      
      // Clean up summary to never say "Not found"
      if (!parsedData.summary || parsedData.summary.includes("not found") || parsedData.summary.includes("Not found")) {
        parsedData.summary = "";
      }
      
      // Fix for random hash-like strings that sometimes appear as placeholders
      if (parsedData.summary && (
          parsedData.summary.match(/[a-f0-9]{16}/) || // Check for hash-like patterns
          parsedData.summary.includes(":") && parsedData.summary.length < 100 // Check for potential placeholder tokens
      )) {
        console.log('Detected potential placeholder in summary, clearing field');
        parsedData.summary = "";
      }
      
      // Handle truncation note
      if (resumeText.length > 14000) {
        parsedData.note = "Resume was truncated during processing due to length.";
      }
      
      return parsedData;
      
    } catch (twoPassError: any) {
      // If the two-pass approach fails, fall back to a single-pass approach
      console.log("Two-pass system failed, falling back to simplified approach:", twoPassError.message);
      
      // Single-pass fallback approach with enhanced NLP focus
      const fallbackPrompt = `
        You are an expert resume parser with advanced NLP and OCR capabilities.
        
        TASK:
        Analyze this resume text and extract ONLY THE INFORMATION THAT IS ACTUALLY PRESENT IN THE DOCUMENT.
        
        CRITICALLY IMPORTANT:
        - DO NOT INVENT OR GENERATE ANY INFORMATION
        - DO NOT USE PLACEHOLDER NAMES LIKE "John Doe"
        - If you cannot find specific information, explicitly state "Not found in document"
        - You must only report what is actually written in the text
        
        CONTEXT:
        This text was extracted from a document and may have formatting issues.
        Information might be in any order with any labeling style.
        Your job is to find the actual information regardless of format.
        
        CRITICAL INSTRUCTIONS:
        1. EXTRACT ONLY ACTUAL INFORMATION from the document
        2. Use "Not found in document" for any missing information
        3. DO NOT make educated guesses or inferences
        4. DO NOT create work experience entries if none are found
        5. For dates, report them exactly as found in the document
        6. Include an empty array for sections with no information
        
        Resume text:
        ${truncatedText}
        
        Parse into this JSON format:
        {
          "personalInfo": {
            "fullName": "Actual name or 'Not found in document'",
            "email": "Actual email or 'Not found in document'",
            "phone": "Actual phone or 'Not found in document'",
            "location": "Actual location or 'Not found in document'",
            "country": "Actual country or 'Not found in document'",
            "city": "Actual city or 'Not found in document'",
            "linkedinUrl": "Actual LinkedIn URL or empty string",
            "portfolioUrl": "Actual portfolio URL or empty string"
          },
          "summary": "Actual summary or 'Not found in document'",
          "workExperience": [
            // Only include if actual work experience found, otherwise leave as empty array
          ],
          "education": [
            // Only include if actual education found, otherwise leave as empty array
          ],
          "skills": ["Only include actual skills found"],
          "technicalSkills": ["Only include actual technical skills found"],
          "softSkills": ["Only include actual soft skills found"],
          "certifications": [
            // Only include if actual certifications found, otherwise leave as empty array
          ],
          "projects": [
            // Only include if actual projects found, otherwise leave as empty array
          ]
        }
      `;
      
      const fallbackResponse = await openaiClient.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an advanced resume analysis system with exceptional information extraction capabilities. IMPORTANT: You MUST ONLY extract information that is ACTUALLY PRESENT in the document. DO NOT invent or generate any information that isn't explicitly mentioned. If information is missing, mark it as 'Not found in document'. You are analyzing actual resumes for real users, so accuracy and honesty are critical."
          },
          {
            role: "user",
            content: fallbackPrompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 4000
      });
      
      const fallbackContent = fallbackResponse.choices[0].message.content;
      if (!fallbackContent) {
        throw new Error("Empty response from OpenAI in fallback approach");
      }
      
      console.log("Successfully completed fallback parsing");
      
      const parsedData = JSON.parse(fallbackContent);
      
      // Ensure all arrays exist
      if (!parsedData.workExperience) parsedData.workExperience = [];
      if (!parsedData.education) parsedData.education = [];
      if (!parsedData.skills) parsedData.skills = [];
      if (!parsedData.technicalSkills) parsedData.technicalSkills = [];
      if (!parsedData.softSkills) parsedData.softSkills = [];
      if (!parsedData.certifications) parsedData.certifications = [];
      if (!parsedData.projects) parsedData.projects = [];
      
      // Add note about using fallback approach
      parsedData.note = "Resume was processed using single-pass approach due to complexity.";
      
      return parsedData;
    }
  } catch (error: any) {
    console.error("Error parsing resume:", error);
    
    // Return error response with fallback structure rather than throwing
    return {
      personalInfo: {
        fullName: "Error processing resume",
        email: "Please try again or enter information manually",
        phone: "Not available due to processing error",
        location: "Not available due to processing error",
        country: "Not available due to processing error",
        city: "Not available due to processing error",
        linkedinUrl: "",
        portfolioUrl: ""
      },
      summary: "There was an error processing this resume. Please try again with a different file or enter your information manually.",
      workExperience: [{
        id: "exp-1",
        company: "Not available due to processing error",
        position: "Not available due to processing error",
        location: "Not available due to processing error",
        startDate: "2020-01-01",
        endDate: null,
        current: true,
        description: "Error extracting work experience. Please enter manually.",
        achievements: []
      }],
      education: [],
      skills: ["Not available due to processing error"],
      technicalSkills: [],
      softSkills: [],
      certifications: [],
      projects: [],
      note: `Failed to parse resume: ${error.message}`
    };
  }
}