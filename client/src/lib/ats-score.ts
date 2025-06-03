import { ResumeData } from "@/types/resume";

// Add caching for AI results at the top of the file
const aiResultsCache = new Map<string, CachedResult>();
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

interface CachedResult {
  keywords: string[];
  categories: { [category: string]: string[] };
  timestamp: number;
}

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

/**
 * Robust ATS score calculation with improved keyword matching and scoring
 */
export async function calculateATSScore(resumeData: ResumeData): Promise<ATSScoreResult> {
  try {
  // Cast to ExtendedResumeData to support the keywordsFeedback property
  const extendedResumeData = resumeData as ExtendedResumeData;
  
    // Validate required data
  if (!extendedResumeData?.targetJobTitle || !extendedResumeData?.jobDescription) {
      return createEmptyScoreResult("Please add a job description to calculate ATS score");
    }

    // Check for minimum viable job description
    if (extendedResumeData.jobDescription.trim().length < 50) {
      return createEmptyScoreResult("Job description is too short for accurate ATS analysis");
    }

    // Extract keywords using AI with enhanced error handling
    let keywordData: { keywords: string[]; categories: { [category: string]: string[] } };
    
    try {
      keywordData = await extractKeywordsWithAI(extendedResumeData.jobDescription);
      
      // Validate extraction results
      if (!keywordData.keywords || keywordData.keywords.length === 0) {
        console.warn('AI keyword extraction returned no keywords, using fallback');
        keywordData = { 
          keywords: extractBasicKeywords(extendedResumeData.jobDescription),
          categories: { general: extractBasicKeywords(extendedResumeData.jobDescription) }
        };
      }
    } catch (error) {
      console.error('AI keyword extraction failed:', error);
      // Fallback to basic extraction
      const basicKeywords = extractBasicKeywords(extendedResumeData.jobDescription);
      keywordData = { 
        keywords: basicKeywords,
        categories: { general: basicKeywords }
      };
    }
    
    const { keywords, categories } = keywordData;
    
    // Check if resume has any meaningful content
    if (isResumeEmpty(extendedResumeData)) {
      return createEmptyResumeResult(keywords, categories);
    }

    // Enhanced keyword matching with multiple algorithms
    const keywordAnalysis = performAdvancedKeywordMatching(extendedResumeData, keywords, categories);
    
    // Store the keyword feedback for use by scoring functions
    extendedResumeData.keywordsFeedback = keywordAnalysis;

    // Calculate individual scores with improved algorithms
    const scores = {
      keywordMatch: calculateAdvancedKeywordScore(extendedResumeData, keywordAnalysis),
      formatting: calculateFormattingScore(extendedResumeData),
      completeness: calculateCompletenessScore(extendedResumeData),
      experienceRelevance: calculateExperienceRelevanceScore(extendedResumeData),
      skillsMatch: calculateSkillsMatchScore(extendedResumeData),
      contentQuality: calculateContentQualityScore(extendedResumeData)
    };

    // Enhanced weighted scoring with adaptive weights
    const adaptiveWeights = calculateAdaptiveWeights(extendedResumeData, scores);
    const generalScore = Math.round(
      Object.entries(scores).reduce((total, [key, score]) => 
        total + (score * adaptiveWeights[key as keyof typeof adaptiveWeights]), 0
      )
    );

    // Generate detailed, actionable suggestions with duplicate and skills feedback
    const suggestions = generateDetailedSuggestions(scores, keywordAnalysis, extendedResumeData);

    return {
      generalScore: Math.max(0, Math.min(100, generalScore)), // Ensure score is between 0-100
      jobSpecificScore: scores.keywordMatch,
      feedback: {
        generalFeedback: [
          {
            category: "Keyword Match",
            score: scores.keywordMatch,
            feedback: generateKeywordFeedback(keywordAnalysis),
            priority: scores.keywordMatch >= 80 ? "low" : scores.keywordMatch >= 60 ? "medium" : "high"
          },
          {
            category: "Formatting",
            score: scores.formatting,
            feedback: generateFormattingFeedback(scores.formatting),
            priority: scores.formatting >= 80 ? "low" : scores.formatting >= 60 ? "medium" : "high"
          },
          {
            category: "Completeness",
            score: scores.completeness,
            feedback: generateCompletenessFeedback(scores.completeness),
            priority: scores.completeness >= 80 ? "low" : scores.completeness >= 60 ? "medium" : "high"
          },
          {
            category: "Experience Relevance",
            score: scores.experienceRelevance,
            feedback: generateExperienceRelevanceFeedback(scores.experienceRelevance),
            priority: scores.experienceRelevance >= 80 ? "low" : scores.experienceRelevance >= 60 ? "medium" : "high"
          },
          {
            category: "Skills Match",
            score: scores.skillsMatch,
            feedback: generateSkillsMatchFeedback(scores.skillsMatch),
            priority: scores.skillsMatch >= 80 ? "low" : scores.skillsMatch >= 60 ? "medium" : "high"
          },
          {
            category: "Content Quality",
            score: scores.contentQuality,
            feedback: generateContentQualityFeedback(scores.contentQuality),
            priority: scores.contentQuality >= 80 ? "low" : scores.contentQuality >= 60 ? "medium" : "high"
          }
        ],
        keywordsFeedback: keywordAnalysis,
        overallSuggestions: suggestions
      }
    };
  } catch (error) {
    console.error('Error calculating ATS score:', error);
    return createEmptyScoreResult("Error calculating ATS score. Please try again.");
  }
}

