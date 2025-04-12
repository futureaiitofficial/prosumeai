import { truncateText } from '../../openai';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// The newest OpenAI model is "gpt-4o" which was released May 13, 2024
const MODEL = "gpt-4o";

/**
 * Generates a professional summary based on job description and experience
 */
export async function generateSummary(
  jobTitle: string,
  jobDescription: string,
  experience: { position: string; company: string; description: string }[],
  skills: string[]
): Promise<string> {
  try {
    // First extract key ATS keywords from job description
    const keywordsResponse = await extractSkills(jobTitle, jobDescription);
    const jobKeywords = [
      ...keywordsResponse.technicalSkills,
      ...keywordsResponse.softSkills
    ];
    
    const prompt = `
You are an expert resume writer. Create a professional summary for a job applicant targeting the position of "${jobTitle}".

Job Description:
${truncateText(jobDescription, 1000)}

Applicant's Experience:
${experience.map(exp => `- ${exp.position} at ${exp.company}: ${truncateText(exp.description, 200)}`).join('\n')}

Applicant's Skills:
${skills.join(', ')}

Key ATS Keywords From Job Description:
${jobKeywords.join(', ')}

Please write a VERY CONCISE professional summary with EXACTLY 300 characters or less (including spaces).
The summary should:
1. Highlight the applicant's relevant experience and skills that MATCH the job description
2. Strategically incorporate 3-5 of the most important ATS keywords from the job description
3. Demonstrate clear alignment between applicant's background and the target role
4. Prioritize featuring skills and experience directly mentioned in the job description
5. Showcase quantifiable achievements where possible

Do not use first person pronouns (I, me, my). Use third person or implied first person.
THE RETURNED TEXT MUST BE 300 CHARACTERS OR LESS (INCLUDING SPACES). This is critically important.
`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.7,
    });

    let summary = response.choices[0]?.message?.content?.trim() || "";
    
    // Ensure the summary is not longer than 300 characters
    if (summary.length > 300) {
      summary = summary.substring(0, 297) + "...";
    }
    
    return summary;
  } catch (error) {
    console.error('Error generating professional summary:', error);
    throw new Error('Failed to generate professional summary');
  }
}

/**
 * Enhances work experience bullet points to match the target job position
 */
export async function enhanceExperiencePoints(
  jobTitle: string,
  jobDescription: string,
  experienceItem: any,
  context?: {
    existingSkills: string[],
    missingKeywords: string[],
    optimizationTarget: string
  }
): Promise<string[]> {
  try {
    const { company, position, description, achievements } = experienceItem;
    
    // Extract existing achievements or description
    const existingContent = achievements?.length 
      ? achievements.join('\n') 
      : description || '';

    // Extract keywords from job description for better matching
    const keywordsResult = await extractSkills(jobTitle, jobDescription);
    const jobKeywords = [
      ...keywordsResult.technicalSkills,
      ...keywordsResult.softSkills
    ];
    
    // If we have missing keywords from ATS analysis, prioritize those
    const priorityKeywords = context?.missingKeywords?.length ? 
      context.missingKeywords : 
      jobKeywords;
    
    // Determine if there's a mismatch between current position and target job
    const positionLower = position?.toLowerCase() || '';
    const jobTitleLower = jobTitle?.toLowerCase() || '';
    
    // Analyze job title similarity
    const positionWords = positionLower.split(/\s+/).filter((word: string) => word.length > 3);
    const jobTitleWords = jobTitleLower.split(/\s+/).filter((word: string) => word.length > 3);
    
    // Calculate overlap between position and target job title
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
    const prompt = isCareerChange 
      ? generateCareerChangePrompt(position, jobTitle, company, existingContent, priorityKeywords, context) 
      : generateMatchingRolePrompt(position, jobTitle, jobDescription, company, existingContent, overlapPercentage, priorityKeywords, context);
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    });

    // Process the response to extract bullet points
    const content = response.choices[0]?.message?.content?.trim() || "";
    
    // Split by newlines and clean up each bullet point
    const bullets = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Remove leading bullet point symbols like "- ", "• ", "* "
        return line.replace(/^[-•*]\s+/, '');
      });

    return bullets;
  } catch (error) {
    console.error('Error enhancing experience bullets:', error);
    throw new Error('Failed to enhance experience bullets');
  }
}

/**
 * Generates a prompt for career change situations (different role types)
 */
