import React, { useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { motion, useInView } from 'framer-motion';
import { Helmet } from 'react-helmet';
import SharedHeader from '@/components/layouts/shared-header';
import SharedFooter from '@/components/layouts/SharedFooter';
import { useBranding } from '@/components/branding/branding-provider';
import { FileText, Sparkles, CheckCircle, Target, Zap, ArrowRight, Download, Briefcase, Bot, Search, Shield, Award, MessageSquare, Brain, TrendingUp, Users } from 'lucide-react';

export default function CoverLetterAI() {
  const branding = useBranding();
  const containerRef = useRef<HTMLDivElement>(null);
  const heroButtonsRef = useRef<HTMLDivElement>(null);
  const isButtonsInView = useInView(heroButtonsRef, { once: false });
  
  // Animation properties
  const sectionAnimationProps = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  // Floating animation
  const floatingAnimation = {
    y: [0, -10, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      repeatType: "reverse" as const,
      ease: "easeInOut"
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>AI Cover Letter Builder - Create Personalized Cover Letters That Land Jobs</title>
        <meta name="description" content="Build professional, tailored cover letters with AI. Analyze job descriptions, highlight your relevant skills, and create compelling cover letters that catch hiring managers' attention." />
        <meta name="keywords" content="cover letter builder, AI cover letter, job application, personalized cover letter, professional cover letter, cover letter templates" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="/cover-letter-ai" />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content="AI Cover Letter Builder - Create Personalized Cover Letters That Land Jobs" />
        <meta property="og:description" content="Build professional, tailored cover letters with AI. Analyze job descriptions, highlight your relevant skills, and create compelling cover letters that catch hiring managers' attention." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="/cover-letter-ai" />
        <meta property="og:image" content="/images/cover-letter-og.jpg" />
        
        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AI Cover Letter Builder - Create Personalized Cover Letters That Land Jobs" />
        <meta name="twitter:description" content="Build professional, tailored cover letters with AI. Analyze job descriptions, highlight your relevant skills, and create compelling cover letters that catch hiring managers' attention." />
        <meta name="twitter:image" content="/images/cover-letter-og.jpg" />
        
        {/* Schema.org structured data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": `${branding.appName} AI Cover Letter Builder`,
            "description": "AI-powered cover letter builder that creates personalized cover letters",
            "url": "/cover-letter-ai",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "featureList": [
              "AI-powered cover letter personalization",
              "Job description analysis", 
              "Professional formatting",
              "Multi-format exports",
              "Intelligent content generation"
            ]
          })}
        </script>
      </Helmet>

      <SharedHeader />
      
      {/* Hero Section with Enhanced Design */}
      <motion.section 
        className="relative flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-900 to-blue-900 overflow-hidden pt-20 min-h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
        <motion.div 
            className="absolute w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-3xl -left-32 -top-32"
            animate={floatingAnimation}
          />
        <motion.div 
            className="absolute w-[400px] h-[400px] rounded-full bg-purple-500/15 blur-3xl -right-16 top-32"
          animate={{ 
              ...floatingAnimation,
              transition: { ...floatingAnimation.transition, delay: 1 }
          }}
          />
        </div>

        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center z-10 pt-16 md:pt-0">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:w-1/2 text-center lg:text-left lg:pr-12 mb-10 lg:mb-0"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-4 py-2 bg-indigo-600/20 border border-indigo-400/30 rounded-full text-indigo-200 text-sm font-medium mb-6"
            >
              <Bot className="w-4 h-4 mr-2" />
              AI-POWERED COVER LETTER BUILDER
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
            >
              Make Your{" "}
              <motion.span 
                className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 inline-block"
                animate={{ 
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  ease: "linear"
                }}
                style={{
                  backgroundSize: "200% 200%"
                }}
              >
                First Impression
              </motion.span>{" "}
              Count
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-lg md:text-xl text-indigo-200 mb-8 max-w-2xl mx-auto lg:mx-0"
            >
              Create personalized, professional cover letters in minutes with our AI-powered platform. 
              Analyze job descriptions, highlight your relevant skills, and make a memorable impression on hiring managers.
            </motion.p>
            
            <motion.div 
              ref={heroButtonsRef}
              className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <Link href="/register">
                <motion.a 
                  className="inline-flex items-center justify-center px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-indigo-600/30"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </motion.a>
              </Link>
              
              <Link href="/cover-letter-builder">
                <motion.a 
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-indigo-400 text-indigo-200 hover:bg-indigo-800/30 hover:border-indigo-300 font-semibold rounded-lg transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Brain className="w-5 h-5 mr-2" />
                  Try the Builder
                </motion.a>
              </Link>
            </motion.div>

            {/* Feature Highlights */}
            <motion.div 
              className="mt-12 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <div className="flex items-center text-indigo-200">
                <FileText className="w-5 h-5 mr-2" />
                <span className="font-medium">Job-Specific Content</span>
              </div>
              <div className="flex items-center text-indigo-200">
                <Zap className="w-5 h-5 mr-2" />
                <span className="font-medium">AI-Powered Writing</span>
              </div>
            </motion.div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:w-1/2 w-full max-w-2xl mx-auto z-10"
              >
                <CoverLetterInterfaceSVG />
          </motion.div>
        </div>
      </motion.section>

      {/* AI Features Section */}
      <motion.section 
        className="py-20 bg-white relative overflow-hidden"
        {...sectionAnimationProps}
      >
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm font-semibold uppercase tracking-wider text-indigo-600 mb-4 inline-block">
              AI-POWERED INTELLIGENCE
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Smart Cover Letter Creation
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Our advanced AI analyzes job descriptions, extracts key requirements, and helps you create personalized cover letters that highlight your most relevant skills and experiences.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Job Analysis */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -5 }}
              className="group bg-gradient-to-br from-slate-50 to-indigo-50 p-8 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all duration-300 hover:shadow-xl"
            >
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Job Description Analysis</h3>
              <p className="text-slate-600 mb-4">
                Our AI analyzes job descriptions to identify key requirements, skills, and qualifications the employer is looking for.
              </p>
              <JobAnalysisSVG />
            </motion.div>
            
            {/* Content Generation */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -5 }}
              className="group bg-gradient-to-br from-slate-50 to-purple-50 p-8 rounded-2xl border border-slate-200 hover:border-purple-200 transition-all duration-300 hover:shadow-xl"
            >
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">AI Content Generation</h3>
              <p className="text-slate-600 mb-4">
                Generate professional, personalized cover letter content that highlights your most relevant skills and experience for the specific job.
              </p>
              <ContentGenerationSVG />
            </motion.div>
            
            {/* Personalization */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -5 }}
              className="group bg-gradient-to-br from-slate-50 to-emerald-50 p-8 rounded-2xl border border-slate-200 hover:border-emerald-200 transition-all duration-300 hover:shadow-xl"
            >
              <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Smart Personalization</h3>
              <p className="text-slate-600 mb-4">
                Each cover letter is uniquely tailored to the specific job and company, ensuring maximum relevance and impact.
              </p>
              <PersonalizationSVG />
            </motion.div>
            
            {/* Professional Formatting */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -5 }}
              className="group bg-gradient-to-br from-slate-50 to-blue-50 p-8 rounded-2xl border border-slate-200 hover:border-blue-200 transition-all duration-300 hover:shadow-xl"
            >
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Professional Formatting</h3>
              <p className="text-slate-600 mb-4">
                Choose from multiple professional templates designed to impress hiring managers across different industries and roles.
              </p>
              <FormattingSVG />
            </motion.div>
            
            {/* Content Enhancement */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ y: -5 }}
              className="group bg-gradient-to-br from-slate-50 to-amber-50 p-8 rounded-2xl border border-slate-200 hover:border-amber-200 transition-all duration-300 hover:shadow-xl"
            >
              <div className="w-16 h-16 bg-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Content Enhancement</h3>
              <p className="text-slate-600 mb-4">
                Enhance your existing content with our AI to improve language, highlight achievements, and create a more compelling narrative.
              </p>
              <EnhancementSVG />
            </motion.div>
            
            {/* Export Options */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              whileHover={{ y: -5 }}
              className="group bg-gradient-to-br from-slate-50 to-rose-50 p-8 rounded-2xl border border-slate-200 hover:border-rose-200 transition-all duration-300 hover:shadow-xl"
            >
              <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Download className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Multiple Export Formats</h3>
              <p className="text-slate-600 mb-4">
                Download your cover letter as a PDF document with perfect formatting for job applications, ready to impress recruiters.
              </p>
              <ExportSVG />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* How It Works Section */}
      <motion.section 
        className="bg-gradient-to-br from-slate-900 to-indigo-900 py-20 text-white relative overflow-hidden"
        {...sectionAnimationProps}
      >
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              How Our AI Creates Perfect Cover Letters
            </h2>
            <p className="text-xl text-indigo-200 max-w-3xl mx-auto">
              Our intelligent 4-step process makes it easy to create personalized, professional cover letters that get results.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Paste Job Description",
                description: "Simply paste the job posting you're applying for. Our AI instantly analyzes requirements and key qualifications.",
                icon: <FileText className="w-8 h-8" />
              },
              {
                step: "02", 
                title: "AI Analyzes Requirements",
                description: "Advanced algorithms extract critical keywords, required skills, and company culture insights from the posting.",
                icon: <Brain className="w-8 h-8" />
              },
              {
                step: "03",
                title: "Generate Personalized Content",
                description: "AI creates tailored content that highlights your relevant experience and demonstrates perfect job fit.",
                icon: <Zap className="w-8 h-8" />
              },
              {
                step: "04",
                title: "Download & Apply",
                description: "Get your professionally formatted cover letter ready to submit with your application and stand out.",
                icon: <Download className="w-8 h-8" />
              }
            ].map((item, index) => (
            <motion.div 
                key={index}
                className="relative"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
          >
                <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <div className="text-6xl font-bold text-indigo-400/30 mb-4">{item.step}</div>
                  <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 text-white">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                  <p className="text-indigo-200">{item.description}</p>
                </div>
                {index < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-indigo-400" />
                  </div>
                )}
          </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Final CTA Section */}
      <motion.section 
        className="bg-gradient-to-r from-indigo-600 to-purple-600 py-20 relative overflow-hidden"
        {...sectionAnimationProps}
      >
        <motion.div 
          className="absolute -right-32 -top-32 w-[300px] h-[300px] rounded-full bg-purple-500/20 blur-3xl"
          animate={floatingAnimation}
        />
        
        <motion.div 
          className="absolute -left-32 -bottom-32 w-[400px] h-[400px] rounded-full bg-indigo-500/20 blur-3xl"
          animate={{ 
            ...floatingAnimation,
            transition: { ...floatingAnimation.transition, delay: 2 }
          }}
        />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div 
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Create Your Perfect Cover Letter?
            </h2>
            <p className="text-xl text-indigo-100 mb-10 max-w-3xl mx-auto">
              Create personalized, professional cover letters with our powerful AI tools. Impress employers and land more interviews.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6 mb-12">
              <Link href="/register">
                <motion.a 
                  className="inline-flex items-center justify-center px-10 py-4 bg-white text-indigo-600 font-bold rounded-lg hover:bg-indigo-50 transition-all duration-300 shadow-xl"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Sparkles className="w-6 h-6 mr-3" />
                  Start Building Free
                  <ArrowRight className="w-6 h-6 ml-3" />
                </motion.a>
              </Link>
              <Link href="/cover-letter-builder">
                <motion.a 
                  className="inline-flex items-center justify-center px-10 py-4 bg-transparent border-2 border-white hover:bg-white/10 text-white font-bold rounded-lg transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Try the Builder
                </motion.a>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { title: "AI-Powered", subtitle: "Smart content generation" },
                { title: "Personalized", subtitle: "Tailored to each job" },
                { title: "Professional", subtitle: "Industry-standard formats" },
                { title: "Time-Saving", subtitle: "Create in minutes" }
              ].map((feature, index) => (
              <motion.div 
                  key={index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm p-4 rounded-lg"
              >
                  <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
                  <p className="text-indigo-200 text-sm">{feature.subtitle}</p>
              </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.section>

      <SharedFooter />
    </div>
  );
}

// Enhanced SVG Components with modern design

function CoverLetterInterfaceSVG() {
  return (
    <motion.div 
      className="relative max-w-2xl mx-auto"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.5 }}
    >
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-white/30"></div>
            <div className="w-3 h-3 rounded-full bg-white/30"></div>
            <div className="w-3 h-3 rounded-full bg-white/30"></div>
            <div className="ml-4 text-white font-medium">AI Cover Letter Builder</div>
          </div>
        </div>
      
        {/* Interface Content */}
        <div className="p-6 space-y-4">
          {/* AI Analysis Panel */}
          <motion.div 
            className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5 }}
          >
            <div className="flex items-center space-x-2 mb-3">
              <Brain className="w-5 h-5 text-indigo-600" />
              <span className="font-semibold text-indigo-900">AI Job Analysis</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Keywords Extracted</span>
                <span className="text-sm font-medium text-indigo-600">18 found</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div 
                  className="bg-indigo-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "90%" }}
                  transition={{ delay: 2, duration: 1 }}
                ></motion.div>
              </div>
            </div>
          </motion.div>

          {/* Content Generation */}
          <motion.div 
            className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-lg border border-emerald-200"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.7 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-emerald-900">AI Content</span>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">Generated</span>
            </div>
            <div className="space-y-2">
              {[
                "Dear Hiring Manager,",
                "I am excited to apply for the Software Engineer position...",
                "My experience with React and TypeScript..."
              ].map((line, i) => (
                <motion.div 
                  key={i}
                  className="h-2 bg-emerald-100 rounded"
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2, duration: 0.8 }}
                  style={{ width: i === 0 ? '100%' : i === 1 ? '90%' : '95%' }}
                ></motion.div>
              ))}
            </div>
          </motion.div>
      
          {/* Export Options */}
          <motion.div 
            className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2 }}
          >
            <div className="flex items-center space-x-2 mb-3">
              <Download className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">Export Ready</span>
            </div>
            <div className="flex space-x-2">
              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">PDF</div>
              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">DOCX</div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// Individual feature SVG components
