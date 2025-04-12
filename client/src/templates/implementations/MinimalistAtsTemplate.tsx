import React from 'react';
import { BaseTemplate } from '../core/BaseTemplate';
import { minimalistCustomization } from '../config/defaultConfig';
import { type ResumeData } from '@/types/resume';
import { generatePDFFromReactElement } from '../utils/exportUtils';

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

  renderPreview(data: ResumeData): JSX.Element {
    console.log("MinimalistAtsTemplate rendering with data:", data);
    const { colors, fonts } = this.customization;

    // Check if skills should be categorized
    const useSkillCategories = data.useSkillCategories ?? false;

    const containerStyle: React.CSSProperties = {
      width: '100%',
      height: 'auto',
      maxWidth: '100%',
      backgroundColor: colors.background || '#ffffff',
      fontFamily: fonts.body || '"Helvetica", "Arial", sans-serif',
      fontSize: '10pt',
      padding: '15mm 15mm',
      color: colors.text || '#333333',
      margin: '0',
      boxSizing: 'border-box',
      lineHeight: '1.4',
      overflow: 'visible',
      position: 'relative'
    };

    // Header styles
    const headerStyle: React.CSSProperties = {
      marginBottom: '1rem',
      borderBottom: '1px solid #e5e5e5',
      paddingBottom: '1rem'
    };

    const nameStyle: React.CSSProperties = {
      fontFamily: fonts.heading || '"Helvetica", "Arial", sans-serif',
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: colors.primary || '#333333',
      margin: '0 0 0.2rem 0',
      padding: 0,
      lineHeight: '1.3',
      textAlign: 'center'
    };

    const jobTitleStyle: React.CSSProperties = {
      fontFamily: fonts.body || '"Helvetica", "Arial", sans-serif',
      fontSize: '1rem',
      color: colors.secondary || '#666666',
      marginBottom: '0.5rem',
      fontWeight: 'normal',
      textAlign: 'center'
    };

    // Contact styles
    const contactStyle: React.CSSProperties = {
      display: 'flex',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: '1rem',
      fontSize: '0.9rem',
      marginTop: '0.5rem',
      textAlign: 'center'
    };

    // Section styling
    const sectionStyle: React.CSSProperties = {
      marginBottom: '1rem',
      width: '100%',
      display: 'block',
      pageBreakInside: 'auto'
    };

    const sectionHeaderStyle: React.CSSProperties = {
      fontFamily: fonts.heading || '"Helvetica", "Arial", sans-serif',
      fontSize: '1.1rem',
      fontWeight: 'bold',
      color: colors.primary || '#333333',
      borderBottom: '1px solid #e5e5e5',
      paddingBottom: '0.3rem',
      marginBottom: '0.5rem',
      marginTop: '1rem',
      width: '100%',
      display: 'block',
      pageBreakBefore: 'auto',
      pageBreakAfter: 'avoid'
    };

    // Style for experience/education items to keep them together
    const itemStyle: React.CSSProperties = {
      marginBottom: '1rem', 
      width: '100%', 
      display: 'block',
      pageBreakInside: 'avoid'
    };

    // Style for titles
    const titleStyle: React.CSSProperties = {
      fontWeight: 'bold', 
      fontSize: '1rem', 
      color: colors.primary || '#333333',
      marginBottom: '0.1rem', 
      margin: '0 0 0.1rem 0', 
      padding: 0,
      pageBreakAfter: 'avoid'
    };

    // Bullet styles
    const bulletListStyle: React.CSSProperties = {
      listStyleType: 'disc',
      paddingLeft: '1.2rem',
      margin: '0.5rem 0'
    };

    const bulletItemStyle: React.CSSProperties = {
      marginBottom: '0.3rem',
      fontSize: '0.95rem',
      lineHeight: '1.4'
    };

    // Skills section
    const skillsContainerStyle: React.CSSProperties = {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.5rem 1rem'
    };

    const skillItemStyle: React.CSSProperties = {
      fontSize: '0.95rem'
    };

    // Projects section
    const projectLinkStyle: React.CSSProperties = {
      color: colors.primary || '#333333',
      textDecoration: 'none',
      fontSize: '0.9rem',
      display: 'inline-block',
      marginBottom: '0.3rem'
    };

    return (
      <div style={containerStyle} className="resume-container">
        {/* Header */}
        <header style={headerStyle} className="resume-header no-break-inside">
          <h1 style={nameStyle} className="no-break-after">{data.fullName}</h1>
          <p style={jobTitleStyle} className="no-break-after">{data.targetJobTitle}</p>
          
          <div style={contactStyle} className="no-break-inside">
            {data.email && <span>{data.email}</span>}
            {data.phone && <span>{data.phone}</span>}
            {data.location && <span>{data.location}</span>}
            {!data.location && data.city && data.state && <span>{data.city}, {data.state}</span>}
            {data.linkedinUrl && <span>
              <a 
                href={data.linkedinUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ color: colors.primary || '#333333', textDecoration: 'none' }}>
                LinkedIn
              </a>
            </span>}
            {data.portfolioUrl && <span>
              <a 
                href={data.portfolioUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ color: colors.primary || '#333333', textDecoration: 'none' }}>
                Portfolio
              </a>
            </span>}
          </div>
        </header>

        {/* Summary */}
        {data.summary && (
          <section style={sectionStyle} className="resume-section summary-section no-break-inside">
            <h2 style={sectionHeaderStyle} className="no-break-after">Summary</h2>
            <p style={{ 
              fontSize: '0.95rem', 
              lineHeight: '1.4', 
              margin: '0',
              padding: '0',
              display: 'block'
            }} className="no-break-inside">{data.summary}</p>
          </section>
        )}

        {/* Skills */}
        {(data.skills?.length > 0 || data.technicalSkills?.length > 0 || data.softSkills?.length > 0) && (
          <section style={sectionStyle} className="resume-section skills-section">
            <h2 style={sectionHeaderStyle} className="no-break-after">Skills</h2>
            <div style={skillsContainerStyle} className="skills-content no-break-inside">
              {!useSkillCategories && data.skills && data.skills.length > 0 && (
                data.skills.map((skill, index) => (
                  <span key={index} style={skillItemStyle}>{skill}</span>
                ))
              )}
              
              {useSkillCategories && (
                <>
                  {data.technicalSkills && data.technicalSkills.length > 0 && (
                    <div style={{ width: '100%', marginBottom: '0.5rem' }} className="technical-skills no-break-inside">
                      <h3 style={{ ...titleStyle, fontSize: '0.95rem', marginBottom: '0.3rem' }} className="no-break-after">Technical Skills</h3>
                      <div style={skillsContainerStyle}>
                        {data.technicalSkills.map((skill, index) => (
                          <span key={index} style={skillItemStyle}>{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {data.softSkills && data.softSkills.length > 0 && (
                    <div style={{ width: '100%' }} className="soft-skills no-break-inside">
                      <h3 style={{ ...titleStyle, fontSize: '0.95rem', marginBottom: '0.3rem' }} className="no-break-after">Soft Skills</h3>
                      <div style={skillsContainerStyle}>
                        {data.softSkills.map((skill, index) => (
                          <span key={index} style={skillItemStyle}>{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        )}

        {/* Experience */}
        {data.workExperience && data.workExperience.length > 0 && (
          <section style={sectionStyle} className="resume-section experience-section">
            <h2 style={sectionHeaderStyle} className="no-break-after">Work Experience</h2>
            {data.workExperience.map((exp, index) => (
              <div key={exp.id || index} style={itemStyle} className="experience-item no-break-inside">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.1rem', width: '100%' }} className="no-break-after">
                  <div>
                    <h3 style={titleStyle} className="no-break-after">{exp.position}</h3>
                    <p style={{ fontSize: '0.95rem', margin: '0 0 0.2rem 0', padding: 0 }} className="no-break-after">
                      <strong>{exp.company}</strong>{exp.location ? ` | ${exp.location}` : ''}
                    </p>
                  </div>
                  <div style={{ fontSize: '0.95rem', color: colors.secondary || '#666666', textAlign: 'right' }}>
                    {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                  </div>
                </div>
                {exp.description && (
                  <p style={{ fontSize: '0.95rem', lineHeight: '1.4', margin: '0.3rem 0', padding: 0 }} className="no-break-inside">
                    {exp.description}
                  </p>
                )}
                {exp.achievements && exp.achievements.length > 0 && (
                  <ul style={bulletListStyle} className="achievements-list no-break-inside">
                    {exp.achievements.map((achievement, i) => (
                      <li key={i} style={bulletItemStyle} className="no-break-inside">
                        {achievement}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <section style={sectionStyle} className="resume-section education-section">
            <h2 style={sectionHeaderStyle} className="no-break-after">Education</h2>
            {data.education.map((edu, index) => (
              <div key={edu.id || index} style={itemStyle} className="education-item no-break-inside">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.1rem', width: '100%' }} className="no-break-after">
                  <div>
                    <h3 style={titleStyle} className="no-break-after">{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</h3>
                    <p style={{ fontSize: '0.95rem', margin: '0 0 0.2rem 0', padding: 0 }} className="no-break-after">
                      <strong>{edu.institution}</strong>{edu.location ? `, ${edu.location}` : ''}
                    </p>
                  </div>
                  <div style={{ fontSize: '0.95rem', color: colors.secondary || '#666666', textAlign: 'right' }}>
                    {edu.startDate} - {edu.current ? 'Present' : edu.endDate}
                  </div>
                </div>
                {edu.description && (
                  <p style={{ fontSize: '0.95rem', lineHeight: '1.4', margin: '0.3rem 0', padding: 0 }} className="no-break-inside">
                    {edu.description}
                  </p>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <section style={sectionStyle} className="resume-section projects-section">
            <h2 style={sectionHeaderStyle} className="no-break-after">Projects</h2>
            {data.projects.map((project, index) => (
              <div key={project.id || index} style={itemStyle} className="project-item no-break-inside">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.1rem', width: '100%' }} className="no-break-after">
                  <h3 style={titleStyle} className="no-break-after">{project.name}</h3>
                  {(project.startDate || project.endDate) && (
                    <div style={{ fontSize: '0.95rem', color: colors.secondary || '#666666', textAlign: 'right' }}>
                      {project.startDate} - {project.current ? 'Present' : project.endDate || ''}
                    </div>
                  )}
                </div>
                
                {project.url && (
                  <a 
                    href={project.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={projectLinkStyle}
                  >
                    {project.url.replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                )}
                
                <p style={{ fontSize: '0.95rem', lineHeight: '1.4', margin: '0.3rem 0', padding: 0 }} className="no-break-inside">
                  {project.description}
                </p>
                
                {project.technologies && project.technologies.length > 0 && (
                  <p style={{ fontSize: '0.9rem', margin: '0.2rem 0 0 0', padding: 0 }} className="no-break-inside">
                    <strong>Technologies:</strong> {project.technologies.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <section style={sectionStyle} className="resume-section certifications-section">
            <h2 style={sectionHeaderStyle} className="no-break-after">Certifications</h2>
            {data.certifications.map((cert, index) => (
              <div key={cert.id || index} style={itemStyle} className="certification-item no-break-inside">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.1rem', width: '100%' }} className="no-break-after">
                  <div>
                    <h3 style={titleStyle} className="no-break-after">{cert.name}</h3>
                    <p style={{ fontSize: '0.95rem', margin: '0 0 0.2rem 0', padding: 0 }} className="no-break-after">
                      <strong>{cert.issuer}</strong>
                    </p>
                  </div>
                  <div style={{ fontSize: '0.95rem', color: colors.secondary || '#666666', textAlign: 'right' }}>
                    {cert.date}
                    {cert.expiryDate && ` - ${cert.expiryDate}`}
                  </div>
                </div>
                {cert.description && (
                  <p style={{ fontSize: '0.95rem', lineHeight: '1.4', margin: '0.3rem 0', padding: 0 }} className="no-break-inside">
                    {cert.description}
                  </p>
                )}
              </div>
            ))}
          </section>
        )}
      </div>
    );
  }

  async exportToPDF(data: ResumeData): Promise<Blob> {
    try {
      const filename = `${data.fullName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Resume'}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      console.log("Starting PDF export for:", filename);
      
      const element = this.renderPreview(data);
      return await generatePDFFromReactElement(element, filename);
    } catch (error) {
      console.error("Error in MinimalistAtsTemplate.exportToPDF:", error);
      throw error;
    }
  }
} 