function generateCareerChangePrompt(
  currentPosition: string, 
  targetPosition: string, 
  company: string, 
  existingContent: string,
  jobKeywords: string[],
  context?: {
    existingSkills: string[],
    missingKeywords: string[],
    optimizationTarget: string
  }
): string {
  const contextualGuidance = context?.optimizationTarget || "balance keywords naturally";
  const existingSkillsContext = context?.existingSkills?.length ? 
    `\nApplicant's Existing Skills: ${context.existingSkills.join(', ')}` : '';
  
  return `
As an expert resume writer, create 3-5 authentic bullet points for a career transition.

CURRENT ROLE: ${currentPosition} at ${company}
TARGET POSITION: ${targetPosition}${existingSkillsContext}

PRIORITY KEYWORDS TO INCORPORATE (where authentic and applicable):
${jobKeywords.join(', ')}

OPTIMIZATION STRATEGY: ${contextualGuidance}

⚠️ CRITICAL INSTRUCTIONS ⚠️
These positions are in different career fields. You must:
1. Write bullet points that HONESTLY reflect work done as a ${currentPosition}
2. Focus on REAL achievements and responsibilities from the ${currentPosition} role
3. DO NOT fabricate skills or experience that wouldn't be part of a ${currentPosition} role
4. Mention skills that naturally transfer to ${targetPosition} ONLY if authentic
5. Strategically incorporate 1-2 priority keywords per bullet point, but ONLY if they genuinely apply
6. Quantify achievements with numbers/percentages where appropriate
7. Balance keyword optimization with authentic experience description

For example:
• If someone was a "Chef" applying for "Software Developer":
  ✅ "Created standardized recipe documentation system, organizing 200+ recipes in searchable digital format"
  ❌ "Developed Python applications and designed SQL databases" (fabricated skills)

Keep each bullet point authentic, concise (15-20 words), and starting with a strong action verb.
Return ONLY the bullet points with no explanations.

Current Content:
${truncateText(existingContent, 300)}
`;
}

/**
 * Generates a prompt for similar roles (same career field)
 */
function generateMatchingRolePrompt(
  currentPosition: string, 
  targetPosition: string, 
  jobDescription: string, 
  company: string, 
  existingContent: string,
  overlapPercentage: number,
  jobKeywords: string[],
  context?: {
    existingSkills: string[],
    missingKeywords: string[],
    optimizationTarget: string
  }
): string {
  // Determine how closely the positions align
  const alignmentLevel = overlapPercentage > 70 ? "highly similar" : 
                          overlapPercentage > 50 ? "related" : 
                          "somewhat related";
  
  const contextualGuidance = context?.optimizationTarget || "balance keywords naturally";
  const existingSkillsContext = context?.existingSkills?.length ? 
    `\nApplicant's Existing Skills: ${context.existingSkills.join(', ')}` : '';
  
  return `
You are an expert resume writer enhancing work experience for a ${alignmentLevel} position.

CURRENT ROLE: ${currentPosition} at ${company}
TARGET POSITION: ${targetPosition}${existingSkillsContext}

Job Description:
${truncateText(jobDescription, 800)}

PRIORITY ATS KEYWORDS TO INCORPORATE:
${jobKeywords.join(', ')}

OPTIMIZATION STRATEGY: ${contextualGuidance}

IMPORTANT GUIDELINES:
1. Write authentic bullet points that accurately represent responsibilities as a ${currentPosition}
2. Emphasize aspects of ${currentPosition} that naturally relate to ${targetPosition}
3. Strategically incorporate the most relevant keywords from the priority list above
4. Use 2-3 different keywords per bullet point, focusing on the most important ones first
5. Include metrics and quantifiable achievements where possible (percentages, numbers, timeframes)
6. Begin each bullet with a strong action verb (achieved, delivered, implemented, etc.)
7. DO NOT fabricate experiences that wouldn't be part of the ${currentPosition} role
8. Balance ATS keyword optimization with natural, readable language

Create 3-5 powerful bullet points that are concise (15-20 words).
Format your response as a list of bullet points only, with no additional text.

Current Content:
${truncateText(existingContent, 300)}
`;
}

/**
 * Extracts relevant skills from job description
 */
export async function extractSkills(
  jobTitle: string,
  jobDescription: string
): Promise<{ technicalSkills: string[], softSkills: string[] }> {
  try {
    // Use the more comprehensive categorization function
    const categorizedKeywords = await extractKeywordsWithCategories(jobTitle, jobDescription);
    
    // For backward compatibility, map the categorized keywords to the expected format
    return {
      technicalSkills: [
        ...categorizedKeywords.technicalSkills,
        ...categorizedKeywords.tools,
        ...categorizedKeywords.methodologies
      ],
      softSkills: [
        ...categorizedKeywords.softSkills,
        ...categorizedKeywords.jobFunctions.slice(0, 3) // Include a few job functions as skills
      ]
    };
  } catch (error) {
    // Fall back to the original implementation if the new one fails
    console.error('Error using enhanced skill extraction, falling back to basic extraction:', error);
    return extractSkillsLegacy(jobTitle, jobDescription);
  }
}

/**
 * Legacy version of the skills extraction function
 */
async function extractSkillsLegacy(
  jobTitle: string,
  jobDescription: string
): Promise<{ technicalSkills: string[], softSkills: string[] }> {
  try {
    const prompt = `
You are an expert resume ATS specialist. Extract relevant skills from the following job description for a "${jobTitle}" position, focusing on keywords that an ATS system would recognize.

Job Description:
${truncateText(jobDescription, 2000)}

Please identify:
1. Technical skills (hard skills, tools, technologies, certifications, methodologies, software)
2. Soft skills (interpersonal abilities, character traits, work style attributes)

Format your response as a JSON object with two arrays: "technicalSkills" and "softSkills".
Each array should contain 8-12 relevant skills as strings.

IMPORTANT:
- Prioritize exact keywords and phrases from the job description
- Focus on specific skills (like "React.js") rather than vague terms (like "programming")
- Include specific methodologies, tools, and technologies mentioned
- Include industry-specific terminology that appears in the job description
- Be precise and use the exact wording from the job description where possible

Do not include explanations, just the JSON object.
`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 700,
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content?.trim() || "{}";
    const skills = JSON.parse(content);

    return {
      technicalSkills: skills.technicalSkills || [],
      softSkills: skills.softSkills || []
    };
  } catch (error) {
    console.error('Error extracting skills with legacy method:', error);
    throw new Error('Failed to extract skills from job description');
  }
}

