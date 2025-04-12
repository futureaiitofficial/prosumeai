import { ResumeData } from "@/types/resume";

// Add KeywordsFeedback interface to ResumeData
interface KeywordsFeedback {
  found: string[];
  missing: string[];
  all: string[];
  categories: {
    [category: string]: {
      found: string[];
      missing: string[];
      all: string[];
    };
  };
}

// Extend ResumeData to include keywordsFeedback
interface ExtendedResumeData extends ResumeData {
  keywordsFeedback?: KeywordsFeedback;
}

interface ATSScoreResult {
  generalScore: number;
  jobSpecificScore?: number;
  feedback: {
    generalFeedback: {
      category: string;
      score: number;
      feedback: string;
      priority: "high" | "low" | "medium";
    }[];
    keywordsFeedback?: KeywordsFeedback;
    overallSuggestions: string[];
  };
}

export async function calculateATSScore(resumeData: ResumeData): Promise<ATSScoreResult> {
  // Cast to ExtendedResumeData to support the keywordsFeedback property
  const extendedResumeData = resumeData as ExtendedResumeData;
  
  if (!extendedResumeData?.targetJobTitle || !extendedResumeData?.jobDescription) {
    return {
      generalScore: 0,
      feedback: {
        generalFeedback: [],
        keywordsFeedback: {
          found: [],
          missing: [],
          all: [],
          categories: {}
        },
        overallSuggestions: ["Please add a job description to calculate ATS score"]
      }
    };
  }

  // Extract keywords using AI with categories
  const { keywords, categories } = await extractKeywordsWithAI(extendedResumeData.jobDescription);
  
  // Check for keywords in resume sections
  const foundKeywords: string[] = [];
  const missingKeywords: string[] = [];

  // Create a single combined text of the entire resume for better matching
  const resumeText = [
    extendedResumeData.summary || '',
    ...(extendedResumeData.workExperience?.map(exp => 
      `${exp.position} ${exp.company} ${exp.description || ''} ${(exp.achievements || []).join(' ')}`
    ) || []),
    ...(extendedResumeData.education?.map(edu => 
      `${edu.degree} ${edu.institution} ${edu.fieldOfStudy || ''} ${edu.description || ''}`
    ) || []),
    ...(extendedResumeData.skills || []),
    ...(extendedResumeData.technicalSkills || []),
    ...(extendedResumeData.softSkills || []),
    ...(extendedResumeData.certifications?.map(cert => 
      `${cert.name} ${cert.issuer || ''}`
    ) || []),
    ...(extendedResumeData.projects?.map(proj => 
      `${proj.name} ${proj.description || ''} ${(proj.technologies || []).join(' ')}`
    ) || [])
  ].join(' ').toLowerCase();

  // Check if resume is essentially empty despite having a job description
  const isResumeEmpty = 
    !extendedResumeData.summary && 
    (!extendedResumeData.workExperience || extendedResumeData.workExperience.length === 0) &&
    (!extendedResumeData.education || extendedResumeData.education.length === 0) &&
    (!extendedResumeData.skills || extendedResumeData.skills.length === 0) &&
    (!extendedResumeData.technicalSkills || extendedResumeData.technicalSkills.length === 0) &&
    (!extendedResumeData.softSkills || extendedResumeData.softSkills.length === 0);
  
  // Return low score if resume is empty
  if (isResumeEmpty) {
    // Convert categories to proper format for keywordsFeedback
    const formattedCategories: { [category: string]: { found: string[]; missing: string[]; all: string[] } } = {};
    
    Object.entries(categories).forEach(([category, terms]) => {
      formattedCategories[category] = {
        found: [],
        missing: terms,
        all: terms
      };
    });
    
    const keywordsFeedback = {
      found: [],
      missing: keywords,
      all: keywords,
      categories: formattedCategories
    };
    
    extendedResumeData.keywordsFeedback = keywordsFeedback;
    
    return {
      generalScore: 20,
      feedback: {
        generalFeedback: [
          {
            category: "Keyword Match",
            score: 0,
            feedback: `Found 0 out of ${keywords.length} keywords`,
            priority: "high"
          },
          {
            category: "Formatting",
            score: 0,
            feedback: "Resume formatting and structure",
            priority: "high"
          },
          {
            category: "Completeness",
            score: 0,
            feedback: "Required sections and information",
            priority: "high"
          },
          {
            category: "Experience Relevance",
            score: 0,
            feedback: "Relevance to target position",
            priority: "high"
          },
          {
            category: "Skills Match",
            score: 0,
            feedback: "Required skills and qualifications",
            priority: "high"
          }
        ],
        keywordsFeedback,
        overallSuggestions: ["Your resume is incomplete. Add content to your resume sections to improve your ATS score."]
      }
    };
  }

  // Prepare categorized feedback
  const categorizedFeedback: { [category: string]: { found: string[]; missing: string[]; all: string[] } } = {};
  
  // Process each category
  Object.entries(categories).forEach(([category, categoryKeywords]) => {
    const foundInCategory: string[] = [];
    const missingInCategory: string[] = [];
    
    // Check each keyword in the current category
    categoryKeywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      
      // Use more sophisticated matching
      if (
        resumeText.includes(` ${keywordLower} `) || // Exact match with word boundaries
        resumeText.includes(` ${keywordLower}.`) || // Match at end of sentence
        resumeText.includes(` ${keywordLower},`) || // Match with comma
        resumeText.includes(` ${keywordLower}:`) || // Match with colon
        resumeText.includes(` ${keywordLower};`) || // Match with semicolon
        resumeText.includes(`${keywordLower} `) || // Match at start of text
        resumeText.includes(` ${keywordLower.replace(/-/g, ' ')} `) || // Handle hyphenated terms
        resumeText.includes(` ${keywordLower.replace(/ /g, '-')} `) || // Handle space-separated terms
        resumeText.includes(` ${keywordLower.replace(/\./g, '')} `) || // Handle version numbers (e.g., Python 3.8)
        (keywordLower.length > 5 && resumeText.match(new RegExp(`\\b${keywordLower}\\b`, 'i'))) // Exact word match for longer keywords
      ) {
        foundKeywords.push(keyword);
        foundInCategory.push(keyword);
      } else {
        missingKeywords.push(keyword);
        missingInCategory.push(keyword);
      }
    });
    
    // Add to categorized feedback
    categorizedFeedback[category] = {
      found: foundInCategory,
      missing: missingInCategory,
      all: categoryKeywords
    };
  });

  // Store the keyword feedback in extendedResumeData for use by calculateKeywordScore
  const keywordsFeedback = {
    found: foundKeywords,
    missing: missingKeywords,
    all: keywords,
    categories: categorizedFeedback
  };
  
  extendedResumeData.keywordsFeedback = keywordsFeedback;

  // Calculate individual scores
  const scores = {
    keywordMatch: calculateKeywordScore(extendedResumeData),
    formatting: calculateFormattingScore(extendedResumeData),
    completeness: calculateCompletenessScore(extendedResumeData),
    experienceRelevance: calculateExperienceRelevanceScore(extendedResumeData),
    skillsMatch: calculateSkillsMatchScore(extendedResumeData)
  };

  // Calculate overall score (weighted average)
  const weights = {
    keywordMatch: 0.3,
    formatting: 0.15,
    completeness: 0.2,
    experienceRelevance: 0.25,
    skillsMatch: 0.1
  };

  const generalScore = Math.round(
    Object.entries(scores).reduce((total, [key, score]) => 
      total + (score * weights[key as keyof typeof weights]), 0
    )
  );

  // Generate suggestions based on all metrics
  const suggestions = generateSuggestions(scores, missingKeywords);

  return {
    generalScore,
    jobSpecificScore: scores.keywordMatch,
    feedback: {
      generalFeedback: [
        {
          category: "Keyword Match",
          score: scores.keywordMatch,
          feedback: `Found ${foundKeywords.length} out of ${keywords.length} keywords`,
          priority: scores.keywordMatch >= 80 ? "low" : scores.keywordMatch >= 60 ? "medium" : "high"
        },
        {
          category: "Formatting",
          score: scores.formatting,
          feedback: "Resume formatting and structure",
          priority: scores.formatting >= 80 ? "low" : scores.formatting >= 60 ? "medium" : "high"
        },
        {
          category: "Completeness",
          score: scores.completeness,
          feedback: "Required sections and information",
          priority: scores.completeness >= 80 ? "low" : scores.completeness >= 60 ? "medium" : "high"
        },
        {
          category: "Experience Relevance",
          score: scores.experienceRelevance,
          feedback: "Relevance to target position",
          priority: scores.experienceRelevance >= 80 ? "low" : scores.experienceRelevance >= 60 ? "medium" : "high"
        },
        {
          category: "Skills Match",
          score: scores.skillsMatch,
          feedback: "Required skills and qualifications",
          priority: scores.skillsMatch >= 80 ? "low" : scores.skillsMatch >= 60 ? "medium" : "high"
        }
      ],
      keywordsFeedback,
      overallSuggestions: suggestions
    }
  };
}

