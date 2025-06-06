import { useRef } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import SharedHeader from '@/components/layouts/shared-header';
import SharedFooter from '@/components/layouts/SharedFooter';
import { useBranding } from '@/components/branding/branding-provider';

export default function AboutPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const branding = useBranding();
  
  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden">
      <Helmet>
        <title>About {branding.appName} | AI-Powered Resume Builder for Students & Job Seekers</title>
        <meta name="description" content={`${branding.appName} uses advanced AI technology to create professional resumes and cover letters that help students and early career professionals land more interviews and job offers.`} />
        <meta name="keywords" content="resume builder, AI resume, job application tools, ATS-friendly resume, cover letter generator, career tools, job search" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://${branding.appName}.com/about`} />
        <meta property="og:title" content={`About ${branding.appName} | AI-Powered Resume Builder for Students & Job Seekers`} />
        <meta property="og:description" content={`${branding.appName} uses advanced AI technology to create professional resumes and cover letters that help students and early career professionals land more interviews and job offers.`} />
        <meta property="og:image" content={`https://${branding.appName}.com/images/about-og-image.jpg`} />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={`https://${branding.appName}.com/about`} />
        <meta property="twitter:title" content={`About ${branding.appName} | AI-Powered Resume Builder for Students & Job Seekers`} />
        <meta property="twitter:description" content={`${branding.appName} uses advanced AI technology to create professional resumes and cover letters that help students and early career professionals land more interviews and job offers.`} />
        <meta property="twitter:image" content={`https://${branding.appName}.com/images/about-og-image.jpg`} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={`https://${branding.appName}.com/about`} />
      </Helmet>
      
      <SharedHeader isLandingPage={false} />

      {/* Hero Section with Gradient Background */}
      <section className="relative min-h-[70vh] flex items-center justify-center bg-gradient-to-b from-indigo-950 via-indigo-900 to-purple-900 overflow-hidden py-16 md:py-0">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        
        <div className="container mx-auto px-4 pt-20 md:pt-0">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 md:mb-6">
              About <span className="text-indigo-400">{branding.appName}</span>
            </h1>
            <p className="text-lg md:text-2xl text-indigo-200 mb-8">
              The AI-powered platform designed to help students and professionals land interviews at top companies with stunning resumes and personalized cover letters.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/register">
                <a className="px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-md transition-colors inline-block text-lg">
                  Get Started For Free
                </a>
              </Link>
              <a href="#features" className="px-8 py-4 bg-transparent border border-white hover:bg-white/10 text-white font-medium rounded-md transition-colors inline-block text-lg">
                See How It Works
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-2 md:mb-4 inline-block">OUR STORY</span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                From Frustration to <span className="text-indigo-600">Innovation</span>
              </h2>

              <p className="text-slate-600 mb-6">
                {branding.appName} was born from our founder's personal struggle with the job application process. After spending thousands of dollars on resume services and countless hours customizing applications, the frustration was real: existing tools were expensive, inefficient, and not designed for those starting their careers.
              </p>
              <p className="text-slate-600 mb-6">
                Our mission became clear: build affordable AI-powered tools specifically for students and early career professionals that would democratize access to high-quality resume building, ATS optimization, and job application tracking.
              </p>
              <p className="text-slate-600 mb-6">
                Today, we're proud to have helped over 15,000 job seekers land interviews and secure positions at companies they love, all while making these powerful tools accessible to those who need them most.
              </p>
              <p className="text-slate-700">
                {branding.appName} is one of the premier products from Futureaiit Consulting Pvt.Ltd.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-1 lg:order-2"
            >
              <div className="rounded-xl overflow-hidden shadow-xl">
                <img 
                  src="/images/about-story.svg" 
                  alt={`The journey of ${branding.appName}`} 
                  className="w-full h-auto"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="bg-slate-50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-2 md:mb-4 inline-block">OUR MISSION</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              Empowering the Next Generation of Professionals
            </h2>
            <p className="text-slate-600 mb-3">
              We believe everyone deserves access to tools that help them showcase their true potential to employers. Our mission is to level the playing field in the job market by providing affordable, AI-powered resume and job application tools specifically designed for students and early career professionals.
            </p>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white p-8 rounded-lg shadow-md"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-6 text-indigo-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Accessibility</h3>
              <p className="text-slate-600">
                Make professional-grade resume tools and career resources accessible to students and early career professionals at an affordable price point.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white p-8 rounded-lg shadow-md"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-6 text-indigo-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Innovation</h3>
              <p className="text-slate-600">
                Continuously enhance our AI technology to provide the most relevant and effective resume optimization for modern job applications.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white p-8 rounded-lg shadow-md"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-6 text-indigo-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Community</h3>
              <p className="text-slate-600">
                Build a supportive community of job seekers who can learn from each other and share success stories throughout their career journey.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose ATScribe Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-2 md:mb-4 inline-block">WHY CHOOSE US</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              Transform Your Job Search With {branding.appName}
            </h2>
            <p className="text-slate-600">
              Our AI-powered platform is specifically designed to help students and early career professionals stand out in competitive job markets with professionally crafted resumes and cover letters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-indigo-50 p-8 rounded-xl"
            >
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 text-indigo-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4">AI-Powered Intelligence</h3>
              <p className="text-slate-700">
                Our advanced AI analyzes job descriptions to tailor your resume, highlighting the most relevant skills and experiences that match what employers are looking for.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-indigo-50 p-8 rounded-xl"
            >
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 text-indigo-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4">ATS-Optimized Templates</h3>
              <p className="text-slate-700">
                Our professionally designed templates are tested against leading Applicant Tracking Systems to ensure your resume passes the first digital screening.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-indigo-50 p-8 rounded-xl"
            >
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 text-indigo-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4">Time-Saving Tools</h3>
              <p className="text-slate-700">
                Create professional-quality resumes and cover letters in minutes, not hours. Our intuitive platform streamlines the entire job application process.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-indigo-50 p-8 rounded-xl"
            >
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 text-indigo-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4">All-in-One Solution</h3>
              <p className="text-slate-700">
                From resume building to cover letter generation and job application tracking, {branding.appName} provides everything you need to manage your entire job search in one platform.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Success Stats Section */}
      <section className="bg-indigo-900 py-16 md:py-24 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-2 md:mb-4 inline-block">OUR VISION</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              What We're Building
            </h2>
            <p className="text-indigo-200 mb-3">
              {branding.appName} is designed with ambitious goals to transform how students and early career professionals approach their job search.
            </p>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-indigo-800/50 backdrop-blur-sm p-8 rounded-xl text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">Reach</div>
              <p className="text-indigo-300 text-lg">Thousands of Job Seekers</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-indigo-800/50 backdrop-blur-sm p-8 rounded-xl text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">Increase</div>
              <p className="text-indigo-300 text-lg">Interview Opportunities</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-indigo-800/50 backdrop-blur-sm p-8 rounded-xl text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">Maximize</div>
              <p className="text-indigo-300 text-lg">ATS Pass Rates</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-indigo-800/50 backdrop-blur-sm p-8 rounded-xl text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">Provide</div>
              <p className="text-indigo-300 text-lg">Professional Templates</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Join Our Mission CTA */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 py-12 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6">
            Ready to Transform Your Job Search?
          </h2>
          <p className="text-base md:text-xl text-indigo-100 mb-8 md:mb-10 max-w-2xl mx-auto">
            Be among the first to experience {branding.appName}'s powerful AI tools designed to help you create winning resumes and land your dream job.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/register">
              <a className="px-6 md:px-8 py-3 bg-white hover:bg-indigo-50 text-indigo-600 font-medium rounded-md transition-colors inline-block">
                Start For Free
              </a>
            </Link>
            <a href={`mailto:contact@${branding.appName}.com`} className="px-6 md:px-8 py-3 bg-transparent border border-white hover:bg-white/10 text-white font-medium rounded-md transition-colors inline-block">
              Contact Us
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <SharedFooter />
    </div>
  );
} 