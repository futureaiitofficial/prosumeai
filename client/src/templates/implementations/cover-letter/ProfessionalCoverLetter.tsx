import React from "react";
import { CoverLetterTemplateProps } from "@/templates/types";

export const ProfessionalCoverLetter: React.FC<CoverLetterTemplateProps> = ({ 
  data, 
  customCss = "",
  setRef 
}) => {
  // Format date if provided, otherwise use current date
  const formattedDate = data.date || new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Use a static city/state if not provided
  const fullName = data.fullName || 'Your Name';
  const phone = data.phone || 'Phone Number';
  const email = data.email || 'Email Address';
  const address = data.address || 'City, State';
  const recipientName = data.recipientName || 'Hiring Manager';
  const companyName = data.companyName || 'Company Name';
  const content = data.content || 'Your cover letter content will appear here...';

  const containerStyle: React.CSSProperties = {
    width: '210mm',
    minHeight: '297mm',
    backgroundColor: '#ffffff',
    fontFamily: '"Calibri", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: '11pt',
    padding: '0',
    color: '#333333',
    margin: '0',
    boxSizing: 'border-box',
    lineHeight: '1.5',
    position: 'relative'
  };

  const headerBannerStyle: React.CSSProperties = {
    background: '#1e40af',
    color: '#ffffff',
    padding: '20pt 25pt',
    marginBottom: '25pt'
  };

  const nameStyle: React.CSSProperties = {
    fontSize: '24pt',
    fontWeight: '600',
    margin: '0 0 8pt 0',
    letterSpacing: '-0.02em',
    color: '#ffffff',
    textShadow: 'none'
  };

  const contactRowStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '15pt',
    fontSize: '10pt',
    color: '#ffffff'
  };

  const contactItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4pt',
    color: '#ffffff'
  };

  const contentAreaStyle: React.CSSProperties = {
    padding: '0 25pt 25pt 25pt'
  };

  const dateStyle: React.CSSProperties = {
    fontSize: '10pt',
    color: '#666666',
    marginBottom: '20pt',
    textAlign: 'right' as const
  };

  const recipientSectionStyle: React.CSSProperties = {
    marginBottom: '25pt',
    paddingLeft: '2pt'
  };

  const recipientNameStyle: React.CSSProperties = {
    fontSize: '12pt',
    fontWeight: '600',
    color: '#1e40af',
    margin: '0 0 3pt 0'
  };

  const companyNameStyle: React.CSSProperties = {
    fontSize: '11pt',
    color: '#555555',
    margin: '0'
  };

  const mainContentStyle: React.CSSProperties = {
    marginBottom: '25pt',
    lineHeight: '1.6',
    color: '#333333',
    fontSize: '11pt',
    whiteSpace: 'pre-wrap',
    textAlign: 'justify' as const
  };

  const footerStyle: React.CSSProperties = {
    marginTop: '25pt',
    paddingTop: '15pt',
    borderTop: '1pt solid #e5e7eb'
  };

  const closingStyle: React.CSSProperties = {
    fontSize: '11pt',
    color: '#333333',
    marginBottom: '15pt'
  };

  const signatureStyle: React.CSSProperties = {
    fontSize: '12pt',
    fontWeight: '600',
    color: '#1e40af'
  };

  return (
    <div
      ref={setRef}
      className="cover-letter-professional"
      style={containerStyle}
    >
      {/* Header Banner */}
      <div style={headerBannerStyle}>
        <h1 style={nameStyle}>{fullName}</h1>
        <div style={contactRowStyle} className="contact-info">
          <div style={contactItemStyle}>
            <span>Email: {email}</span>
          </div>
          <div style={contactItemStyle}>
            <span>Phone: {phone}</span>
          </div>
          <div style={contactItemStyle}>
            <span>Location: {address}</span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div style={contentAreaStyle}>
        {/* Date */}
        <div style={dateStyle}>
          {formattedDate}
        </div>

        {/* Recipient */}
        <section style={recipientSectionStyle}>
          <p style={recipientNameStyle}>{recipientName}</p>
          <p style={companyNameStyle}>{companyName}</p>
        </section>

        {/* Main Content */}
        <section style={mainContentStyle}>
          {content}
        </section>

        {/* Footer */}
        <footer style={footerStyle}>
          <p style={closingStyle}>Best regards,</p>
          <p style={signatureStyle}>{fullName}</p>
        </footer>
      </div>

      <style jsx global>{`
        ${customCss}
        
        /* Print optimizations */
        @media print {
          .cover-letter-professional {
            width: 210mm !important;
            height: 297mm !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Ensure proper page breaks */
          .cover-letter-professional header {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          .cover-letter-professional section {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          .cover-letter-professional footer {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
        
        /* Force color preservation */
        .cover-letter-professional,
        .cover-letter-professional * {
          color: inherit !important;
        }
        
        /* Specific color overrides for the banner */
        .cover-letter-professional h1 {
          color: #ffffff !important;
        }
        
        .cover-letter-professional .contact-info {
          color: #ffffff !important;
        }
        
        .cover-letter-professional .contact-info span {
          color: #ffffff !important;
        }
        
        /* Ensure links are properly styled */
        .cover-letter-professional a {
          color: #1e40af !important;
          text-decoration: none !important;
        }
        
        .cover-letter-professional a:hover {
          text-decoration: underline !important;
        }
        
        /* Responsive adjustments for screen preview */
        @media screen and (max-width: 768px) {
          .cover-letter-professional {
            font-size: 10pt !important;
          }
          
          .cover-letter-professional h1 {
            font-size: 20pt !important;
          }
        }
        
        /* Ensure text wrapping */
        .cover-letter-professional p,
        .cover-letter-professional div {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        /* Optimize spacing for single page */
        .cover-letter-professional {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
        }
      `}</style>
    </div>
  );
};

export default ProfessionalCoverLetter; 