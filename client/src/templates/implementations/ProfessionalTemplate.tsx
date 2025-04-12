import React from 'react';
import { BaseTemplate } from '../core/BaseTemplate';
import { professionalCustomization } from '../config/defaultConfig';
import { type ResumeData } from '@/types/resume';
import { generatePDFFromReactElement } from '../utils/exportUtils';

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

  renderPreview(data: ResumeData): JSX.Element {
    console.log("ProfessionalTemplate rendering with data:", data);
    const { colors, fonts } = this.customization;

    // Check if skills should be categorized
    const useSkillCategories = data.useSkillCategories ?? false;

    const containerStyle: React.CSSProperties = {
      width: '210mm', // A4 width
      height: 'auto',
      maxWidth: '100%',
      backgroundColor: colors.background || '#ffffff',
      fontFamily: fonts.body || '"Times New Roman", serif',
      fontSize: '9pt',
      padding: '8mm',
      color: colors.text || '#000000',
      margin: '0 auto', // Center content for preview
      boxSizing: 'border-box',
      lineHeight: '1.3',
      overflow: 'visible',
      position: 'relative'
    };

    const headerStyle: React.CSSProperties = {
      textAlign: 'center',
      marginBottom: '0.3rem',
      width: '100%',
      display: 'block',
      pageBreakAfter: 'avoid' // Prevent page break after header
    };

    const nameStyle: React.CSSProperties = {
      fontFamily: fonts.heading || '"Times New Roman", serif',
      fontSize: '1.4rem',
      fontWeight: 'bold',
      color: colors.primary || '#000000',
      margin: '0 0 0.2rem 0',
      padding: 0,
      textAlign: 'center',
      lineHeight: '1.3',
      display: 'block'
    };

    const contactStyle: React.CSSProperties = {
      display: 'flex',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: '0.6rem',
      fontSize: '0.85rem',
      marginBottom: '0.4rem',
      width: '100%',
      whiteSpace: 'normal',
      wordWrap: 'break-word',
      lineHeight: '1.3'
    };

    const sectionStyle: React.CSSProperties = {
      marginBottom: '0rem',
      width: '100%',
      display: 'block',
      pageBreakInside: 'auto'
    };

    const sectionHeaderStyle: React.CSSProperties = {
      fontFamily: fonts.heading || '"Times New Roman", serif',
      fontSize: '1.1rem',
      fontWeight: 'bold',
      color: colors.primary || '#000000',
      borderBottom: `2px solid ${colors.primary || '#000000'}`,
      paddingBottom: '0.2rem',
      marginBottom: '0.2rem',
      marginTop: '0.5rem',
      width: '100%',
      display: 'block',
      pageBreakBefore: 'auto',
      pageBreakAfter: 'avoid'
    };

    // Style for experience/education items to keep them together if possible
    const itemStyle: React.CSSProperties = {
      marginBottom: '0.5rem', 
      width: '100%', 
      display: 'block',
      pageBreakInside: 'avoid' // Try to avoid breaking within an item
    };

    // Style for titles to stay with their content
    const titleStyle: React.CSSProperties = {
      fontWeight: 'bold', 
      fontSize: '1rem', 
      marginBottom: '0.2rem', 
      margin: '0 0 0.2rem 0', 
      padding: 0,
      pageBreakAfter: 'avoid' // Don't break page right after a title
    };

    return (
      <div style={containerStyle} className="resume-container">
        {/* Header - add class for page break control */}
        <div style={headerStyle} className="resume-header no-break-inside no-break-after">
          <h1 style={nameStyle} className="no-break-after">{data.fullName}</h1>
          <p style={{ fontSize: '1rem', color: colors.secondary || '#4b5563', marginBottom: '0.4rem', margin: '0 0 0.4rem 0', padding: 0 }} className="no-break-after">{data.targetJobTitle}</p>
          <div style={contactStyle} className="no-break-inside">
            {data.email && <span>{data.email}</span>}
            {data.phone && <span>{data.email ? " | " : ""}{data.phone}</span>}
            {data.location && <span>{(data.email || data.phone) ? " | " : ""}{data.location}</span>}
            {!data.location && data.city && data.state && <span>{(data.email || data.phone) ? " | " : ""}{data.city}, {data.state}</span>}
            {!data.location && !data.city && data.state && <span>{(data.email || data.phone) ? " | " : ""}{data.state}</span>}
            {!data.location && data.city && !data.state && <span>{(data.email || data.phone) ? " | " : ""}{data.city}</span>}
            {data.linkedinUrl && <span>{(data.email || data.phone || data.location || data.city || data.state) ? " | " : ""}<a href={data.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color: colors.primary || '#000000', textDecoration: 'none', wordBreak: 'break-all' }}>{data.linkedinUrl.replace(/^https?:\/\/(www\.)?/, '')}</a></span>}
            {data.portfolioUrl && <span>{(data.email || data.phone || data.location || data.city || data.state || data.linkedinUrl) ? " | " : ""}<a href={data.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ color: colors.primary || '#000000', textDecoration: 'none', wordBreak: 'break-all' }}>{data.portfolioUrl.replace(/^https?:\/\/(www\.)?/, '')}</a></span>}
          </div>
        </div>

        {/* Summary */}
        {data.summary && (
          <section style={sectionStyle} className="resume-section summary-section no-break-inside">
            <h2 style={sectionHeaderStyle} className="no-break-after">Professional Summary</h2>
            <p style={{ 
              fontSize: '0.9rem', 
              lineHeight: '1.3', 
              margin: '0.15rem 0 0.4rem 0',
              padding: '0',
              display: 'block'
            }} className="no-break-inside">{data.summary}</p>
          </section>
        )}

        {/* Experience */}
        {data.workExperience && data.workExperience.length > 0 && (
          <section style={sectionStyle} className="resume-section experience-section">
            <h2 style={sectionHeaderStyle} className="no-break-after">Work Experience</h2>
            {data.workExperience.map((exp, index) => (
              <div key={exp.id || index} style={itemStyle} className="experience-item no-break-inside">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem', width: '100%' }} className="no-break-after">
                  <div style={{ flex: '1 1 70%' }}>
                    <h3 style={titleStyle} className="no-break-after">{exp.position}</h3>
                    <h4 style={{ fontSize: '0.9rem', color: colors.secondary || '#4b5563', margin: 0, padding: 0 }} className="no-break-after">{exp.company}{exp.location ? ` | ${exp.location}` : ''}</h4>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: colors.secondary || '#4b5563', textAlign: 'right', marginTop: '0.25rem' }}>
                    {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                  </div>
                </div>
                {exp.description && (
                  <p style={{ fontSize: '0.9rem', marginTop: '0.2rem', lineHeight: '1.3', margin: '0.2rem 0 0.4rem 0', padding: 0 }} className="no-break-inside">{exp.description}</p>
                )}
                {exp.achievements && exp.achievements.length > 0 && (
                  <ul style={{ listStyle: 'none', paddingLeft: '0', marginTop: '0.4rem', marginBottom: '0', margin: '0.4rem 0 0 0', padding: 0 }} className="achievements-list no-break-inside">
                    {exp.achievements.map((achievement, i) => (
                      <li key={i} style={{ marginBottom: '0.3rem', paddingLeft: '1rem', textIndent: '-0.7rem', lineHeight: '1.3', margin: '0 0 0.3rem 0', padding: '0 0 0 1rem' }} className="no-break-inside">
                        <span style={{ display: 'inline-block', width: '0.7rem', textAlign: 'center' }}>•</span>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.2rem', width: '100%' }} className="no-break-after">
                  <div style={{ flex: '1 1 70%' }}>
                    <h3 style={titleStyle} className="no-break-after">{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</h3>
                    <h4 style={{ fontSize: '0.9rem', color: colors.secondary || '#4b5563', margin: 0, padding: 0 }} className="no-break-after">{edu.institution}</h4>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: colors.secondary || '#4b5563', textAlign: 'right', marginTop: '0.25rem' }}>
                    {edu.startDate} - {edu.current ? 'Present' : edu.endDate}
                  </div>
                </div>
                {edu.description && (
                  <p style={{ fontSize: '0.9rem', marginTop: '0.2rem', lineHeight: '1.3', margin: '0.2rem 0 0 0', padding: 0 }} className="no-break-inside">{edu.description}</p>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Skills */}
        {(data.skills?.length > 0 || data.technicalSkills?.length > 0 || data.softSkills?.length > 0) && (
          <section style={sectionStyle} className="resume-section skills-section">
            <h2 style={sectionHeaderStyle} className="no-break-after">Skills</h2>
            <div style={{ fontSize: '0.9rem', width: '100%' }} className="skills-content no-break-inside">
              {!useSkillCategories && data.skills && data.skills.length > 0 && (
                <p style={{ marginBottom: '0.4rem', margin: '0 0 0.4rem 0', padding: 0 }} className="no-break-inside">{data.skills.join(', ')}</p>
              )}
              {useSkillCategories && (
                <>
                  {data.skills && data.skills.length > 0 && (
                    <p style={{ marginBottom: '0.4rem', margin: '0 0 0.4rem 0', padding: 0 }} className="no-break-inside">General Skills: {data.skills.join(', ')}</p>
                  )}
                  {data.technicalSkills && data.technicalSkills.length > 0 && (
                    <div style={{ marginBottom: '0.4rem', width: '100%', display: 'block' }} className="technical-skills no-break-inside">
                      <h3 style={titleStyle} className="no-break-after">Technical Skills</h3>
                      <p style={{ margin: 0, padding: 0 }}>{data.technicalSkills.join(', ')}</p>
                    </div>
                  )}
                  {data.softSkills && data.softSkills.length > 0 && (
                    <div style={{ width: '100%', display: 'block' }} className="soft-skills no-break-inside">
                      <h3 style={titleStyle} className="no-break-after">Soft Skills</h3>
                      <p style={{ margin: 0, padding: 0 }}>{data.softSkills.join(', ')}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        )}

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <section style={sectionStyle} className="resume-section projects-section">
            <h2 style={sectionHeaderStyle} className="no-break-after">Projects</h2>
            {data.projects.map((project, index) => (
              <div key={project.id || index} style={itemStyle} className="project-item no-break-inside">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.2rem', width: '100%' }} className="no-break-after">
                  <h3 style={titleStyle} className="no-break-after">{project.name}</h3>
                  {(project.startDate || project.endDate) && (
                    <div style={{ fontSize: '0.85rem', color: colors.secondary || '#4b5563', textAlign: 'right', marginTop: '0.25rem' }}>
                      {project.startDate} - {project.current ? 'Present' : project.endDate || 'N/A'}
                    </div>
                  )}
                </div>
                {project.url && (
                  <a href={project.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: colors.primary || '#000000', textDecoration: 'none', marginBottom: '0.3rem', display: 'block', margin: '0 0 0.3rem 0', padding: 0, wordBreak: 'break-all' }}>{project.url.replace(/^https?:\/\/(www\.)?/, '')}</a>
                )}
                <p style={{ fontSize: '0.9rem', marginTop: '0.2rem', lineHeight: '1.3', margin: '0.2rem 0 0.2rem 0', padding: 0 }} className="no-break-inside">{project.description}</p>
                {project.technologies && project.technologies.length > 0 && (
                  <div style={{ marginTop: '0.2rem', fontSize: '0.85rem', margin: '0.2rem 0 0 0', padding: 0 }} className="no-break-inside">
                    <strong>Technologies:</strong> {project.technologies.join(', ')}
                  </div>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.2rem', width: '100%' }} className="no-break-after">
                  <div style={{ flex: '1 1 70%' }}>
                    <h3 style={titleStyle} className="no-break-after">{cert.name}</h3>
                    <h4 style={{ fontSize: '0.9rem', color: colors.secondary || '#4b5563', margin: 0, padding: 0 }} className="no-break-after">{cert.issuer}</h4>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: colors.secondary || '#4b5563', textAlign: 'right', marginTop: '0.25rem' }}>
                    {cert.date}
                    {cert.expiryDate && ` - ${cert.expiryDate}`}
                  </div>
                </div>
                {cert.description && (
                  <p style={{ fontSize: '0.9rem', marginTop: '0.2rem', lineHeight: '1.3', margin: '0.2rem 0 0 0', padding: 0 }} className="no-break-inside">{cert.description}</p>
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