/**
 * Simple resume template generator
 * This file contains templates for generating resume documents
 */

/**
 * Escapes special LaTeX characters to prevent compilation errors
 */
export function escapeLatex(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/</g, '\\textless{}')
    .replace(/>/g, '\\textgreater{}');
}

/**
 * Format date for LaTeX display
 */
export function formatLatexDate(dateString: string | null): string {
  if (!dateString) return 'Present';
  
  try {
    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${month} ${year}`;
  } catch (e) {
    return dateString;
  }
}

/**
 * Clean and sanitize achievement text for LaTeX
 */
function cleanAchievement(achievement: string): string {
  return escapeLatex(achievement).trim();
}

/**
 * Generate professional template (LaTeX style)
 */
export function generateProfessionalTemplate(resumeData: any): string {
  const {
    fullName,
    email,
    phone,
    location,
    summary,
    workExperience = [],
    education = [],
    skills = [],
    technicalSkills = [],
    softSkills = []
  } = resumeData;

  // Format work experience section
  const experienceSection = workExperience.map((exp: any) => {
    const achievements = exp.achievements || [];
    const achievementsList = achievements.map((achievement: string) => 
      `  - ${achievement}`
    ).join('\n');

    return `${exp.company || 'Company'}, ${exp.location || 'Location'}
${exp.position || 'Position'}, ${exp.startDate || ''} - ${exp.current ? 'Present' : exp.endDate || ''}
${achievementsList}`;
  }).join('\n\n');

  // Format education section
  const educationSection = education.map((edu: any) => 
    `${edu.institution || 'Institution'}, ${edu.location || 'Location'}
${edu.degree || 'Degree'}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}, ${edu.startDate || ''} - ${edu.current ? 'Present' : edu.endDate || ''}`
  ).join('\n\n');

  // Combine all skills
  const skillsSection = [
    technicalSkills?.length ? `Technical Skills: ${technicalSkills.join(', ')}` : '',
    softSkills?.length ? `Soft Skills: ${softSkills.join(', ')}` : '',
    skills?.length ? `Other Skills: ${skills.join(', ')}` : ''
  ].filter(Boolean).join('\n');

  // Combine all sections into the resume
  return `${fullName || 'Your Name'}
${email || 'email@example.com'} | ${phone || 'Phone'} | ${location || 'Location'}

${summary ? `SUMMARY\n${summary}\n\n` : ''}

${skillsSection ? `SKILLS\n${skillsSection}\n\n` : ''}

${experienceSection ? `EXPERIENCE\n${experienceSection}\n\n` : ''}

${educationSection ? `EDUCATION\n${educationSection}` : ''}`;
}

/**
 * Generate minimalist template
 */
export function generateMinimalistTemplate(resumeData: any): string {
  const {
    fullName,
    email,
    phone,
    city,
    country,
    linkedinUrl,
    portfolioUrl,
    summary,
    workExperience = [],
    education = [],
    skills = [],
    technicalSkills = [],
    softSkills = [],
    certifications = [],
    projects = []
  } = resumeData;

  // Format work experience section with bullet points
  const experienceSection = workExperience.map((exp: any) => {
    const achievements = exp.achievements || [];
    const achievementsList = achievements.map((achievement: string) => 
      `  • ${achievement}`
    ).join('\n');

    return `${exp.company || 'Company'}, ${exp.position || 'Position'}
${exp.location || 'Location'} | ${exp.startDate || ''} - ${exp.current ? 'Present' : exp.endDate || ''}
${achievementsList}`;
  }).join('\n\n');

  // Format education section
  const educationSection = education.map((edu: any) => 
    `${edu.institution || 'Institution'}
${edu.degree || 'Degree'}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}
${edu.city && edu.country ? `${edu.city}, ${edu.country}` : edu.city || edu.country || ''}
${edu.startDate || ''} - ${edu.current ? 'Present' : edu.endDate || ''}`
  ).join('\n\n');

  // Format projects section
  const projectsSection = projects?.length ? 
    `Projects: ${projects.map((project: any) => project.name).join(', ')}` : '';

  // Format certifications section
  const certificationsSection = certifications?.length ? 
    `Certifications: ${certifications.map((cert: any) => cert.name).join(', ')}` : '';

  // Combine all skills
  const skillsSection = [
    technicalSkills?.length ? `Technical Skills: ${technicalSkills.join(', ')}` : '',
    softSkills?.length ? `Soft Skills: ${softSkills.join(', ')}` : '',
    skills?.length ? `Other Skills: ${skills.join(', ')}` : ''
  ].filter(Boolean).join('\n');

  // Combine all sections into the minimalist resume with proper order
  return `${fullName || 'First Last'}