/**
 * Create empty score result for error cases
 */
function createEmptyScoreResult(message: string): ATSScoreResult {
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
      overallSuggestions: [message]
    }
  };
}

/**
 * Create result for empty resume
 */
function createEmptyResumeResult(keywords: string[], categories: { [category: string]: string[] }): ATSScoreResult {
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
    
    return {
    generalScore: 15, // Slightly higher than 0 to indicate some structure exists
      feedback: {
        generalFeedback: [
          {
          category: "Content",
            score: 0,
          feedback: "Resume content is incomplete",
          priority: "high" as const
          }
        ],
        keywordsFeedback,
      overallSuggestions: [
        "Add content to your resume sections to improve your ATS score",
        "Include a professional summary",
        "Add relevant work experience",
        "List your skills and qualifications"
      ]
    }
  };
}

/**
 * Check if resume has meaningful content
 */
function isResumeEmpty(resumeData: ExtendedResumeData): boolean {
  const hasBasicInfo = resumeData.fullName || resumeData.email || resumeData.phone;
  const hasContent = 
    (resumeData.summary && resumeData.summary.trim().length > 20) ||
    (resumeData.workExperience && resumeData.workExperience.length > 0) ||
    (resumeData.education && resumeData.education.length > 0) ||
    (resumeData.skills && resumeData.skills.length > 0) ||
    (resumeData.technicalSkills && resumeData.technicalSkills.length > 0);
  
  return !hasBasicInfo || !hasContent;
}

/**
 * Advanced keyword matching with multiple algorithms
 */
function performAdvancedKeywordMatching(
  resumeData: ExtendedResumeData, 
  keywords: string[], 
  categories: { [category: string]: string[] }
): KeywordsFeedback {
  // Create comprehensive resume text for matching
  const resumeText = buildResumeText(resumeData);
  
  const foundKeywords: string[] = [];
  const missingKeywords: string[] = [];
  const categorizedFeedback: { [category: string]: { found: string[]; missing: string[]; all: string[] } } = {};
  
  // Process each category
  Object.entries(categories).forEach(([category, categoryKeywords]) => {
    const foundInCategory: string[] = [];
    const missingInCategory: string[] = [];
    
    categoryKeywords.forEach(keyword => {
      if (isKeywordMatch(keyword, resumeText)) {
        foundKeywords.push(keyword);
        foundInCategory.push(keyword);
      } else {
        missingKeywords.push(keyword);
        missingInCategory.push(keyword);
      }
    });
    
    categorizedFeedback[category] = {
      found: foundInCategory,
      missing: missingInCategory,
      all: categoryKeywords
    };
  });

  return {
    found: Array.from(new Set(foundKeywords)), // Remove duplicates
    missing: Array.from(new Set(missingKeywords)),
    all: Array.from(new Set(keywords)),
    categories: categorizedFeedback
  };
}

/**
 * Build comprehensive resume text for matching
 */
function buildResumeText(resumeData: ExtendedResumeData): string {
  const textSections = [
    resumeData.summary || '',
    resumeData.targetJobTitle || '',
    ...(resumeData.workExperience?.map(exp => 
      `${exp.position} ${exp.company} ${exp.description || ''} ${(exp.achievements || []).join(' ')}`
    ) || []),
    ...(resumeData.education?.map(edu => 
      `${edu.degree} ${edu.institution} ${edu.fieldOfStudy || ''} ${edu.description || ''}`
    ) || []),
    ...(resumeData.skills || []),
    ...(resumeData.technicalSkills || []),
    ...(resumeData.softSkills || []),
    ...(resumeData.certifications?.map(cert => 
      `${cert.name} ${cert.issuer || ''} ${cert.description || ''}`
    ) || []),
    ...(resumeData.projects?.map(proj => 
      `${proj.name} ${proj.description || ''} ${(proj.technologies || []).join(' ')}`
    ) || []),
    ...((resumeData as any).publications?.map((pub: any) => 
      `${pub.title || ''} ${pub.publisher || ''} ${pub.description || ''}`
    ) || [])
  ];
  
  return textSections.join(' ').toLowerCase();
}

/**
 * Enhanced keyword matching with multiple strategies
 */
