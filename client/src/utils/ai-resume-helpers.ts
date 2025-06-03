import { apiRequest } from "@/lib/queryClient";

// Define interfaces for better type safety
interface KeywordsFeedback {
  missing: string[];
  found: string[];
  all?: string[];
  categories?: {
    [category: string]: {
      found: string[];
      missing: string[];
      all: string[];
    }
  };
}

interface ATSScoreFeedback {
  generalFeedback: {
    category: string;
    score: number;
    feedback: string;
    priority: 'high' | 'medium' | 'low';
  }[],
  keywordsFeedback?: KeywordsFeedback,
  overallSuggestions: string[]
}

interface ATSScoreResult {
  generalScore: number,
  jobSpecificScore?: number,
  feedback: ATSScoreFeedback
}

/**
 * Generate a professional summary based on job description and experience
 */
export async function generateProfessionalSummary(
  jobTitle: string, 
  jobDescription: string, 
  experience: any[], 
  skills: string[]
): Promise<string> {
  try {
    const response = await apiRequest('POST', '/api/resume-ai/summary', {
      jobTitle,
      jobDescription,
      experience,
      skills,
      maxLength: 250 // Request a slightly shorter summary to account for processing
    });
    
    const data = await response.json();
    let summary = data.summary || "";
    
    // Clean up any placeholder or hash-like strings that might appear
    if (summary.match(/[a-f0-9]{16}/) || // Check for hash-like patterns
        (summary.includes(":") && summary.length < 100)) { // Check for potential placeholder tokens
      console.log("Detected placeholder in summary, clearing field");
      return "";
    }
    
    // Ensure the summary is properly formatted and complete
    // First, clean up any trailing spaces or incomplete sentences
    summary = summary.trim();
    
    // Ensure client-side enforcement of 300 character limit, but trim to last complete sentence
    if (summary.length > 300) {
      // Find the last period, question mark, or exclamation point to trim to a complete sentence
      const lastSentenceEnd = Math.max(
        summary.lastIndexOf('.'), 
        summary.lastIndexOf('!'), 
        summary.lastIndexOf('?')
      );
      
      if (lastSentenceEnd > 0 && lastSentenceEnd < 290) {
        // If we found a sentence end in a reasonable position, cut there
        summary = summary.substring(0, lastSentenceEnd + 1);
      } else {
        // If we can't find a good breakpoint, truncate and add period
        summary = summary.substring(0, 297) + "...";
      }
    }
    
    // Ensure summary ends with proper punctuation
    if (summary && !summary.endsWith('.') && !summary.endsWith('!') && !summary.endsWith('?')) {
      summary = summary.trim() + '.';
    }
    
    // Fix double periods that might occur from trimming or API response
    summary = summary.replace(/\.+$/, '.').trim();
    
    return summary;
  } catch (error) {
    console.error('Error generating summary:', error);
    throw new Error('Failed to generate professional summary');
  }
}

interface EnhancementOptions {
  experienceTitle: string;
  jobKeywords: string[];
  titleKeywords: string[];
  keywordBalance: number;
  optimizationStrategy: string;
  focusAreas: string[];
  // Additional context for better enhancements
  position?: string;
  company?: string;
  description?: string;
}

/**
 * Enhance work experience bullet points to highlight relevant experience
 */
export async function enhanceExperienceBullets(
  jobTitle: string,
  jobDescription: string,
  existingBullets: string[],
  options?: {
    experienceTitle?: string;
    company?: string;
    description?: string;
    existingSkills?: string[];
    missingKeywords?: string[];
  }
): Promise<string[]> {
  try {
    // First check if we have ATS score data to provide missing keywords context
    const atsData = await calculateATSScore({
      targetJobTitle: jobTitle,
      jobDescription,
      workExperience: [{
        position: options?.experienceTitle || "",
        description: options?.description || "",
        achievements: existingBullets
      }]
    }, jobTitle, jobDescription);

    // Get all keywords for context
    const allKeywords = atsData?.feedback?.keywordsFeedback?.all || [];
    
    // Extract missing keywords from ATS data if available - these get priority
    const missingKeywords = atsData?.feedback?.keywordsFeedback?.missing || options?.missingKeywords || [];
    
    // Get previously matched keywords to avoid duplication
    const matchedKeywords = atsData?.feedback?.keywordsFeedback?.found || [];
    
    // Prepare additional skills context
    const existingSkills = options?.existingSkills || [...matchedKeywords];
    
    // Determine optimal keyword strategy - focus more heavily on missing keywords
    // if many are missing, otherwise balance natural language with keyword inclusion
    const keywordStrategy = missingKeywords.length > (allKeywords.length * 0.4) 
      ? "focus aggressively on incorporating missing keywords" 
      : "balance naturally sounding bullets with strategic keyword inclusion";

    const response = await apiRequest('POST', '/api/resume-ai/enhance-experience', {
      jobTitle,
      jobDescription,
      experienceItem: {
        position: options?.experienceTitle || "",
        company: options?.company || "",
        description: options?.description || "",
        achievements: existingBullets
      },
      existingSkills,
      missingKeywords,
      optimizationTarget: keywordStrategy,
      matchedKeywords,
      allKeywords
    });
    
    const data = await response.json();
    return data.enhancedBullets || [];
  } catch (error) {
    console.error('Failed to enhance experience bullets:', error);
    throw new Error('Could not enhance experience bullets. Please try again later.');
  }
}