${email || 'email@example.com'} | ${phone || 'Phone'} | ${city && country ? `${city}, ${country}` : city || country || 'Location'}

${summary ? `SUMMARY\n${summary}\n\n` : ''}

EXPERIENCE
${experienceSection}

EDUCATION
${educationSection}

${skillsSection ? `SKILLS\n${skillsSection}\n\n` : ''}

${projectsSection ? `PROJECTS\n${projectsSection}\n\n` : ''}

${certificationsSection ? `CERTIFICATIONS\n${certificationsSection}` : ''}`;
}

/**
 * Generate Elegant template - Sophisticated with serif fonts
 */
export function generateElegantTemplate(resumeData: any): string {
  if (!resumeData) return '';
  
  // Convert the resumeData to a well-formatted text resume
  const {
    fullName = '',
    targetJobTitle = '',
    email = '',
    phone = '',
    location = '',
    country = '',
    city = '',
    linkedinUrl = '',
    portfolioUrl = '',
    summary = '',
    workExperience = [],
    education = [],
    skills = [],
    technicalSkills = [],
    softSkills = [],
    certifications = [],
    projects = []
  } = resumeData;

  // Format contact information
  const contactInfo = [
    email && `Email: ${email}`,
    phone && `Phone: ${phone}`,
    (city && country) && `Location: ${city}, ${country}`,
    linkedinUrl && `LinkedIn: ${linkedinUrl}`,
    portfolioUrl && `Website: ${portfolioUrl}`
  ].filter(Boolean).join(' | ');

  // Format work experience
  const experienceSection = workExperience.map((exp: any) => {
    const duration = `${formatLatexDate(exp.startDate)} - ${exp.current ? 'Present' : formatLatexDate(exp.endDate)}`;
    const achievements = exp.achievements && exp.achievements.length 
      ? '\n' + exp.achievements.map((a: string) => `  • ${cleanAchievement(a)}`).join('\n')
      : '';
    
    return `${exp.position}