function isKeywordMatch(keyword: string, resumeText: string): boolean {
  const keywordLower = keyword.toLowerCase();
  const variations = generateKeywordVariations(keywordLower);
  
  return variations.some(variation => {
    // Exact word boundary match
    if (new RegExp(`\\b${escapeRegExp(variation)}\\b`, 'i').test(resumeText)) {
      return true;
    }
    
    // Partial match for compound terms
    if (variation.includes(' ') || variation.includes('-') || variation.includes('.')) {
      const parts = variation.split(/[\s\-\.]+/);
      return parts.every(part => 
        part.length > 2 && new RegExp(`\\b${escapeRegExp(part)}\\b`, 'i').test(resumeText)
      );
    }
    
    // Acronym matching
    if (variation.length <= 5 && variation.toUpperCase() === variation) {
      return resumeText.includes(variation.toLowerCase()) || 
             resumeText.includes(variation.toUpperCase());
    }
    
    return false;
  });
}

/**
 * Generate keyword variations for better matching
 */
function generateKeywordVariations(keyword: string): string[] {
  const variations = [keyword];
  
  // Common variations
  const commonVariations: { [key: string]: string[] } = {
    'javascript': ['js', 'javascript', 'java script'],
    'typescript': ['ts', 'typescript', 'type script'],
    'node.js': ['node', 'nodejs', 'node js'],
    'react': ['reactjs', 'react.js'],
    'vue.js': ['vue', 'vuejs'],
    'angular': ['angularjs', 'angular.js'],
    'c++': ['cpp', 'c plus plus'],
    'c#': ['csharp', 'c sharp'],
    'machine learning': ['ml', 'machine-learning'],
    'artificial intelligence': ['ai', 'artificial-intelligence'],
    'user experience': ['ux', 'user-experience'],
    'user interface': ['ui', 'user-interface'],
    'search engine optimization': ['seo'],
    'customer relationship management': ['crm']
  };
  
  const normalizedKeyword = keyword.toLowerCase();
  if (commonVariations[normalizedKeyword]) {
    variations.push(...commonVariations[normalizedKeyword]);
  }
  
  // Add hyphenated and spaced versions
  if (keyword.includes(' ')) {
    variations.push(keyword.replace(/ /g, '-'));
    variations.push(keyword.replace(/ /g, ''));
  }
  
  if (keyword.includes('-')) {
    variations.push(keyword.replace(/-/g, ' '));
    variations.push(keyword.replace(/-/g, ''));
  }
  
  return Array.from(new Set(variations));
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Calculate adaptive weights based on resume content and job requirements
 */
function calculateAdaptiveWeights(
  resumeData: ExtendedResumeData, 
  scores: { [key: string]: number }
): { [key: string]: number } {
  const baseWeights = {
    keywordMatch: 0.35,
    formatting: 0.10,
    completeness: 0.15,
    experienceRelevance: 0.25,
    skillsMatch: 0.10,
    contentQuality: 0.05
  };
  
  // Adjust weights based on resume content
  const adjustments: { [key: string]: number } = { ...baseWeights };
  
  // If resume is very sparse, increase completeness weight
  if (scores.completeness < 50) {
    adjustments.completeness += 0.1;
    adjustments.keywordMatch -= 0.05;
    adjustments.experienceRelevance -= 0.05;
  }
  
  // If keywords are very sparse, increase keyword weight
  if (scores.keywordMatch < 30) {
    adjustments.keywordMatch += 0.1;
    adjustments.experienceRelevance -= 0.05;
    adjustments.contentQuality -= 0.05;
  }
  
  // For entry-level positions, reduce experience weight
  const jobTitle = resumeData.targetJobTitle?.toLowerCase() || '';
  if (jobTitle.includes('entry') || jobTitle.includes('junior') || jobTitle.includes('intern')) {
    adjustments.experienceRelevance -= 0.1;
    adjustments.skillsMatch += 0.05;
    adjustments.contentQuality += 0.05;
  }
  
  return adjustments;
}

/**
 * Advanced keyword score calculation
 */
function calculateAdvancedKeywordScore(
  resumeData: ExtendedResumeData,
  keywordAnalysis: KeywordsFeedback
): number {
  if (!keywordAnalysis.all.length) return 0;
  
  const totalKeywords = keywordAnalysis.all.length;
  const foundKeywords = keywordAnalysis.found.length;
  
  // Base score from percentage found
  let score = (foundKeywords / totalKeywords) * 100;
  
  // Bonus for category diversity
  const categoriesWithMatches = Object.values(keywordAnalysis.categories)
    .filter(category => category.found.length > 0).length;
  const totalCategories = Object.keys(keywordAnalysis.categories).length;
  
  if (totalCategories > 0) {
    const diversityBonus = (categoriesWithMatches / totalCategories) * 10;
    score += diversityBonus;
  }
  
  // Penalty for critical missing keywords (technical skills)
  const criticalCategories = ['technicalSkills', 'tools', 'certifications'];
  const criticalMissing = criticalCategories.reduce((count, category) => {
    const categoryData = keywordAnalysis.categories[category];
    return count + (categoryData ? categoryData.missing.length : 0);
  }, 0);
  
  if (criticalMissing > 5) {
    score -= Math.min(15, criticalMissing * 2);
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

function calculateFormattingScore(resumeData: ExtendedResumeData): number {
  let score = 100;
  
  // Check for proper contact information
  if (!resumeData.fullName) score -= 15;
  if (!resumeData.email) score -= 15;
  if (!resumeData.phone) score -= 10;
  
  // Check for section organization
  const hasWorkExperience = resumeData.workExperience && resumeData.workExperience.length > 0;
  const hasEducation = resumeData.education && resumeData.education.length > 0;
  const hasSkills = (resumeData.skills && resumeData.skills.length > 0) || 
                   (resumeData.technicalSkills && resumeData.technicalSkills.length > 0);
  
  if (!hasWorkExperience) score -= 20;
  if (!hasEducation) score -= 15;
  if (!hasSkills) score -= 15;
  
  // Check for consistent date formatting in work experience
  if (hasWorkExperience) {
    const inconsistentDates = resumeData.workExperience!.some(exp => 
      !exp.startDate || (!exp.endDate && !exp.current)
    );
    if (inconsistentDates) score -= 10;
  }
  
  // Check for proper job titles and company names
  if (hasWorkExperience) {
    const missingInfo = resumeData.workExperience!.some(exp => 
      !exp.position || !exp.company
    );
    if (missingInfo) score -= 15;
  }

  return Math.max(0, score);
}

function calculateCompletenessScore(resumeData: ExtendedResumeData): number {
  let score = 100;
  
  // Essential contact information (30 points)
  if (!resumeData.email) score -= 10;
  if (!resumeData.phone) score -= 10;
  if (!resumeData.location && !resumeData.city && !resumeData.state) score -= 10;
  
  // Professional summary (20 points)
  if (!resumeData.summary) {
    score -= 20;
  } else if (resumeData.summary.length < 100) {
    score -= 10; // Partial penalty for short summary
  }
  
  // Work experience (25 points)
  if (!resumeData.workExperience || resumeData.workExperience.length === 0) {
    score -= 25;
  } else {
    // Check quality of work experience entries
    const incompleteEntries = resumeData.workExperience.filter(exp => 
      !exp.position || !exp.company || !exp.startDate
    ).length;
    score -= incompleteEntries * 5;
    
    // Check for descriptions/achievements
    const entriesWithoutDescriptions = resumeData.workExperience.filter(exp => 
      !exp.description && (!exp.achievements || exp.achievements.length === 0)
    ).length;
    score -= entriesWithoutDescriptions * 3;
  }
  
  // Education (15 points)
  if (!resumeData.education || resumeData.education.length === 0) {
    score -= 15;
  }
  
  // Skills (10 points)
  const hasAnySkills = (resumeData.skills && resumeData.skills.length > 0) ||
                      (resumeData.technicalSkills && resumeData.technicalSkills.length > 0) ||
                      (resumeData.softSkills && resumeData.softSkills.length > 0);
  if (!hasAnySkills) {
    score -= 10;
  }

  return Math.max(0, score);
}

function calculateExperienceRelevanceScore(resumeData: ExtendedResumeData): number {
  let score = 50; // Start with neutral score
  
  if (!resumeData.workExperience || resumeData.workExperience.length === 0) {
    return 0;
  }
  
  const targetJobTitle = resumeData.targetJobTitle?.toLowerCase() || '';
  if (!targetJobTitle) return score;
  
  // Analyze job title relevance
  const relevantExperience = resumeData.workExperience.filter(exp => {
    const position = exp.position.toLowerCase();
    const company = exp.company.toLowerCase();
    const description = (exp.description || '').toLowerCase();
    const achievements = (exp.achievements || []).join(' ').toLowerCase();
    
    // Check for title keyword overlap
    const titleWords = targetJobTitle.split(/\s+/).filter(word => word.length > 3);
    const positionWords = position.split(/\s+/);
    
    const titleMatch = titleWords.some(word => positionWords.includes(word));
    const descriptionMatch = titleWords.some(word => 
      description.includes(word) || achievements.includes(word)
    );
    
    return titleMatch || descriptionMatch;
  });

    if (relevantExperience.length === 0) {
    score = 20; // Some penalty but not zero - transferable skills exist
  } else {
    const relevanceRatio = relevantExperience.length / resumeData.workExperience.length;
    score = 30 + (relevanceRatio * 70); // Scale from 30 to 100
  }
  
  // Bonus for recent relevant experience
  const recentRelevantExp = relevantExperience.filter(exp => {
    if (exp.current) return true;
    if (!exp.endDate) return false;
    
    // Check if ended within last 3 years (rough heuristic)
    const endYear = parseInt(exp.endDate);
    const currentYear = new Date().getFullYear();
    return (currentYear - endYear) <= 3;
  });
  
  if (recentRelevantExp.length > 0) {
    score += 10;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Calculate content quality score with duplicate detection
 */
function calculateContentQualityScore(resumeData: ExtendedResumeData): number {
  let score = 100;
  
  // Check summary quality
  if (resumeData.summary) {
    const summaryWords = resumeData.summary.split(/\s+/).length;
    if (summaryWords < 20) {
      score -= 15;
    } else if (summaryWords > 100) {
      score -= 10;
    }
  }
  
  // Check work experience descriptions and detect duplicates
  if (resumeData.workExperience && resumeData.workExperience.length > 0) {
    const experiences = resumeData.workExperience;
    
    // Check for poor descriptions
    const entriesWithPoorDescriptions = experiences.filter(exp => {
      const totalContent = (exp.description || '') + (exp.achievements || []).join(' ');
      return totalContent.length < 50;
    }).length;
    score -= entriesWithPoorDescriptions * 10;
    
    // Detect duplicate experiences - check for similar job titles, companies, or descriptions
    const duplicateCount = detectDuplicateExperiences(experiences);
    score -= duplicateCount * 25; // Heavy penalty for duplicates
    
    // Detect duplicate achievements/descriptions within experiences
    const duplicateAchievements = detectDuplicateAchievements(experiences);
    score -= duplicateAchievements * 15;
  }
  
  // Check for quantified achievements
  const hasQuantifiedAchievements = resumeData.workExperience?.some(exp => 
    exp.achievements?.some(achievement => 
      /\d+/.test(achievement) // Contains numbers
    )
  );
  
  if (!hasQuantifiedAchievements) {
    score -= 20;
  }

  return Math.max(0, score);
}

/**
 * Detect duplicate work experiences
 */
function detectDuplicateExperiences(experiences: any[]): number {
  let duplicateCount = 0;
  
  for (let i = 0; i < experiences.length; i++) {
    for (let j = i + 1; j < experiences.length; j++) {
      const exp1 = experiences[i];
      const exp2 = experiences[j];
      
      // Check for exact matches in position and company
      if (exp1.position === exp2.position && exp1.company === exp2.company) {
        duplicateCount++;
        continue;
      }
      
      // Check for similar descriptions (high similarity)
      const similarity = calculateTextSimilarity(
        (exp1.description || '') + (exp1.achievements || []).join(' '),
        (exp2.description || '') + (exp2.achievements || []).join(' ')
      );
      
      if (similarity > 0.8) { // 80% similarity threshold
        duplicateCount++;
      }
    }
  }
  
  return duplicateCount;
}

/**
 * Detect duplicate achievements within work experiences
 */
function detectDuplicateAchievements(experiences: any[]): number {
  const allAchievements: string[] = [];
  let duplicateCount = 0;
  
  experiences.forEach(exp => {
    if (exp.achievements && Array.isArray(exp.achievements)) {
      exp.achievements.forEach((achievement: string) => {
        const cleanAchievement = achievement.toLowerCase().trim();
        
        // Check against existing achievements
        for (const existing of allAchievements) {
          const similarity = calculateTextSimilarity(cleanAchievement, existing);
          if (similarity > 0.85) { // 85% similarity for achievements
            duplicateCount++;
            break;
          }
        }
        
        allAchievements.push(cleanAchievement);
      });
    }
  });
  
  return duplicateCount;
}

/**
 * Calculate text similarity between two strings
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  
  const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const intersection = words1.filter(word => words2.includes(word));
  const union = Array.from(new Set([...words1, ...words2]));
  
  return intersection.length / union.length; // Jaccard similarity
}

/**
 * Enhanced skills match score that actually compares against job requirements
 */
function calculateSkillsMatchScore(resumeData: ExtendedResumeData): number {
  // Get all user skills
  const allUserSkills = [
    ...(resumeData.skills || []),
    ...(resumeData.technicalSkills || []),
    ...(resumeData.softSkills || [])
  ].map(skill => skill.toLowerCase().trim());

  if (allUserSkills.length === 0) {
    return 0;
  }
  
  let score = 0; // Start from 0 instead of 100
  
  // Base score for having skills at all
  score += 30;
  
  // Quality checks for skill count
  if (allUserSkills.length >= 5 && allUserSkills.length <= 20) {
    score += 20; // Good skill count range
  } else if (allUserSkills.length < 5) {
    score += 10; // Some skills but too few
  } else if (allUserSkills.length > 30) {
    score += 15; // Many skills but may appear unfocused
  }
  
  // Bonus for skill categorization
  const hasCategorizedSkills = (resumeData.technicalSkills && resumeData.technicalSkills.length > 0) ||
                               (resumeData.softSkills && resumeData.softSkills.length > 0);
  
  if (hasCategorizedSkills) {
    score += 10; // Bonus for organization
  }
  
  // Compare against job requirements using cached keyword data
  const keywordsFeedback = resumeData.keywordsFeedback;
  if (keywordsFeedback && keywordsFeedback.categories) {
    const jobSkills = [
      ...(keywordsFeedback.categories.technicalSkills?.all || []),
      ...(keywordsFeedback.categories.softSkills?.all || []),
      ...(keywordsFeedback.categories.tools?.all || [])
    ].map(skill => skill.toLowerCase().trim());
    
    if (jobSkills.length > 0) {
      // Calculate skill overlap with job requirements
      const matchedSkills = allUserSkills.filter(userSkill => 
        jobSkills.some(jobSkill => 
          userSkill.includes(jobSkill) || 
          jobSkill.includes(userSkill) ||
          calculateTextSimilarity(userSkill, jobSkill) > 0.8
        )
      );
      
      const overlapPercentage = (matchedSkills.length / jobSkills.length) * 100;
      
      // Award points based on overlap (maximum 40 points for job match)
      if (overlapPercentage >= 80) {
        score += 40; // Excellent skill match
      } else if (overlapPercentage >= 60) {
        score += 30; // Good skill match
      } else if (overlapPercentage >= 40) {
        score += 20; // Moderate skill match
      } else if (overlapPercentage >= 20) {
        score += 10; // Some skill match
      }
      // No bonus for < 20% overlap
      
    } else {
      // No job skills to compare against, give partial credit for having skills
      score += 20;
    }
  } else {
    // No job requirements available, give partial credit
    score += 20;
  }

  // Ensure score never exceeds 100
  return Math.max(0, Math.min(100, score));
}

// Generate detailed feedback functions
function generateKeywordFeedback(keywordAnalysis: KeywordsFeedback): string {
  const total = keywordAnalysis.all.length;
  const found = keywordAnalysis.found.length;
  const percentage = total > 0 ? Math.round((found / total) * 100) : 0;
  
  return `Found ${found} out of ${total} keywords (${percentage}%)`;
}

function generateFormattingFeedback(score: number): string {
  if (score >= 90) return "Excellent formatting and structure";
  if (score >= 70) return "Good formatting with minor improvements needed";
  if (score >= 50) return "Formatting needs improvement";
  return "Significant formatting issues detected";
}

function generateCompletenessFeedback(score: number): string {
  if (score >= 90) return "Resume is comprehensive and complete";
  if (score >= 70) return "Resume is mostly complete with minor gaps";
  if (score >= 50) return "Several important sections are missing";
  return "Resume lacks essential information";
}

function generateExperienceRelevanceFeedback(score: number): string {
  if (score >= 80) return "Experience is highly relevant to target position";
  if (score >= 60) return "Experience is moderately relevant";
  if (score >= 40) return "Some transferable experience identified";
  return "Experience alignment needs significant improvement";
}

function generateSkillsMatchFeedback(score: number): string {
  if (score >= 90) return "Excellent skills match - nearly all job requirements covered";
  if (score >= 75) return "Strong skills alignment with most job requirements met";
  if (score >= 60) return "Good skills foundation with some gaps in job requirements";
  if (score >= 45) return "Basic skills present but missing several key requirements";
  if (score >= 30) return "Limited skills coverage - significant gaps in job requirements";
  return "Skills section needs major improvement to match job requirements";
}

function generateContentQualityFeedback(score: number): string {
  if (score >= 90) return "Content is detailed and well-written";
  if (score >= 70) return "Content quality is good with room for improvement";
  if (score >= 50) return "Content needs more detail and quantification";
  return "Content quality requires significant improvement";
}

/**
 * Generate detailed, actionable suggestions with duplicate and skills feedback
 */
function generateDetailedSuggestions(
  scores: { [key: string]: number }, 
  keywordAnalysis: KeywordsFeedback,
  resumeData: ExtendedResumeData
): string[] {
  const suggestions: string[] = [];
  
  // Duplicate content detection and suggestions
  if (resumeData.workExperience && resumeData.workExperience.length > 0) {
    const duplicateExperiences = detectDuplicateExperiences(resumeData.workExperience);
    const duplicateAchievements = detectDuplicateAchievements(resumeData.workExperience);
    
    if (duplicateExperiences > 0) {
      suggestions.push(`Remove ${duplicateExperiences} duplicate work experience${duplicateExperiences > 1 ? 's' : ''} - they hurt your ATS score`);
    }
    
    if (duplicateAchievements > 0) {
      suggestions.push(`Rewrite ${duplicateAchievements} duplicate achievement${duplicateAchievements > 1 ? 's' : ''} to be unique and specific`);
    }
  }
  
  // Skills-specific suggestions based on actual job requirements
  if (scores.skillsMatch < 70) {
    const userSkills = [
    ...(resumeData.skills || []),
    ...(resumeData.technicalSkills || []),
    ...(resumeData.softSkills || [])
  ];

    if (userSkills.length === 0) {
      suggestions.push("Add a skills section with relevant technical and soft skills");
    } else if (userSkills.length < 5) {
      suggestions.push("Add more relevant skills - aim for 8-15 skills total");
    }
    
    // Specific missing skills from job requirements
    if (keywordAnalysis.categories) {
      const missingTechnicalSkills = keywordAnalysis.categories.technicalSkills?.missing || [];
      const missingTools = keywordAnalysis.categories.tools?.missing || [];
      
      if (missingTechnicalSkills.length > 0) {
        suggestions.push(`Add these technical skills if you have them: ${missingTechnicalSkills.slice(0, 3).join(', ')}`);
      }
      
      if (missingTools.length > 0) {
        suggestions.push(`Add these tools/technologies if you've used them: ${missingTools.slice(0, 3).join(', ')}`);
      }
    }
    
    suggestions.push("Organize skills into technical and soft skill categories for better ATS parsing");
  }
  
  // Keyword-specific suggestions
  if (keywordAnalysis.missing.length > 0) {
    const topMissing = keywordAnalysis.missing.slice(0, 5);
    suggestions.push(`Incorporate these job keywords naturally: ${topMissing.join(', ')}`);
    
    // Category-specific suggestions
    Object.entries(keywordAnalysis.categories).forEach(([category, data]) => {
      if (data.missing.length > 0 && data.missing.length >= data.all.length * 0.7) {
        const categoryName = category === 'technicalSkills' ? 'technical skills' : 
                            category === 'softSkills' ? 'soft skills' : 
                            category === 'industryTerms' ? 'industry knowledge' : category;
        suggestions.push(`Your ${categoryName} section needs strengthening - add: ${data.missing.slice(0, 2).join(', ')}`);
      }
    });
  }
  
  // Content quality suggestions
  if (scores.contentQuality < 70) {
    suggestions.push("Add quantified achievements with specific numbers and results (e.g., 'Increased sales by 25%')");
    suggestions.push("Use strong action verbs to describe your accomplishments (achieved, implemented, optimized)");
    
    if (resumeData.workExperience) {
      const entriesWithoutNumbers = resumeData.workExperience.filter(exp => {
        const allText = (exp.description || '') + (exp.achievements || []).join(' ');
        return !/\d+/.test(allText);
      });
      
      if (entriesWithoutNumbers.length > 0) {
        suggestions.push(`Add measurable results to ${entriesWithoutNumbers.length} work experience${entriesWithoutNumbers.length > 1 ? 's' : ''}`);
      }
    }
  }
  
  // Completeness suggestions
  if (scores.completeness < 70) {
    if (!resumeData.summary || resumeData.summary.length < 50) {
      suggestions.push("Add a compelling professional summary (3-5 sentences highlighting your key value)");
    }
    
    if (!resumeData.workExperience || resumeData.workExperience.length === 0) {
      suggestions.push("Add your work experience with detailed descriptions and achievements");
    }
    
    if (!resumeData.email || !resumeData.phone) {
      suggestions.push("Complete your contact information (email, phone, location)");
    }
  }
  
  // Experience relevance suggestions
  if (scores.experienceRelevance < 60) {
    suggestions.push("Tailor your job descriptions to emphasize responsibilities relevant to the target role");
    suggestions.push("Highlight transferable skills that apply to your target position");
    
    if (resumeData.projects && resumeData.projects.length > 0) {
      suggestions.push("Include relevant projects that demonstrate skills for your target role");
    } else {
      suggestions.push("Add a projects section to showcase relevant work and skills");
    }
  }
  
  // Formatting suggestions
  if (scores.formatting < 80) {
    suggestions.push("Ensure all work experience entries have consistent date formatting");
    suggestions.push("Verify all job titles, company names, and dates are complete and accurate");
  }
  
  // Always include general improvement tips (but limit total suggestions)
  if (suggestions.length < 6) {
    suggestions.push("Use keywords naturally throughout your experience descriptions, not just in a skills list");
    suggestions.push("Proofread for consistency in formatting and ensure all information is up-to-date");
  }
  
  return Array.from(new Set(suggestions)).slice(0, 8); // Limit to 8 unique suggestions
}

/**
 * Cached keyword extraction to prevent excessive AI calls
 */
async function extractKeywordsWithAI(jobDescription: string): Promise<{
  keywords: string[];
  categories: {
    [category: string]: string[];
  };
}> {
  // Create cache key from job description hash
  const cacheKey = btoa(jobDescription.substring(0, 500)); // Use first 500 chars as key
  
  // Check cache first
  const cached = aiResultsCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_EXPIRY_MS) {
    console.log('Using cached AI results');
    return {
      keywords: cached.keywords,
      categories: cached.categories
    };
  }
  
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format from AI service');
    }
    
    // Create a categories object with the results from our improved API
    const categories: { [category: string]: string[] } = {
      technicalSkills: Array.isArray(data.technicalSkills) ? data.technicalSkills : [],
      softSkills: Array.isArray(data.softSkills) ? data.softSkills : [],
      education: Array.isArray(data.education) ? data.education : [],
      responsibilities: Array.isArray(data.responsibilities) ? data.responsibilities : [],
      industryTerms: Array.isArray(data.industryTerms) ? data.industryTerms : [],
      tools: Array.isArray(data.tools) ? data.tools : [],
      certifications: Array.isArray(data.certifications) ? data.certifications : []
    };
    
    // Combine all extracted keywords
    const allKeywords = Object.values(categories).flat().filter(keyword => 
      keyword && typeof keyword === 'string' && keyword.trim().length > 0
    );
    
    const result = { 
      keywords: allKeywords,
      categories
    };
    
    // Cache the result
    aiResultsCache.set(cacheKey, {
      keywords: result.keywords,
      categories: result.categories,
      timestamp: Date.now()
    });
    
    // If AI analysis returns insufficient keywords, fallback to basic extraction
    if (allKeywords.length < 3) {
      console.warn('AI keyword extraction returned insufficient keywords, falling back to basic extraction');
      const basicKeywords = extractBasicKeywords(jobDescription);
      const fallbackResult = { 
        keywords: basicKeywords,
        categories: { 
          general: basicKeywords 
        }
      };
      
      // Cache fallback result too
      aiResultsCache.set(cacheKey, {
        keywords: fallbackResult.keywords,
        categories: fallbackResult.categories,
        timestamp: Date.now()
      });
      
      return fallbackResult;
    }

    return result;
  } catch (error) {
    console.error('Error in AI keyword extraction:', error);
    // Fallback to basic extraction if AI fails
    const basicKeywords = extractBasicKeywords(jobDescription);
    const fallbackResult = { 
      keywords: basicKeywords,
      categories: { 
        general: basicKeywords 
      }
    };
    
    // Cache fallback result
    aiResultsCache.set(cacheKey, {
      keywords: fallbackResult.keywords,
      categories: fallbackResult.categories,
      timestamp: Date.now()
    });
    
    return fallbackResult;
  }
}

/**
 * Enhanced basic keyword extraction as fallback
 */
function extractBasicKeywords(jobDescription: string): string[] {
  if (!jobDescription || jobDescription.trim().length < 20) {
    return [];
  }
  
  // Enhanced patterns for better keyword detection
  const technicalPatterns = [
    // Programming languages
    /\b(javascript|typescript|python|java|c\+\+|c#|php|ruby|go|swift|kotlin|rust|scala|r|matlab|sql)\b/gi,
    // Frameworks and libraries
    /\b(react|angular|vue|node\.?js|express|django|spring|laravel|flask|rails|\.net|bootstrap|jquery)\b/gi,
    // Databases
    /\b(mysql|postgresql|mongodb|redis|elasticsearch|oracle|sql\s+server|dynamodb|firebase)\b/gi,
    // Cloud and DevOps
    /\b(aws|azure|google\s+cloud|gcp|docker|kubernetes|terraform|jenkins|github|gitlab|ci\/cd)\b/gi,
    // Tools and software
    /\b(jira|confluence|slack|teams|figma|sketch|photoshop|illustrator|excel|powerpoint|salesforce)\b/gi,
    // Methodologies
    /\b(agile|scrum|kanban|waterfall|lean|devops|machine\s+learning|artificial\s+intelligence|data\s+science)\b/gi
  ];
  
  const softSkillPatterns = [
    /\b(leadership|management|communication|collaboration|problem\s+solving|critical\s+thinking|project\s+management|time\s+management)\b/gi
  ];
  
  const allPatterns = [...technicalPatterns, ...softSkillPatterns];
  const keywords = new Set<string>();
  
  // Extract using patterns
  allPatterns.forEach(pattern => {
    const matches = jobDescription.match(pattern);
    if (matches) {
      matches.forEach(match => keywords.add(match.trim()));
    }
  });
  
  // Clean and normalize keywords
  return Array.from(keywords)
    .map(keyword => {
      // Normalize common variations
      const normalized = keyword.toLowerCase().trim();
      const normalizations: { [key: string]: string } = {
        'node.js': 'Node.js',
        'nodejs': 'Node.js',
        'javascript': 'JavaScript',
        'typescript': 'TypeScript',
        'c++': 'C++',
        'c#': 'C#',
        'sql server': 'SQL Server',
        'google cloud': 'Google Cloud Platform'
      };
      
      return normalizations[normalized] || 
             keyword.split(' ').map(word => 
               word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
             ).join(' ');
    })
    .filter(keyword => keyword.length > 1)
    .slice(0, 15); // Limit to prevent overwhelming results
} 