/**
 * Enhances project description to highlight relevant experience
 */
export async function enhanceProject(
  jobTitle: string,
  jobDescription: string,
  project: any
): Promise<string> {
  try {
    const { name, description, technologies } = project;
    
    const prompt = `
You are an expert resume writer. Enhance the following project description to make it more relevant for a "${jobTitle}" position.

Job Description:
${truncateText(jobDescription, 1000)}

Project to Enhance:
Name: ${name}
Current Description: ${truncateText(description, 300)}
Technologies: ${technologies ? technologies.join(', ') : 'N/A'}

Please create an enhanced project description that:
1. Emphasizes aspects relevant to the target job
2. Highlights transferable skills and achievements
3. Incorporates keywords from the job description
4. Mentions technologies used and their relevance
5. Quantifies impact where possible
6. Is concise (60-100 words)

Format your response as a paragraph with no additional text or explanation.
`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 350,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content?.trim() || "";
  } catch (error) {
    console.error('Error enhancing project description:', error);
    throw new Error('Failed to enhance project description');
  }
}

/**
 * Calculates ATS score for a resume
 */
export async function calculateATSScore(
  resumeData: any,
  jobTitle?: string,
  jobDescription?: string
): Promise<{
  generalScore: number;
  jobSpecificScore?: number;
  feedback: {
    generalFeedback: {
      category: string;
      score: number;
      feedback: string;
      priority: 'high' | 'medium' | 'low';
    }[];
    keywordsFeedback?: {
      missing: string[];
      found: string[];
    };
    overallSuggestions: string[];
  };
}> {
  try {
    // First, calculate the general ATS score
    const generalScore = calculateGeneralATSScore(resumeData);
    
    // If job information is provided, calculate job-specific score
    let jobSpecificScore = undefined;
    let keywordsFeedback = undefined;
    
    if (jobTitle && jobDescription) {
      const jobSpecificResults = await calculateJobSpecificATSScore(resumeData, jobTitle, jobDescription);
      jobSpecificScore = jobSpecificResults.score;
      keywordsFeedback = jobSpecificResults.keywordsFeedback;
    }
    
    // Check if there's a job title mismatch
    let jobTitleMismatch = false;
    if (jobTitle && resumeData.workExperience && resumeData.workExperience.length > 0) {
      // Check if any work experience position matches job title
      const jobTitleLower = jobTitle.toLowerCase();
      const hasMatchingPosition = resumeData.workExperience.some((exp: any) => {
        if (!exp.position) return false;
        const positionLower = exp.position.toLowerCase();
        
        // Check for significant overlap
        const jobTitleWords = jobTitleLower.split(/\s+/).filter((w: string) => w.length > 3);
        const positionWords = positionLower.split(/\s+/).filter((w: string) => w.length > 3);
        
        // If there's at least one meaningful overlap, consider it a match
        return jobTitleWords.some((word: string) => positionWords.includes(word));
      });
      
      jobTitleMismatch = !hasMatchingPosition;
    }
    
    // Generate overall suggestions
    const overallSuggestions = generateOverallSuggestions(
      generalScore.feedback, 
      jobSpecificScore !== undefined ? jobSpecificScore : null,
      jobTitleMismatch
    );
    
    return {
      generalScore: generalScore.totalScore,
      jobSpecificScore,
      feedback: {
        generalFeedback: generalScore.feedback,
        keywordsFeedback,
        overallSuggestions
      }
    };
  } catch (error) {
    console.error('Error calculating ATS score:', error);
    throw new Error('Failed to calculate ATS score');
  }
}

