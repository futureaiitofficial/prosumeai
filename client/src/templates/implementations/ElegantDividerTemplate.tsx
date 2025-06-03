import React from 'react';
import { BaseTemplate } from '../core/BaseTemplate';
import { elegantCustomization } from '../config/defaultConfig';
import { type ResumeData } from '@/types/resume';
import { generatePDFFromReactElement } from '../utils/exportUtils';
import { renderSections } from '../core/sectionRenderer';

const metadata = {
  id: 'elegant-divider',
  name: 'Elegant Divider',
  description: 'A professional single-column layout with elegant horizontal dividers between sections.',
  isAtsOptimized: true,
  version: '1.0.0',
  thumbnail: '/templates/elegant-divider.png',
  category: 'professional',
  tags: ['elegant', 'professional', 'single-column', 'modern', 'clean']
};

export class ElegantDividerTemplate extends BaseTemplate {
  constructor() {
    super(metadata, elegantCustomization);
  }

  render(data: ResumeData): JSX.Element {
    console.log("ElegantDividerTemplate rendering with data:", data);
    const { colors, fonts } = this.customization;

    // Check if skills should be categorized
    const useSkillCategories = data.useSkillCategories ?? false;

    const containerStyle: React.CSSProperties = {
      width: '210mm',
      minHeight: '297mm',
      backgroundColor: colors.background || '#ffffff',
      fontFamily: fonts.body || '"Playfair Display", "Georgia", serif',
      fontSize: '9pt',
      padding: '12mm',
      color: colors.text || '#1a1a1a',
      margin: '0',
      boxSizing: 'border-box',
      lineHeight: '1.2',
      position: 'relative'
    };

    // Header styles - centered with elegant typography - keep together
    const headerStyle: React.CSSProperties = {
      textAlign: 'center',
      marginBottom: '2pt',
      paddingBottom: '2pt',
      borderBottom: '2pt solid #2c3e50',
      width: '100%',
      display: 'block'
    };

    const nameStyle: React.CSSProperties = {
      fontFamily: fonts.heading || '"Playfair Display", "Georgia", serif',
      fontSize: '22pt',
      fontWeight: '700',
      color: '#2c3e50',
      margin: '0',
      padding: 0,
      lineHeight: '1.0',
      textAlign: 'center',
      letterSpacing: '1pt',
      display: 'block'
    };

    const jobTitleStyle: React.CSSProperties = {
      fontFamily: fonts.body || '"Lato", "Arial", sans-serif',
      fontSize: '11pt',
      color: '#5d6d7e',
      margin: '0 0 2pt 0',
      padding: 0,
      fontWeight: '400',
      textAlign: 'center',
      fontStyle: 'italic',
      letterSpacing: '0.5pt',
      lineHeight: '1.1',
      display: 'block'
    };

    // Contact styles - elegant horizontal layout
    const contactStyle: React.CSSProperties = {
      display: 'flex',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: '2pt 8pt',
      fontSize: '8pt',
      marginTop: '1pt',
      textAlign: 'center',
      color: '#5d6d7e',
      width: '100%'
    };

    const contactItemStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      color: '#5d6d7e'
    };

    // Section styling with elegant dividers - prevent breaks between sections
    const sectionStyle: React.CSSProperties = {
      marginBottom: '1pt',
      width: '100%',
      display: 'block',
      position: 'relative'
    };

    const sectionHeaderStyle: React.CSSProperties = {
      fontFamily: fonts.heading || '"Playfair Display", "Georgia", serif',
      fontSize: '12pt',
      fontWeight: '600',
      color: '#2c3e50',
      marginBottom: '3pt',
      marginTop: '0',
      textAlign: 'center',
      position: 'relative',
      paddingBottom: '2pt',
      display: 'block',
      width: '100%'
    };

    // Elegant divider after section headers
    const dividerStyle: React.CSSProperties = {
      width: '50pt',
      height: '1pt',
      backgroundColor: '#bdc3c7',
      margin: '0 auto 4pt auto',
      position: 'relative',
      display: 'block'
    };

    // Content layout
    const contentStyle: React.CSSProperties = {
      maxWidth: '100%',
      margin: '0 auto',
      width: '100%',
      display: 'block'
    };

    // Experience/Education item styles - allow breaking inside items if needed
    const itemStyle: React.CSSProperties = {
      marginBottom: '3pt',
      width: '100%',
      display: 'block',
      paddingBottom: '1pt'
    };

    const itemHeaderStyle: React.CSSProperties = {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '0.5pt',
      width: '100%'
    };

