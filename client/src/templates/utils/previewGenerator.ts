import { toPng } from 'html-to-image';
import { type ResumeData } from '@/types/resume';
import { type BaseTemplate } from '../core/BaseTemplate';
import ReactDOM from 'react-dom';
import React from 'react';

// Sample data for preview generation
export const PREVIEW_DATA: ResumeData = {
  fullName: "John Smith",
  email: "john.smith@example.com",
  phone: "(555) 123-4567",
  location: "New York, NY",
  targetJobTitle: "Senior Software Engineer",
  summary: "Experienced software engineer with 8+ years of expertise in full-stack development, cloud architecture, and team leadership. Proven track record of delivering high-impact projects and mentoring junior developers.",
  workExperience: [
    {
      id: "1",
      position: "Senior Software Engineer",
      company: "Tech Solutions Inc.",
      startDate: "2020",
      endDate: "Present",
      current: true,
      description: "Lead developer for enterprise cloud applications",
      achievements: [
        "Increased system performance by 40% through architecture optimization",
        "Led a team of 5 developers in modernizing legacy applications",
        "Implemented CI/CD pipeline reducing deployment time by 60%"
      ]
    },
    {
      id: "2",
      position: "Software Developer",
      company: "Digital Innovations",
      startDate: "2018",
      endDate: "2020",
      current: false,
      description: "Full-stack developer for web applications",
      achievements: [
        "Developed responsive web applications using React and Node.js",
        "Reduced bug reports by 30% through comprehensive testing",
      ]
    }
  ],
  education: [
    {
      id: "1",
      institution: "University of Technology",
      degree: "B.S.",
      fieldOfStudy: "Computer Science",
      startDate: "2014",
      endDate: "2018",
      current: false,
      description: "Focus on Software Engineering and Data Structures"
    }
  ],
  skills: ["JavaScript", "TypeScript", "React", "Node.js", "Python"],
  technicalSkills: ["AWS", "Docker", "Kubernetes", "GraphQL", "PostgreSQL"],
  softSkills: ["Leadership", "Communication", "Problem Solving", "Team Collaboration"],
  projects: [
    {
      id: "1",
      name: "Cloud Migration Platform",
      description: "Led the development of an automated cloud migration tool",
      technologies: ["AWS", "Python", "Docker"],
      link: "https://github.com/example/cloud-migration"
    }
  ],
  certifications: [
    {
      id: "1",
      name: "AWS Certified Solutions Architect",
      issuer: "Amazon Web Services",
      dateObtained: "2022",
      expiryDate: "2025"
    }
  ]
};

export async function generateTemplatePreview(
  template: BaseTemplate,
  scale: number = 0.5
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create a root container that's positioned off-screen
      const rootContainer = document.createElement('div');
      rootContainer.style.position = 'fixed';
      rootContainer.style.top = '0';
      rootContainer.style.left = '0';
      rootContainer.style.width = '210mm';  // Fixed width
      rootContainer.style.backgroundColor = '#ffffff';
      rootContainer.style.zIndex = '-1000';
      document.body.appendChild(rootContainer);

      // Create the template container
      const templateContainer = document.createElement('div');
      templateContainer.style.width = '210mm';
      templateContainer.style.backgroundColor = '#ffffff';
      templateContainer.style.position = 'relative';
      templateContainer.style.transformOrigin = 'top left';
      rootContainer.appendChild(templateContainer);

      // Render the template
      const element = template.render(PREVIEW_DATA);
      ReactDOM.render(element, templateContainer);

      // Wait for fonts and images to load
      Promise.all([
        document.fonts.ready,
        new Promise(resolve => setTimeout(resolve, 1000))
      ]).then(async () => {
        try {
          // Get the actual rendered height
          const actualHeight = templateContainer.scrollHeight;
          
          // Set container height based on content
          templateContainer.style.height = `${actualHeight}px`;

          // Generate preview
          const dataUrl = await toPng(templateContainer, {
            width: Math.ceil(210 * 3.78 * scale), // A4 width in pixels
            height: Math.ceil(actualHeight * scale),
            quality: 1,
            pixelRatio: 2,
            backgroundColor: '#ffffff',
            style: {
              transform: `scale(${scale})`,
              transformOrigin: 'top left'
            }
          });

          // Cleanup
          ReactDOM.unmountComponentAtNode(templateContainer);
          document.body.removeChild(rootContainer);

          resolve(dataUrl);
        } catch (error) {
          console.error('Error generating preview:', error);
          ReactDOM.unmountComponentAtNode(templateContainer);
          document.body.removeChild(rootContainer);
          reject(error);
        }
      }).catch(error => {
        console.error('Error loading fonts:', error);
        ReactDOM.unmountComponentAtNode(templateContainer);
        document.body.removeChild(rootContainer);
        reject(error);
      });
    } catch (error) {
      console.error('Error setting up preview:', error);
      reject(error);
    }
  });
}