${exp.company}, ${exp.location}
${duration}
${exp.description}${achievements}`;
  }).join('\n\n');

  // Format education
  const educationSection = education.map((edu: any) => {
    const duration = `${formatLatexDate(edu.startDate)} - ${edu.current ? 'Present' : formatLatexDate(edu.endDate)}`;
    
    return `${edu.degree} ${edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
${edu.institution}
${duration}
${edu.description || ''}`;
  }).join('\n\n');

  // Format skills - combine all skill types
  const allSkills = [...skills, ...technicalSkills, ...softSkills]
    .filter((skill, index, self) => self.indexOf(skill) === index);
  const skillsSection = allSkills.length > 0 ? allSkills.join(' • ') : '';

  // Format projects
  const projectsSection = projects.map((project: any) => {
    const duration = `${formatLatexDate(project.startDate)} - ${project.current ? 'Present' : formatLatexDate(project.endDate)}`;
    const technologies = project.technologies && project.technologies.length 
      ? `\nTechnologies: ${project.technologies.join(', ')}`
      : '';
    
    return `${project.name}
${duration}
${project.description}${technologies}`;
  }).join('\n\n');

  // Format certifications
  const certificationsSection = certifications.map((cert: any) => {
    return `${cert.name}
${cert.issuer}
${formatLatexDate(cert.date)}`;
  }).join('\n\n');

  // Compile the final text resume with elegant formatting
  return `${fullName.toUpperCase()}
${targetJobTitle}

${contactInfo}

${summary ? `PROFESSIONAL SUMMARY\n${summary}\n\n` : ''}

${experienceSection ? `EXPERIENCE\n${experienceSection}\n\n` : ''}

${educationSection ? `EDUCATION\n${educationSection}\n\n` : ''}

${skillsSection ? `SKILLS\n${skillsSection}\n\n` : ''}

${projectsSection ? `PROJECTS\n${projectsSection}\n\n` : ''}

${certificationsSection ? `CERTIFICATIONS\n${certificationsSection}` : ''}`;
}

/**
 * Generate Corporate template - Professional and structured business styling
 */
export function generateCorporateTemplate(resumeData: any): string {
  if (!resumeData) return '';
  
  // Convert the resumeData to a well-formatted text resume for corporate style
  const {
    fullName = '',
    targetJobTitle = '',
    email = '',
    phone = '',
    location = '',
    country = '',
    city = '',
    linkedinUrl = '',
    portfolioUrl = '',
    summary = '',
    workExperience = [],
    education = [],
    skills = [],
    technicalSkills = [],
    softSkills = [],
    certifications = [],
    projects = []
  } = resumeData;

  // Format contact information in a structured corporate style
  const contactInfo = [
    email && `Email: ${email}`,
    phone && `Phone: ${phone}`,
    (city && country) && `Location: ${city}, ${country}`,
    linkedinUrl && `LinkedIn: ${linkedinUrl}`,
    portfolioUrl && `Website: ${portfolioUrl}`
  ].filter(Boolean).join(' | ');

  // Format work experience with corporate structure
  const experienceSection = workExperience.map((exp: any) => {
    const duration = `${formatLatexDate(exp.startDate)} - ${exp.current ? 'Present' : formatLatexDate(exp.endDate)}`;
    const achievements = exp.achievements && exp.achievements.length 
      ? '\n' + exp.achievements.map((a: string) => `  • ${cleanAchievement(a)}`).join('\n')
      : '';
    
    return `${exp.position} | ${exp.company} | ${exp.location}
${duration}
${exp.description}${achievements}`;
  }).join('\n\n');

  // Format education with corporate structure
  const educationSection = education.map((edu: any) => {
    const duration = `${formatLatexDate(edu.startDate)} - ${edu.current ? 'Present' : formatLatexDate(edu.endDate)}`;
    
    return `${edu.degree} ${edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''} | ${edu.institution}
${duration}
${edu.description || ''}`;
  }).join('\n\n');

  // Format skills - combine all skill types with corporate categorization
  const allSkills = [...skills, ...technicalSkills, ...softSkills]
    .filter((skill, index, self) => self.indexOf(skill) === index);
  const skillsSection = allSkills.length > 0 ? allSkills.join(' | ') : '';

  // Format projects with corporate structure
  const projectsSection = projects.map((project: any) => {
    const duration = `${formatLatexDate(project.startDate)} - ${project.current ? 'Present' : formatLatexDate(project.endDate)}`;
    const technologies = project.technologies && project.technologies.length 
      ? `\nTechnologies: ${project.technologies.join(', ')}`
      : '';
    
    return `${project.name} | ${duration}
${project.description}${technologies}`;
  }).join('\n\n');

  // Format certifications with corporate structure
  const certificationsSection = certifications.map((cert: any) => {
    return `${cert.name} | ${cert.issuer} | ${formatLatexDate(cert.date)}`;
  }).join('\n\n');

  // Compile the final text resume with corporate formatting
  return `${fullName}
${targetJobTitle}

${contactInfo}

${summary ? `EXECUTIVE SUMMARY\n${summary}\n\n` : ''}

${experienceSection ? `PROFESSIONAL EXPERIENCE\n${experienceSection}\n\n` : ''}

${educationSection ? `EDUCATION & CREDENTIALS\n${educationSection}\n\n` : ''}

${skillsSection ? `CORE COMPETENCIES\n${skillsSection}\n\n` : ''}

${projectsSection ? `KEY PROJECTS\n${projectsSection}\n\n` : ''}

${certificationsSection ? `PROFESSIONAL CERTIFICATIONS\n${certificationsSection}` : ''}`;
}

/**
 * Generate modern template with creative elements
 */
export function generateModernTemplate(resumeData: any): string {
  if (!resumeData) return '';
  
  // Convert the resumeData to a modern formatted text resume
  const {
    fullName = '',
    targetJobTitle = '',
    email = '',
    phone = '',
    location = '',
    country = '',
    city = '',
    linkedinUrl = '',
    portfolioUrl = '',
    summary = '',
    workExperience = [],
    education = [],
    skills = [],
    technicalSkills = [],
    softSkills = [],
    certifications = [],
    projects = []
  } = resumeData;

  // Format contact information
  const contactInfo = [
    email && `Email: ${email}`,
    phone && `Phone: ${phone}`,
    (city && country) && `Location: ${city}, ${country}`,
    linkedinUrl && `LinkedIn: ${linkedinUrl}`,
    portfolioUrl && `Website: ${portfolioUrl}`
  ].filter(Boolean).join('\n');

  // Format work experience
  const experienceSection = workExperience.map((exp: any) => {
    const duration = `${formatLatexDate(exp.startDate)} - ${exp.current ? 'Present' : formatLatexDate(exp.endDate)}`;
    const achievements = exp.achievements && exp.achievements.length 
      ? '\n' + exp.achievements.map((a: string) => `  • ${cleanAchievement(a)}`).join('\n')
      : '';
    
    return `${exp.position}
${exp.company} | ${exp.location} | ${duration}
${exp.description}${achievements}`;
  }).join('\n\n');

  // Format education
  const educationSection = education.map((edu: any) => {
    const duration = `${formatLatexDate(edu.startDate)} - ${edu.current ? 'Present' : formatLatexDate(edu.endDate)}`;
    
    return `${edu.degree} ${edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
${edu.institution} | ${duration}
${edu.description || ''}`;
  }).join('\n\n');

  // Format skills - combine all skill types
  const allSkills = [...skills, ...technicalSkills, ...softSkills]
    .filter((skill, index, self) => self.indexOf(skill) === index);
  const skillsSection = allSkills.length > 0 ? allSkills.join(' | ') : '';

  // Format projects
  const projectsSection = projects.map((project: any) => {
    const duration = `${formatLatexDate(project.startDate)} - ${project.current ? 'Present' : formatLatexDate(project.endDate)}`;
    const technologies = project.technologies && project.technologies.length 
      ? `\nTechnologies: ${project.technologies.join(', ')}`
      : '';
    
    return `${project.name} | ${duration}
${project.description}${technologies}`;
  }).join('\n\n');

  // Format certifications
  const certificationsSection = certifications.map((cert: any) => {
    return `${cert.name}
${cert.issuer} | ${formatLatexDate(cert.date)}`;
  }).join('\n\n');

  // Compile the final text resume with modern formatting
  return `${fullName}
${targetJobTitle}

${contactInfo}

${summary ? `PROFILE\n${summary}\n\n` : ''}

${experienceSection ? `EXPERIENCE\n${experienceSection}\n\n` : ''}

${educationSection ? `EDUCATION\n${educationSection}\n\n` : ''}

${skillsSection ? `SKILLS\n${skillsSection}\n\n` : ''}

${projectsSection ? `PROJECTS\n${projectsSection}\n\n` : ''}

${certificationsSection ? `CERTIFICATIONS\n${certificationsSection}` : ''}`;
}

/**
 * Generate creative template with modern design elements
 */
export function generateCreativeTemplate(resumeData: any): string {
  if (!resumeData) return '';
  
  // Convert the resumeData to a creative formatted text resume
  const {
    fullName = '',
    targetJobTitle = '',
    email = '',
    phone = '',
    location = '',
    country = '',
    city = '',
    linkedinUrl = '',
    portfolioUrl = '',
    summary = '',
    workExperience = [],
    education = [],
    skills = [],
    technicalSkills = [],
    softSkills = [],
    certifications = [],
    projects = []
  } = resumeData;

  // Format contact information creatively
  const contactInfo = [
    email && `✉️ ${email}`,
    phone && `📱 ${phone}`,
    (city && country) && `📍 ${city}, ${country}`,
    linkedinUrl && `🔗 ${linkedinUrl}`,
    portfolioUrl && `🌐 ${portfolioUrl}`
  ].filter(Boolean).join(' | ');

  // Format work experience with creative elements
  const experienceSection = workExperience.map((exp: any) => {
    const duration = `${formatLatexDate(exp.startDate)} - ${exp.current ? 'Present' : formatLatexDate(exp.endDate)}`;
    const achievements = exp.achievements && exp.achievements.length 
      ? '\n' + exp.achievements.map((a: string) => `  ✓ ${cleanAchievement(a)}`).join('\n')
      : '';
    
    return `${exp.position}
${exp.company} | ${exp.location}
${duration}
${exp.description}${achievements}`;
  }).join('\n\n');

  // Format education with creative elements
  const educationSection = education.map((edu: any) => {
    const duration = `${formatLatexDate(edu.startDate)} - ${edu.current ? 'Present' : formatLatexDate(edu.endDate)}`;
    
    return `${edu.degree} ${edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
${edu.institution}
${duration}
${edu.description || ''}`;
  }).join('\n\n');

  // Format skills - combine all skill types with creative elements
  const allSkills = [...skills, ...technicalSkills, ...softSkills]
    .filter((skill, index, self) => self.indexOf(skill) === index);
  const skillsSection = allSkills.length > 0 ? allSkills.map(skill => `• ${skill}`).join('\n') : '';

  // Format projects with creative elements
  const projectsSection = projects.map((project: any) => {
    const duration = `${formatLatexDate(project.startDate)} - ${project.current ? 'Present' : formatLatexDate(project.endDate)}`;
    const technologies = project.technologies && project.technologies.length 
      ? `\nTech Stack: ${project.technologies.join(' | ')}`
      : '';
    
    return `★ ${project.name}
${duration}
${project.description}${technologies}`;
  }).join('\n\n');

  // Format certifications with creative elements
  const certificationsSection = certifications.map((cert: any) => {
    return `🏆 ${cert.name}
${cert.issuer} | ${formatLatexDate(cert.date)}`;
  }).join('\n\n');

  // Compile the final text resume with creative formatting
  return `${fullName}
${targetJobTitle}

${contactInfo}

${summary ? `ABOUT ME\n${summary}\n\n` : ''}

${experienceSection ? `MY EXPERIENCE\n${experienceSection}\n\n` : ''}

${educationSection ? `MY EDUCATION\n${educationSection}\n\n` : ''}

${skillsSection ? `MY SKILLS\n${skillsSection}\n\n` : ''}

${projectsSection ? `MY PROJECTS\n${projectsSection}\n\n` : ''}

${certificationsSection ? `MY CERTIFICATIONS\n${certificationsSection}` : ''}`;
}

/**
 * Generate LaTeX content for a resume
 */
export function generateLatexResume(resumeData: any, template: string = 'latex'): string {
  // Choose template based on parameter
  if (!resumeData) return '';
  
  switch (template) {
    case 'minimalist':
      return generateMinimalistTemplate(resumeData);
    case 'modern':
      return generateModernTemplate(resumeData);
    case 'creative':
      return generateCreativeTemplate(resumeData);
    case 'elegant':
      return generateElegantTemplate(resumeData);
    case 'corporate':
      return generateCorporateTemplate(resumeData);
    case 'plain': // Support legacy template name
    case 'professional':
    case 'latex':
    default:
      return generateProfessionalTemplate(resumeData);
  }
}