const JobAnalysisSVG = () => (
  <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
    <div className="text-xs text-gray-600 mb-3">Key Requirements Identified:</div>
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs">Technical Skills</span>
        <div className="w-16 h-1 bg-indigo-200 rounded"><div className="w-12 h-1 bg-indigo-600 rounded"></div></div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs">Experience Level</span>
        <div className="w-16 h-1 bg-indigo-200 rounded"><div className="w-14 h-1 bg-indigo-600 rounded"></div></div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs">Soft Skills</span>
        <div className="w-16 h-1 bg-indigo-200 rounded"><div className="w-10 h-1 bg-indigo-600 rounded"></div></div>
      </div>
    </div>
  </div>
);

const ContentGenerationSVG = () => (
  <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
    <div className="text-xs text-gray-600 mb-2">AI Generated Paragraph:</div>
    <div className="space-y-2">
      {[
        "With 5+ years of experience in software development...",
        "My expertise in React and Node.js aligns perfectly...",
        "I am excited about the opportunity to contribute..."
      ].map((line, i) => (
        <motion.div 
          key={i}
          className="h-2 bg-purple-100 rounded"
          initial={{ width: 0 }}
          whileInView={{ width: "100%" }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.2, duration: 0.8 }}
          style={{ width: i === 0 ? '100%' : i === 1 ? '90%' : '95%' }}
        ></motion.div>
      ))}
    </div>
  </div>
);

