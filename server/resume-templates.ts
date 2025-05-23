/**
 * LaTeX resume template generator
 * This file contains templates for generating LaTeX resume documents
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
  return escapeLatex(achievement.trim());
}

/**
 * Generates professional LaTeX template (Template 1)
 */
export function generateProfessionalTemplate(resumeData: any): string {
  const {
    fullName,
    email,
    phone,
    location,
    linkedinUrl,
    portfolioUrl,
    summary,
    workExperience = [],
    education = [],
    skills = [],
    technicalSkills = [],
    softSkills = [],
    certifications = [],
    projects = [],
    publications = []
  } = resumeData;

  // Format work experience
  const workExperienceSection = workExperience.length 
    ? `\\section{Experience}
\\resumeSubHeadingList
${workExperience.map((exp: any) => {
  const achievements = exp.achievements || [];
  const achievementsText = achievements.length 
    ? `\\resumeItemListStart
${achievements.map((achievement: string) => `\\resumeItem{${cleanAchievement(achievement)}}`).join('\n')}
\\resumeItemListEnd`
    : '';

  return `\\resumeSubheading
{${escapeLatex(exp.company || '')}} {${escapeLatex(exp.location || '')}}
{${escapeLatex(exp.position || '')}} {${formatLatexDate(exp.startDate)} - ${exp.current ? 'Present' : formatLatexDate(exp.endDate)}}
${achievementsText}`;
}).join('\n')}
\\resumeSubHeadingListEnd`
    : '';

  // Format education
  const educationSection = education.length 
    ? `\\section{Education}
\\resumeSubHeadingList
${education.map((edu: any) => 
  `\\resumeSubheading
{${escapeLatex(edu.institution || '')}} {${escapeLatex(edu.location || '')}}
{${escapeLatex(edu.degree || '')}${edu.fieldOfStudy ? ` in ${escapeLatex(edu.fieldOfStudy || '')}` : ''}} {${formatLatexDate(edu.startDate)} - ${edu.current ? 'Present' : formatLatexDate(edu.endDate)}}
${edu.description ? `\\resumeItemListStart
\\resumeItem{${escapeLatex(edu.description)}}
\\resumeItemListEnd` : ''}`
).join('\n')}
\\resumeSubHeadingListEnd`
    : '';

  // Format projects
  const projectsSection = projects.length 
    ? `\\section{Projects}
\\resumeSubHeadingList
${projects.map((project: any) => {
  const technologies = project.technologies?.length ? project.technologies.join(', ') : '';
  
  return `\\resumeSubheading
{${escapeLatex(project.name || '')}} {${project.current ? 'Present' : formatLatexDate(project.endDate)}}
{${escapeLatex(project.description || '')}} {${formatLatexDate(project.startDate)}}
${technologies ? `\\resumeItemListStart
\\resumeItem{Technologies used: ${escapeLatex(technologies)}}
\\resumeItemListEnd` : ''}`;
}).join('\n')}
\\resumeSubHeadingListEnd`
    : '';

  // Format publications
  const publicationsSection = publications.length 
    ? `\\section{Publications}
\\resumeSubHeadingList
${publications.map((pub: any) => 
  `\\resumeSubheading
{${escapeLatex(pub.title || '')}} {${formatLatexDate(pub.publicationDate)}}
{${escapeLatex(pub.publisher || '')}${pub.authors ? ` | ${escapeLatex(pub.authors)}` : ''}} {}
${pub.description ? `\\resumeItemListStart
\\resumeItem{${escapeLatex(pub.description)}}
${pub.url ? `\\resumeItem{URL/DOI: ${escapeLatex(pub.url)}}` : ''}
\\resumeItemListEnd` : (pub.url ? `\\resumeItemListStart
\\resumeItem{URL/DOI: ${escapeLatex(pub.url)}}
\\resumeItemListEnd` : '')}`
).join('\n')}
\\resumeSubHeadingListEnd`
    : '';

  // Format certifications
  const certificationsSection = certifications.length 
    ? `\\section{Certifications}
\\resumeSubHeadingList
${certifications.map((cert: any) => 
  `\\resumeSubheading
{${escapeLatex(cert.name || '')}} {${formatLatexDate(cert.date)}}
{${escapeLatex(cert.issuer || '')}} {${cert.expires ? `Expires: ${formatLatexDate(cert.expiryDate)}` : 'No Expiration'}}`
).join('\n')}
\\resumeSubHeadingListEnd`
    : '';

  // Format technical skills
  const technicalSkillsText = technicalSkills?.length 
    ? `\\item{
      \\textbf{Technical Skills}{: ${escapeLatex(technicalSkills.join(', '))}}
    }`
    : '';

  // Format soft skills
  const softSkillsText = softSkills?.length 
    ? `\\item{
      \\textbf{Soft Skills}{: ${escapeLatex(softSkills.join(', '))}}
    }`
    : '';

  // Format other skills
  const otherSkillsText = skills?.length 
    ? `\\item{
      \\textbf{Other Skills}{: ${escapeLatex(skills.join(', '))}}
    }`
    : '';

  // Format LinkedIn URL
  const linkedinLink = linkedinUrl 
    ? `\\href{${escapeLatex(linkedinUrl)}}{LinkedIn} $|$ `
    : '';

  // Format portfolio URL
  const portfolioLink = portfolioUrl 
    ? `\\href{${escapeLatex(portfolioUrl)}}{Portfolio} $|$ `
    : '';

  const contactLinks = `${portfolioLink}${linkedinLink}`;

  return `\\documentclass[letterpaper,10pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}

% Font options
\\usepackage{times}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Section formatting
\\titleformat{\\section}{\\Large\\bfseries\\scshape\\raggedright}{}{0em}{}[\\titlerule]

% Ensure PDF is machine readable
% \\pdfgentounicode=1

% Custom commands
\\newcommand{\\resumeItem}[1]{\\item\\small{#1}}
\\newcommand{\\resumeSubheading}[4]{
\\vspace{-1pt}\\item
  \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
    \\textbf{#1} & #2 \\\\
    \\textit{#3} & \\textit{#4} \\\\
  \\end{tabular*}\\vspace{-7pt}
}
\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}
\\newcommand{\\resumeSubHeadingList}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}}

\\begin{document}

\\begin{center}
  \\textbf{\\Huge ${escapeLatex(fullName || 'Your Name')}} \\\\
  \\small ${escapeLatex(phone || 'Phone')} $|$ \\href{mailto:${escapeLatex(email || 'email@example.com')}}{${escapeLatex(email || 'email@example.com')}} $|$ ${escapeLatex(location || 'Location')}
  ${contactLinks ? `\\\\ \\small ${contactLinks}` : ''}
\\end{center}

${summary ? `\\section*{Summary}
${escapeLatex(summary)}
` : ''}

${(technicalSkills?.length || softSkills?.length || skills?.length) ? `\\section{Skills}
\\resumeSubHeadingList
  ${technicalSkillsText}
  ${softSkillsText}
  ${otherSkillsText}
\\resumeSubHeadingListEnd
` : ''}

${workExperienceSection}

${educationSection}

${projectsSection}

${publicationsSection}

${certificationsSection}

\\end{document}`;
}

