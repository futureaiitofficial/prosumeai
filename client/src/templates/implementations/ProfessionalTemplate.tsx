import React from 'react';
import { BaseTemplate } from '../base/ResumeTemplate';
import { professionalCustomization } from '../config/defaultConfig';
import { type ResumeData } from '@/types/resume';
import { generatePDFFromReactElement } from '../utils/exportUtils';
import { renderSections } from '../core/sectionRenderer';
import { TemplateFactory } from '../core/TemplateFactory';

const metadata = {
  id: 'professional',
  name: 'Professional',
  description: 'A clean, traditional layout optimized for ATS systems.',
  isAtsOptimized: true,
  version: '1.0.0',
  thumbnail: '/templates/professional.png',
  category: 'professional',
  tags: ['professional', 'traditional', 'ats-friendly']
};

export class ProfessionalTemplate extends BaseTemplate {
  constructor() {
    super(metadata, professionalCustomization);
  }

  render(data: ResumeData): JSX.Element {
    console.log("ProfessionalTemplate rendering with data:", data);
    const { colors, fonts } = this.customization;

    // Check if skills should be categorized
    const useSkillCategories = data.useSkillCategories ?? false;

    const containerStyle: React.CSSProperties = {
      width: '210mm',
      minHeight: '297mm',
      backgroundColor: colors.background || '#ffffff',
      fontFamily: fonts.body || '"Times New Roman", serif',
      fontSize: '9pt',
      padding: '12mm',
      color: colors.text || '#000000',
      margin: '0',
      boxSizing: 'border-box',
      lineHeight: '1.2',
      position: 'relative'
    };

    const headerStyle: React.CSSProperties = {
      textAlign: 'center',
      marginBottom: '6pt',
      width: '100%',
      display: 'block'
    };

    const nameStyle: React.CSSProperties = {
      fontFamily: fonts.heading || '"Times New Roman", serif',
      fontSize: '18pt',
      fontWeight: 'bold',
      color: '#000000',
      margin: '0 0 2pt 0',
      padding: 0,
      textAlign: 'center',
      lineHeight: '1.1',
      display: 'block'
    };

    const jobTitleStyle: React.CSSProperties = {
      fontSize: '11pt',
      color: colors.secondary || '#000000',
      margin: '0 0 4pt 0',
      padding: 0,
      textAlign: 'center'
    };

    const contactStyle: React.CSSProperties = {
      display: 'flex',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: '2pt',
      fontSize: '9pt',
      marginBottom: '0',
      width: '100%',
      whiteSpace: 'normal',
      wordWrap: 'break-word',
      lineHeight: '1.2'
    };

    const contactItemStyle: React.CSSProperties = {
      padding: '0 2pt',
      position: 'relative',
      display: 'inline-block'
    };

    const sectionStyle: React.CSSProperties = {
      marginBottom: '2pt',
      width: '100%',
      display: 'block'
    };

    const sectionHeaderStyle: React.CSSProperties = {
      fontFamily: fonts.heading || '"Times New Roman", serif',
      fontSize: '11pt',
      fontWeight: 'bold',
      color: '#000000',
      borderBottom: '1.5pt solid #000000',
      paddingBottom: '1pt',
      marginBottom: '2pt',
      marginTop: '0',
      width: '100%',
      display: 'block',
      textTransform: 'uppercase',
      letterSpacing: '0.5pt'
    };

    // Style for experience/education items - more compact
    const itemStyle: React.CSSProperties = {
      marginBottom: '4pt',
      width: '100%', 
      display: 'block'
    };

    // Style for titles to stay with their content - simplified
    const titleStyle: React.CSSProperties = {
      fontWeight: 'bold', 
      fontSize: '10pt', 
      margin: '0 0 1pt 0', 
      padding: 0
    };

    const mainContentStyle: React.CSSProperties = {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '0'
    };

    return (
      <div style={containerStyle} className="professional-template">
        {/* Header */}
        <header style={headerStyle}>
          <h1 style={nameStyle}>{data.fullName}</h1>
          {data.targetJobTitle && <p style={jobTitleStyle}>{data.targetJobTitle}</p>}
          
          {/* Contact Info */}
          <div style={contactStyle}>
            {data.email && <span style={contactItemStyle}>{data.email}</span>}
            {data.email && (data.phone || data.city || data.state || data.formattedLinkedinUrl || data.formattedPortfolioUrl) && 
              <span style={{...contactItemStyle, padding: '0 2pt'}}>{data.contactSeparator || "|"}</span>}
            
            {data.phone && <span style={contactItemStyle}>{data.phone}</span>}
            {data.phone && (data.city || data.state || data.formattedLinkedinUrl || data.formattedPortfolioUrl) && 
              <span style={{...contactItemStyle, padding: '0 2pt'}}>{data.contactSeparator || "|"}</span>}
            
            {data.city && data.state && <span style={contactItemStyle}>{`${data.city}, ${data.state}`}</span>}
            {data.city && data.state && (data.formattedLinkedinUrl || data.formattedPortfolioUrl) && 
              <span style={{...contactItemStyle, padding: '0 2pt'}}>{data.contactSeparator || "|"}</span>}
            
            {data.formattedLinkedinUrl && 
              <span style={contactItemStyle}>
                <a 
                  href={data.linkedinUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ color: colors.primary || '#000000', textDecoration: 'none' }}>
                  {data.formattedLinkedinUrl}
                </a>
              </span>}
            {data.formattedLinkedinUrl && data.formattedPortfolioUrl && 
              <span style={{...contactItemStyle, padding: '0 2pt'}}>{data.contactSeparator || "|"}</span>}
              
            {data.formattedPortfolioUrl && 
              <span style={contactItemStyle}>
                <a 
                  href={data.portfolioUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ color: colors.primary || '#000000', textDecoration: 'none' }}>
                  {data.formattedPortfolioUrl}
                </a>
              </span>}
          </div>
        </header>
        