function calculateKeywordScore(resumeData: ExtendedResumeData): number {
  if (!resumeData?.jobDescription) return 0;

  // Get the keywords from the resume data feedback
  const keywords = resumeData.keywordsFeedback?.all || [];
  if (keywords.length === 0) return 0;
  
  const foundKeywords = resumeData.keywordsFeedback?.found || [];
  if (foundKeywords.length === 0) return 0;

  // Calculate score as a percentage of found keywords
  const score = (foundKeywords.length / keywords.length) * 100;
  return Math.min(100, Math.round(score)); // Cap at 100%
}

function calculateFormattingScore(resumeData: ExtendedResumeData): number {
  let score = 100;
  
  // Check for proper section headers
  const requiredSections = ['summary', 'workExperience', 'education'];
  requiredSections.forEach(section => {
    if (!resumeData[section as keyof ResumeData]) {
      score -= 20;
    }
  });

  // Check for consistent formatting
  if (resumeData.workExperience?.some(exp => !exp.position || !exp.company)) {
    score -= 15;
  }

  // Check for proper date formatting
  if (resumeData.workExperience?.some(exp => !exp.startDate || !exp.endDate)) {
    score -= 15;
  }

  return Math.max(0, score);
}

function calculateCompletenessScore(resumeData: ExtendedResumeData): number {
  let score = 100;
  
  // Check for required contact information
  if (!resumeData.email || !resumeData.phone || !resumeData.location) {
    score -= 20;
  }

  // Check for summary
  if (!resumeData.summary || resumeData.summary.length < 50) {
    score -= 20;
  }

  // Check for work experience
  if (!resumeData.workExperience?.length) {
    score -= 20;
  }

  // Check for education
  if (!resumeData.education?.length) {
    score -= 20;
  }

  // Check for skills
  if (!resumeData.skills?.length && !resumeData.technicalSkills?.length) {
    score -= 20;
  }

  return Math.max(0, score);
}