    const titleStyle: React.CSSProperties = {
      fontWeight: '600',
      fontSize: '10pt',
      color: '#2c3e50',
      margin: '0',
      padding: 0,
      flex: '1',
      lineHeight: '1.1',
      display: 'block'
    };

    const companyStyle: React.CSSProperties = {
      fontWeight: '500',
      fontSize: '9pt',
      color: '#5d6d7e',
      margin: '0',
      padding: 0,
      fontStyle: 'italic',
      lineHeight: '1.1',
      display: 'block'
    };

    const dateStyle: React.CSSProperties = {
      fontSize: '8pt',
      color: '#85929e',
      fontWeight: '400',
      textAlign: 'right',
      minWidth: '60pt',
      lineHeight: '1.1',
      display: 'block'
    };

    // Skills section - simple text format
    const skillsContainerStyle: React.CSSProperties = {
      textAlign: 'center',
      marginTop: '1pt',
      width: '100%',
      display: 'block'
    };

    const skillsTextStyle: React.CSSProperties = {
      fontSize: '9pt',
      color: '#34495e',
      lineHeight: '1.2',
      margin: '0',
      padding: 0,
      display: 'block',
      textAlign: 'center'
    };

    // Achievements/bullet points
    const achievementsStyle: React.CSSProperties = {
      margin: '1pt 0 0 0',
      padding: 0,
      fontSize: '8pt',
      display: 'block',
      width: '100%'
    };

    const achievementItemStyle: React.CSSProperties = {
      marginBottom: '1pt',
      lineHeight: '1.3',
      color: '#34495e',
      paddingLeft: '10pt',
      position: 'relative',
      display: 'block',
      width: '100%'
    };

    const bulletStyle: React.CSSProperties = {
      position: 'absolute',
      left: '0',
      top: '0',
      color: '#8b9dc3',
      fontWeight: '600'
    };