// Helper function to calculate general ATS score based on detailed criteria
function calculateGeneralATSScore(resumeData: any): {
  totalScore: number,
  feedback: Array<{
    category: string;
    score: number;
    feedback: string;
    priority: 'high' | 'medium' | 'low';
  }>
} {
  const feedback: Array<{
    category: string;
    score: number;
    feedback: string;
    priority: 'high' | 'medium' | 'low';
  }> = [];
  
  // Set initial score to 0 - only award points for actual content
  let totalScore = 0;
  let keywordMatchScore = 0;
  let keywordPlacementScore = 0;
  let formattingComplianceScore = 0;
  let relevanceOfExperienceScore = 0;
  let educationCertificationsScore = 0;
  
  // Check if the resume has enough content to be properly evaluated
  const hasMinimalContent = 
    (resumeData.workExperience && resumeData.workExperience.length > 0) ||
    (resumeData.education && resumeData.education.length > 0) ||
    (resumeData.skills && resumeData.skills.length > 0) ||
    (resumeData.technicalSkills && resumeData.technicalSkills.length > 0) ||
    (resumeData.softSkills && resumeData.softSkills.length > 0) ||
    (resumeData.summary && resumeData.summary.trim().length > 30);
  
  // If there's almost no content, give a very low base score with helpful feedback
  if (!hasMinimalContent) {
    feedback.push({
      category: 'Content Completeness',
      score: 5,
      feedback: 'Your resume needs more content. Add your work experience, education, skills, and a professional summary.',
      priority: 'high'
    });
    
    feedback.push({
      category: 'ATS Compatibility',
      score: 5,
      feedback: 'Most ATS systems require detailed professional information to properly evaluate your resume.',
      priority: 'high'
    });
    
    feedback.push({
      category: 'Resume Structure',
      score: 5,
      feedback: 'Create a complete resume with standard sections to improve your score.',
      priority: 'high'
    });
    
    // Return very low score for essentially empty resume
    return {
      totalScore: 5,
      feedback
    };
  }
  
  // 1. KEYWORD MATCH (40% of total score)
  // This represents how well the resume includes important industry and role keywords
  
  // Extract all skills from resume
  const allSkills = [
    ...(resumeData.skills || []),
    ...(resumeData.technicalSkills || []),
    ...(resumeData.softSkills || [])
  ];
  
  // Common general professional keywords that should be present
  const generalKeywords = [
    'communication', 'teamwork', 'leadership', 'project management', 'problem solving',
    'time management', 'analytical', 'collaborative', 'innovative', 'detail-oriented'
  ];
  
  // Convert resume data to a single string for keyword searching
  const resumeText = JSON.stringify(resumeData).toLowerCase();
  
  // Check for general keywords
  const matchedKeywords = generalKeywords.filter(keyword => 
    resumeText.includes(keyword.toLowerCase())
  );
  
  // Calculate base keyword score
  const baseKeywordScore = allSkills.length > 0 ? 
    Math.min(allSkills.length, 20) / 20 * 25 : 0;
  
  // Calculate general keywords score
  const generalKeywordScore = generalKeywords.length > 0 ? 
    (matchedKeywords.length / generalKeywords.length) * 15 : 0;
  
  // Check if keywords are organized in categories (better for ATS)
  let organizationBonus = 0;
  const hasOrganizedSkills = 
    (resumeData.technicalSkills && resumeData.technicalSkills.length > 0) &&
    (resumeData.softSkills && resumeData.softSkills.length > 0);
    
  if (hasOrganizedSkills) {
    organizationBonus = allSkills.length > 5 ? 5 : 0;
  }
  
  keywordMatchScore = Math.min(40, baseKeywordScore + generalKeywordScore + organizationBonus);
  
  feedback.push({
    category: 'Keyword Match',
    score: keywordMatchScore / 0.4, // Convert to scale of 100
    feedback: keywordMatchScore < 25
      ? `Add more relevant skills and industry keywords. Consider including: ${generalKeywords.filter(k => !matchedKeywords.includes(k)).slice(0, 5).join(', ')}.`
      : keywordMatchScore < 35
        ? 'Good keyword inclusion. Consider organizing your skills into technical and soft skill categories.'
        : 'Excellent keyword match with a good balance of technical and soft skills.',
    priority: keywordMatchScore < 25 ? 'high' : keywordMatchScore < 35 ? 'medium' : 'low'
  });
  
  // 2. KEYWORD PLACEMENT (20% of total score)
  // This assesses if keywords appear in critical sections like Summary, Experience, Skills
  
  let keywordsInCriticalSections = 0;
  const totalKeywords = allSkills.length;
  
  // Check summary for keywords
  if (resumeData.summary) {
    const summaryLower = resumeData.summary.toLowerCase();
    keywordsInCriticalSections += allSkills.filter(skill => 
      summaryLower.includes(skill.toLowerCase())
    ).length;
  }
  
  // Check work experience for keywords
  if (resumeData.workExperience && resumeData.workExperience.length > 0) {
    for (const exp of resumeData.workExperience) {
      // Check position title
      if (exp.position) {
        const positionLower = exp.position.toLowerCase();
        keywordsInCriticalSections += allSkills.filter(skill => 
          positionLower.includes(skill.toLowerCase())
        ).length;
      }
      
      // Check achievements
      if (exp.achievements && exp.achievements.length > 0) {
        for (const achievement of exp.achievements) {
          const achievementLower = achievement.toLowerCase();
          keywordsInCriticalSections += allSkills.filter(skill => 
            achievementLower.includes(skill.toLowerCase())
          ).length;
        }
      }
      
      // Check description
      if (exp.description) {
        const descriptionLower = exp.description.toLowerCase();
        keywordsInCriticalSections += allSkills.filter(skill => 
          descriptionLower.includes(skill.toLowerCase())
        ).length;
      }
    }
  }
  
  // Calculate placement score (avoid division by zero)
  if (totalKeywords > 0) {
    keywordPlacementScore = Math.min(20, (keywordsInCriticalSections / Math.max(1, totalKeywords)) * 20);
  }
  
  feedback.push({
    category: 'Keyword Placement',
    score: keywordPlacementScore / 0.2, // Convert to scale of 100
    feedback: keywordPlacementScore < 10
      ? 'Improve your score by including more skills in your summary and work experience descriptions.'
      : keywordPlacementScore < 15
        ? 'Good keyword placement. Add more skills to your professional summary for better visibility.'
        : 'Excellent keyword placement throughout critical resume sections.',
    priority: keywordPlacementScore < 10 ? 'high' : keywordPlacementScore < 15 ? 'medium' : 'low'
  });
  
  // 3. FORMATTING COMPLIANCE (15% of total score)
  // Assess adherence to ATS-friendly formatting guidelines
  
  formattingComplianceScore = 15; // Start with full points and subtract for issues
  const formattingIssues: string[] = [];
  
  // Check for proper structure
  const expectedSections = ['summary', 'experience', 'education', 'skills'];
  const presentSections: string[] = [];
  
  if (resumeData.summary && resumeData.summary.length > 30) presentSections.push('summary');
  if (resumeData.workExperience && resumeData.workExperience.length > 0) presentSections.push('experience');
  if (resumeData.education && resumeData.education.length > 0) presentSections.push('education');
  if ((resumeData.skills && resumeData.skills.length > 0) || 
      (resumeData.technicalSkills && resumeData.technicalSkills.length > 0) ||
      (resumeData.softSkills && resumeData.softSkills.length > 0)) {
    presentSections.push('skills');
  }
  
  const missingSections = expectedSections.filter(section => !presentSections.includes(section));
  if (missingSections.length > 0) {
    formattingIssues.push(`Missing standard sections: ${missingSections.join(', ')}`);
    formattingComplianceScore -= Math.min(3, missingSections.length * 3);
  }
  
  // Check for contact information completeness
  const contactFields = ['fullName', 'email', 'phone'];
  const missingContactFields = contactFields.filter(field => 
    !resumeData[field] || 
    (field === 'email' && !resumeData[field].includes('@')) ||
    (field === 'phone' && resumeData[field].length < 5) ||
    (field === 'fullName' && resumeData[field].length < 3)
  );
  
  if (missingContactFields.length > 0) {
    formattingIssues.push(`Missing contact details: ${missingContactFields.join(', ')}`);
    formattingComplianceScore -= Math.min(3, missingContactFields.length * 1.5);
  }
  
  // Check for inconsistent formatting
  // Date formats
  if (resumeData.workExperience && resumeData.workExperience.length > 1) {
    const dateFormats = resumeData.workExperience
      .filter((exp: any) => exp.startDate)
      .map((exp: any) => {
        // Check if date appears to be in the same format based on length and separators
        return exp.startDate.length + (exp.startDate.includes('/') ? '/': '') + 
               (exp.startDate.includes('-') ? '-': '') + (exp.startDate.includes(' ') ? ' ': '');
      });
    
    // Check if we have different date formats
    const uniqueFormats = new Set(dateFormats);
    if (uniqueFormats.size > 1) {
      formattingIssues.push('Inconsistent date formats in work experience');
      formattingComplianceScore -= 3;
    }
  }
  
  // Content presentation consistency
  if (resumeData.workExperience && resumeData.workExperience.length > 1) {
    const hasAchievements = resumeData.workExperience.filter((exp: any) => 
      exp.achievements && exp.achievements.length > 0
    );
    
    const hasDescriptions = resumeData.workExperience.filter((exp: any) => 
      exp.description && exp.description.trim() !== ''
    );
    
    if (hasAchievements.length > 0 && hasDescriptions.length > 0 && 
        hasAchievements.length !== resumeData.workExperience.length) {
      formattingIssues.push('Inconsistent use of bullet points across experience entries');
      formattingComplianceScore -= 3;
    }
  }
  
  // Ensure score doesn't go below 0
  formattingComplianceScore = Math.max(0, formattingComplianceScore);
  
  feedback.push({
    category: 'Formatting Compliance',
    score: (formattingComplianceScore / 15) * 100, // Convert to scale of 100
    feedback: formattingIssues.length > 0
      ? `Format issues: ${formattingIssues.slice(0, 2).join('. ')}`
      : 'Excellent formatting. Your resume follows standard ATS-friendly structure.',
    priority: formattingComplianceScore < 10 ? 'high' : formattingComplianceScore < 12 ? 'medium' : 'low'
  });
  
  // 4. RELEVANCE OF EXPERIENCE (15% of total score)
  // Assess how well the experience matches the target role (or general professional standards)
  
  // Check if target job title is provided
  if (resumeData.targetJobTitle) {
    const targetJobLower = resumeData.targetJobTitle.toLowerCase();
    let relevantExperienceCount = 0;
    
    // Check work experience for relevance to target job
    if (resumeData.workExperience && resumeData.workExperience.length > 0) {
      for (const exp of resumeData.workExperience) {
        if (exp.position) {
          const positionLower = exp.position.toLowerCase();
          
          // Check for similarity with target job title
          // Using a simple word overlap approach
          const targetJobWords = targetJobLower.split(/\s+/).filter((word: string) => word.length > 3);
          const positionWords = positionLower.split(/\s+/).filter((word: string) => word.length > 3);
          
          const commonWords = targetJobWords.filter((word: string) => 
            positionWords.includes(word)
          ).length;
          
          // If there's significant overlap or exact match
          if (commonWords > 0 || positionLower.includes(targetJobLower) || targetJobLower.includes(positionLower)) {
            relevantExperienceCount++;
          }
        }
      }
    }
    
    // Calculate relevance score
    const totalExperiences = resumeData.workExperience ? resumeData.workExperience.length : 0;
    if (totalExperiences > 0) {
      relevanceOfExperienceScore = Math.min(15, (relevantExperienceCount / totalExperiences) * 15);
    }
  } else {
    // Without target job, we evaluate general quality of experience descriptions
    
    // Check work experience for detail level and achievements
    if (resumeData.workExperience && resumeData.workExperience.length > 0) {
      let detailedExperienceCount = 0;
      
      for (const exp of resumeData.workExperience) {
        // Check if achievements have good detail
        if (exp.achievements && exp.achievements.length >= 3) {
          detailedExperienceCount++;
        } 
        // Or if description is detailed enough
        else if (exp.description && exp.description.length > 100) {
          detailedExperienceCount++;
        }
      }
      
      // Calculate quality score
      const totalExperiences = resumeData.workExperience.length;
      relevanceOfExperienceScore = Math.min(15, (detailedExperienceCount / totalExperiences) * 15);
    } else {
      relevanceOfExperienceScore = 0;
    }
  }
  
  feedback.push({
    category: 'Experience Relevance',
    score: (relevanceOfExperienceScore / 15) * 100, // Convert to scale of 100
    feedback: relevanceOfExperienceScore < 8
      ? 'Your work experience could better align with your target role. Add more relevant positions or emphasize transferable skills.'
      : relevanceOfExperienceScore < 12
        ? 'Good job experience relevance. Consider highlighting more specific achievements relevant to your target role.'
        : 'Excellent job experience alignment with your target role.',
    priority: relevanceOfExperienceScore < 8 ? 'high' : relevanceOfExperienceScore < 12 ? 'medium' : 'low'
  });
  
  // 5. EDUCATION & CERTIFICATIONS (10% of total score)
  
  // Start with no points
  educationCertificationsScore = 0;
  
  // Award points for education
  if (resumeData.education && resumeData.education.length > 0) {
    // Basic points for having education
    educationCertificationsScore += 5;
    
    // Check for education completeness
    let completeEducationCount = 0;
    for (const edu of resumeData.education) {
      const hasInstitution = edu.institution && edu.institution.length > 0;
      const hasDegree = edu.degree && edu.degree.length > 0;
      const hasFieldOfStudy = edu.fieldOfStudy && edu.fieldOfStudy.length > 0;
      const hasDates = edu.startDate || edu.endDate;
      
      if (hasInstitution && hasDegree && hasFieldOfStudy && hasDates) {
        completeEducationCount++;
      }
    }
    
    // Bonus for complete education entries
    if (completeEducationCount === resumeData.education.length) {
      educationCertificationsScore += 2;
    }
  }
  
  // Award points for certifications
  if (resumeData.certifications && resumeData.certifications.length > 0) {
    // Points based on number of certifications (up to 3)
    educationCertificationsScore += Math.min(3, resumeData.certifications.length);
  }
  
  // Ensure score doesn't exceed max
  educationCertificationsScore = Math.min(10, educationCertificationsScore);
  
  feedback.push({
    category: 'Education & Certifications',
    score: (educationCertificationsScore / 10) * 100, // Convert to scale of 100
    feedback: educationCertificationsScore < 5
      ? 'Add more detail to your education section. Include institutions, degrees, and dates.'
      : educationCertificationsScore < 8
        ? 'Good education details. Consider adding relevant certifications to strengthen your qualifications.'
        : 'Excellent education and certification details.',
    priority: educationCertificationsScore < 5 ? 'high' : educationCertificationsScore < 8 ? 'medium' : 'low'
  });
  
  // Calculate total score
  totalScore = Math.round(
    keywordMatchScore + 
    keywordPlacementScore + 
    formattingComplianceScore + 
    relevanceOfExperienceScore + 
    educationCertificationsScore
  );
  
  return {
    totalScore,
    feedback
  };
}