function calculateExperienceRelevanceScore(resumeData: ExtendedResumeData): number {
  let score = 100;
  
  // Check if work experience is relevant to target job
  if (resumeData.workExperience?.length) {
    const relevantExperience = resumeData.workExperience.filter(exp => 
      exp.position.toLowerCase().includes(resumeData.targetJobTitle?.toLowerCase() || '') ||
      exp.description?.toLowerCase().includes(resumeData.targetJobTitle?.toLowerCase() || '')
    );

    if (relevantExperience.length === 0) {
      score -= 40;
    } else if (relevantExperience.length < resumeData.workExperience.length / 2) {
      score -= 20;
    }
  }

  return Math.max(0, score);
}

function calculateSkillsMatchScore(resumeData: ExtendedResumeData): number {
  let score = 100;
  
  // Check for required skills
  const allSkills = [
    ...(resumeData.skills || []),
    ...(resumeData.technicalSkills || []),
    ...(resumeData.softSkills || [])
  ];

  if (!allSkills.length) {
    score -= 50;
  }

  return Math.max(0, score);
}

async function extractKeywordsWithAI(jobDescription: string): Promise<{
  keywords: string[];
  categories: {
    [category: string]: string[];
  };
}> {
  try {
    // Call the AI API to analyze the job description
    const response = await fetch('/api/ai/analyze-job-description', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobDescription }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze job description');
    }

    const data = await response.json();
    
    // Create a categories object with the results from our improved API
    const categories: { [category: string]: string[] } = {
      technicalSkills: data.technicalSkills || [],
      softSkills: data.softSkills || [],
      education: data.education || [],
      responsibilities: data.responsibilities || [],
      industryTerms: data.industryTerms || [],
      tools: data.tools || [],
      certifications: data.certifications || []
    };
    
    // Combine all extracted keywords
    const allKeywords = Object.values(categories).flat();
    
    // If AI analysis returns no keywords or too few, fallback to basic extraction
    if (allKeywords.length < 5) {
      console.warn('AI keyword extraction returned too few keywords, falling back to basic extraction');
      const basicKeywords = extractBasicKeywords(jobDescription);
      return { 
        keywords: basicKeywords,
        categories: { 
          technicalSkills: basicKeywords 
        }
      };
    }

    return { 
      keywords: allKeywords,
      categories
    };
  } catch (error) {
    console.error('Error in AI keyword extraction:', error);
    // Fallback to basic extraction if AI fails
    const basicKeywords = extractBasicKeywords(jobDescription);
    return { 
      keywords: basicKeywords,
      categories: { 
        technicalSkills: basicKeywords 
      }
    };
  }
}

// Set of common generic terms to filter out
const commonGenericTerms = new Set<string>([
  'experience', 'work', 'team', 'job', 'role', 'position', 'company', 'business',
  'requirements', 'skills', 'ability', 'knowledge', 'understanding', 'familiar',
  'strong', 'excellent', 'great', 'good', 'preferred', 'required', 'minimum',
  'qualification', 'proficiency', 'proficient', 'expertise', 'expert'
]);