/**
 * Generates modern LaTeX template (Template 2)
 */
export function generateModernTemplate(resumeData: any): string {
  const {
    fullName,
    email,
    phone,
    location,
    country,
    city,
    linkedinUrl,
    portfolioUrl,
    summary,
    workExperience = [],
    education = [],
    skills = [],
    technicalSkills = [],
    softSkills = [],
    certifications = [],
    projects = [],
    publications = []
  } = resumeData;

  // Combine location elements
  const locationText = location || (city && country ? `${city}, ${country}` : city || country || '');

  // Format work experience
  const workExperienceSection = workExperience.length 
    ? `\\cvsection{\\textbf{Experience}}
\\resumeSubHeadingListStart
${workExperience.map((exp: any) => {
  const achievements = exp.achievements || [];
  const achievementsText = achievements.length 
    ? `    \\resumeItemListStart
${achievements.map((achievement: string) => 
  `        \\item {${cleanAchievement(achievement)}}`
).join('\n')}
    \\resumeItemListEnd`
    : '';

  return `    \\resumeSubheading
      {${escapeLatex(exp.position || '')}}{${formatLatexDate(exp.startDate)} -- ${formatLatexDate(exp.endDate)}}
      {${escapeLatex(exp.company || '')}}{${escapeLatex(exp.location || '')}}
      \\vspace{-2.0mm}
      ${achievementsText}
      
      \\vspace{-3.0mm}`;
}).join('\n')}
\\resumeSubHeadingListEnd
\\vspace{-5.5mm}
`
    : '';

  // Format education
  const educationSection = education.length 
    ? `\\cvsection{\\textbf{Education}}
\\resumeSubHeadingListStart
${education.map((edu: any) => 
  `    \\resumeSubheading
      {${escapeLatex(edu.degree || '')}}${edu.fieldOfStudy ? ` in ${escapeLatex(edu.fieldOfStudy || '')}` : ''}}{${edu.gpa ? `GPA: ${edu.gpa}` : ''}}
      {${escapeLatex(edu.institution || '')}}{${formatLatexDate(edu.startDate)} -- ${formatLatexDate(edu.endDate)}}
      ${edu.description ? 
      `\\vspace{-2.0mm}
      \\resumeItemListStart
        \\item {${escapeLatex(edu.description)}}
      \\resumeItemListEnd
      
      \\vspace{-3.0mm}` : ''}`
).join('\n')}
\\resumeSubHeadingListEnd
\\vspace{-5.5mm}
`
    : '';
  
  // Format projects
  const projectsSection = projects.length 
    ? `\\cvsection{\\textbf{Personal Projects}}
\\resumeSubHeadingListStart
${projects.map((project: any) => {
  const technologies = project.technologies?.length ? project.technologies.join(', ') : '';
  const url = project.url ? project.url : '';
  const dates = project.startDate ? `${formatLatexDate(project.startDate)} -- ${formatLatexDate(project.endDate)}` : '';
  
  return `    \\resumeProject
      {${escapeLatex(project.name || '')}} 
      {${escapeLatex(project.description || '')}}
      {${dates}}
      ${technologies ? `
      \\resumeItemListStart
        \\item {Technology Used: ${escapeLatex(technologies)}}
        ${url ? `\\item {URL: ${escapeLatex(url)}}` : ''}
      \\resumeItemListEnd
      \\vspace{-2mm}` : ''}`;
}).join('\n')}
\\resumeSubHeadingListEnd
\\vspace{-8.5mm}
`
    : '';

  // Format publications
  const publicationsSection = publications.length 
    ? `\\cvsection{\\textbf{Publications}}
\\resumeSubHeadingListStart
${publications.map((pub: any) => 
  `    \\resumeSubheading
      {${escapeLatex(pub.title || '')}}{${formatLatexDate(pub.publicationDate)}}
      {${escapeLatex(pub.publisher || '')}${pub.authors ? ` | ${escapeLatex(pub.authors)}` : ''}}{}
      ${pub.description ? 
      `\\vspace{-2.0mm}
      \\resumeItemListStart
        \\item {${escapeLatex(pub.description)}}
        ${pub.url ? `\\item {URL/DOI: ${escapeLatex(pub.url)}}` : ''}
      \\resumeItemListEnd
      
      \\vspace{-3.0mm}` : (pub.url ? `\\vspace{-2.0mm}
      \\resumeItemListStart
        \\item {URL/DOI: ${escapeLatex(pub.url)}}
      \\resumeItemListEnd
      
      \\vspace{-3.0mm}` : '')}`
).join('\n')}
\\resumeSubHeadingListEnd
\\vspace{-5.5mm}
`
    : '';

  // Combine all skills
  const allSkillsSection = `\\cvsection{\\textbf{Technical Skills and Interests}}
 \\begin{itemize}[leftmargin=0.05in, label={}]
    \\small{\\item{
     ${technicalSkills?.length ? `\\textbf{Technical Skills}{: ${escapeLatex(technicalSkills.join(', '))}} \\\\` : ''}
     ${softSkills?.length ? `\\textbf{Soft Skills}{: ${escapeLatex(softSkills.join(', '))}} \\\\` : ''}
     ${skills?.length ? `\\textbf{Other Skills}{: ${escapeLatex(skills.join(', '))}} \\\\` : ''}
     ${summary ? `\\textbf{Professional Summary}{: ${escapeLatex(summary)}} \\\\` : ''}
    }}
 \\end{itemize}
 \\vspace{-16pt}`;

  // Format certifications
  const certificationsSection = certifications.length 
    ? `\\cvsection{\\textbf{Certifications}}
\\vspace{-0.4mm}
\\resumeSubHeadingListStart
${certifications.map((cert: any) => 
  `\\resumePOR{${escapeLatex(cert.name)}} 
    {${escapeLatex(cert.issuer)}}
    {${formatLatexDate(cert.date)}}`
).join('\n')}
\\resumeSubHeadingListEnd
\\vspace{-5mm}
`
    : '';

  return `%-------------------------
% Resume in Latex
% Template 2
%------------------------

%---- Required Packages and Functions ----

\\documentclass[a4paper,11pt]{article}
\\usepackage{latexsym}
\\usepackage{xcolor}
\\usepackage{float}
\\usepackage{ragged2e}
\\usepackage[empty]{fullpage}
\\usepackage{wrapfig}
\\usepackage{lipsum}
\\usepackage{tabularx}
\\usepackage{titlesec}
\\usepackage{geometry}
\\usepackage{marvosym}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage{multicol}
\\usepackage{graphicx}
\\setlength{\\multicolsep}{0pt} 
\\pagestyle{fancy}
\\fancyhf{} % clear all header and footer fields
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}
\\geometry{left=1.4cm, top=0.8cm, right=1.2cm, bottom=1cm}

\\usepackage[most]{tcolorbox}
\\tcbset{
        frame code={}
        center title,
        left=0pt,
        right=0pt,
        top=0pt,
        bottom=0pt,
        colback=gray!20,
        colframe=white,
        width=\\dimexpr\\textwidth\\relax,
        enlarge left by=-2mm,
        boxsep=4pt,
        arc=0pt,outer arc=0pt,
}

\\urlstyle{same}

\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-7pt}]

%-------------------------
% Custom commands
\\newcommand{\\resumeItem}[2]{
  \\item{
    \\textbf{#1}{\\hspace{0.5mm}#2 \\vspace{-0.5mm}}
  }
}

\\newcommand{\\resumePOR}[3]{
\\vspace{0.5mm}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
        \\textbf{#1}\\hspace{0.3mm}#2 & \\textit{\\small{#3}} 
    \\end{tabular*}
    \\vspace{-2mm}
}

\\newcommand{\\resumeSubheading}[4]{
\\vspace{0.5mm}\\item
    \\begin{tabular*}{0.98\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
        \\textbf{#1} & \\textit{\\footnotesize{#4}} \\\\
        \\textit{\\footnotesize{#3}} &  \\footnotesize{#2}\\\\
    \\end{tabular*}
    \\vspace{-2.4mm}
}

\\newcommand{\\resumeProject}[4]{
\\vspace{0.5mm}\\item
    \\begin{tabular*}{0.98\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
        \\textbf{#1} & \\textit{\\footnotesize{#3}} \\\\
        \\footnotesize{\\textit{#2}} & \\footnotesize{#4}
    \\end{tabular*}
    \\vspace{-2.4mm}
}

\\newcommand{\\resumeSubItem}[2]{\\resumeItem{#1}{#2}\\vspace{-4pt}}
\\renewcommand{\\labelitemi}{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}
\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=*,labelsep=0mm]}
\\newcommand{\\resumeHeadingSkillStart}{\\begin{itemize}[leftmargin=*,itemsep=1.7mm, rightmargin=2ex]}
\\newcommand{\\resumeItemListStart}{\\begin{justify}\\begin{itemize}[leftmargin=3ex, rightmargin=2ex, noitemsep,labelsep=1.2mm,itemsep=0mm]\\small}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}\\vspace{2mm}}
\\newcommand{\\resumeHeadingSkillEnd}{\\end{itemize}\\vspace{-2mm}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\end{justify}\\vspace{-2mm}}
\\newcommand{\\cvsection}[1]{%
\\vspace{2mm}
\\begin{tcolorbox}
    \\textbf{\\large #1}
\\end{tcolorbox}
    \\vspace{-4mm}
}
\\newcolumntype{L}{>{\\raggedright\\arraybackslash}X}%
\\newcolumntype{R}{>{\\raggedleft\\arraybackslash}X}%
\\newcolumntype{C}{>{\\centering\\arraybackslash}X}%

\\begin{document}

{
\\begin{tabularx}{\\linewidth}{L r} \\\\
  \\textbf{\\Large ${escapeLatex(fullName || 'Your Name')}} & {\\raisebox{0.0\\height}{\\footnotesize \\faPhone}}\\ ${escapeLatex(phone || 'Phone')}\\\\
  ${email ? `{${escapeLatex(email)}} & \\href{mailto:${escapeLatex(email)}}{\\raisebox{0.0\\height}{\\footnotesize \\faEnvelope}}\\ {${escapeLatex(email)}}` : ''} \\\\
  ${locationText ? `{${escapeLatex(locationText)}} & ${linkedinUrl ? `\\href{${escapeLatex(linkedinUrl)}}{\\raisebox{0.0\\height}{\\footnotesize \\faLinkedin}}\\ {LinkedIn}` : ''}` : ''} \\\\  
  ${portfolioUrl ? `{Portfolio} & \\href{${escapeLatex(portfolioUrl)}}{\\raisebox{0.0\\height}{\\footnotesize \\faGlobe}}\\ {${escapeLatex(portfolioUrl)}}` : ''}
\\end{tabularx}
}

${educationSection}

${projectsSection}

${workExperienceSection}

${publicationsSection}

${allSkillsSection}

${certificationsSection}

\\end{document}`;
}

/**
 * Generate LaTeX content for a resume
 */
export function generateLatexResume(resumeData: any, template: string = 'professional'): string {
  switch (template.toLowerCase()) {
    case 'modern':
      return generateModernTemplate(resumeData);
    case 'professional':
    default:
      return generateProfessionalTemplate(resumeData);
  }
}
