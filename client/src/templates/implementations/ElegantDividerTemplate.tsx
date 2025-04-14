import React from 'react';
import { BaseTemplate } from '../core/BaseTemplate';
import { elegantCustomization } from '../config/defaultConfig';
import { type ResumeData } from '@/types/resume';
import { generatePDFFromReactElement } from '../utils/exportUtils';
import { renderSections } from '../core/sectionRenderer';

const metadata = {
  id: 'elegant-divider',
  name: 'Elegant Divider',
  description: 'A professional two-column layout with a vertical divider for clear section separation.',
  isAtsOptimized: true,
  version: '1.0.0',
  thumbnail: '/templates/elegant-divider.png',
  category: 'professional',
  tags: ['elegant', 'professional', 'two-column', 'modern', 'clean']
};

export class ElegantDividerTemplate extends BaseTemplate {
  constructor() {
    super(metadata, elegantCustomization);
  }

  renderPreview(data: ResumeData): JSX.Element {
    console.log("ElegantDividerTemplate rendering with data:", data);
    const { colors, fonts } = this.customization;

    // Check if skills should be categorized
    const useSkillCategories = data.useSkillCategories ?? false;

    const containerStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      minHeight: '297mm',
      maxWidth: '100%',
      backgroundColor: colors.background || '#ffffff',
      fontFamily: fonts.body || '"Arial", sans-serif',
      fontSize: '9pt',
      padding: '0',
      color: colors.text || '#333333',
      margin: '0',
      boxSizing: 'border-box',
      lineHeight: '1.3',
      overflow: 'visible',
      position: 'relative'
    };