// Rename the basic function to be clearer about its purpose
function extractBasicKeywords(jobDescription: string): string[] {
  // This is only used as a fallback if the AI extraction fails
  // It's a very basic keyword extraction that will be less accurate
  
  // Convert to lowercase and split into words
  const words = jobDescription.toLowerCase().split(/\s+/);
  
  // Enhanced list of common words to exclude
  const commonWords = new Set<string>([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
    'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
    'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
    'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them',
    'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
    'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work',
    'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
    'give', 'day', 'most', 'us', 'need', 'should', 'must', 'important', 'looking',
    'developing', 'building', 'technical', 'related', 'preferred', 'industry',
    // Additional common words to filter out
    'role', 'position', 'job', 'company', 'team', 'experience', 'responsibility',
    'qualification', 'requirement', 'candidate', 'ability', 'opportunity', 'project',
    'develop', 'design', 'create', 'implement', 'maintain', 'support', 'ensure',
    'provide', 'deliver', 'manage', 'lead', 'drive', 'strong', 'excellent', 'great'
  ]);

  // Extract potential technical terms - this is a basic approach
  const technicalTermRegex = /(javascript|python|java|react|node|angular|vue|c\+\+|c#|\.net|php|ruby|go|swift|kotlin|rust|sql|nosql|mongodb|mysql|postgresql|redis|graphql|rest|soap|api|aws|azure|gcp|cloud|docker|kubernetes|terraform|git|cicd|machine learning|ai|artificial intelligence|nlp|computer vision|data science|blockchain|frontend|backend|fullstack|devops|security|agile|scrum|kanban|jira|confluence)/i;
  
  const technicalTerms: string[] = [];
  const jobDescriptionLower = jobDescription.toLowerCase();
  
  // Find potential technical terms using regex
  let match;
  const regex = new RegExp(technicalTermRegex, 'g');
  while ((match = regex.exec(jobDescriptionLower)) !== null) {
    technicalTerms.push(match[0]);
  }
  
  // Add any technical terms that weren't caught by the regex
  // Filter out common words and special characters, then get unique words
  const additionalKeywords = words
    .filter(word => 
      word.length > 2 && // Ignore very short words
      !commonWords.has(word) && // Ignore common words
      /^[a-z0-9\+\#\.]+$/.test(word) && // Include alphanumeric plus common tech symbols
      !/^(and|or|the|in|on|at|to|for|of|with|by|from|up|out|over|under|between|among|through|during|before|after|since|until|while|where|when|why|how|what|which|who|whom|whose|that|this|these|those|such|like|as|than|but|yet|so|for|nor|both|either|neither|not|only|just|also|too|very|much|many|more|most|some|any|no|all|each|every|few|several|such|own|same|other|another|any|some|no|all|both|each|few|many|neither|none|one|several|some|such|this|that|these|those|what|whatever|which|whichever|who|whoever|whom|whomever|whose|whosesoever)$/.test(word) // Exclude common prepositions and conjunctions
    );
  
  // Combine technical terms and filtered additional keywords and remove duplicates
  const combinedArray = [...technicalTerms, ...additionalKeywords];
  return Array.from(new Set(combinedArray));
}

function generateSuggestions(scores: Record<string, number>, missingKeywords: string[]): string[] {
  const suggestions: string[] = [];

  // Add suggestions based on scores
  if (scores.formatting < 80) {
    suggestions.push("Improve resume formatting and structure");
  }
  if (scores.completeness < 80) {
    suggestions.push("Add missing required sections and information");
  }
  if (scores.experienceRelevance < 80) {
    suggestions.push("Add more relevant work experience for the target position");
  }
  if (scores.skillsMatch < 80) {
    suggestions.push("Add more relevant skills and qualifications");
  }

  // Add keyword-specific suggestions
  if (missingKeywords.length > 0) {
    suggestions.push(`Add ${missingKeywords.length} missing keywords to improve your ATS score`);
    
    // Group keywords by type
    const technicalKeywords = missingKeywords.filter(keyword => 
      /(programming|software|development|engineering|technical|system|database|network|security|cloud|web|mobile|api|framework|language|tool|platform)/i.test(keyword)
    );

    const softSkillKeywords = missingKeywords.filter(keyword => 
      /(communication|leadership|management|team|problem|solution|project|planning|organization|analytical|creative|strategic|collaboration|adaptability|initiative)/i.test(keyword)
    );

    if (technicalKeywords.length > 0) {
      suggestions.push(`Add technical skills: ${technicalKeywords.slice(0, 3).join(', ')}`);
    }

    if (softSkillKeywords.length > 0) {
      suggestions.push(`Add soft skills: ${softSkillKeywords.slice(0, 3).join(', ')}`);
    }

    suggestions.push('Include keywords naturally in your experience descriptions');
    suggestions.push('Add relevant certifications or training');
  }

  return suggestions;
} 