// Helper function to calculate job-specific ATS score
async function calculateJobSpecificATSScore(
  resumeData: any,
  jobTitle: string,
  jobDescription: string
): Promise<{ 
  score: number,
  keywordsFeedback: {
    missing: string[],
    found: string[],
    all: string[],
    categories: {
      [category: string]: {
        found: string[],
        missing: string[],
        all: string[]
      }
    }
  }
}> {
  try {
    // Extract keywords from job description with categorization
    const keywordsResponse = await extractKeywordsWithCategories(jobTitle, jobDescription);
    
    // Flatten all keywords for overall matching
    const allKeywords = Object.values(keywordsResponse).flatMap(keywords => keywords);
    
    // Prepare resume content - create a normalized version for better matching
    const resumeText = JSON.stringify(resumeData).toLowerCase();
    const resumeNormalized = normalizeText(resumeText);
    
    // Track found and missing keywords by category
    const categories: {
      [category: string]: {
        found: string[],
        missing: string[],
        all: string[]
      }
    } = {};
    
    // Process each category
    for (const [category, keywords] of Object.entries(keywordsResponse)) {
      const foundInCategory: string[] = [];
      const missingInCategory: string[] = [];
      
      // Check each keyword in this category
      for (const keyword of keywords) {
        // Check direct inclusion first
        if (resumeText.includes(keyword.toLowerCase())) {
          foundInCategory.push(keyword);
        } 
        // Try variations for stemming/fuzzy matching if exact match not found
        else if (hasPartialOrVariationMatch(resumeNormalized, keyword)) {
          foundInCategory.push(keyword);
        }
        else {
          missingInCategory.push(keyword);
        }
      }
      
      // Store results for this category
      categories[category] = {
        found: foundInCategory,
        missing: missingInCategory,
        all: keywords
      };
    }
    
    // Calculate overall found/missing keywords
    const foundKeywords = Object.values(categories).flatMap(cat => cat.found);
    const missingKeywords = Object.values(categories).flatMap(cat => cat.missing);
    
    // Calculate overall match percentage with weighted categories
    // Technical skills and job-specific terms get higher weight
    let weightedFoundCount = 0;
    let weightedTotalCount = 0;
    
    // Define weights for different categories
    const categoryWeights = {
      'technicalSkills': 1.5,     // Higher weight for technical skills
      'softSkills': 1.0,          // Standard weight for soft skills
      'industryTerms': 1.4,       // Higher weight for industry-specific terms
      'tools': 1.3,               // Higher weight for tools/software
      'methodologies': 1.3,       // Higher weight for methodologies
      'requirements': 1.2,        // Higher weight for explicit requirements
      'certificates': 1.1,        // Slightly higher weight for certs
      'education': 0.9,           // Lower weight for education
      'jobFunctions': 1.2,        // Higher weight for job functions
      'default': 1.0              // Default weight
    };
    
    // Calculate weighted scores
    for (const [category, data] of Object.entries(categories)) {
      const weight = categoryWeights[category as keyof typeof categoryWeights] || categoryWeights.default;
      weightedFoundCount += data.found.length * weight;
      weightedTotalCount += data.all.length * weight;
    }
    
    // Calculate match percentage with weights
    const keywordMatchPercentage = weightedTotalCount > 0 
      ? (weightedFoundCount / weightedTotalCount) * 100 
      : 0;
    
    // Convert to score out of 100
    const score = Math.round(keywordMatchPercentage);
    
    return {
      score,
      keywordsFeedback: {
        missing: missingKeywords,
        found: foundKeywords,
        all: allKeywords,
        categories
      }
    };
  } catch (error) {
    console.error('Error calculating job-specific ATS score:', error);
    throw new Error('Failed to calculate job-specific ATS score');
  }
}