        <div style={mainContentStyle}>
          {/* Use the section renderer to respect section order */}
          {renderSections(data, {
            summary: () => data.summary ? (
              <section style={sectionStyle} className="resume-section summary-section">
                <h2 style={sectionHeaderStyle}>Professional Summary</h2>
                <p style={{ 
                  fontSize: '9pt', 
                  lineHeight: '1.3', 
                  margin: '0 0 0 0',
                  padding: '0',
                  display: 'block'
                }}>{data.summary}</p>
              </section>
            ) : null,
            
            workExperience: () => data.workExperience && data.workExperience.length > 0 ? (
              <section style={sectionStyle} className="resume-section experience-section">
                <h2 style={sectionHeaderStyle}>Work Experience</h2>
                {data.workExperience.map((exp, index) => (
                  <div key={exp.id || index} style={itemStyle} className="experience-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1pt', width: '100%' }}>
                      <div style={{ flex: '1 1 70%' }}>
                        <h3 style={titleStyle}>{exp.position}</h3>
                        <h4 style={{ fontSize: '9pt', color: colors.secondary || '#4b5563', margin: 0, padding: 0 }}>{exp.company}{exp.location ? `, ${exp.location}` : ''}</h4>
                      </div>
                      <div style={{ fontSize: '8pt', color: colors.secondary || '#4b5563', textAlign: 'right', marginTop: '0' }}>
                        {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                      </div>
                    </div>
                    
                    {exp.description && (
                      <p style={{ fontSize: '9pt', marginTop: '1pt', lineHeight: '1.3', margin: '1pt 0 2pt 0', padding: 0 }}>{exp.description}</p>
                    )}
                    
                    {exp.achievements && exp.achievements.length > 0 && (
                      <div style={{ margin: '1pt 0 0 0', padding: 0, fontSize: '8pt' }} className="achievements-list">
                        {exp.achievements.map((achievement, i) => (
                          <div key={i} style={{ marginBottom: '0.5pt', lineHeight: '1.3' }}>{achievement}</div>
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
                      <div style={{ flex: '1 1 70%' }}>
                        <h3 style={titleStyle}>{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</h3>
                        <h4 style={{ fontSize: '9pt', color: colors.secondary || '#4b5563', margin: 0, padding: 0 }}>{edu.institution}</h4>
                      </div>
                      <div style={{ fontSize: '8pt', color: colors.secondary || '#4b5563', textAlign: 'right', marginTop: '0' }}>
                        {edu.startDate} - {edu.current ? 'Present' : edu.endDate}
                      </div>
                    </div>
                    {edu.description && (
                      <p style={{ fontSize: '9pt', marginTop: '1pt', lineHeight: '1.3', margin: '1pt 0 0 0', padding: 0 }}>{edu.description}</p>
                    )}
                  </div>
                ))}
              </section>
            ) : null,
            
            skills: () => (data.skills?.length > 0 || data.technicalSkills?.length > 0 || data.softSkills?.length > 0 || data.skillCategories) ? (
              <section style={sectionStyle} className="resume-section skills-section">
                <h2 style={sectionHeaderStyle}>Skills</h2>
                <div style={{ fontSize: '9pt', width: '100%' }} className="skills-content">
                  {/* New flexible categories system */}
                  {useSkillCategories && data.skillCategories && Object.keys(data.skillCategories).length > 0 ? (
                    Object.entries(data.skillCategories).map(([categoryName, skills]) => (
                      skills && skills.length > 0 ? (
                        <div key={categoryName} style={{ marginBottom: '1pt', width: '100%', display: 'block' }} className={`skills-category-${categoryName.toLowerCase().replace(/\s+/g, '-')}`}>
                          <h3 style={titleStyle}>{categoryName}</h3>
                          <p style={{ margin: 0, padding: 0 }}>{skills.join(', ')}</p>
                        </div>
                      ) : null
                    ))
                  ) : (
                    <>
                      {/* Simple mode - all skills in one list */}
                      {!useSkillCategories && data.skills && data.skills.length > 0 && (
                        <p style={{ marginBottom: '0', margin: '0', padding: 0 }}>{data.skills.join(', ')}</p>
                      )}
                      
                      {/* Legacy categorized skills */}
                      {useSkillCategories && (
                        <>
                          {data.skills && data.skills.length > 0 && (
                            <p style={{ marginBottom: '1pt', margin: '0 0 1pt 0', padding: 0 }}>General Skills: {data.skills.join(', ')}</p>
                          )}
                          {data.technicalSkills && data.technicalSkills.length > 0 && (
                            <div style={{ marginBottom: '1pt', width: '100%', display: 'block' }} className="technical-skills">
                              <h3 style={titleStyle}>Technical Skills</h3>
                              <p style={{ margin: 0, padding: 0 }}>{data.technicalSkills.join(', ')}</p>
                            </div>
                          )}
                          {data.softSkills && data.softSkills.length > 0 && (
                            <div style={{ width: '100%', display: 'block' }} className="soft-skills">
                              <h3 style={titleStyle}>Soft Skills</h3>
                              <p style={{ margin: 0, padding: 0 }}>{data.softSkills.join(', ')}</p>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </section>
            ) : null,
            
            projects: () => data.projects && data.projects.length > 0 ? (
              <section style={sectionStyle} className="resume-section projects-section">
                <h2 style={sectionHeaderStyle}>Projects</h2>
                {data.projects.map((project, index) => (
                  <div key={project.id || index} style={itemStyle} className="project-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1pt', width: '100%' }}>
                      <div style={{ flex: '1 1 70%' }}>
                        <h3 style={titleStyle}>{project.name}</h3>
                        {project.technologies && project.technologies.length > 0 && (
                          <p style={{ fontSize: '8pt', color: colors.secondary || '#4b5563', margin: '0 0 1pt 0', padding: 0 }}>
                            <strong>Technologies:</strong> {project.technologies.join(', ')}
                          </p>
                        )}
                      </div>
                      {(project.startDate || project.endDate) && (
                        <div style={{ fontSize: '8pt', color: colors.secondary || '#4b5563', textAlign: 'right', marginTop: '0' }}>
                          {project.startDate} - {project.current ? 'Present' : project.endDate}
                        </div>
                      )}
                    </div>
                    {project.description && (
                      <p style={{ fontSize: '9pt', marginTop: '1pt', lineHeight: '1.3', margin: '1pt 0 0 0', padding: 0 }}>{project.description}</p>
                    )}
                    {project.url && (
                      <p style={{ fontSize: '8pt', marginTop: '1pt', marginBottom: 0, lineHeight: '1.3' }}>
                        <strong>URL:</strong> {project.url}
                      </p>
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
                    <p style={{ fontSize: '9pt', lineHeight: '1.4', margin: '0', padding: 0, fontStyle: 'normal' }}>
                      {/* Authors */}
                      {publication.authors && (
                        <span style={{ fontWeight: 'bold' }}>
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
                        <span style={{ fontWeight: 'bold' }}>{publication.publisher}</span>
                      )}
                      {publication.publisher && '. '}
                      
                      {/* URL */}
                      {publication.url && (
                        <a 
                          href={publication.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ color: colors.primary || '#000000', textDecoration: 'none' }}
                        >
                          {publication.url}
                        </a>
                      )}
                    </p>
                    
                    {/* Description as a separate paragraph if provided */}
                    {publication.description && (
                      <p style={{ fontSize: '8pt', marginTop: '1pt', lineHeight: '1.3', margin: '1pt 0 0 0', padding: 0, color: colors.secondary || '#4b5563' }}>
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
                      <div style={{ flex: '1 1 70%' }}>
                        <h3 style={titleStyle}>{cert.name}</h3>
                        <h4 style={{ fontSize: '9pt', color: colors.secondary || '#4b5563', margin: 0, padding: 0 }}>{cert.issuer}</h4>
                      </div>
                      <div style={{ fontSize: '8pt', color: colors.secondary || '#4b5563', textAlign: 'right', marginTop: '0' }}>
                        {cert.date} {cert.expires && cert.expiryDate ? `- Expires: ${cert.expiryDate}` : ''}
                      </div>
                    </div>
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
      const element = this.renderPreview(dataWithFormattedUrls);
      return await generatePDFFromReactElement(element, filename);
    } catch (error) {
      console.error("Error in ProfessionalTemplate.exportToPDF:", error);
      throw error;
    }
  }

  async exportToLaTeX(data: ResumeData): Promise<string> {
    throw new Error('LaTeX export not implemented');
  }

  async exportToHTML(data: ResumeData): Promise<string> {
    throw new Error('HTML export not implemented');
  }

  async exportToDOCX(data: ResumeData): Promise<Blob> {
    throw new Error('DOCX export not implemented');
  }
}