/**
 * Extract relevant skills from job description
 */
export async function extractRelevantSkills(
  jobTitle: string,
  jobDescription: string,
  customCategories?: string[]
): Promise<{
  // Legacy format for backward compatibility
  technicalSkills: string[], 
  softSkills: string[],
  // New flexible format
  categorizedSkills: {
    [category: string]: string[]
  }
}> {
  try {
    const response = await apiRequest('POST', '/api/resume-ai/extract-skills', {
      jobTitle,
      jobDescription,
      customCategories: customCategories || []
    });
    
    const data = await response.json();
    
    // Return both legacy and new format
    return {
      // Legacy format
      technicalSkills: data.technicalSkills || [],
      softSkills: data.softSkills || [],
      // New flexible format
      categorizedSkills: data.categorizedSkills || {
        "Technical Skills": data.technicalSkills || [],
        "Soft Skills": data.softSkills || []
      }
    };
  } catch (error) {
    console.error('Failed to extract relevant skills:', error);
    throw new Error('Could not extract skills. Please try again later.');
  }
}

/**
 * Extract comprehensive skills with multiple categories
 */
export async function extractSkillsWithCategories(
  jobTitle: string,
  jobDescription: string,
  customCategories: string[] = []
): Promise<{
  [category: string]: string[]
}> {
  try {
    const response = await apiRequest('POST', '/api/resume-ai/extract-skills-comprehensive', {
      jobTitle,
      jobDescription,
      customCategories
    });
    
    const data = await response.json();
    return data.categorizedSkills || {};
  } catch (error) {
    console.error('Failed to extract categorized skills:', error);
    
    // Fallback to basic extraction
    const basicResult = await extractRelevantSkills(jobTitle, jobDescription);
    return basicResult.categorizedSkills;
  }
}

/**
 * Enhance project descriptions to highlight relevant experience
 */
export async function enhanceProjectDescription(
  jobTitle: string,
  jobDescription: string,
  project: any
): Promise<string> {
  try {
    const response = await apiRequest('POST', '/api/resume-ai/enhance-project', {
      jobTitle,
      jobDescription,
      project
    });
    
    const data = await response.json();
    return data.enhancedDescription;
  } catch (error) {
    console.error('Failed to enhance project description:', error);
    throw new Error('Could not enhance project description. Please try again later.');
  }
}

/**
 * Calculate ATS score for a resume
 */
export async function calculateATSScore(
  resumeData: any,
  jobTitle?: string,
  jobDescription?: string
): Promise<ATSScoreResult> {
  try {
    const response = await apiRequest('POST', '/api/resume-ai/ats-score', {
      resumeData,
      jobTitle,
      jobDescription
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to calculate ATS score:', error);
    throw new Error('Could not calculate ATS score. Please try again later.');
  }
}

/**
 * Generate skills based on just the target job position
 */
export async function generateSkillsForPosition(
  jobTitle: string,
  customCategories?: string[]
): Promise<{
  // Legacy format for backward compatibility
  technicalSkills: string[], 
  softSkills: string[],
  // New flexible format
  categorizedSkills: {
    [category: string]: string[]
  }
}> {
  try {
    const response = await apiRequest('POST', '/api/resume-ai/generate-position-skills', {
      jobTitle,
      customCategories: customCategories || []
    });
    
    const data = await response.json();
    
    // Return both legacy and new format
    return {
      // Legacy format
      technicalSkills: data.technicalSkills || [],
      softSkills: data.softSkills || [],
      // New flexible format
      categorizedSkills: data.categorizedSkills || {
        "Technical Skills": data.technicalSkills || [],
        "Soft Skills": data.softSkills || []
      }
    };
  } catch (error) {
    console.error('Failed to generate skills for position:', error);
    throw new Error('Could not generate skills. Please try again later.');
  }
}

/**
 * Generate skills with custom categories
 */
export async function generateSkillsWithCategories(
  jobTitle: string,
  customCategories: string[] = []
): Promise<{
  [category: string]: string[]
}> {
  try {
    const response = await apiRequest('POST', '/api/resume-ai/generate-skills-comprehensive', {
      jobTitle,
      customCategories
    });
    
    const data = await response.json();
    return data.categorizedSkills || {};
  } catch (error) {
    console.error('Failed to generate categorized skills:', error);
    
    // Fallback to basic generation
    const basicResult = await generateSkillsForPosition(jobTitle);
    return basicResult.categorizedSkills;
  }
}