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

  return (
    <div
      ref={setRef}
      className="cover-letter-standard bg-white font-serif w-full text-black"
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      <div className="px-10 py-10 max-w-[210mm] mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-xl font-bold mb-1 text-black">{fullName}</h1>
          <div className="text-sm text-gray-700 space-y-0.5">
            <p>{email}</p>
            <p>{phone}</p>
            <p>{address}</p>
          </div>
          <div className="mt-4 text-sm text-gray-700">{formattedDate}</div>
        </header>

        {/* Recipient */}
        <section className="mb-8">
          <p className="font-medium text-black">{recipientName}</p>
          <p className="text-gray-700">{companyName}</p>
        </section>

        {/* Content */}
        <section className="mb-8 whitespace-pre-wrap leading-relaxed text-gray-900">
          {content}
        </section>

        {/* Footer */}
        <footer>
          <p className="mb-6 text-gray-900">Sincerely,</p>
          <p className="font-medium text-black">{fullName}</p>
        </footer>
      </div>

      <style jsx global>{`
        ${customCss}
        
        @media print {
          .cover-letter-standard {
            width: 210mm;
            height: 297mm;
            padding: 25mm 20mm;
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