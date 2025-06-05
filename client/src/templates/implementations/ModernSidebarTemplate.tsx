import React from 'react';
import { BaseTemplate } from '../base/ResumeTemplate';
import { type ResumeData } from '@/types/resume';
import { generatePDFFromReactElement } from '../utils/exportUtils';
import { renderSections } from '../core/sectionRenderer';

export class ModernSidebarTemplate extends BaseTemplate {
  name = 'Modern Sidebar';
  description = 'A clean, modern two-column layout with a sidebar for contact info and skills, perfect for showcasing technical expertise.';
  preview = '/templates/modern-sidebar.png';

  metadata = {
    id: 'modern-sidebar',
    name: 'Modern Sidebar',
    description: 'A clean, modern two-column layout with a sidebar for contact info and skills, perfect for showcasing technical expertise.',
    isAtsOptimized: true,
    version: '1.0.0',
    thumbnail: '/templates/modern-sidebar.png',
    category: 'modern',
    tags: ['modern', 'sidebar', 'two-column', 'clean', 'technical']
  };

  constructor() {
    super();
    this.customization = {
      colors: {
        primary: '#2563eb',
        secondary: '#475569',
        text: '#1f2937',
        background: '#ffffff'
      },
      fonts: {
        heading: 'Inter',
        body: 'Inter'
      },
      spacing: {
        margins: '1rem',
        lineHeight: 1.5,
        sectionSpacing: '1.5rem'
      }
    };
  }

  render(data: ResumeData): JSX.Element {
    console.log("ModernSidebarTemplate rendering with data:", data);
    const { colors, fonts } = this.customization;

    // Check if skills should be categorized
    const useSkillCategories = data.useSkillCategories ?? false;

    const containerStyle: React.CSSProperties = {
      width: '210mm',
      minHeight: '297mm',
      backgroundColor: '#ffffff',
      fontFamily: fonts.body || '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '9pt',
      padding: '0',
      color: '#2d3748',
      margin: '0',
      boxSizing: 'border-box',
      lineHeight: '1.3',
      position: 'relative',
      display: 'flex',
      flexDirection: 'row'
    };

    // Left sidebar styles - more compact
    const sidebarStyle: React.CSSProperties = {
      width: '32%',
      backgroundColor: '#f7fafc',
      padding: '15mm 12mm',
      boxSizing: 'border-box',
      borderRight: '1px solid #e2e8f0'
    };

    // Main content area styles - takes more space
    const mainContentStyle: React.CSSProperties = {
      width: '68%',
      padding: '15mm 15mm',
      boxSizing: 'border-box'
    };

    // Header styles - more compact
    const nameStyle: React.CSSProperties = {
      fontFamily: fonts.heading || '"Inter", sans-serif',
      fontSize: '18pt',
      fontWeight: '700',
      color: '#1a202c',
      margin: '0 0 3pt 0',
      lineHeight: '1.1'
    };

    const titleStyle: React.CSSProperties = {
      fontSize: '11pt',
      color: '#4a5568',
      margin: '0 0 12pt 0',
      fontWeight: '400'
    };

    // Sidebar section styles - very compact
    const sidebarSectionStyle: React.CSSProperties = {
      marginBottom: '12pt'
    };

    const sidebarHeaderStyle: React.CSSProperties = {
      fontFamily: fonts.heading || '"Inter", sans-serif',
      fontSize: '9pt',
      fontWeight: '700',
      color: '#1a202c',
      marginBottom: '4pt',
      textTransform: 'uppercase',
      letterSpacing: '0.5pt',
      borderBottom: '1pt solid #e2e8f0',
      paddingBottom: '2pt'
    };

    // Contact styles - very compact
    const contactItemStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'flex-start',
      marginBottom: '3pt',
      fontSize: '8pt',
      color: '#2d3748',
      lineHeight: '1.2'
    };

    const contactLabelStyle: React.CSSProperties = {
      fontWeight: '600',
      minWidth: '20pt',
      marginRight: '4pt',
      color: '#4a5568'
    };

