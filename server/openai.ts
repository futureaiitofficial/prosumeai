// Import OpenAI
import OpenAILib from 'openai';
import { ApiKeyManager } from './src/utils/api-key-manager';

// Use a different variable name to avoid collision
const OpenAI = OpenAILib;

// Initialize with a placeholder, will be updated with actual key when needed
const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'placeholder' });

// Function to update the API key
export async function updateApiKey(): Promise<boolean> {
  try {
    const apiKey = await ApiKeyManager.getKeyWithFallback('openai', 'OPENAI_API_KEY');
    
    if (!apiKey) {
      console.error('No valid OpenAI API key found, using placeholder for development');
      // Don't throw an error, just return false
      return false;
    }
    
    // Update the API key
    openaiClient.apiKey = apiKey;
    return true;
  } catch (error) {
    console.error('Error updating API key:', error);
    // Don't throw an error, just return false
    return false;
  }
}

// Wrapper for chat completions
export async function createChatCompletion(params: any) {
  const keyUpdated = await updateApiKey();
  if (!keyUpdated) {
    throw new Error('OpenAI API key is not configured. Please check your environment variables or database settings.');
  }
  return openaiClient.chat.completions.create(params);
}

// Wrapper for completions
export async function createCompletion(params: any) {
  const keyUpdated = await updateApiKey();
  if (!keyUpdated) {
    throw new Error('OpenAI API key is not configured. Please check your environment variables or database settings.');
  }
  return openaiClient.completions.create(params);
}