    return (
      <div style={containerStyle} className="resume-container elegant-divider-template">
        {/* Header - Centered with elegant styling */}
        <header style={headerStyle} className="resume-header">
          <h1 style={nameStyle}>{data.fullName}</h1>
          {data.targetJobTitle && <p style={jobTitleStyle}>{data.targetJobTitle}</p>}
          
          <div style={contactStyle}>
            {data.email && <span style={contactItemStyle}>{data.email}</span>}
            {data.phone && <span style={contactItemStyle}>{data.phone}</span>}
            {data.city && data.state && <span style={contactItemStyle}>{data.city}, {data.state}</span>}
            {data.formattedLinkedinUrl && 
              <span style={contactItemStyle}>
                <a 
                  href={data.linkedinUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ color: '#5d6d7e', textDecoration: 'none' }}>
                  {data.formattedLinkedinUrl}
                </a>
              </span>
            }
            {data.formattedPortfolioUrl && 
              <span style={contactItemStyle}>
                <a 
                  href={data.portfolioUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ color: '#5d6d7e', textDecoration: 'none' }}>
                  {data.formattedPortfolioUrl}
                </a>
              </span>
            }
          </div>
        </header>

        <div style={contentStyle}>
          {/* Use renderSections for consistent section ordering */}
          {renderSections(data, {
            summary: () => data.summary ? (
              <section style={sectionStyle} className="resume-section summary-section">
                <h2 style={sectionHeaderStyle}>Professional Summary</h2>
                <div style={dividerStyle}></div>
                <p style={{ 
                  fontSize: '9pt', 
                  lineHeight: '1.2', 
                  margin: '0',
                  padding: '0',
                  textAlign: 'center',
                  color: '#34495e',
                  fontStyle: 'italic',
                  display: 'block',
                  width: '100%'
                }}>{data.summary}</p>
              </section>
            ) : null,
            
            skills: () => (data.skills?.length > 0 || data.technicalSkills?.length > 0 || data.softSkills?.length > 0 || data.skillCategories) ? (
              <section style={sectionStyle} className="resume-section skills-section">
                <h2 style={sectionHeaderStyle}>Core Competencies</h2>
                <div style={dividerStyle}></div>
                <div style={skillsContainerStyle} className="skills-content">
                  {/* New flexible categories system */}
                  {useSkillCategories && data.skillCategories && Object.keys(data.skillCategories).length > 0 ? (
                    Object.entries(data.skillCategories).map(([categoryName, skills], index) => (
                      skills && skills.length > 0 ? (
                        <div key={categoryName} style={{ marginBottom: index < Object.keys(data.skillCategories!).length - 1 ? '3pt' : '0' }}>
                          <h3 style={{ 
                            ...titleStyle, 
                            textAlign: 'center', 
                            fontSize: '10pt', 
                            marginBottom: '2pt',
                            color: '#2c3e50',
                            fontWeight: '600'
                          }}>{categoryName}</h3>
                          <p style={skillsTextStyle}>{skills.join(', ')}</p>
                        </div>
                      ) : null
                    ))
                  ) : (
                    <>
                      {/* Simple mode - all skills in one list */}
                      {!useSkillCategories && data.skills && data.skills.length > 0 && (
                        <p style={skillsTextStyle}>{data.skills.join(', ')}</p>
                      )}
                      
                      {/* Legacy categorized skills */}
                      {useSkillCategories && (
                        <p style={skillsTextStyle}>
                          {data.technicalSkills && data.technicalSkills.length > 0 && 
                            data.technicalSkills.join(', ')
                          }
                          {data.technicalSkills && data.technicalSkills.length > 0 && 
                           data.softSkills && data.softSkills.length > 0 && ', '}
                          {data.softSkills && data.softSkills.length > 0 && 
                            data.softSkills.join(', ')
                          }
                        </p>
                      )}
                    </>
                  )}
                </div>
              </section>
            ) : null,
            
            workExperience: () => data.workExperience && data.workExperience.length > 0 ? (
              <section style={sectionStyle} className="resume-section experience-section">
                <h2 style={sectionHeaderStyle}>Professional Experience</h2>
                <div style={dividerStyle}></div>
                {data.workExperience.map((exp, index) => (
                  <div key={exp.id || index} style={itemStyle} className="experience-item">
                    <div style={itemHeaderStyle}>
                      <div style={{ flex: '1' }}>
                        <h3 style={titleStyle}>{exp.position}</h3>
                        <p style={companyStyle}>
                          {exp.company}{exp.location ? ` • ${exp.location}` : ''}
                        </p>
                      </div>
                      <div style={dateStyle}>
                        {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                      </div>
                    </div>
                    
                    {exp.description && (
                      <p style={{ 
                        fontSize: '9pt', 
                        lineHeight: '1.2', 
                        margin: '1pt 0', 
                        padding: 0,
                        color: '#34495e',
                        display: 'block',
                        width: '100%'
                      }}>
                        {exp.description}
                      </p>
                    )}
                    
                    {exp.achievements && exp.achievements.length > 0 && (
                      <div style={achievementsStyle} className="achievements-list">
                        {exp.achievements.map((achievement, i) => (
                          <div key={i} style={achievementItemStyle}>
                            <span style={bulletStyle}>▪</span>
                            {achievement.replace(/^[•\-\*]\s*/, '')}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </section>
            ) : null,
            
            education: () => data.education && data.education.length > 0 ? (
              <section style={sectionStyle} className="resume-section education-section">
                <h2 style={sectionHeaderStyle}>Education</h2>
                <div style={dividerStyle}></div>
                {data.education.map((edu, index) => (
                  <div key={edu.id || index} style={itemStyle} className="education-item">
                    <div style={itemHeaderStyle}>
                      <div style={{ flex: '1' }}>
                        <h3 style={titleStyle}>
                          {edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}
                        </h3>
                        <p style={companyStyle}>{edu.institution}</p>
                      </div>
                      <div style={dateStyle}>
                        {edu.startDate} - {edu.current ? 'Present' : edu.endDate}
                      </div>
                    </div>
                    {edu.description && (
                      <p style={{ 
                        fontSize: '9pt', 
                        lineHeight: '1.2', 
                        margin: '1pt 0 0 0', 
                        padding: 0,
                        color: '#34495e',
                        display: 'block',
                        width: '100%'
                      }}>
                        {edu.description}
                      </p>
                    )}
                  </div>
                ))}
              </section>
            ) : null,
            
            projects: () => data.projects && data.projects.length > 0 ? (
              <section style={sectionStyle} className="resume-section projects-section">
                <h2 style={sectionHeaderStyle}>Notable Projects</h2>
                <div style={dividerStyle}></div>
                {data.projects.map((project, index) => (
                  <div key={project.id || index} style={itemStyle} className="project-item">
                    <div style={itemHeaderStyle}>
                      <div style={{ flex: '1' }}>
                        <h3 style={titleStyle}>{project.name}</h3>
                        {project.url && (
                          <a 
                            href={project.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{
                              color: '#5d6d7e',
                              textDecoration: 'none',
                              fontSize: '8pt',
                              fontStyle: 'italic',
                              display: 'block'
                            }}
                          >
                            {project.url.replace(/^https?:\/\/(www\.)?/, '')}
                          </a>
                        )}
                      </div>
                      {(project.startDate || project.endDate) && (
                        <div style={dateStyle}>
                          {project.startDate} - {project.current ? 'Present' : project.endDate || ''}
                        </div>
                      )}
                    </div>
                    
                    <p style={{ 
                      fontSize: '9pt', 
                      lineHeight: '1.2', 
                      margin: '1pt 0', 
                      padding: 0,
                      color: '#34495e',
                      display: 'block',
                      width: '100%'
                    }}>
                      {project.description}
                    </p>
                    
                    {project.technologies && project.technologies.length > 0 && (
                      <p style={{ 
                        fontSize: '8pt', 
                        margin: '1pt 0 0 0', 
                        padding: 0,
                        color: '#5d6d7e',
                        display: 'block',
                        width: '100%'
                      }}>
                        <strong>Technologies:</strong> {project.technologies.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </section>
            ) : null,
            
            publications: () => data.publications && data.publications.length > 0 ? (
              <section style={sectionStyle} className="resume-section publications-section">
                <h2 style={sectionHeaderStyle}>Publications</h2>
                <div style={dividerStyle}></div>
                {data.publications.map((publication, index) => (
                  <div key={publication.id || index} style={itemStyle} className="publication-item">
                    <p style={{ 
                      fontSize: '9pt', 
                      lineHeight: '1.3', 
                      margin: '0', 
                      padding: 0, 
                      fontStyle: 'normal', 
                      color: '#34495e',
                      display: 'block',
                      width: '100%'
                    }}>
                      {/* Authors */}
                      {publication.authors && (
                        <span style={{ fontWeight: '600', color: '#2c3e50' }}>
                          {Array.isArray(publication.authors) ? publication.authors.join(', ') : publication.authors}
                        </span>
                      )}
                      {publication.authors && '. '}
                      
                      {/* Publication Date */}
                      {publication.publicationDate && (
                        <span>({publication.publicationDate}). </span>
                      )}
                      
                      {/* Title */}
                      <span style={{ fontStyle: 'italic' }}>{publication.title}</span>
                      {publication.title && '. '}
                      
                      {/* Publisher */}
                      {publication.publisher && (
                        <span style={{ fontWeight: '600' }}>{publication.publisher}</span>
                      )}
                      {publication.publisher && '. '}
                      
                      {/* URL */}
                      {publication.url && (
                        <a 
                          href={publication.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ color: '#5d6d7e', textDecoration: 'none' }}
                        >
                          {publication.url}
                        </a>
                      )}
                    </p>
                    
                    {/* Description as a separate paragraph if provided */}
                    {publication.description && (
                      <p style={{ 
                        fontSize: '8pt', 
                        margin: '2pt 0 0 0', 
                        padding: 0, 
                        color: '#85929e',
                        lineHeight: '1.3',
                        display: 'block',
                        width: '100%'
                      }}>
                        {publication.description}
                      </p>
                    )}
                  </div>
                ))}
              </section>
            ) : null,
            
            certifications: () => data.certifications && data.certifications.length > 0 ? (
              <section style={sectionStyle} className="resume-section certifications-section">
                <h2 style={sectionHeaderStyle}>Professional Development</h2>
                <div style={dividerStyle}></div>
                {data.certifications.map((cert, index) => (
                  <div key={cert.id || index} style={itemStyle} className="certification-item">
                    <div style={itemHeaderStyle}>
                      <div style={{ flex: '1' }}>
                        <h3 style={titleStyle}>{cert.name}</h3>
                        <p style={companyStyle}>{cert.issuer}</p>
                      </div>
                      <div style={dateStyle}>
                        {cert.date}
                        {cert.expiryDate && ` - ${cert.expiryDate}`}
                      </div>
                    </div>
                    {cert.description && (
                      <p style={{ 
                        fontSize: '9pt', 
                        lineHeight: '1.3', 
                        margin: '2pt 0', 
                        padding: 0,
                        color: '#34495e',
                        display: 'block',
                        width: '100%'
                      }}>
                        {cert.description}
                      </p>
                    )}
                  </div>
                ))}
              </section>
            ) : null
          })}
        </div>
      </div>
    );
  }

  // Use single render method for both preview and PDF
  renderPreview(data: ResumeData): JSX.Element {
    return this.render(data);
  }

  async exportToPDF(data: ResumeData): Promise<Blob> {
    try {
      const filename = `${data.fullName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Resume'}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      console.log("Starting PDF export for:", filename);
      console.log("PDF export using section order:", data.sectionOrder);
      
      // Format URLs for display before PDF generation
      const dataWithFormattedUrls = { ...data };
      
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
      
      // Pass the enhanced data to renderPreview
      const element = this.render(dataWithFormattedUrls);
      return await generatePDFFromReactElement(element, filename);
    } catch (error) {
      console.error("Error in ElegantDividerTemplate.exportToPDF:", error);
      throw error;
    }
  }
} 