/**
 * Helper function to extract keywords from job description with categorization
 */
async function extractKeywordsWithCategories(
  jobTitle: string,
  jobDescription: string
): Promise<{ [category: string]: string[] }> {
  try {
    const prompt = `
You are an expert ATS system analyst. Extract and categorize all relevant keywords from the following job description for a "${jobTitle}" position.

Job Description:
${truncateText(jobDescription, 2000)}

Please extract keywords in the following categories:
1. technicalSkills - Technical skills, programming languages, hard skills
2. softSkills - Interpersonal and character traits
3. tools - Software, hardware, platforms, and specific tools
4. methodologies - Frameworks, methodologies, and processes
5. requirements - Explicitly stated requirements or qualifications
6. certificates - Required or preferred certifications
7. education - Educational requirements or preferences
8. industryTerms - Industry-specific terminology and domain knowledge
9. jobFunctions - Core job functions and responsibilities

Format your response as a JSON object where each key is one of the categories above and each value is an array of string keywords.
IMPORTANT: Return only exact phrases and terms directly from the job description - do not paraphrase or generalize.
Focus on extracting the SPECIFIC keywords an ATS system would be looking for.

Do not include explanations, just the JSON object.
`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content?.trim() || "{}";
    const categoryKeywords = JSON.parse(content);
    
    // Ensure we have values for all expected categories
    const categories = [
      'technicalSkills', 'softSkills', 'tools', 'methodologies', 
      'requirements', 'certificates', 'education', 'industryTerms', 'jobFunctions'
    ];
    
    // Initialize missing categories with empty arrays
    for (const category of categories) {
      if (!categoryKeywords[category]) {
        categoryKeywords[category] = [];
      }
    }

    return categoryKeywords;
  } catch (error) {
    console.error('Error extracting categorized keywords:', error);
    // Fallback to simpler extraction if categorized extraction fails
    const skills = await extractSkills(jobTitle, jobDescription);
    return {
      technicalSkills: skills.technicalSkills || [],
      softSkills: skills.softSkills || [],
      tools: [],
      methodologies: [],
      requirements: [],
      certificates: [],
      education: [],
      industryTerms: [],
      jobFunctions: []
    };
  }
}