    // Two-column layout styles
    const mainContainerStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'row',
      width: '100%',
      height: '100%',
      minHeight: '297mm',
      position: 'relative',
      margin: 0,
      padding: 0
    };

    const leftColumnStyle: React.CSSProperties = {
      width: '32%',
      padding: '20px',
      position: 'relative',
      borderRight: `1px solid #000000`,
      height: '100%',
      boxSizing: 'border-box',
      minHeight: '100%'
    };

    const rightColumnStyle: React.CSSProperties = {
      width: '68%',
      padding: '20px',
      position: 'relative',
      boxSizing: 'border-box'
    };

    // Header styles
    const nameStyle: React.CSSProperties = {
      fontFamily: fonts.heading || '"Arial", sans-serif',
      fontSize: '1.6rem',
      fontWeight: 'bold',
      color: '#000000',
      margin: '0 0 0.4rem 0',
      padding: 0,
      lineHeight: '1.3',
      display: 'block'
    };

    const jobTitleStyle: React.CSSProperties = {
      fontFamily: fonts.body || '"Arial", sans-serif',
      fontSize: '1rem',
      color: colors.secondary || '#4b5563',
      marginBottom: '1rem',
      fontWeight: 'normal'
    };

    // Contact styles
    const contactStyle: React.CSSProperties = {
      marginBottom: '1.5rem',
      fontSize: '0.9rem'
    };

    const contactItemStyle: React.CSSProperties = {
      display: 'block',
      marginBottom: '0.25rem',
      color: colors.text || '#333333'
    };

    // Section styling
    const sectionStyle: React.CSSProperties = {
      marginBottom: '0.7rem', // Reduced from 1rem for tighter spacing
      width: '100%',
      display: 'block',
      pageBreakInside: 'auto'
    };

    const sectionHeaderStyle: React.CSSProperties = {
      fontFamily: fonts.heading || '"Arial", sans-serif',
      fontSize: '0.9rem',
      fontWeight: 'bold',
      color: '#000000',
      textTransform: 'uppercase',
      letterSpacing: '0.05rem',
      marginBottom: '0.4rem',
      marginTop: '0.7rem',
      width: '100%',
      display: 'block',
      pageBreakBefore: 'auto',
      pageBreakAfter: 'avoid'
    };

    // Style for experience/education items to keep them together
    const itemStyle: React.CSSProperties = {
      marginBottom: '0.7rem', 
      width: '100%', 
      display: 'block',
      pageBreakInside: 'avoid'
    };

    // Style for titles
    const titleStyle: React.CSSProperties = {
      fontWeight: 'bold', 
      fontSize: '1rem', 
      color: colors.primary || '#1e293b',
      marginBottom: '0.1rem', 
      margin: '0 0 0.1rem 0', 
      padding: 0,
      pageBreakAfter: 'avoid'
    };

    // Bullet styles
    const bulletListStyle: React.CSSProperties = {
      listStyleType: 'none',
      padding: 0,
      margin: '0 0 0.5rem 0'
    };

    const bulletItemStyle: React.CSSProperties = {
      position: 'relative',
      paddingLeft: '12px',
      marginBottom: '0.3rem',
      fontSize: '0.9rem',
      lineHeight: '1.3'
    };

    // Skill styles
    const skillItemStyle: React.CSSProperties = {
      display: 'block',
      marginBottom: '0.15rem',
      fontSize: '0.9rem'
    };

    const skillCategoryStyle: React.CSSProperties = {
      fontWeight: 'bold',
      marginBottom: '0.2rem',
      fontSize: '0.9rem'
    };

    return (
      <div 
        style={containerStyle} 
        className="resume-container"
        data-template-id="elegant-divider"
      >
        <div style={mainContainerStyle}>
          {/* Left Column */}
          <div style={leftColumnStyle} className="resume-left-column no-break-inside">
            {/* Name and Job Title */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={nameStyle} className="no-break-after">{data.fullName}</h1>
              <p style={jobTitleStyle} className="no-break-after">{data.targetJobTitle}</p>
            </div>
            
            {/* Contact Information */}
            <div style={contactStyle} className="contact-section no-break-inside">
              <h2 style={sectionHeaderStyle} className="no-break-after">Contact</h2>
              {data.phone && (
                <div style={contactItemStyle}>
                  {data.phone}
                </div>
              )}
              {data.email && (
                <div style={contactItemStyle}>
                  {data.email}
                </div>
              )}
              {data.linkedinUrl && (
                <div style={contactItemStyle}>
                  <a 
                    href={data.linkedinUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ color: colors.text || '#333333', textDecoration: 'none', wordBreak: 'break-all' }}
                  >
                    {data.linkedinUrl.replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                </div>
              )}
              {data.location && (
                <div style={contactItemStyle}>
                  {data.location}
                </div>
              )}
              {!data.location && data.city && data.state && (
                <div style={contactItemStyle}>
                  {data.city}, {data.state}
                </div>
              )}
              {data.portfolioUrl && (
                <div style={contactItemStyle}>
                  <a 
                    href={data.portfolioUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ color: colors.text || '#333333', textDecoration: 'none', wordBreak: 'break-all' }}
                  >
                    {data.portfolioUrl.replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                </div>
              )}
            </div>
            
            {/* Skills Section for Left Column */}
            {renderSections(data, {
              skills: () => (data.skills?.length > 0 || data.technicalSkills?.length > 0 || data.softSkills?.length > 0) ? (
                <div style={sectionStyle} className="skills-section no-break-inside">
                  <h2 style={sectionHeaderStyle} className="no-break-after">Skills</h2>
                  
                  {!useSkillCategories && data.skills && data.skills.length > 0 && (
                    <div style={bulletListStyle}>
                      {data.skills.map((skill, index) => (
                        <div key={index} style={skillItemStyle}>{skill}</div>
                      ))}
                    </div>
                  )}
                  
                  {useSkillCategories && (
                    <>
                      {data.technicalSkills && data.technicalSkills.length > 0 && (
                        <div style={{ marginBottom: '0.5rem' }} className="technical-skills no-break-inside">
                          <div style={skillCategoryStyle}>Professional</div>
                          {data.technicalSkills.map((skill, index) => (
                            <div key={index} style={skillItemStyle}>
                              • {skill}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {data.softSkills && data.softSkills.length > 0 && (
                        <div className="soft-skills no-break-inside">
                          <div style={skillCategoryStyle}>Technical</div>
                          {data.softSkills.map((skill, index) => (
                            <div key={index} style={skillItemStyle}>
                              • {skill}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : null,
              
              languages: () => data.languages && data.languages.length > 0 ? (
                <div style={sectionStyle} className="languages-section no-break-inside">
                  <h2 style={sectionHeaderStyle} className="no-break-after">Languages</h2>
                  <div style={bulletListStyle}>
                    {data.languages.map((lang, index) => (
                      <div key={index} style={skillItemStyle}>
                        {lang.language}{lang.proficiency ? `, ${lang.proficiency}` : ''}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null,
              
              certifications: () => data.certifications && data.certifications.length > 0 ? (
                <div style={sectionStyle} className="certifications-section no-break-inside">
                  <h2 style={sectionHeaderStyle} className="no-break-after">Professional Development</h2>
                  {data.certifications.map((cert, index) => (
                    <div key={cert.id || index} style={{ marginBottom: '0.5rem' }} className="certification-item no-break-inside">
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.1rem' }}>
                        {cert.name}
                      </div>
                      <div style={{ fontSize: '0.85rem' }}>
                        {cert.issuer}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: colors.secondary || '#4b5563' }}>
                        {cert.date}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null
            })}
          </div>
          
          {/* Right Column */}
          <div style={rightColumnStyle} className="resume-right-column">
            {/* Use renderSections to render right column content in the correct order */}
            {renderSections(data, {
              summary: () => data.summary ? (
                <section style={sectionStyle} className="resume-section summary-section no-break-inside">
                  <p style={{ 
                    fontSize: '0.9rem', 
                    lineHeight: '1.4', 
                    margin: '0 0 1rem 0',
                    padding: '0',
                    display: 'block'
                  }} className="no-break-inside">{data.summary}</p>
                </section>
              ) : null,
              
              workExperience: () => data.workExperience && data.workExperience.length > 0 ? (
                <section style={sectionStyle} className="resume-section experience-section">
                  <h2 style={sectionHeaderStyle} className="no-break-after">Work Experience</h2>
                  {data.workExperience.map((exp, index) => (
                    <div key={exp.id || index} style={itemStyle} className="experience-item no-break-inside">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.1rem', width: '100%' }} className="no-break-after">
                        <div style={{ flex: '1 1 70%' }}>
                          <h3 style={titleStyle} className="no-break-after">{exp.position}</h3>
                          <h4 style={{ fontSize: '0.9rem', color: colors.secondary || '#4b5563', margin: 0, padding: 0 }} className="no-break-after">
                            {exp.company}{exp.location ? ` | ${exp.location}` : ''}
                          </h4>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: colors.secondary || '#4b5563', textAlign: 'right' }}>
                          {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                        </div>
                      </div>
                      {exp.description && (
                        <p style={{ fontSize: '0.9rem', marginTop: '0.2rem', lineHeight: '1.3', margin: '0.2rem 0 0.3rem 0', padding: 0 }} className="no-break-inside">
                          {exp.description}
                        </p>
                      )}
                      {exp.achievements && exp.achievements.length > 0 && (
                        <ul style={bulletListStyle} className="achievements-list no-break-inside">
                          {exp.achievements.map((achievement, i) => (
                            <li key={i} style={bulletItemStyle} className="no-break-inside">
                              <span style={{ position: 'absolute', left: '0', top: '0' }}>•</span>
                              {achievement}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </section>
              ) : null,
              
              education: () => data.education && data.education.length > 0 ? (
                <section style={sectionStyle} className="resume-section education-section">
                  <h2 style={sectionHeaderStyle} className="no-break-after">Education</h2>
                  {data.education.map((edu, index) => (
                    <div key={edu.id || index} style={itemStyle} className="education-item no-break-inside">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.1rem', width: '100%' }} className="no-break-after">
                        <div style={{ flex: '1 1 70%' }}>
                          <h3 style={titleStyle} className="no-break-after">{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</h3>
                          <h4 style={{ fontSize: '0.9rem', color: colors.secondary || '#4b5563', margin: 0, padding: 0 }} className="no-break-after">
                            {edu.institution}{edu.location ? `, ${edu.location}` : ''}
                          </h4>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: colors.secondary || '#4b5563', textAlign: 'right' }}>
                          {edu.startDate} - {edu.current ? 'Present' : edu.endDate}
                        </div>
                      </div>
                      {edu.description && (
                        <p style={{ fontSize: '0.9rem', marginTop: '0.2rem', lineHeight: '1.3', margin: '0.2rem 0 0 0', padding: 0 }} className="no-break-inside">
                          {edu.description}
                        </p>
                      )}
                    </div>
                  ))}
                </section>
              ) : null,
              
              projects: () => data.projects && data.projects.length > 0 ? (
                <section style={sectionStyle} className="resume-section projects-section">
                  <h2 style={sectionHeaderStyle} className="no-break-after">Projects</h2>
                  {data.projects.map((project, index) => (
                    <div key={project.id || index} style={itemStyle} className="project-item no-break-inside">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.1rem', width: '100%' }} className="no-break-after">
                        <h3 style={titleStyle} className="no-break-after">{project.name} {project.detail ? `— ${project.detail}` : ''}</h3>
                        {(project.startDate || project.endDate) && (
                          <div style={{ fontSize: '0.85rem', color: colors.secondary || '#4b5563', textAlign: 'right' }}>
                            {project.startDate} - {project.current ? 'Present' : project.endDate || 'N/A'}
                          </div>
                        )}
                      </div>
                      <p style={{ fontSize: '0.9rem', marginTop: '0.2rem', lineHeight: '1.3', margin: '0.2rem 0 0 0', padding: 0 }} className="no-break-inside">
                        {project.description}
                      </p>
                      {project.technologies && project.technologies.length > 0 && (
                        <div style={{ fontSize: '0.85rem', margin: '0.2rem 0 0 0', padding: 0 }} className="no-break-inside">
                          <strong>Technologies:</strong> {project.technologies.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </section>
              ) : null
            })}
          </div>
        </div>
      </div>
    );
  }

  async exportToPDF(data: ResumeData): Promise<Blob> {
    try {
      const filename = `${data.fullName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Resume'}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      console.log("Starting PDF export for:", filename);
      console.log("PDF export using section order:", data.sectionOrder);
      
      // Pass the exact same data to renderPreview to maintain section order
      const element = this.renderPreview(data);
      return await generatePDFFromReactElement(element, filename);
    } catch (error) {
      console.error("Error in ElegantDividerTemplate.exportToPDF:", error);
      throw error;
    }
  }
} 