import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { generateLatexResume } from './simple-templates';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_DIR = path.join(__dirname, '../temp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Creates a simple PDF version of the resume
 * This is a fallback when a full LaTeX environment is not available
 */
export async function createSimplePDF(resumeData: any): Promise<string> {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
    
    // Get the standard fonts
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    
    const { width, height } = page.getSize();
    const margin = 50;
    
    // Extract resume data
    const { 
      fullName, 
      email, 
      phone, 
      location,
      summary,
      workExperience = [],
      education = [],
      skills = [],
      technicalSkills = [],
      softSkills = [],
    } = resumeData;
    
    let yPosition = height - margin;
    
    // Add heading
    page.drawText(fullName || 'Your Name', {
      x: margin,
      y: yPosition,
      size: 24,
      font: boldFont,
    });
    
    yPosition -= 30;
    
    // Add contact info
    const contactInfo = `${email || 'email@example.com'} | ${phone || 'Phone'} | ${location || 'Location'}`;
    page.drawText(contactInfo, {
      x: margin,
      y: yPosition,
      size: 10,
      font: font,
    });
    
    yPosition -= 30;
    
    // Add summary
    if (summary) {
      page.drawText('SUMMARY', {
        x: margin,
        y: yPosition,
        size: 14,
        font: boldFont,
      });
      
      yPosition -= 20;
      
      // Handle text wrapping for summary
      const words = summary.split(' ');
      let line = '';
      const maxWidth = width - (margin * 2);
      
      for (const word of words) {
        const testLine = line + (line ? ' ' : '') + word;
        const lineWidth = font.widthOfTextAtSize(testLine, 10);
        
        if (lineWidth > maxWidth) {
          page.drawText(line, {
            x: margin,
            y: yPosition,
            size: 10,
            font: font,
          });
          
          yPosition -= 15;
          line = word;
        } else {
          line = testLine;
        }
      }
      
      if (line) {
        page.drawText(line, {
          x: margin,
          y: yPosition,
          size: 10,
          font: font,
        });
        
        yPosition -= 25;
      }
    }
    
    // Add skills section
    if (technicalSkills.length || softSkills.length || skills.length) {
      page.drawText('SKILLS', {
        x: margin,
        y: yPosition,
        size: 14,
        font: boldFont,
      });
      
      yPosition -= 20;
      
      if (technicalSkills.length) {
        page.drawText(`Technical Skills: ${technicalSkills.join(', ')}`, {
          x: margin,
          y: yPosition,
          size: 10,
          font: font,
        });
        
        yPosition -= 15;
      }
      
      if (softSkills.length) {
        page.drawText(`Soft Skills: ${softSkills.join(', ')}`, {
          x: margin,
          y: yPosition,
          size: 10,
          font: font,
        });
        
        yPosition -= 15;
      }
      
      if (skills.length) {
        page.drawText(`Other Skills: ${skills.join(', ')}`, {
          x: margin,
          y: yPosition,
          size: 10,
          font: font,
        });
        
        yPosition -= 25;
      }
    }
    
    // Add experience section
    if (workExperience.length) {
      page.drawText('EXPERIENCE', {
        x: margin,
        y: yPosition,
        size: 14,
        font: boldFont,
      });
      
      yPosition -= 20;
      
      for (const exp of workExperience) {
        page.drawText(`${exp.position || 'Position'} at ${exp.company || 'Company'}`, {
          x: margin,
          y: yPosition,
          size: 12,
          font: boldFont,
        });
        
        const dateRange = `${formatDate(exp.startDate)} - ${exp.current ? 'Present' : formatDate(exp.endDate)}`;
        const dateWidth = font.widthOfTextAtSize(dateRange, 10);
        
        page.drawText(dateRange, {
          x: width - margin - dateWidth,
          y: yPosition,
          size: 10,
          font: font,
        });
        
        yPosition -= 15;
        
        page.drawText(exp.location || '', {
          x: margin,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0.5, 0.5, 0.5),
        });
        
        yPosition -= 15;
        
        if (exp.achievements && exp.achievements.length) {
          for (const achievement of exp.achievements) {
            // Handle text wrapping for achievements
            const words = achievement.split(' ');
            let line = '• ';
            const maxWidth = width - (margin * 2);
            const indent = 10;
            
            for (const word of words) {
              const testLine = line + (line === '• ' ? '' : ' ') + word;
              const lineWidth = font.widthOfTextAtSize(testLine, 10);
              
              if (lineWidth > maxWidth) {
                page.drawText(line, {
                  x: margin + indent,
                  y: yPosition,
                  size: 10,
                  font: font,
                });
                
                yPosition -= 15;
                line = '  ' + word; // indent continuation lines
              } else {
                line = testLine;
              }
            }
            
            if (line) {
              page.drawText(line, {
                x: margin + indent,
                y: yPosition,
                size: 10,
                font: font,
              });
              
              yPosition -= 15;
            }
          }
        } else if (exp.description) {
          // Handle text wrapping for description
          const words = exp.description.split(' ');
          let line = '';
          const maxWidth = width - (margin * 2);
          
          for (const word of words) {
            const testLine = line + (line ? ' ' : '') + word;
            const lineWidth = font.widthOfTextAtSize(testLine, 10);
            
            if (lineWidth > maxWidth) {
              page.drawText(line, {
                x: margin,
                y: yPosition,
                size: 10,
                font: font,
              });
              
              yPosition -= 15;
              line = word;
            } else {
              line = testLine;
            }
          }
          
          if (line) {
            page.drawText(line, {
              x: margin,
              y: yPosition,
              size: 10,
              font: font,
            });
            
            yPosition -= 15;
          }
        }
        
        yPosition -= 10; // space between experiences
      }
    }
    
    // Add education section
    if (education.length) {
      yPosition -= 10;
      
      page.drawText('EDUCATION', {
        x: margin,
        y: yPosition,
        size: 14,
        font: boldFont,
      });
      
      yPosition -= 20;
      
      for (const edu of education) {
        page.drawText(edu.institution || 'Institution', {
          x: margin,
          y: yPosition,
          size: 12,
          font: boldFont,
        });
        
        const dateRange = `${formatDate(edu.startDate)} - ${edu.current ? 'Present' : formatDate(edu.endDate)}`;
        const dateWidth = font.widthOfTextAtSize(dateRange, 10);
        
        page.drawText(dateRange, {
          x: width - margin - dateWidth,
          y: yPosition,
          size: 10,
          font: font,
        });
        
        yPosition -= 15;
        
        const degreeText = `${edu.degree || 'Degree'}${edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''}`;
        page.drawText(degreeText, {
          x: margin,
          y: yPosition,
          size: 10,
          font: font,
        });
        
        yPosition -= 20;
      }
    }
    
    const timestamp = Date.now();
    const fileName = `resume_${timestamp}.pdf`;
    const filePath = path.join(TEMP_DIR, fileName);
    
    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(filePath, pdfBytes);
    
    return filePath;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

/**
 * Creates a LaTeX file and returns its content
 */
export async function generateLatexFile(resumeData: any, template: string = 'latex'): Promise<string> {
  try {
    const latexContent = generateLatexResume(resumeData, template);
    const timestamp = Date.now();
    const fileName = `resume_${timestamp}.tex`;
    const filePath = path.join(TEMP_DIR, fileName);
    
    await fs.writeFile(filePath, latexContent);
    
    return filePath;
  } catch (error) {
    console.error('Error generating LaTeX file:', error);
    throw new Error('Failed to generate LaTeX file');
  }
}

/**
 * Formats a date for display in the PDF
 */
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Present';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  } catch (e) {
    return dateString;
  }
}