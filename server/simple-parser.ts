import fs from 'fs';

/**
 * A very simple resume parser that doesn't rely on external libraries.
 * This handles all file types by treating them as raw text and extracting
 * information using regular expressions and text pattern matching.
 */
export function parseResume(filePath: string): {
  name: string;
  email: string;
  phone: string;
  linkedIn: string;
  skills: string[];
  sections: Record<string, string>;
  workExperience: any[];
  education: any[];
  projects: any[];
  certifications: any[];
} {
  try {
    // Check file extension to determine if it's a binary file
    const fileExt = filePath.toLowerCase().split('.').pop();
    let fileContent = '';
    
    if (fileExt === 'pdf' || fileExt === 'docx' || fileExt === 'doc') {
      // For binary files, read as buffer and convert to text
      console.log(`Detected binary file: ${fileExt}`);
      const buffer = fs.readFileSync(filePath);
      // Basic conversion, will catch some text in binary files
      fileContent = buffer.toString('utf8');
    } else {
      // For text files, read directly
      fileContent = fs.readFileSync(filePath, 'utf8');
    }
    
    // Strip out non-printable ASCII characters to clean up the text
    const cleanedText = fileContent.replace(/[^\x20-\x7E\r\n]/g, ' ')
                                  .replace(/\s+/g, ' ');
    
    // Break into lines
    const lines = cleanedText.split('\n')
                            .map(line => line.trim())
                            .filter(line => line.length > 0);
    
    // Extract basic information with regex patterns
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
    const phonePattern = /\b(?:\+?1[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}\b/;
    const linkedinPattern = /(?:linkedin\.com\/in\/|linkedin\:)[a-zA-Z0-9_-]+/i;
    
    const emailMatch = cleanedText.match(emailPattern);
    const phoneMatch = cleanedText.match(phonePattern);
    const linkedinMatch = cleanedText.match(linkedinPattern);
    
    // Log the first 5 lines to help with debugging
    console.log("First 5 lines:", lines.slice(0, 5));
    
    // Try to extract name (typically in the first few lines)
    let nameMatch = "";
    
    // First look for filename - often contains the person's name
    if (filePath) {
      const filename = filePath.split('/').pop() || "";
      const nameFromFile = filename.replace(/\.(pdf|docx|doc|txt)$/i, '').replace(/_/g, ' ').trim();
      
      // If filename contains sensible name (not too short, no numbers or special characters)
      if (nameFromFile.length > 3 && nameFromFile.length < 40 && /^[A-Za-z\s]+$/.test(nameFromFile)) {
        console.log(`Using name from filename: ${nameFromFile}`);
        nameMatch = nameFromFile;
      }
    }
    
    // If name wasn't found in filename, try to find it in first few lines
    if (!nameMatch) {
      for (let i = 0; i < Math.min(10, lines.length); i++) {
        const line = lines[i];
        // Check if this looks like a name (no email, no phone, not too long)
        if (line.length > 0 && line.length < 40 && 
            !emailPattern.test(line) && 
            !phonePattern.test(line) &&
            !/\d{4}/.test(line) && // No years
            !/^(RESUME|CURRICULUM|CV|PROFILE)$/i.test(line) && // Not resume title
            /^[A-Za-z\s\.,]+$/.test(line)) { // Only alpha characters, spaces, periods
          nameMatch = line;
          console.log(`Found name in text: ${nameMatch}`);
          break;
        }
      }
    }
    
    // Extract sections based on common resume headers
    const sections: Record<string, string> = {};
    
    // Common headers
    const sectionHeaders = {
      summary: /^(SUMMARY|PROFESSIONAL SUMMARY|PROFILE|OBJECTIVE)/i,
      experience: /^(EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT|WORK HISTORY)/i,
      education: /^(EDUCATION|ACADEMIC)/i,
      skills: /^(SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES)/i,
      projects: /^(PROJECTS|PROJECT EXPERIENCE)/i,
      certifications: /^(CERTIFICATIONS|CERTIFICATES)/i
    };
    
    let currentSection = "header";
    sections[currentSection] = "";
    
    // Identify sections 
    for (const line of lines) {
      let foundHeader = false;
      
      // Check if this line is a section header
      for (const [section, pattern] of Object.entries(sectionHeaders)) {
        if (pattern.test(line)) {
          currentSection = section;
          foundHeader = true;
          // Initialize section if not exists
          if (!sections[currentSection]) {
            sections[currentSection] = "";
          }
          break;
        }
      }
      
      // Skip header line but add content lines to the current section
      if (!foundHeader) {
        sections[currentSection] += line + "\n";
      }
    }
    
    // Find skills from skills section if it exists
    let skills: string[] = [];
    if (sections.skills) {
      // Skills are typically comma or bullet separated
      skills = sections.skills
        .split(/[,•|\n-]/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && s.length < 50);
    }
    
    // Create a basic structure for work experience
    const workExperience = [];
    
    // Try to extract work experience entries if exist
    if (sections.experience) {
      const expLines = sections.experience.split('\n');
      let currentExp: any = null;
      let bullets: string[] = [];
      
      for (const line of expLines) {
        // Check if line looks like a job title/company line (often has dates)
        const hasDatePattern = /\b(19|20)\d{2}\b/.test(line) || 
                             /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(line);
        
        if (hasDatePattern && line.length < 100) {
          // If we already have a job entry, save it before starting new one
          if (currentExp) {
            currentExp.achievements = bullets;
            currentExp.description = bullets.join("\n");
            workExperience.push(currentExp);
            bullets = [];
          }
          
          // Start new job entry
          currentExp = {
            id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            company: "",
            position: "",
            location: "",
            startDate: "",
            endDate: "",
            current: false,
            description: "",
            achievements: []
          };
          
          // Try to extract dates
          const dateRangeMatch = line.match(/(\b\d{4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\s*(?:-|to|–)\s*(\b\d{4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|Present|Current)/i);
          
          if (dateRangeMatch) {
            currentExp.startDate = dateRangeMatch[1];
            currentExp.endDate = dateRangeMatch[2];
            currentExp.current = /present|current/i.test(dateRangeMatch[2]);
          }
          
          // Try to extract position and company
          // Common format: "Position at Company" or "Position, Company"
          const positionMatch = line.replace(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*(?:-|to|–)\s*(\b\d{4}\b|Present|Current)/gi, "").trim();
          
          if (positionMatch) {
            if (positionMatch.includes(" at ")) {
              const parts = positionMatch.split(" at ");
              currentExp.position = parts[0].trim();
              currentExp.company = parts[1].trim();
            } else if (positionMatch.includes(", ")) {
              const parts = positionMatch.split(", ");
              currentExp.position = parts[0].trim();
              currentExp.company = parts[1].trim();
            } else {
              currentExp.position = positionMatch;
            }
          }
        } 
        // Check if line is a bullet point
        else if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
          if (currentExp) {
            bullets.push(line.replace(/^[•\-*]+\s*/, '').trim());
          }
        }
        // Other lines may be continuation or additional info
        else if (line.trim().length > 0 && currentExp) {
          if (bullets.length > 0) {
            // Likely continuation of previous bullet
            bullets[bullets.length - 1] += " " + line.trim();
          } else {
            // Might be a company name or other info
            if (!currentExp.company) {
              currentExp.company = line.trim();
            }
          }
        }
      }
      
      // Add the last job entry if exists
      if (currentExp) {
        currentExp.achievements = bullets;
        currentExp.description = bullets.join("\n");
        workExperience.push(currentExp);
      }
    }
    
    // Extract education in a similar way
    const education = [];
    
    if (sections.education) {
      const eduLines = sections.education.split('\n');
      let currentEdu: any = null;
      
      for (const line of eduLines) {
        // Look for degree info or institution
        const hasDegree = /\b(?:Bachelor|Master|Ph\.D|MBA|B\.S\.|M\.S\.|B\.A\.|M\.A\.|Associate|Diploma)\b/i.test(line);
        const hasSchool = /\b(?:University|College|Institute|School)\b/i.test(line);
        const hasDate = /\b(19|20)\d{2}\b/.test(line);
        
        if ((hasDegree || hasSchool) && line.length < 100) {
          // Save previous education entry if exists
          if (currentEdu) {
            education.push(currentEdu);
          }
          
          // Start new education entry
          currentEdu = {
            id: `edu-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            institution: "",
            degree: "",
            fieldOfStudy: "",
            startDate: "",
            endDate: "",
            current: false,
            description: ""
          };
          
          // Try to extract institution
          const schoolMatch = line.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*\s+(?:University|College|Institute|School))\b/);
          if (schoolMatch) {
            currentEdu.institution = schoolMatch[1];
          }
          
          // Try to extract degree
          const degreeMatch = line.match(/\b(Bachelor|Master|Ph\.D|MBA|B\.S\.|M\.S\.|B\.A\.|M\.A\.|Associate|Diploma)(?:'s)?\s+(?:of|in)?\s+([A-Za-z\s]+)\b/i);
          if (degreeMatch) {
            currentEdu.degree = degreeMatch[1];
            if (degreeMatch[2]) {
              currentEdu.fieldOfStudy = degreeMatch[2].trim();
            }
          }
          
          // Try to extract dates
          const dateRangeMatch = line.match(/(\b\d{4}\b)\s*(?:-|to|–)\s*(\b\d{4}\b|Present|Current)/i);
          if (dateRangeMatch) {
            currentEdu.startDate = dateRangeMatch[1];
            currentEdu.endDate = dateRangeMatch[2];
            currentEdu.current = /present|current/i.test(dateRangeMatch[2]);
          }
        } 
        else if (line.trim().length > 0 && currentEdu) {
          // Additional information about the education
          if (!currentEdu.description) {
            currentEdu.description = line.trim();
          } else {
            currentEdu.description += " " + line.trim();
          }
        }
      }
      
      // Add the last education entry if exists
      if (currentEdu) {
        education.push(currentEdu);
      }
    }
    
    // Extract projects if available
    const projects = [];
    
    if (sections.projects) {
      const projLines = sections.projects.split('\n');
      let currentProj: any = null;
      let description: string[] = [];
      
      for (const line of projLines) {
        // Project titles are often short, may have tech stack or dates
        const isLikelyTitle = line.length < 60 && /^[A-Z]/.test(line);
        const hasTech = line.includes('|') && 
                      (line.includes('JavaScript') || line.includes('Python') || 
                       line.includes('Java') || line.includes('React'));
        
        if (isLikelyTitle || hasTech) {
          // Save previous project if exists
          if (currentProj) {
            currentProj.description = description.join("\n");
            projects.push(currentProj);
            description = [];
          }
          
          // Create new project
          currentProj = {
            id: `proj-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: "",
            description: "",
            technologies: [],
            startDate: "",
            endDate: "",
            current: false,
            url: null
          };
          
          // Extract name and technologies
          if (line.includes('|')) {
            const parts = line.split('|').map(p => p.trim());
            currentProj.name = parts[0];
            if (parts.length > 1) {
              currentProj.technologies = parts[1].split(/[,;]/).map(t => t.trim());
            }
          } else {
            currentProj.name = line;
          }
          
          // Try to extract date if present
          const dateMatch = line.match(/\b(20\d{2})\b/);
          if (dateMatch) {
            currentProj.startDate = dateMatch[1];
          }
        } 
        else if (line.trim().length > 0 && currentProj) {
          // Line is part of project description
          description.push(line.trim());
        }
      }
      
      // Add final project if exists
      if (currentProj) {
        currentProj.description = description.join("\n");
        projects.push(currentProj);
      }
    }
    
    // Extract certifications if available
    const certifications = [];
    
    if (sections.certifications) {
      const certLines = sections.certifications.split('\n');
      
      for (let i = 0; i < certLines.length; i++) {
        const line = certLines[i].trim();
        
        // Skip empty lines
        if (!line) continue;
        
        const isBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('*');
        const certText = isBullet ? line.substring(1).trim() : line;
        
        // Skip if too short
        if (certText.length < 3) continue;
        
        const cert = {
          id: `cert-${Date.now()}-${i}`,
          name: certText,
          issuer: "",
          date: "",
          expires: false,
          expiryDate: null
        };
        
        // Try to extract issuer
        if (certText.includes(" - ")) {
          const parts = certText.split(" - ");
          cert.name = parts[0].trim();
          cert.issuer = parts[1].trim();
        } else if (certText.includes(", ")) {
          const parts = certText.split(", ");
          cert.name = parts[0].trim();
          if (parts.length > 1 && !parts[1].match(/\b20\d{2}\b/)) {
            cert.issuer = parts[1].trim();
          }
        }
        
        // Try to extract date
        const dateMatch = certText.match(/\b(20\d{2})\b/);
        if (dateMatch) {
          cert.date = dateMatch[1];
        }
        
        certifications.push(cert);
      }
    }
    
    return {
      name: nameMatch || "Not extracted from document",
      email: emailMatch ? emailMatch[0] : "Not extracted from document",
      phone: phoneMatch ? phoneMatch[0] : "Not extracted from document",
      linkedIn: linkedinMatch ? linkedinMatch[0] : "",
      skills,
      sections,
      workExperience,
      education,
      projects,
      certifications
    };
  } catch (error) {
    console.error("Error in simple resume parser:", error);
    // Return empty results on error
    return {
      name: "Error parsing document",
      email: "",
      phone: "",
      linkedIn: "",
      skills: [],
      sections: {},
      workExperience: [],
      education: [],
      projects: [],
      certifications: []
    };
  }
}