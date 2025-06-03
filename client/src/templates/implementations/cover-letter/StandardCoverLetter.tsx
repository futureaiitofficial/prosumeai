import React from "react";
import { CoverLetterTemplateProps } from "@/templates/types";

export const StandardCoverLetter: React.FC<CoverLetterTemplateProps> = ({ 
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
  // Ensure we're only using the content field for the main content
  const content = data.content || 'Your cover letter content will appear here...';

  const containerStyle: React.CSSProperties = {
    width: '210mm',
    minHeight: '297mm',
    backgroundColor: '#ffffff',
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: '10pt',
    padding: '25mm 20mm',
    color: '#000000',
    margin: '0',
    boxSizing: 'border-box',
    lineHeight: '1.4',
    position: 'relative'
  };

  return (
    <div
      ref={setRef}
      className="cover-letter-standard"
      style={containerStyle}
    >
      {/* Header */}
      <header style={{ marginBottom: '20pt' }}>
        <h1 style={{ fontSize: '16pt', fontWeight: 'bold', marginBottom: '4pt', color: '#000000' }}>{fullName}</h1>
        <div style={{ fontSize: '10pt', color: '#374151' }}>
          <p style={{ margin: '0 0 2pt 0' }}>{email}</p>
          <p style={{ margin: '0 0 2pt 0' }}>{phone}</p>
          <p style={{ margin: '0 0 2pt 0' }}>{address}</p>
        </div>
        <div style={{ marginTop: '12pt', fontSize: '10pt', color: '#374151' }}>{formattedDate}</div>
      </header>

      {/* Recipient */}
      <section style={{ marginBottom: '20pt' }}>
        <p style={{ fontWeight: '600', color: '#000000', margin: '0 0 2pt 0' }}>{recipientName}</p>
        <p style={{ color: '#374151', margin: '0' }}>{companyName}</p>
      </section>

      {/* Content */}
      <section style={{ marginBottom: '20pt', whiteSpace: 'pre-wrap', lineHeight: '1.5', color: '#111827' }}>
        {content}
      </section>

      {/* Footer */}
      <footer>
        <p style={{ marginBottom: '16pt', color: '#111827' }}>Sincerely,</p>
        <p style={{ fontWeight: '600', color: '#000000' }}>{fullName}</p>
      </footer>

      <style jsx global>{`
        ${customCss}
        
        @media print {
          .cover-letter-standard {
            width: 210mm !important;
            height: 297mm !important;
            padding: 25mm 20mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        
        /* Force text to remain black in all themes */
        .cover-letter-standard * {
          color: inherit !important;
        }
        
        .cover-letter-standard {
          color: #000000 !important;
        }
      `}</style>
    </div>
  );
};

export default StandardCoverLetter; 