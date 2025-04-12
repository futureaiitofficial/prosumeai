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

  return (
    <div
      ref={setRef}
      className="cover-letter-modern bg-white font-sans w-full text-black"
    >
      <div className="border-l-4 border-blue-500 h-full">
        <div className="px-10 py-10 max-w-[210mm] mx-auto">
          {/* Header with modern design */}
          <header className="mb-8 flex flex-col">
            <h1 className="text-2xl font-bold text-blue-700 mb-2">{fullName}</h1>
            <div className="text-sm text-gray-600 space-y-0.5 flex flex-col">
              <p>{email}</p>
              <p>{phone}</p>
              <p>{address}</p>
            </div>
            <div className="mt-4 text-sm text-gray-600">{formattedDate}</div>
          </header>

          {/* Recipient */}
          <section className="mb-8">
            <p className="font-medium text-blue-700">{recipientName}</p>
            <p className="text-gray-700">{companyName}</p>
          </section>

          {/* Content */}
          <section className="mb-8 whitespace-pre-wrap leading-relaxed text-gray-800">
            {content}
          </section>

          {/* Footer */}
          <footer>
            <p className="mb-6 text-gray-800">Sincerely,</p>
            <p className="font-medium text-blue-700">{fullName}</p>
          </footer>
        </div>
      </div>

      <style jsx global>{`
        ${customCss}
        
        .cover-letter-modern {
          font-family: 'Arial', sans-serif;
        }
        
        @media print {
          .cover-letter-modern {
            width: 210mm;
            height: 297mm;
            padding: 20mm 0;
          }
        }
        
        /* Force text to remain properly colored in all themes */
        .cover-letter-modern * {
          color: inherit !important;
        }
        
        .cover-letter-modern {
          color: #000000 !important;
        }
        
        .cover-letter-modern h1, 
        .cover-letter-modern .text-blue-700 {
          color: #1d4ed8 !important;
        }
        
        .cover-letter-modern .text-gray-600 {
          color: #4b5563 !important;
        }
        
        .cover-letter-modern .text-gray-700 {
          color: #374151 !important;
        }
        
        .cover-letter-modern .text-gray-800 {
          color: #1f2937 !important;
        }
      `}</style>
    </div>
  );
};

export default ModernCoverLetter; 