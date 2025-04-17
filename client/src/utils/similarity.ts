/**
 * Calculate the relevance of a work experience to a job description
 */
export function calculateExperienceRelevance(experience: any, jobDescription: string): number {
  if (!jobDescription || !experience.description) {
    return 0;
  }
  
  const jobDescWords = jobDescription.toLowerCase().split(/\s+/);
  const expDescWords = experience.description.toLowerCase().split(/\s+/);
  
  let matchCount = 0;
  for (const word of expDescWords) {
    if (word.length > 3 && jobDescWords.includes(word)) {
      matchCount++;
    }
  }
  
  // Include the position match as well
  if (experience.position) {
    const positionWords = experience.position.toLowerCase().split(/\s+/);
    for (const word of positionWords) {
      if (word.length > 3 && jobDescWords.includes(word)) {
        matchCount += 2; // Position matches are more important
      }
    }
  }
  
  return matchCount;
} 