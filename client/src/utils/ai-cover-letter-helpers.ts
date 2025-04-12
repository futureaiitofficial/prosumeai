import { apiRequest } from "@/lib/queryClient";

/**
 * Generate a cover letter based on job title, job description, and optional resume data
 */
export async function generateCoverLetter(
  jobTitle: string,
  jobDescription: string,
  companyName: string,
  resumeId?: number | null,
  resumeData?: any,
  recipientName?: string, 
  letterStyle: string = 'professional'
): Promise<string> {
  try {
    // Create a payload object without undefined or null values for resumeId
    const payload: any = {
      jobTitle,
      jobDescription,
      companyName,
      recipientName,
      letterStyle
    };
    
    // Only add resumeId if it's a valid number (not null or undefined)
    if (typeof resumeId === 'number') {
      payload.resumeId = resumeId;
    }
    
    // Only add resumeData if provided
    if (resumeData) {
      payload.resumeData = resumeData;
    }
    
    const response = await apiRequest('POST', '/api/cover-letter-ai/generate', payload);
    
    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('Failed to generate cover letter:', error);
    throw new Error('Could not generate cover letter. Please try again later.');
  }
}

/**
 * Enhance an existing cover letter
 */
export async function enhanceCoverLetter(
  content: string,
  jobTitle: string,
  jobDescription: string,
  companyName: string,
  feedback?: string
): Promise<string> {
  try {
    const response = await apiRequest('POST', '/api/cover-letter-ai/enhance', {
      content,
      jobTitle,
      jobDescription,
      companyName,
      feedback
    });
    
    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('Failed to enhance cover letter:', error);
    throw new Error('Could not enhance cover letter. Please try again later.');
  }
}

/**
 * Analyze a cover letter and get feedback
 */
export async function analyzeCoverLetter(
  content: string,
  jobTitle: string,
  jobDescription: string
): Promise<{
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}> {
  try {
    const response = await apiRequest('POST', '/api/cover-letter-ai/analyze', {
      content,
      jobTitle,
      jobDescription
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to analyze cover letter:', error);
    throw new Error('Could not analyze cover letter. Please try again later.');
  }
}