    // Skills styles - ATS friendly (no colors)
    const skillsContainerStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap: '6pt'
    };

    const skillCategoryStyle: React.CSSProperties = {
      fontWeight: '600',
      color: '#1a202c',
      marginBottom: '2pt',
      fontSize: '8pt'
    };

    const skillsListStyle: React.CSSProperties = {
      fontSize: '8pt',
      lineHeight: '1.2',
      color: '#2d3748'
    };

    // Projects/Publications in sidebar - very compact with page break control
    const sidebarItemStyle: React.CSSProperties = {
      marginBottom: '6pt',
      pageBreakInside: 'avoid'
    };

    const sidebarItemTitleStyle: React.CSSProperties = {
      fontSize: '8pt',
      fontWeight: '600',
      color: '#1a202c',
      margin: '0 0 1pt 0',
      lineHeight: '1.2'
    };

    const sidebarItemHeaderStyle: React.CSSProperties = {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '1pt'
    };

    const sidebarItemDescStyle: React.CSSProperties = {
      fontSize: '7pt',
      color: '#4a5568',
      lineHeight: '1.2',
      margin: '0'
    };

    const sidebarItemDateStyle: React.CSSProperties = {
      fontSize: '7pt',
      color: '#718096',
      fontStyle: 'italic',
      textAlign: 'right',
      flexShrink: 0,
      marginLeft: '4pt'
    };

    // Main content section styles - allow content to break properly
    const mainSectionStyle: React.CSSProperties = {
      marginBottom: '12pt'
    };

    const mainSectionHeaderStyle: React.CSSProperties = {
      fontFamily: fonts.heading || '"Inter", sans-serif',
      fontSize: '11pt',
      fontWeight: '700',
      color: '#1a202c',
      marginBottom: '6pt',
      paddingBottom: '2pt',
      borderBottom: '1.5pt solid #1a202c',
      textTransform: 'uppercase',
      letterSpacing: '0.5pt',
      pageBreakAfter: 'avoid'
    };

    // Experience/Education item styles - break at item level, not section level
    const itemStyle: React.CSSProperties = {
      marginBottom: '8pt',
      pageBreakInside: 'avoid'
    };

    const itemTitleStyle: React.CSSProperties = {
      fontSize: '10pt',
      fontWeight: '700',
      color: '#1a202c',
      margin: '0 0 1pt 0',
      lineHeight: '1.2',
      pageBreakAfter: 'avoid'
    };

    const itemSubtitleStyle: React.CSSProperties = {
      fontSize: '9pt',
      color: '#4a5568',
      margin: '0 0 1pt 0',
      fontWeight: '500'
    };

    const itemDateStyle: React.CSSProperties = {
      fontSize: '8pt',
      color: '#718096',
      fontWeight: '500',
      margin: '0 0 3pt 0',
      fontStyle: 'italic'
    };

    const itemDescriptionStyle: React.CSSProperties = {
      fontSize: '9pt',
      lineHeight: '1.2',
      color: '#2d3748',
      margin: '3pt 0'
    };

    // Bullet list styles - very compact
    const bulletListStyle: React.CSSProperties = {
      listStyleType: 'none',
      padding: 0,
      margin: '3pt 0'
    };

    const bulletItemStyle: React.CSSProperties = {
      position: 'relative',
      paddingLeft: '8pt',
      marginBottom: '2pt',
      fontSize: '8pt',
      lineHeight: '1.2',
      color: '#2d3748',
      pageBreakInside: 'avoid'
    };

    const bulletStyle: React.CSSProperties = {
      position: 'absolute',
      left: '0',
      top: '0.5pt',
      color: '#1a202c',
      fontWeight: 'bold'
    };

    // Link styles
    const linkStyle: React.CSSProperties = {
      color: '#1a202c',
      textDecoration: 'none',
      wordBreak: 'break-all'
    };

    return (
      <div 
        style={containerStyle} 
        className="resume-container modern-sidebar-template"
        data-template-id="modern-sidebar"
      >
        {/* Left Sidebar */}
        <div style={sidebarStyle} className="resume-sidebar">
          {/* Contact Information */}
          <div style={sidebarSectionStyle}>
            <h3 style={sidebarHeaderStyle}>Contact</h3>
            
            {data.email && (
              <div style={contactItemStyle}>
                <span style={contactLabelStyle}>Email:</span>
                <span>{data.email}</span>
              </div>
            )}
            
            {data.phone && (
              <div style={contactItemStyle}>
                <span style={contactLabelStyle}>Phone:</span>
                <span>{data.phone}</span>
              </div>
            )}
            
            {(data.city || data.state) && (
              <div style={contactItemStyle}>
                <span style={contactLabelStyle}>Location:</span>
                <span>{data.city ? data.city : ''}{data.city && data.state ? ', ' : ''}{data.state ? data.state : ''}</span>
              </div>
            )}
            
            {data.location && !data.city && !data.state && (
              <div style={contactItemStyle}>
                <span style={contactLabelStyle}>Location:</span>
                <span>{data.location}</span>
              </div>
            )}
            
            {data.linkedinUrl && (
              <div style={contactItemStyle}>
                <span style={contactLabelStyle}>LinkedIn:</span>
                <a 
                  href={data.linkedinUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={linkStyle}
                >
                  {(data as any).formattedLinkedinUrl || data.linkedinUrl}
                </a>
              </div>
            )}
            
            {data.portfolioUrl && (
              <div style={contactItemStyle}>
                <span style={contactLabelStyle}>Portfolio:</span>
                <a 
                  href={data.portfolioUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={linkStyle}
                >
                  {(data as any).formattedPortfolioUrl || data.portfolioUrl}
                </a>
              </div>
            )}
          </div>

          {/* Skills Section - ATS Friendly */}
          {renderSections(data, {
            summary: () => null, // Not rendered in sidebar
            workExperience: () => null, // Not rendered in sidebar
            publications: () => null, // Not rendered in sidebar
            skills: () => (data.skills?.length > 0 || data.technicalSkills?.length > 0 || data.softSkills?.length > 0 || data.skillCategories) ? (
              <div style={sidebarSectionStyle}>
                <h3 style={sidebarHeaderStyle}>Skills</h3>
                <div style={skillsContainerStyle}>
                  {/* New flexible categories system */}
                  {useSkillCategories && data.skillCategories && Object.keys(data.skillCategories).length > 0 ? (
                    Object.entries(data.skillCategories).map(([categoryName, skills]) => (
                      skills && skills.length > 0 ? (
                        <div key={categoryName} className={`skills-category-${categoryName.toLowerCase().replace(/\s+/g, '-')}`}>
                          <div style={skillCategoryStyle}>{categoryName}</div>
                          <div style={skillsListStyle}>
                            {skills.map(skill => {
                              const cleanSkill = skill.replace(/^[•\-\*]\s*/, '');
                              return cleanSkill.charAt(0).toUpperCase() + cleanSkill.slice(1).toLowerCase();
                            }).join(', ')}
                          </div>
                        </div>
                      ) : null
                    ))
                  ) : (
                    <>
                      {/* Simple mode - all skills in one list */}
                      {!useSkillCategories && data.skills && data.skills.length > 0 && (
                        <div style={skillsListStyle}>
                          {data.skills.map(skill => {
                            const cleanSkill = skill.replace(/^[•\-\*]\s*/, '');
                            return cleanSkill.charAt(0).toUpperCase() + cleanSkill.slice(1).toLowerCase();
                          }).join(', ')}
                        </div>
                      )}
                      
                      {/* Legacy categorized skills */}
                      {useSkillCategories && (
                        <>
                          {data.technicalSkills && data.technicalSkills.length > 0 && (
                            <div>
                              <div style={skillCategoryStyle}>Technical Skills</div>
                              <div style={skillsListStyle}>
                                {data.technicalSkills.map(skill => {
                                  const cleanSkill = skill.replace(/^[•\-\*]\s*/, '');
                                  return cleanSkill.charAt(0).toUpperCase() + cleanSkill.slice(1).toLowerCase();
                                }).join(', ')}
                              </div>
                            </div>
                          )}
                          
                          {data.softSkills && data.softSkills.length > 0 && (
                            <div>
                              <div style={skillCategoryStyle}>Soft Skills</div>
                              <div style={skillsListStyle}>
                                {data.softSkills.map(skill => {
                                  const cleanSkill = skill.replace(/^[•\-\*]\s*/, '');
                                  return cleanSkill.charAt(0).toUpperCase() + cleanSkill.slice(1).toLowerCase();
                                }).join(', ')}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : null,

            // Education in sidebar
            education: () => data.education && data.education.length > 0 ? (
              <div style={sidebarSectionStyle}>
                <h3 style={sidebarHeaderStyle}>Education</h3>
                {data.education.slice(0, 3).map((edu, index) => (
                  <div key={edu.id || index} style={sidebarItemStyle} className="education-item">
                    <div style={sidebarItemHeaderStyle}>
                      <div style={sidebarItemTitleStyle}>
                        {edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}
                      </div>
                      {(edu.startDate || edu.endDate) && (
                        <div style={sidebarItemDateStyle}>
                          {edu.startDate} - {edu.current ? 'Present' : edu.endDate || 'N/A'}
                        </div>
                      )}
                    </div>
                    <div style={sidebarItemDescStyle}>{edu.institution}</div>
                    {edu.description && (
                      <div style={{ ...sidebarItemDescStyle, marginTop: '2pt' }}>
                        {edu.description.substring(0, 100)}{(edu.description?.length || 0) > 100 ? '...' : ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : null,

            // Projects in sidebar
            projects: () => data.projects && data.projects.length > 0 ? (
              <div style={sidebarSectionStyle}>
                <h3 style={sidebarHeaderStyle}>Projects</h3>
                {data.projects.slice(0, 3).map((project, index) => (
                  <div key={project.id || index} style={sidebarItemStyle} className="project-item">
                    <div style={sidebarItemHeaderStyle}>
                      <div style={sidebarItemTitleStyle}>{project.name}</div>
                      {(project.startDate || project.endDate) && (
                        <div style={sidebarItemDateStyle}>
                          {project.startDate} - {project.current ? 'Present' : project.endDate || 'N/A'}
                        </div>
                      )}
                    </div>
                    <div style={sidebarItemDescStyle}>
                      {project.description?.substring(0, 120)}{(project.description?.length || 0) > 120 ? '...' : ''}
                    </div>
                    {project.technologies && project.technologies.length > 0 && (
                      <div style={{ ...sidebarItemDescStyle, marginTop: '2pt', fontWeight: '500' }}>
                        Tech: {project.technologies.slice(0, 4).join(', ')}
                      </div>
                    )}
                    {project.url && (
                      <a 
                        href={project.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ ...linkStyle, fontSize: '7pt', display: 'block', marginTop: '1pt' }}
                      >
                        {project.url.replace(/^https?:\/\/(www\.)?/, '')}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : null,

            // Certifications in sidebar
            certifications: () => data.certifications && data.certifications.length > 0 ? (
              <div style={sidebarSectionStyle}>
                <h3 style={sidebarHeaderStyle}>Certifications</h3>
                {data.certifications.slice(0, 4).map((cert, index) => (
                  <div key={cert.id || index} style={sidebarItemStyle} className="certification-item">
                    <div style={sidebarItemHeaderStyle}>
                      <div style={sidebarItemTitleStyle}>{cert.name}</div>
                      {cert.date && (
                        <div style={sidebarItemDateStyle}>{cert.date}</div>
                      )}
                    </div>
                    <div style={sidebarItemDescStyle}>{cert.issuer}</div>
                  </div>
                ))}
              </div>
            ) : null
          })}
        </div>

        {/* Main Content Area */}
        <div style={mainContentStyle} className="resume-main-content">
          {/* Header */}
          <div style={{ marginBottom: '15pt' }}>
            <h1 style={nameStyle}>{data.fullName}</h1>
            <h2 style={titleStyle}>{data.targetJobTitle}</h2>
          </div>

          {/* Render main sections - summary, experience, publications */}
          {renderSections(data, {
            summary: () => data.summary ? (
              <section style={mainSectionStyle} className="resume-section summary-section">
                <h3 style={mainSectionHeaderStyle}>Professional Summary</h3>
                <p style={itemDescriptionStyle}>{data.summary}</p>
              </section>
            ) : null,
            
            workExperience: () => data.workExperience && data.workExperience.length > 0 ? (
              <section style={mainSectionStyle} className="resume-section experience-section">
                <h3 style={mainSectionHeaderStyle}>Experience</h3>
                {data.workExperience.map((exp, index) => (
                  <div key={exp.id || index} style={itemStyle} className="experience-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1pt' }}>
                      <h4 style={itemTitleStyle}>{exp.position}</h4>
                      <div style={itemDateStyle}>
                        {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                      </div>
                    </div>
                    <h5 style={itemSubtitleStyle}>
                      {exp.company}{exp.location ? ` • ${exp.location}` : ''}
                    </h5>
                    
                    {exp.description && (
                      <p style={itemDescriptionStyle}>{exp.description}</p>
                    )}
                    
                    {exp.achievements && exp.achievements.length > 0 && (
                      <ul style={bulletListStyle}>
                        {exp.achievements.slice(0, 4).map((achievement, i) => (
                          <li key={i} style={bulletItemStyle}>
                            <span style={bulletStyle}>•</span>
                            {achievement.replace(/^[•\-\*]\s*/, '')}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </section>
            ) : null,

            publications: () => data.publications && data.publications.length > 0 ? (
              <section style={mainSectionStyle} className="resume-section publications-section">
                <h3 style={mainSectionHeaderStyle}>Publications</h3>
                {data.publications.map((pub, index) => (
                  <div key={pub.id || index} style={itemStyle} className="publication-item">
                    <p style={{ ...itemDescriptionStyle, margin: '0', fontStyle: 'normal' }}>
                      {/* Authors */}
                      {pub.authors && (
                        <span style={{ fontWeight: '500' }}>
                          {Array.isArray(pub.authors) ? pub.authors.join(', ') : pub.authors}
                        </span>
                      )}
                      {pub.authors && '. '}
                      
                      {/* Publication Date */}
                      {pub.publicationDate && (
                        <span>({pub.publicationDate}). </span>
                      )}
                      
                      {/* Title */}
                      <span style={{ fontStyle: 'italic' }}>{pub.title}</span>
                      {pub.title && '. '}
                      
                      {/* Publisher */}
                      {pub.publisher && (
                        <span style={{ fontWeight: '500' }}>{pub.publisher}</span>
                      )}
                      {pub.publisher && '. '}
                      
                      {/* URL */}
                      {pub.url && (
                        <a 
                          href={pub.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ ...linkStyle, fontSize: '9pt' }}
                        >
                          {pub.url}
                        </a>
                      )}
                    </p>
                    
                    {/* Description as a separate paragraph if provided */}
                    {pub.description && (
                      <p style={{ ...itemDescriptionStyle, marginTop: '2pt', fontSize: '8pt', color: '#4a5568' }}>
                        {pub.description}
                      </p>
                    )}
                  </div>
                ))}
              </section>
            ) : null,

            // Empty handlers for required sections (content is in sidebar)
            skills: () => null,
            projects: () => null,
            certifications: () => null,
            education: () => null // Education is now in sidebar
          })}
        </div>
      </div>
    );
  }

  // Remove renderPreview - use single render method for both preview and PDF
  renderPreview(data: ResumeData): JSX.Element {
    return this.render(data);
  }

  async exportToLaTeX(data: ResumeData): Promise<string> {
    throw new Error('LaTeX export not implemented for Modern Sidebar template');
  }

  async exportToHTML(data: ResumeData): Promise<string> {
    throw new Error('HTML export not implemented for Modern Sidebar template');
  }

  async exportToDOCX(data: ResumeData): Promise<Blob> {
    throw new Error('DOCX export not implemented for Modern Sidebar template');
  }

  validate(data: ResumeData): any {
    // Basic validation using the parent class method
    return super.validate(data);
  }

  getATSCompatibilityScore(data: ResumeData): number {
    // Calculate ATS score based on template optimization
    let score = 85; // Base score for this ATS-optimized template
    
    if (!data.fullName) score -= 10;
    if (!data.email) score -= 10;
    if (!data.phone) score -= 5;
    if (!data.summary) score -= 10;
    if (!data.workExperience?.length) score -= 15;
    if (!data.skills?.length && !data.technicalSkills?.length) score -= 10;
    
    return Math.max(0, score);
  }

  async export(data: ResumeData, format: 'pdf' | 'docx' | 'latex' | 'html'): Promise<Blob> {
    if (format === 'pdf') {
      return this.exportToPDF(data);
    }
    throw new Error(`Export format ${format} not implemented for Modern Sidebar template`);
  }

  async exportToPDF(data: ResumeData): Promise<Blob> {
    try {
      const filename = `${data.fullName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Resume'}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      console.log("Starting PDF export for ModernSidebarTemplate:", filename);
      
      // Format URLs for display before PDF generation
      const dataWithFormattedUrls = { ...data } as any;
      
      // Format LinkedIn URL
      if (dataWithFormattedUrls.linkedinUrl) {
        try {
          const url = new URL(dataWithFormattedUrls.linkedinUrl);
          let host = url.hostname;
          if (host.startsWith('www.')) {
            host = host.substring(4);
          }
          dataWithFormattedUrls.formattedLinkedinUrl = host + url.pathname;
        } catch (e) {
          dataWithFormattedUrls.formattedLinkedinUrl = dataWithFormattedUrls.linkedinUrl;
        }
      }
      
      // Format portfolio/website URL
      if (dataWithFormattedUrls.portfolioUrl) {
        try {
          const url = new URL(dataWithFormattedUrls.portfolioUrl);
          let host = url.hostname;
          if (host.startsWith('www.')) {
            host = host.substring(4);
          }
          dataWithFormattedUrls.formattedPortfolioUrl = host + url.pathname;
        } catch (e) {
          dataWithFormattedUrls.formattedPortfolioUrl = dataWithFormattedUrls.portfolioUrl;
        }
      }
      
      // Add contact separator
      dataWithFormattedUrls.contactSeparator = "|";
      
      // Pass the enhanced data to render
      const element = this.render(dataWithFormattedUrls);
      return await generatePDFFromReactElement(element, filename);
    } catch (error) {
      console.error("Error in ModernSidebarTemplate.exportToPDF:", error);
      throw error;
    }
  }
} 