/**
 * Helper function that normalizes text for better matching
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')  // Replace punctuation with spaces
    .replace(/\s+/g, ' ')      // Replace multiple spaces with single space
    .trim();
}

/**
 * Helper function to check for partial or variation matches
 */
function hasPartialOrVariationMatch(resumeText: string, keyword: string): boolean {
  // Normalize keyword
  const normalizedKeyword = normalizeText(keyword);
  
  // Direct match check
  if (resumeText.includes(normalizedKeyword)) {
    return true;
  }
  
  // Handle plural/singular variations
  const singularVariation = normalizedKeyword.endsWith('s') 
    ? normalizedKeyword.slice(0, -1) 
    : normalizedKeyword;
    
  const pluralVariation = normalizedKeyword.endsWith('s')
    ? normalizedKeyword
    : normalizedKeyword + 's';
    
  if (resumeText.includes(singularVariation) || resumeText.includes(pluralVariation)) {
    return true;
  }
  
  // Handle common term variations (e.g., "JavaScript" vs "Javascript")
  const commonVariations: {[key: string]: string[]} = {
    'javascript': ['js', 'javascript'],
    'typescript': ['ts', 'typescript'],
    'react': ['reactjs', 'react.js', 'react js'],
    'node': ['nodejs', 'node.js', 'node js'],
    'vue': ['vuejs', 'vue.js', 'vue js'],
    'angular': ['angularjs', 'angular.js', 'angular js'],
    'c#': ['csharp', 'c sharp'],
    'c++': ['cpp', 'cplusplus'],
    'product management': ['product manager', 'managing products'],
    'project management': ['project manager', 'managing projects'],
    'machine learning': ['ml'],
    'artificial intelligence': ['ai'],
    'user experience': ['ux'],
    'user interface': ['ui'],
    'amazon web services': ['aws'],
    'microsoft azure': ['azure'],
    'continuous integration': ['ci'],
    'continuous deployment': ['cd']
  };
  
  // Check for common variations
  const lowercaseKeyword = normalizedKeyword.toLowerCase();
  for (const [base, variations] of Object.entries(commonVariations)) {
    if (lowercaseKeyword.includes(base) || variations.some(v => lowercaseKeyword.includes(v))) {
      // Check if any variation exists in the resume
      if (variations.some(v => resumeText.includes(v)) || resumeText.includes(base)) {
        return true;
      }
    }
  }
  
  // Handle acronyms (e.g., "HCI" for "Human Computer Interaction")
  if (keyword.length > 3 && keyword.toUpperCase() === keyword) {
    const words = keyword.split(' ');
    if (words.length === 1) { // It's already an acronym
      // Look for expanded form by checking first letters of consecutive words
      // This is a simplified approach and might need refinement
      const pattern = new RegExp(
        keyword.split('').map(char => `\\b${char}`).join('\\w+ ') + '\\w+\\b', 
        'i'
      );
      return pattern.test(resumeText);
    }
  }
  
  // Check for words with hyphens/spaces vs combined words
  // e.g., "on-premise" vs "onpremise" or "on premise"
  if (normalizedKeyword.includes('-') || normalizedKeyword.includes(' ')) {
    const combined = normalizedKeyword.replace(/[-\s]/g, '');
    const separated = normalizedKeyword.replace(/-/g, ' ');
    
    if (resumeText.includes(combined) || resumeText.includes(separated)) {
      return true;
    }
  }
  
  return false;
}

