import React from 'react';
import { BaseTemplate } from '../core/BaseTemplate';
import { minimalistCustomization } from '../config/defaultConfig';
import { type ResumeData } from '@/types/resume';
import { generatePDFFromReactElement } from '../utils/exportUtils';
import { renderSections } from '../core/sectionRenderer';

const metadata = {
  id: 'minimalist-ats',
  name: 'Minimalist ATS',
  description: 'A clean, minimal layout optimized for ATS parsing with maximum readability.',
  isAtsOptimized: true,
  version: '1.0.0',
  thumbnail: '/templates/minimalist-ats.png',
  category: 'professional',
  tags: ['ats-friendly', 'minimal', 'clean', 'professional', 'simple']
};

export class MinimalistAtsTemplate extends BaseTemplate {
  constructor() {
    super(metadata, minimalistCustomization);
  }

  render(data: ResumeData): JSX.Element {
    console.log("MinimalistAtsTemplate rendering with data:", data);
    const { colors, fonts } = this.customization;

    // Check if skills should be categorized
    const useSkillCategories = data.useSkillCategories ?? false;

    const containerStyle: React.CSSProperties = {
      width: '210mm',
      minHeight: '297mm',
      backgroundColor: colors.background || '#ffffff',
      fontFamily: fonts.body || '"Inter", "Segoe UI", "Helvetica Neue", sans-serif',
      fontSize: '9pt',
      padding: '15mm',
      color: colors.text || '#2d3748',
      margin: '0',
      boxSizing: 'border-box',
      lineHeight: '1.2',
      position: 'relative'
    };

    // Header styles - left aligned, modern approach
    const headerStyle: React.CSSProperties = {
      marginBottom: '6pt',
      paddingBottom: '4pt',
      borderLeft: '3pt solid #4299e1',
      paddingLeft: '8pt'
    };

    const nameStyle: React.CSSProperties = {
      fontFamily: fonts.heading || '"Inter", "Segoe UI", sans-serif',
      fontSize: '22pt',
      fontWeight: '700',
      color: '#1a202c',
      margin: '0 0 1pt 0',
      padding: 0,
      lineHeight: '1.1',
      textAlign: 'left',
      letterSpacing: '-0.5pt'
    };

    const jobTitleStyle: React.CSSProperties = {
      fontFamily: fonts.body || '"Inter", "Segoe UI", sans-serif',
      fontSize: '12pt',
      color: '#4a5568',
      marginBottom: '3pt',
      fontWeight: '500',
      textAlign: 'left'
    };

    // Contact styles - horizontal layout, left aligned
    const contactStyle: React.CSSProperties = {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '2pt 8pt',
      fontSize: '9pt',
      marginTop: '2pt',
      textAlign: 'left',
      color: '#4a5568'
    };

    const contactItemStyle: React.CSSProperties = {
      display: 'inline-block'
    };

    // Section styling - clean, no borders
    const sectionStyle: React.CSSProperties = {
      marginBottom: '2pt',
      width: '100%',
      display: 'block'
    };

    const sectionHeaderStyle: React.CSSProperties = {
      fontFamily: fonts.heading || '"Inter", "Segoe UI", sans-serif',
      fontSize: '12pt',
      fontWeight: '600',
      color: '#2d3748',
      paddingBottom: '1pt',
      marginBottom: '3pt',
      width: '100%',
      display: 'block',
      textTransform: 'none',
      letterSpacing: '0pt'
    };

    // Style for experience/education items
    const itemStyle: React.CSSProperties = {
      marginBottom: '3pt',
      width: '100%',
      display: 'block'
    };

    // Style for titles - modern hierarchy
    const titleStyle: React.CSSProperties = {
      fontWeight: '600',
      fontSize: '10pt',
      color: '#2d3748',
      margin: '0 0 0.5pt 0',
      padding: 0
    };

    const companyStyle: React.CSSProperties = {
      fontWeight: '500',
      fontSize: '9pt',
      color: '#4a5568',
      margin: '0',
      padding: 0
    };

    const dateStyle: React.CSSProperties = {
      fontSize: '8pt',
      color: '#718096',
      fontWeight: '400'
    };

    // Skills section - tag-like appearance
    const skillsContainerStyle: React.CSSProperties = {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '2pt'
    };

    const skillItemStyle: React.CSSProperties = {
      fontSize: '8pt',
      backgroundColor: '#edf2f7',
      color: '#4a5568',
      padding: '2pt 6pt',
      borderRadius: '3pt',
      fontWeight: '500'
    };

    return (
      <div style={containerStyle} className="resume-container">
        {/* Header - Left aligned with accent border */}
        <header style={headerStyle} className="resume-header">
          <h1 style={nameStyle}>{data.fullName}</h1>
          {data.targetJobTitle && <p style={jobTitleStyle}>{data.targetJobTitle}</p>}
          
          <div style={contactStyle}>
            {data.email && <span style={contactItemStyle}>{data.email}</span>}
            {data.phone && <span style={contactItemStyle}>{data.phone}</span>}
            {data.city && data.state && <span style={contactItemStyle}>{data.city}, {data.state}</span>}
            {data.linkedinUrl && 
              <span style={contactItemStyle}>
                <a 
                  href={data.linkedinUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ color: '#4299e1', textDecoration: 'none' }}>
                  {data.formattedLinkedinUrl || "LinkedIn"}
                </a>
              </span>
            }
            {data.portfolioUrl && 
              <span style={contactItemStyle}>
                <a 
                  href={data.portfolioUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ color: '#4299e1', textDecoration: 'none' }}>
                  {data.formattedPortfolioUrl || "Portfolio"}
                </a>
              </span>
            }
          </div>
        </header>