// Wrapper for embeddings
export async function createEmbedding(params: any) {
  const keyUpdated = await updateApiKey();
  if (!keyUpdated) {
    throw new Error('OpenAI API key is not configured. Please check your environment variables or database settings.');
  }
  return openaiClient.embeddings.create(params);
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
export async function parseResume(text: string): Promise<{
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    country: string;
    city: string;
    linkedinUrl: string;
    portfolioUrl: string;
  };
  summary: string;
  workExperience: Array<{
    id: string;
    company: string;
    position: string;
    location: string;
    startDate: string | null;
    endDate: string | null;
    current: boolean;
    description: string;
    achievements: string[];
  }>;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string | null;
    endDate: string | null;
    current: boolean;
    description: string;
  }>;
  skills: string[];
  technicalSkills: string[];
  softSkills: string[];
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    date: string | null;
    expires: boolean;
    expiryDate: string | null;
  }>;
  projects: Array<{
    id: string;
    name: string;
    description: string;
    technologies: string[];
    startDate: string | null;
    endDate: string | null;
    current: boolean;
    url: string | null;
  }>;
  note?: string;
}> {
  try {
    console.log(`Analyzing resume with ${text.length} characters`);
    // Truncate text to handle token limits
    const truncatedText = truncateText(text, 14000);

    // FIRST PASS: Deep analysis of the resume with minimal structure constraints
    try {
      console.log("Starting two-pass resume parsing with advanced NLP...");
      
      // First pass - extract raw information without strict formatting
      const firstPassPrompt = `
        You are an advanced resume analyzer with NLP and OCR capabilities.
        
        TASK:
        Deeply analyze this resume text and EXTRACT ONLY THE INFORMATION THAT IS ACTUALLY PRESENT IN THE DOCUMENT.
        
        CRITICALLY IMPORTANT:
        - DO NOT INVENT OR GENERATE ANY INFORMATION THAT IS NOT IN THE DOCUMENT
        - DO NOT USE PLACEHOLDERS LIKE "John Doe" OR "Not specified"
        - DO NOT MAKE ASSUMPTIONS OR INFERENCES BEYOND WHAT'S EXPLICITLY WRITTEN
        - If you cannot find certain information, explicitly state "NOT FOUND IN DOCUMENT"
        - You must only extract what is actually written in the text
        - DO NOT create descriptions for job experiences if only bullet points are provided
        - NEVER combine bullets into paragraph form
        - NEVER add or invent bullet points that aren't in the document
        
        CONTEXT:
        This text was extracted from a document and may have formatting issues. 
        Information might appear in ANY order with ANY labeling style.
        Your job is to understand the semantic meaning regardless of format.

        ESPECIALLY IMPORTANT FOR SECTIONS DETECTION:
        - Pay close attention to ALL CAPS text like "EDUCATION", "SKILLS", "EXPERIENCE" which might be section headers
        - Look for Markdown-style headers with # or ## symbols which indicate section headings
        - Check for formatting clues such as bold text, larger font sizes, or underlined text that might signal section headers
        - In DOCX files, educational institutions might be listed with degree names and dates (e.g., "University of X - Bachelor of Y - 2018-2022")
        - For skills, look for lists of technologies, languages, tools, methodologies, etc. 
        - Pay attention to bullet points (•) that might contain skills lists
        
        FOCUS ON FINDING THESE TYPES OF INFORMATION (regardless of how they're labeled in the document):
        
        1. PERSON: Who is this person? Name, contact info, location, links, etc.
           - Look for explicit mentions of names, email addresses, phone numbers
           - Look for location information (city, country)
           - Look for LinkedIn URLs, portfolio URLs
           - NEVER make up contact details that aren't in the document
           - If any of these are not found, explicitly state "NOT FOUND" for that field
        
        2. PROFILE SUMMARY: Any kind of professional overview
           - Could be labeled as "Summary", "Profile", "Objective", "About Me", etc.
           - Quote the exact text if you find it
           - NEVER write a summary if none exists
           - If not found, state "NOT FOUND"
        
        3. WORK HISTORY: Information about professional roles
           - Might be labeled "Experience", "Employment", "Work History", "Professional Background", etc.
           - Extract ACTUAL company names, job titles, dates, responsibilities
           - If there are only bullet points, do NOT create a paragraph description
           - If there's a paragraph and bullet points, keep them separate
           - Make sure to PRESERVE the EXACT ORIGINAL BULLET POINTS
           - Quote the actual text for descriptions
           - DO NOT invent any details about job responsibilities
           - If not found, state "NO WORK HISTORY FOUND"
        
        4. EDUCATION: Academic background
           - CRITICAL SECTION - SEARCH EXTREMELY THOROUGHLY
           - Might be labeled "EDUCATION", "ACADEMIC", "Academic Background", "Qualifications", "ACADEMIC CREDENTIALS", etc.
           - Look for any university or college names such as "Michigan Technological University", "Jawaharlal Nehru", etc.
           - Look for degree indicators like "Masters", "Bachelor", "BS", "BA", "MS", "PhD", "Doctor of", "Pharm.D", etc.
           - Look for phrases like "Expected December 2024", "August 2014 – July 2020", "GPA: 3.75", etc.
           - Extract ACTUAL institutions, degrees, fields of study, dates - even if they're not in a dedicated section
           - Be sure to check the BOTTOM of the resume as Education is often listed last
           - Even if there's no explicit "EDUCATION" heading, extract any academic information you can find
           - NEVER invent educational details
           - If not found after extremely thorough checking, state "NO EDUCATION FOUND"
        
        5. SKILLS: Abilities and competencies 
           - CRITICAL SECTION - SEARCH THOROUGHLY
           - Might be labeled "SKILLS", "Competencies", "Core Strengths", "Technologies", "TECHNICAL SKILLS", etc.
           - Might be a bulleted or comma-separated list of terms
           - Look for technical skills (programming languages, software, hardware, methodologies)
           - Look for soft skills (communication, leadership, teamwork)
           - Look for language proficiencies
           - List ONLY the exact skills mentioned
           - DO NOT categorize skills by type unless they are already categorized in the document
           - If no explicit skills section after thorough checking, state "NO EXPLICIT SKILLS SECTION"
        
        6. PROJECTS: Personal or professional endeavors
           - Might be labeled "Projects", "Key Projects", "Portfolio", etc.
           - Extract ACTUAL project information
           - NEVER add your own interpretation of project descriptions
           - If not found, state "NO PROJECTS FOUND"
        
        7. CERTIFICATIONS: Professional credentials
           - Might be labeled "Certifications", "Credentials", "Licenses", etc.
           - Extract ACTUAL certification information
           - NEVER invent certification details
           - If not found, state "NO CERTIFICATIONS FOUND"
        
        OUTPUT INSTRUCTIONS:
        - Organize your findings under these broad semantic categories
        - Include ONLY information actually found in the document VERBATIM
        - For any field where information is missing, explicitly state that it's not found
        - Quote exact text when possible to show it came from the document
        - PRESERVE all bullet points EXACTLY as they appear in the document
        - NEVER invent names, addresses, dates, or any other details not present in the text
        - NEVER convert bullet points into paragraphs or paragraphs into bullet points
        
        RESUME TEXT:
        ${truncatedText}
      `;

      const firstPassResponse = await openaiClient.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an advanced resume analysis system with exceptional information extraction capabilities. Your primary goal is STRICT ADHERENCE to only extracting information that is explicitly present in the document. NEVER add information, explanations, or text that is not directly in the source document. If the document only contains bullet points, do not create paragraphs from them. If information is missing, clearly state it's not in the document. IMPORTANT: Pay special attention to EDUCATION sections which are usually toward the bottom of a resume. Look for university names (e.g., 'Michigan Technological University'), degree types (e.g., 'Masters', 'Doctor of Pharmacy', 'Pharm.D'), and graduation dates even if they're not in a dedicated section."
          },
          {
            role: "user",
            content: firstPassPrompt
          }
        ],
        max_tokens: 4000
      });

      const firstPassContent = firstPassResponse.choices[0].message.content;
      if (!firstPassContent) {
        throw new Error("Empty response from OpenAI in first pass");
      }

      // SECOND PASS: Structure the extracted information into the required format
      const secondPassPrompt = `
        You are a resume structuring expert. Take this raw information extracted from a resume and structure it ONLY using the information provided.
        
        CRITICALLY IMPORTANT:
        - DO NOT INVENT ANY INFORMATION that wasn't provided in the first pass
        - When the first pass shows "NOT FOUND IN DOCUMENT" or similar, use "Not found in document" in the JSON 
        - DO NOT use placeholder names like "John Doe" or generic values
        - ONLY structure the actual information that was extracted in the first pass
        
        Raw extracted resume information:
        ${firstPassContent}
        
        Structure this information into the following JSON format:
        {
          "personalInfo": {
            "fullName": "Actual name from document or 'Not found in document'",
            "email": "Actual email from document or 'Not found in document'",
            "phone": "Actual phone from document or 'Not found in document'",
            "location": "Actual location from document or 'Not found in document'",
            "country": "Actual country from document or 'Not found in document'",
            "city": "Actual city from document or 'Not found in document'",
            "linkedinUrl": "Actual LinkedIn URL or empty string",
            "portfolioUrl": "Actual Portfolio URL or empty string"
          },
          "summary": "Actual summary from document or 'Not found in document'",
          "workExperience": [
            // Only include if work experience was found, otherwise leave as empty array
            {
              "id": "exp-1",
              "company": "Actual company name from document",
              "position": "Actual job title from document",
              "location": "Actual job location from document or 'Not specified'",
              "startDate": "Actual start date in YYYY-MM-DD format if found",
              "endDate": "Actual end date in YYYY-MM-DD format or null if current",
              "current": true/false based on document,
              "description": "Actual job description from document",
              "achievements": ["Actual achievement 1", "Actual achievement 2"] 
            }
          ],
          "education": [
            // Only include if education was found, otherwise leave as empty array
            {
              "id": "edu-1",
              "institution": "Actual school name from document",
              "degree": "Actual degree type from document",
              "fieldOfStudy": "Actual field of study from document",
              "startDate": "Actual start date if found",
              "endDate": "Actual end date or null if current",
              "current": true/false based on document,
              "description": "Actual education details from document"
            }
          ],
          "skills": ["Only actual skills mentioned in document"],
          "technicalSkills": ["Only actual technical skills mentioned in document"],
          "softSkills": ["Only actual soft skills mentioned in document"],
          "certifications": [
            // Only include if certifications were found, otherwise leave as empty array
            {
              "id": "cert-1",
              "name": "Actual certification name from document",
              "issuer": "Actual issuing organization from document",
              "date": "Actual issue date if found",
              "expires": true/false based on document,
              "expiryDate": "Actual expiry date or null"
            }
          ],
          "projects": [
            // Only include if projects were found, otherwise leave as empty array
            {
              "id": "proj-1",
              "name": "Actual project name from document",
              "description": "Actual project description from document",
              "technologies": ["Actual technology 1", "Actual technology 2"],
              "startDate": "Actual start date if found",
              "endDate": "Actual end date or null if ongoing",
              "current": true/false based on document,
              "url": "Actual project URL or null"
            }
          ]
        }
        
        CRITICAL INSTRUCTIONS:
        1. DO NOT INVENT DATA - if information is missing from the first pass, use "Not found in document"
        2. If the entire category is missing (like "NO WORK HISTORY FOUND"), use an empty array for that section
        3. For dates, use the format provided in the document. If only year is mentioned, use YYYY-01-01
        4. DO NOT try to fill in missing information with educated guesses
        5. For string fields with no information, use "Not found in document"
        6. Only include array items (work experience, education, etc.) that were actually found in the document
      `;

      const secondPassResponse = await openaiClient.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a resume formatting specialist who takes raw extracted resume information and structures it into clean, consistent JSON. CRITICALLY IMPORTANT: NEVER invent or generate information that wasn't in the first pass. Do not make guesses or inferences. Only structure information that was explicitly identified in the first pass. If something wasn't found in the document, clearly mark it as 'Not found in document'. PRESERVE ORIGINAL BULLET POINTS EXACTLY. If the first pass only found bullet points for job descriptions, DO NOT convert them into paragraph format. Keep bullet points as an array of individual items. DO NOT generate descriptions if none exist in the source document. CRUCIAL: For EDUCATION entries, look for ANY mentions of universities, colleges, degrees (Masters, Doctorate, Pharm.D, etc.), or educational timeframes in the first pass text. Even if they weren't under a clear 'EDUCATION' heading, include them in the education array if they represent academic credentials."
          },
          {
            role: "user",
            content: secondPassPrompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 4000
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
      
      // Keep empty work experience array if none is found
      // This will allow the user to know there was no work experience in the document
      
      // Ensure personal info fields exist
      if (!parsedData.personalInfo) {
        parsedData.personalInfo = {
          fullName: "Not clearly provided in resume",
          email: "Not provided in resume",
          phone: "Not provided in resume",
          location: "Not provided in resume",
          country: "Not provided in resume",
          city: "Not provided in resume",
          linkedinUrl: "",
          portfolioUrl: ""
        };
      }
      
      // Set summary to "Not found in document" if it doesn't exist
      if (!parsedData.summary || parsedData.summary.trim() === "") {
        parsedData.summary = "Not found in document";
      }
      
      // Handle truncation note
      if (text.length > 14000) {
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