// Helper function to generate overall suggestions based on feedback
function generateOverallSuggestions(
  generalFeedback: Array<{
    category: string;
    score: number;
    feedback: string;
    priority: 'high' | 'medium' | 'low';
  }>,
  jobSpecificScore: number | null,
  jobTitleMismatch: boolean
): string[] {
  const suggestions: string[] = [];
  
  // Add high priority feedback first
  const highPriorityFeedback = generalFeedback
    .filter(item => item.priority === 'high')
    .map(item => item.feedback);
  
  suggestions.push(...highPriorityFeedback);
  
  // If job title mismatch, add specific advice
  if (jobTitleMismatch) {
    suggestions.push(
      "Your work experience job titles don't directly match your target position. Consider adding a 'Key Skills' section that explicitly mentions skills relevant to the target job."
    );
  }
  
  // If job specific score is low, add advice
  if (jobSpecificScore !== null && jobSpecificScore < 50) {
    suggestions.push(
      "Your resume is missing several keywords from the job description. Review the keywords list and incorporate more of them in your resume where appropriate."
    );
  }
  
  // Add a couple medium priority items if we don't have enough suggestions
  if (suggestions.length < 2) {
    const mediumPriorityFeedback = generalFeedback
      .filter(item => item.priority === 'medium')
      .map(item => item.feedback);
    
    suggestions.push(...mediumPriorityFeedback.slice(0, 2 - suggestions.length));
  }
  
  // If still not enough suggestions, add general advice
  if (suggestions.length === 0) {
    suggestions.push(
      "Overall, your resume looks good! Consider revisiting your professional summary to ensure it aligns perfectly with your target position."
    );
  }
  
  return suggestions;
}