        {/* Use renderSections to render content in the correct order */}
        {renderSections(data, {
          summary: () => data.summary ? (
            <section style={sectionStyle} className="resume-section summary-section">
              <h2 style={sectionHeaderStyle}>Professional Summary</h2>
              <p style={{ 
                fontSize: '9pt', 
                lineHeight: '1.3', 
                margin: '0',
                padding: '0',
                display: 'block',
                color: '#4a5568'
              }}>{data.summary}</p>
            </section>
          ) : null,
          
          skills: () => (data.skills?.length > 0 || data.technicalSkills?.length > 0 || data.softSkills?.length > 0 || data.skillCategories) ? (
            <section style={sectionStyle} className="resume-section skills-section">
              <h2 style={sectionHeaderStyle}>Skills</h2>
              <div style={skillsContainerStyle} className="skills-content">
                {/* New flexible categories system */}
                {useSkillCategories && data.skillCategories && Object.keys(data.skillCategories).length > 0 ? (
                  Object.entries(data.skillCategories).map(([categoryName, skills]) => (
                    skills && skills.length > 0 ? (
                      <div key={categoryName} style={{ width: '100%', marginBottom: '2pt' }} className={`skills-category-${categoryName.toLowerCase().replace(/\s+/g, '-')}`}>
                        <h3 style={{ ...titleStyle, fontSize: '10pt', marginBottom: '2pt', color: '#2d3748' }}>{categoryName}</h3>
                        <div style={skillsContainerStyle}>
                          {skills.map((skill, index) => (
                            <span key={index} style={skillItemStyle}>{skill}</span>
                          ))}
                        </div>
                      </div>
                    ) : null
                  ))
                ) : (
                  <>
                    {/* Simple mode - all skills in one list */}
                    {!useSkillCategories && data.skills && data.skills.length > 0 && (
                      data.skills.map((skill, index) => (
                        <span key={index} style={skillItemStyle}>{skill}</span>
                      ))
                    )}
                    
                    {/* Legacy categorized skills */}
                    {useSkillCategories && (
                      <>
                        {data.technicalSkills && data.technicalSkills.length > 0 && (
                          <div style={{ width: '100%', marginBottom: '2pt' }} className="technical-skills">
                            <h3 style={{ ...titleStyle, fontSize: '10pt', marginBottom: '2pt', color: '#2d3748' }}>Technical Skills</h3>
                            <div style={skillsContainerStyle}>
                              {data.technicalSkills.map((skill, index) => (
                                <span key={index} style={skillItemStyle}>{skill}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {data.softSkills && data.softSkills.length > 0 && (
                          <div style={{ width: '100%' }} className="soft-skills">
                            <h3 style={{ ...titleStyle, fontSize: '10pt', marginBottom: '2pt', color: '#2d3748' }}>Soft Skills</h3>
                            <div style={skillsContainerStyle}>
                              {data.softSkills.map((skill, index) => (
                                <span key={index} style={skillItemStyle}>{skill}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </section>
          ) : null,
          
          workExperience: () => data.workExperience && data.workExperience.length > 0 ? (
            <section style={sectionStyle} className="resume-section experience-section">
              <h2 style={sectionHeaderStyle}>Experience</h2>
              {data.workExperience.map((exp, index) => (
                <div key={exp.id || index} style={itemStyle} className="experience-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1pt', width: '100%' }}>
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
                      lineHeight: '1.3', 
                      margin: '1pt 0 2pt 0', 
                      padding: 0,
                      color: '#4a5568'
                    }}>
                      {exp.description}
                    </p>
                  )}
                  
                  {exp.achievements && exp.achievements.length > 0 && (
                    <div style={{ margin: '1pt 0 0 0', padding: 0, fontSize: '8pt' }} className="achievements-list">
                      {exp.achievements.map((achievement, i) => (
                        <div key={i} style={{ 
                          marginBottom: '0.5pt', 
                          lineHeight: '1.3',
                          color: '#4a5568',
                          paddingLeft: '8pt',
                          position: 'relative'
                        }}>
                          <span style={{ 
                            position: 'absolute', 
                            left: '0', 
                            top: '0',
                            color: '#4299e1',
                            fontWeight: '600'
                          }}>•</span>
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
              {data.education.map((edu, index) => (
                <div key={edu.id || index} style={itemStyle} className="education-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1pt', width: '100%' }}>
                    <div style={{ flex: '1' }}>
                      <h3 style={titleStyle}>{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</h3>
                      <p style={companyStyle}>{edu.institution}</p>
                    </div>
                    <div style={dateStyle}>
                      {edu.startDate} - {edu.current ? 'Present' : edu.endDate}
                    </div>
                  </div>
                  {edu.description && (
                    <p style={{ 
                      fontSize: '9pt', 
                      lineHeight: '1.3', 
                      margin: '1pt 0 0 0', 
                      padding: 0,
                      color: '#4a5568'
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
              <h2 style={sectionHeaderStyle}>Projects</h2>
              {data.projects.map((project, index) => (
                <div key={project.id || index} style={itemStyle} className="project-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1pt', width: '100%' }}>
                    <h3 style={titleStyle}>{project.name}</h3>
                    {(project.startDate || project.endDate) && (
                      <div style={dateStyle}>
                        {project.startDate} - {project.current ? 'Present' : project.endDate || ''}
                      </div>
                    )}
                  </div>
                  
                  {project.url && (
                    <a 
                      href={project.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{
                        color: '#4299e1',
                        textDecoration: 'none',
                        fontSize: '8pt',
                        display: 'block',
                        marginBottom: '1pt'
                      }}
                    >
                      {project.url.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  )}
                  
                  <p style={{ 
                    fontSize: '9pt', 
                    lineHeight: '1.3', 
                    margin: '1pt 0', 
                    padding: 0,
                    color: '#4a5568'
                  }}>
                    {project.description}
                  </p>
                  
                  {project.technologies && project.technologies.length > 0 && (
                    <div style={{ marginTop: '1pt' }}>
                      {project.technologies.map((tech, i) => (
                        <span key={i} style={{
                          ...skillItemStyle,
                          fontSize: '7pt',
                          marginRight: '2pt',
                          marginBottom: '1pt',
                          display: 'inline-block'
                        }}>
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </section>
          ) : null,
          
          publications: () => data.publications && data.publications.length > 0 ? (
            <section style={sectionStyle} className="resume-section publications-section">
              <h2 style={sectionHeaderStyle}>Publications</h2>
              {data.publications.map((publication, index) => (
                <div key={publication.id || index} style={itemStyle} className="publication-item">
                  <p style={{ fontSize: '9pt', lineHeight: '1.3', margin: '0', padding: 0, fontStyle: 'normal', color: '#4a5568' }}>
                    {/* Authors */}
                    {publication.authors && (
                      <span style={{ fontWeight: '600', color: '#2d3748' }}>
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
                        style={{ color: '#4299e1', textDecoration: 'none' }}
                      >
                        {publication.url}
                      </a>
                    )}
                  </p>
                  
                  {/* Description as a separate paragraph if provided */}
                  {publication.description && (
                    <p style={{ fontSize: '8pt', marginTop: '1pt', lineHeight: '1.3', margin: '1pt 0 0 0', padding: 0, color: '#718096' }}>
                      {publication.description}
                    </p>
                  )}
                </div>
              ))}
            </section>
          ) : null,
          
          certifications: () => data.certifications && data.certifications.length > 0 ? (
            <section style={sectionStyle} className="resume-section certifications-section">
              <h2 style={sectionHeaderStyle}>Certifications</h2>
              {data.certifications.map((cert, index) => (
                <div key={cert.id || index} style={itemStyle} className="certification-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1pt', width: '100%' }}>
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
                      margin: '1pt 0', 
                      padding: 0,
                      color: '#4a5568'
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
      const element = this.renderPreview(dataWithFormattedUrls);
      return await generatePDFFromReactElement(element, filename);
    } catch (error) {
      console.error("Error in MinimalistAtsTemplate.exportToPDF:", error);
      throw error;
    }
  }
} 