const PersonalizationSVG = () => (
  <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
    <div className="text-xs text-gray-600 mb-3">Personalization Score:</div>
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs">Job Match</span>
      <span className="text-sm font-bold text-emerald-600">95%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <motion.div 
        className="bg-emerald-600 h-2 rounded-full"
        initial={{ width: 0 }}
        whileInView={{ width: "95%" }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, delay: 0.5 }}
      ></motion.div>
    </div>
    <div className="mt-2 text-xs text-gray-600">
      ✓ Company specific • ✓ Role tailored • ✓ Skills matched
    </div>
  </div>
);

const FormattingSVG = () => (
  <div className="mt-4 grid grid-cols-3 gap-2">
    {['Professional', 'Modern', 'Classic'].map((template, i) => (
      <motion.div 
        key={template}
        className={`aspect-[3/4] rounded border-2 ${
          i === 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
        } flex flex-col p-2`}
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.1 }}
      >
        <div className="text-xs font-medium text-center mb-1">{template}</div>
        <div className="flex-1 bg-white rounded p-1">
          <div className="space-y-1">
            <div className="h-1 bg-gray-300 rounded"></div>
            <div className="h-1 bg-gray-200 rounded w-3/4"></div>
            <div className="h-1 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </motion.div>
    ))}
  </div>
);

const EnhancementSVG = () => (
  <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
        <span className="text-xs text-gray-600">Grammar Enhancement</span>
        <CheckCircle className="w-3 h-3 text-green-500" />
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
        <span className="text-xs text-gray-600">Tone Optimization</span>
        <CheckCircle className="w-3 h-3 text-green-500" />
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
        <span className="text-xs text-gray-600">Impact Amplification</span>
        <CheckCircle className="w-3 h-3 text-green-500" />
      </div>
    </div>
  </div>
);

const ExportSVG = () => (
  <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
    <div className="text-xs text-gray-600 mb-3">Export Options:</div>
    <div className="flex space-x-2 mb-3">
      <div className="bg-rose-100 text-rose-800 px-2 py-1 rounded-full text-xs font-medium">PDF</div>
      <div className="bg-rose-100 text-rose-800 px-2 py-1 rounded-full text-xs font-medium">DOCX</div>
      <div className="bg-rose-100 text-rose-800 px-2 py-1 rounded-full text-xs font-medium">TXT</div>
    </div>
    <div className="flex items-center">
      <Download className="w-4 h-4 text-rose-600 mr-2" />
      <span className="text-xs text-gray-700">Ready for download</span>
    </div>
  </div>
); 