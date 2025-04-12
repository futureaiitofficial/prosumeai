import OpenAI from "openai";
import { truncateText } from "../../openai";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generates a cover letter based on job description, resume data, and company information
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
    // Prepare resume summary if available
    let resumeSummary = "";
    
    if (resumeData) {
      // Extract relevant parts from resume
      const { fullName, email, phone, summary, workExperience, education, skills } = resumeData;
      
      resumeSummary = `
        Applicant Name: ${fullName || ''}
        Summary: ${summary || ''}
        
        Key Experience:
        ${workExperience ? workExperience.slice(0, 2).map((exp: any) => 
          `${exp.position} at ${exp.company} (${exp.startDate} - ${exp.current ? 'Present' : exp.endDate})
           ${exp.achievements ? exp.achievements.slice(0, 2).join('\n') : ''}
          `).join('\n') : ''}
        
        Education:
        ${education ? education.slice(0, 1).map((edu: any) => 
          `${edu.degree} in ${edu.fieldOfStudy} from ${edu.institution}`).join('\n') : ''}
        
        Key Skills: ${Array.isArray(skills) ? skills.slice(0, 10).join(', ') : ''}
      `;
    }
    
    // Determine the style instructions based on letterStyle
    let styleInstructions = "";
    switch (letterStyle.toLowerCase()) {
      case 'professional':
        styleInstructions = "Write in a formal, professional tone appropriate for traditional industries.";
        break;
      case 'creative':
        styleInstructions = "Write in a creative, engaging tone that showcases personality while remaining professional.";
        break;
      case 'modern':
        styleInstructions = "Write in a modern, conversational tone that balances professionalism with approachability.";
        break;
      case 'technical':
        styleInstructions = "Write in a precise, technical tone that emphasizes expertise and analytical skills.";
        break;
      default:
        styleInstructions = "Write in a formal, professional tone appropriate for traditional industries.";
    }
    
    // Truncate text to avoid token limits
    const truncatedJobDescription = truncateText(jobDescription, 2500);
    const truncatedResumeSummary = truncateText(resumeSummary, 1500);
    
    // Create the prompt
    const prompt = `
      Generate only the BODY CONTENT for a personalized cover letter for a ${jobTitle} position at ${companyName}.
      
      ${styleInstructions}
      
      The content should include:
      1. A brief, engaging opening paragraph that mentions the specific position and company (2-3 sentences)
      2. 2 body paragraphs (each 3-4 sentences) highlighting ONLY the most relevant qualifications
      3. A concise closing paragraph with a call to action (2-3 sentences)
      
      IMPORTANT CONSTRAINTS:
      - Total length must not exceed 300 words / 1800 characters
      - Keep paragraphs short (3-4 sentences maximum)
      - Focus on quality over quantity
      - Avoid repetition and filler content
      
      Job Description:
      ${truncatedJobDescription}
      
      ${truncatedResumeSummary ? `Applicant Information:\n${truncatedResumeSummary}` : ''}
      
      Keep the content concise, impactful, and focused on the most relevant qualifications for this specific position. Avoid generic statements and focus on demonstrating value to the employer.
      
      IMPORTANT: Do NOT include any of the following in your response:
      - Header information (address, contact info, date)
      - Salutation/greeting line
      - Company address
      - "Sincerely" or signature line
      - Formatting placeholders like [Your Address], [City, State], etc.
      
      ONLY generate the body paragraphs of the letter. The formatting and layout will be handled separately.
    `;
    
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert career coach who specializes in writing persuasive, tailored cover letters that highlight relevant experiences and skills. You excel at creating concise, impactful content that fits well on a single page."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800 // Reduced from 1500 to ensure shorter content
    });
    
    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Error generating cover letter:", error);
    throw new Error("Failed to generate cover letter");
  }
}

/**
 * Enhances an existing cover letter based on job description and company research
 */
export async function enhanceCoverLetter(
  content: string,
  jobTitle: string,
  jobDescription: string,
  companyName: string,
  feedback?: string
): Promise<string> {
  try {
    // Truncate inputs to avoid token limits
    const truncatedContent = truncateText(content, 2000);
    const truncatedJobDescription = truncateText(jobDescription, 1500);
    const truncatedFeedback = feedback ? truncateText(feedback, 500) : "";
    
    const prompt = `
      Enhance the following cover letter content for a ${jobTitle} position at ${companyName}.
      
      Current Cover Letter Content:
      ${truncatedContent}
      
      Job Description:
      ${truncatedJobDescription}
      
      ${truncatedFeedback ? `Additional Feedback to Address:\n${truncatedFeedback}` : ''}
      
      Please improve this cover letter by:
      1. Making it more compelling and persuasive
      2. Ensuring strong alignment with the job requirements
      3. Improving phrasing, tone, and flow
      4. Maintaining or reducing the overall length (do not make it longer)
      5. Eliminating generic statements and replacing them with specific value propositions
      6. Keeping paragraphs short (3-4 sentences maximum)
      
      IMPORTANT CONSTRAINTS:
      - Total length must not exceed 300 words / 1800 characters
      - The letter must fit comfortably on a single page
      - Keep paragraphs short and readable
      - Focus on quality over quantity
      
      IMPORTANT: Do NOT include any of the following in your response:
      - Header information (address, contact info, date)
      - Salutation/greeting line
      - Company address
      - "Sincerely" or signature line
      - Formatting placeholders like [Your Address], [City, State], etc.
      
      ONLY return the body paragraphs of the letter. The formatting and layout will be handled separately.
    `;
    
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert career coach who specializes in writing persuasive, tailored cover letters that highlight relevant experiences and skills. You excel at creating concise, impactful content that fits well on a single page."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800 // Reduced from 1500 to ensure shorter content
    });
    
    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Error enhancing cover letter:", error);
    throw new Error("Failed to enhance cover letter");
  }
}

/**
 * Analyzes the strength of a cover letter and provides improvement suggestions
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
    // Truncate inputs to avoid token limits
    const truncatedContent = truncateText(content, 2000);
    const truncatedJobDescription = truncateText(jobDescription, 1500);
    
    const prompt = `
      Analyze the following cover letter for a ${jobTitle} position.
      
      Cover Letter:
      ${truncatedContent}
      
      Job Description:
      ${truncatedJobDescription}
      
      Please provide:
      1. An overall score from 1-100 based on relevance, persuasiveness, professionalism, and alignment with the job
      2. 3-5 specific strengths of the cover letter
      3. 3-5 specific weaknesses or areas for improvement
      4. 3-5 actionable suggestions to improve the cover letter
      
      Format your response as JSON with the following structure:
      {
        "score": number,
        "strengths": [string],
        "weaknesses": [string],
        "suggestions": [string]
      }
    `;
    
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert career coach who analyzes cover letters and provides actionable feedback."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 1000
    });
    
    const messageContent = response.choices[0].message.content || '{}';
    const result = JSON.parse(messageContent);
    
    return {
      score: result.score || 0,
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      suggestions: result.suggestions || []
    };
  } catch (error) {
    console.error("Error analyzing cover letter:", error);
    throw new Error("Failed to analyze cover letter");
  }
}