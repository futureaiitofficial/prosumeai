import React from "react";
import { CoverLetterTemplateProps } from "@/templates/types";

export const ModernCoverLetter: React.FC<CoverLetterTemplateProps> = ({ 
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
    fontFamily: '"Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: '10pt',
    padding: '15mm 20mm',
    color: '#1a1a1a',
    margin: '0',
    boxSizing: 'border-box',
    lineHeight: '1.4',
    position: 'relative'
  };

  return (
    <div
      ref={setRef}
      className="cover-letter-modern"
      style={containerStyle}
    >
      {/* Accent bar */}
      <div 
        style={{
          position: 'absolute',
          left: '0',
          top: '0',
          bottom: '0',
          width: '4pt',
          background: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)',
          borderRadius: '0 2pt 2pt 0'
        }}
      ></div>
      
      {/* Header */}
      <header style={{ borderBottom: '3px solid #2563eb', paddingBottom: '8pt', marginBottom: '12pt' }}>
        <h1 style={{ fontSize: '20pt', fontWeight: '700', color: '#1e293b', margin: '0 0 4pt 0', letterSpacing: '-0.025em' }}>{fullName}</h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8pt', fontSize: '9pt', color: '#64748b', alignItems: 'center' }}>
          <span>{email}</span>
          <span style={{ color: '#cbd5e1', fontWeight: '300' }}>•</span>
          <span>{phone}</span>
          <span style={{ color: '#cbd5e1', fontWeight: '300' }}>•</span>
          <span>{address}</span>
        </div>
      </header>

      {/* Date */}
      <div style={{ fontSize: '9pt', color: '#64748b', marginTop: '12pt', marginBottom: '12pt' }}>
        {formattedDate}
      </div>

      {/* Recipient */}
      <section style={{ marginBottom: '16pt' }}>
        <p style={{ fontSize: '11pt', fontWeight: '600', color: '#1e293b', margin: '0 0 2pt 0' }}>{recipientName}</p>
        <p style={{ fontSize: '10pt', color: '#475569', margin: '0' }}>{companyName}</p>
      </section>

      {/* Content */}
      <section style={{ marginBottom: '16pt', lineHeight: '1.5', color: '#374151', fontSize: '10pt', whiteSpace: 'pre-wrap' }}>
        {content}
      </section>

      {/* Footer */}
      <footer style={{ marginTop: '16pt' }}>
        <p style={{ fontSize: '10pt', color: '#374151', marginBottom: '12pt' }}>Sincerely,</p>
        <p style={{ fontSize: '11pt', fontWeight: '600', color: '#1e293b' }}>{fullName}</p>
      </footer>

      <style jsx global>{`
        ${customCss}
        
        /* Print optimizations */
        @media print {
          .cover-letter-modern {
            width: 210mm !important;
            height: 297mm !important;
            padding: 15mm 20mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Ensure proper page breaks */
          .cover-letter-modern header {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          .cover-letter-modern section {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          .cover-letter-modern footer {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
        
        /* Force color preservation */
        .cover-letter-modern,
        .cover-letter-modern * {
          color: inherit !important;
        }
        
        /* Specific color overrides */
        .cover-letter-modern h1 {
          color: #1e293b !important;
        }
        
        /* Ensure links are properly styled */
        .cover-letter-modern a {
          color: #2563eb !important;
          text-decoration: none !important;
        }
        
        .cover-letter-modern a:hover {
          text-decoration: underline !important;
        }
        
        /* Responsive adjustments for screen preview */
        @media screen and (max-width: 768px) {
          .cover-letter-modern {
            padding: 10mm 15mm !important;
            font-size: 9pt !important;
          }
          
          .cover-letter-modern h1 {
            font-size: 18pt !important;
          }
        }
        
        /* Ensure text wrapping */
        .cover-letter-modern p,
        .cover-letter-modern div {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        /* Optimize spacing for single page */
        .cover-letter-modern {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
        }
      `}</style>
    </div>
  );
};

export default ModernCoverLetter; 