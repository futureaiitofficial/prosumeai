import React from 'react';
import Link from 'next/link';

export default function SharedFooter() {
  return (
    <footer className="bg-slate-900 py-10 md:py-12 text-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between mb-6 md:mb-8">
          <div className="mb-8 md:mb-0">
            <div className="text-xl md:text-2xl font-bold mb-3 md:mb-4">ATScribe</div>
            <p className="text-slate-400 max-w-xs text-sm md:text-base">
              AI-powered resume builder, cover letter generator, and job application tracker designed specifically for students and early career professionals.
            </p>
            <p className="text-slate-500 mt-3 md:mt-4 text-xs md:text-sm">
              A product of Futureaiit Consulting Private Limited
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 md:gap-8">
            <div>
              <h4 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/#features" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm md:text-base">Features</Link></li>
                <li><Link href="/pricing" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm md:text-base">Pricing</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm md:text-base">About Us</Link></li>
                <li><Link href="/contact" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm md:text-base">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm md:text-base">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm md:text-base">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="pt-6 md:pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center">
          <div className="text-slate-500 text-xs md:text-sm text-center md:text-left">
            &copy; {new Date().getFullYear()} Futureaiit Consulting Private Limited. All rights reserved.
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-6">
            <a href="https://twitter.com/ATScribe" className="text-slate-500 hover:text-indigo-400 transition-colors">
              <span className="sr-only">Twitter</span>
              <svg className="h-5 w-5 md:h-6 md:w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
              </svg>
            </a>
            
            <a href="https://linkedin.com/company/ATScribe" className="text-slate-500 hover:text-indigo-400 transition-colors">
              <span className="sr-only">LinkedIn</span>
              <svg className="h-5 w-5 md:h-6 md:w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
} 