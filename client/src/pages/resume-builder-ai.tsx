import { useRef, useEffect, useState } from 'react';
import { Link } from 'wouter';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Helmet } from 'react-helmet';
import SharedHeader from '@/components/layouts/shared-header';
import SharedFooter from '@/components/layouts/SharedFooter';
import { useBranding } from '@/components/branding/branding-provider';
import { 
  Star, 
  Zap, 
  Target, 
  Brain, 
  FileText, 
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Download,
  Sparkles,
  Bot,
  Search,
  Shield,
  Users,
  Award,
  Upload
} from 'lucide-react';

export default function ResumeBuilderAI() {
  const branding = useBranding();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  useEffect(() => {
    setIsReady(true);
  }, []);

  // Hero section animations
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

  // Section animation props
  const sectionAnimationProps = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>AI Resume Builder - Create ATS-Optimized Resumes That Land Jobs | {branding.appName}</title>
        <meta name="description" content="Build professional, ATS-optimized resumes with AI. Our intelligent resume builder analyzes job descriptions, extracts keywords, and creates tailored resumes that pass applicant tracking systems and impress recruiters." />
        <meta name="keywords" content="AI resume builder, ATS optimized resume, resume maker, job application, career tools, AI-powered resume, resume optimization, job search, professional resume, applicant tracking system, resume templates, keyword optimization" />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content="AI Resume Builder - Create ATS-Optimized Resumes That Land Jobs" />
        <meta property="og:description" content="Build professional, ATS-optimized resumes with AI. Analyze job descriptions, extract keywords, and create tailored resumes that pass applicant tracking systems." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="/resume-builder-ai" />
        <meta property="og:image" content="/images/resume-builder-og.jpg" />
        
        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AI Resume Builder - Create ATS-Optimized Resumes That Land Jobs" />
        <meta name="twitter:description" content="Build professional, ATS-optimized resumes with AI. Analyze job descriptions, extract keywords, and create tailored resumes." />
        <meta name="twitter:image" content="/images/resume-builder-twitter.jpg" />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <meta name="author" content={branding.appName} />
        <link rel="canonical" href="/resume-builder-ai" />
        
        {/* Schema.org structured data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": `${branding.appName} AI Resume Builder`,
            "description": "AI-powered resume builder that creates ATS-optimized resumes",
            "url": "/resume-builder-ai",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "featureList": [
              "AI-powered resume optimization",
              "ATS compatibility analysis", 
              "Job description keyword extraction",
              "Professional resume templates",
              "Real-time scoring",
              "Multi-format export"
            ]
          })}
        </script>
      </Helmet>

      <div ref={containerRef} className="relative min-h-screen overflow-hidden bg-slate-50">
        <SharedHeader isLandingPage={true} />

        {/* Hero Section */}
        <motion.section 
          className="relative flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-900 to-blue-900 overflow-hidden pt-20 min-h-screen"
          style={{ 
            opacity: heroOpacity,
            scale: heroScale
          }}
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div 
              className="absolute w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-3xl -left-32 -top-32"
              animate={{ 
                y: [0, -20, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 8,
                repeat: Infinity,
                repeatType: "reverse" 
              }}
            />
            <motion.div 
              className="absolute w-[400px] h-[400px] rounded-full bg-purple-500/15 blur-3xl -right-16 top-32"
              animate={{ 
                y: [0, 20, 0],
                scale: [1, 0.9, 1]
              }}
              transition={{ 
                duration: 6,
                repeat: Infinity,
                repeatType: "reverse",
                delay: 1
              }}
            />
          </div>

          <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center z-10 pt-16 md:pt-0">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
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
                AI-Powered Resume Intelligence
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
              >
                Build Resumes That{" "}
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
                  Actually Get Hired
                </motion.span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="text-lg md:text-xl text-indigo-200 mb-8 max-w-2xl mx-auto lg:mx-0"
              >
                Our AI analyzes job descriptions, extracts key requirements, and crafts ATS-optimized resumes that pass automated screening and impress human recruiters. Get real-time scoring, keyword optimization, and professional formatting.
              </motion.p>

              <motion.div 
                className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <Link href="/register">
                  <motion.a 
                    className="inline-flex items-center justify-center px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-indigo-600/30"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Start Building Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </motion.a>
                </Link>
                <motion.a 
                  href="#ai-features"
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-indigo-400 text-indigo-200 hover:bg-indigo-800/30 hover:border-indigo-300 font-semibold rounded-lg transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('ai-features')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Brain className="w-5 h-5 mr-2" />
                  See AI Features
                </motion.a>
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
                  <span className="font-medium">Import Your Existing Resume</span>
                </div>
                <div className="flex items-center text-indigo-200">
                  <Zap className="w-5 h-5 mr-2" />
                  <span className="font-medium">AI-Powered Optimization</span>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Hero Visual - AI Resume Builder Interface */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="lg:w-1/2 w-full max-w-2xl mx-auto z-10"
            >
              <ResumeBuilderInterfaceSVG />
            </motion.div>
          </div>
        </motion.section>

        {/* AI Features Section */}
        <motion.section 
          id="ai-features"
          className="bg-white py-20 relative overflow-hidden"
          {...sectionAnimationProps}
        >
          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-sm font-semibold uppercase tracking-wider text-indigo-600 mb-4 inline-block">
                AI-POWERED INTELLIGENCE
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                Smart Features That Get You Hired
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Our AI doesn't just format your resume—it analyzes, optimizes, and tailors every element to match job requirements and beat ATS systems.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* ATS Optimization */}
              <motion.div 
                className="group bg-gradient-to-br from-slate-50 to-indigo-50 p-8 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all duration-300 hover:shadow-xl"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -5 }}
              >
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">ATS Score Optimization</h3>
                <p className="text-slate-600 mb-4">
                  Real-time ATS compatibility scoring with specific recommendations to improve your resume's chances of passing automated screening.
                </p>
                <ATSScoreSVG />
              </motion.div>

              {/* Keyword Extraction */}
              <motion.div 
                className="group bg-gradient-to-br from-slate-50 to-purple-50 p-8 rounded-2xl border border-slate-200 hover:border-purple-200 transition-all duration-300 hover:shadow-xl"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">Smart Keyword Extraction</h3>
                <p className="text-slate-600 mb-4">
                  AI analyzes job descriptions to extract critical keywords and phrases, ensuring your resume matches what recruiters are looking for.
                </p>
                <KeywordExtractionSVG />
              </motion.div>

              {/* AI Content Generation */}
              <motion.div 
                className="group bg-gradient-to-br from-slate-50 to-emerald-50 p-8 rounded-2xl border border-slate-200 hover:border-emerald-200 transition-all duration-300 hover:shadow-xl"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ y: -5 }}
              >
                <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">AI Content Generation</h3>
                <p className="text-slate-600 mb-4">
                  Generate compelling professional summaries, achievement-focused bullet points, and tailored content that highlights your best qualities.
                </p>
                <ContentGenerationSVG />
              </motion.div>

              {/* Template Intelligence */}
              <motion.div 
                className="group bg-gradient-to-br from-slate-50 to-blue-50 p-8 rounded-2xl border border-slate-200 hover:border-blue-200 transition-all duration-300 hover:shadow-xl"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                whileHover={{ y: -5 }}
              >
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">Smart Template Selection</h3>
                <p className="text-slate-600 mb-4">
                  AI recommends the optimal template design based on your industry, experience level, and target job requirements.
                </p>
                <TemplateSelectionSVG />
              </motion.div>

              {/* Section Optimization */}
              <motion.div 
                className="group bg-gradient-to-br from-slate-50 to-amber-50 p-8 rounded-2xl border border-slate-200 hover:border-amber-200 transition-all duration-300 hover:shadow-xl"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                whileHover={{ y: -5 }}
              >
                <div className="w-16 h-16 bg-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">Section Prioritization</h3>
                <p className="text-slate-600 mb-4">
                  Intelligently reorders resume sections based on job requirements to ensure your most relevant qualifications appear first.
                </p>
                <SectionOrderSVG />
              </motion.div>

              {/* Security & Privacy */}
              <motion.div 
                className="group bg-gradient-to-br from-slate-50 to-rose-50 p-8 rounded-2xl border border-slate-200 hover:border-rose-200 transition-all duration-300 hover:shadow-xl"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
                whileHover={{ y: -5 }}
              >
                <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">Secure AI Processing</h3>
                <p className="text-slate-600 mb-4">
                  Enterprise-grade encryption ensures your personal information and resume data remain private and secure during AI processing.
                </p>
                <SecuritySVG />
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
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                How Our AI Creates Perfect Resumes
              </h2>
              <p className="text-xl text-indigo-200 max-w-3xl mx-auto">
                Follow our intelligent 4-step process to create a resume that beats ATS systems and impresses recruiters.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  step: "01",
                  title: "Paste Job Description",
                  description: "Simply paste the job posting you're applying for. Our AI instantly analyzes requirements, skills, and keywords.",
                  icon: <FileText className="w-8 h-8" />
                },
                {
                  step: "02", 
                  title: "AI Analyzes & Extracts",
                  description: "Advanced algorithms identify critical keywords, required skills, and qualification priorities from the job posting.",
                  icon: <Brain className="w-8 h-8" />
                },
                {
                  step: "03",
                  title: "Content Optimization",
                  description: "AI generates tailored content, optimizes existing experience descriptions, and suggests improvements.",
                  icon: <Zap className="w-8 h-8" />
                },
                {
                  step: "04",
                  title: "Download & Apply",
                  description: "Get your ATS-optimized resume in multiple formats, ready to beat automated screening and impress recruiters.",
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

        {/* Key Features Section */}
        <motion.section 
          className="bg-white py-20"
          {...sectionAnimationProps}
        >
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                AI-Powered Resume Builder Features
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Everything you need to create professional, tailored resumes that stand out to employers and pass ATS systems.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Upload className="w-12 h-12 text-indigo-600" />,
                  label: "Import Existing Resumes",
                  description: "Already have a resume? Upload it and our AI will extract all your information automatically"
                },
                {
                  icon: <Target className="w-12 h-12 text-indigo-600" />,
                  label: "ATS Optimization",
                  description: "Our intelligent system helps your resume pass through Applicant Tracking Systems with ease"
                },
                {
                  icon: <FileText className="w-12 h-12 text-indigo-600" />, 
                  label: "Multiple Export Formats",
                  description: "Download your finished resume in PDF, DOCX, or other formats ready for submission"
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="text-center p-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="flex justify-center mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">{feature.label}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Import Resume Section */}
        <motion.section 
          className="bg-slate-50 py-16 md:py-24 relative overflow-hidden"
          {...sectionAnimationProps}
        >
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="order-2 lg:order-1"
              >
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 md:mb-6 text-center lg:text-left">
                  Import Your Existing Resume<br/>
                  <span className="text-indigo-600">Let AI Do the Work</span>
                </h2>
                <div className="mb-4 bg-blue-50 border border-blue-200 p-3 rounded-lg text-blue-800 text-sm">
                  <p className="flex items-start">
                    <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>This is a preview of features available after registration. Create an account to access this functionality.</span>
                  </p>
                </div>
                <p className="text-slate-600 mb-6 md:mb-8 text-center lg:text-left">
                  Already have a resume? Don't start from scratch! Upload your existing resume, and our AI will automatically extract all your information, saving you time and effort.
                </p>
                <ul className="space-y-3 mb-8 max-w-lg mx-auto lg:mx-0">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-slate-700">Support for DOC, DOCX, PDF, and TXT formats</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-slate-700">Intelligent extraction of contact details, experience, and skills</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-slate-700">AI-powered parsing that understands various resume formats</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-slate-700">Edit and optimize after import with full control</span>
                  </li>
                </ul>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="order-1 lg:order-2 bg-white p-6 rounded-xl shadow-lg border border-slate-200"
              >
                <div className="flex items-center mb-4">
                  <Upload className="w-6 h-6 text-indigo-600 mr-2" />
                  <h3 className="text-lg font-semibold">Resume Import</h3>
                </div>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center mb-4">
                  <Upload className="h-12 w-12 mx-auto text-slate-400 mb-3" />
                  <p className="text-slate-600 mb-2">Once registered, you can upload your existing resume</p>
                  <p className="text-xs text-slate-500 mb-4">Supported formats: DOCX, DOC, PDF, TXT (Max 5MB)</p>
                  <Link href="/register">
                    <motion.a
                      className="bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg inline-flex items-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Register to Use This Feature
                    </motion.a>
                  </Link>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg text-sm text-indigo-700">
                  <p className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-indigo-600 flex-shrink-0" />
                    <span>This feature is available after creating an account</span>
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section 
          className="bg-gradient-to-r from-indigo-600 to-purple-600 py-20 text-white relative overflow-hidden"
          {...sectionAnimationProps}
        >
          <div className="container mx-auto px-4 text-center relative z-10">
            <motion.div 
              className="max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Build Your AI-Optimized Resume?
              </h2>
              <p className="text-xl text-indigo-100 mb-10 max-w-3xl mx-auto">
                Create a professional, ATS-optimized resume with our powerful AI tools. Import your existing resume or start from scratch to build a winning application.
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
                <Link href="/pricing">
                  <motion.a 
                    className="inline-flex items-center justify-center px-10 py-4 border-2 border-white text-white hover:bg-white/10 font-bold rounded-lg transition-all duration-300"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Award className="w-6 h-6 mr-3" />
                    View Pricing
                  </motion.a>
                </Link>
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                {[
                  "AI-Powered",
                  "ATS-Optimized", 
                  "Multiple Templates",
                  "Instant Download"
                ].map((feature, index) => (
                  <motion.div 
                    key={index}
                    className="flex items-center justify-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <CheckCircle className="w-5 h-5 mr-2 text-indigo-200" />
                    <span className="text-indigo-100 font-medium">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.section>

        <SharedFooter />
      </div>
    </>
  );
}

// Custom SVG Components representing actual UI features

const ResumeBuilderInterfaceSVG = () => (
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
          <div className="ml-4 text-white font-medium">AI Resume Builder</div>
        </div>
      </div>
      
      {/* Interface Content */}
      <div className="p-6 space-y-4">
        {/* Progress Steps */}
        <div className="flex items-center space-x-2 mb-6">
          {[1,2,3,4,5].map((step, i) => (
            <div key={step} className="flex items-center">
              <motion.div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  i <= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1 + i * 0.1 }}
              >
                {step}
              </motion.div>
              {i < 4 && <div className="w-8 h-0.5 bg-gray-200 mx-1"></div>}
            </div>
          ))}
        </div>

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
              <span className="text-sm font-medium text-indigo-600">24 found</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div 
                className="bg-indigo-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "85%" }}
                transition={{ delay: 2, duration: 1 }}
              ></motion.div>
            </div>
          </div>
        </motion.div>

        {/* ATS Score */}
        <motion.div 
          className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-lg border border-emerald-200"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.7 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-emerald-900">ATS Score</span>
            </div>
            <motion.div 
              className="text-2xl font-bold text-emerald-600"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 2.5, type: "spring" }}
            >
              92%
            </motion.div>
          </div>
        </motion.div>

        {/* Form Fields Preview */}
        <div className="space-y-3">
          {['Full Name', 'Professional Summary', 'Work Experience'].map((field, i) => (
            <motion.div 
              key={field}
              className="space-y-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2 + i * 0.1 }}
            >
              <label className="text-sm font-medium text-gray-700">{field}</label>
              <div className="h-8 bg-gray-100 rounded border"></div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
);

const ATSScoreSVG = () => (
  <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium text-gray-700">ATS Compatibility</span>
      <span className="text-lg font-bold text-indigo-600">92%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-3">
      <motion.div 
        className="bg-indigo-600 h-3 rounded-full"
        initial={{ width: 0 }}
        whileInView={{ width: "92%" }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, delay: 0.5 }}
      ></motion.div>
    </div>
    <div className="mt-2 text-xs text-gray-600">
      ✓ Keywords optimized • ✓ Format compatible • ✓ Length appropriate
    </div>
  </div>
);

const KeywordExtractionSVG = () => (
  <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
    <div className="text-xs text-gray-600 mb-3">Extracted Keywords:</div>
    <div className="flex flex-wrap gap-1">
      {['React', 'TypeScript', 'Node.js', 'AWS', 'Agile', 'Testing'].map((keyword, i) => (
        <motion.span 
          key={keyword}
          className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium"
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
        >
          {keyword}
        </motion.span>
      ))}
    </div>
  </div>
);

const ContentGenerationSVG = () => (
  <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
    <div className="text-xs text-gray-600 mb-2">AI Generated Summary:</div>
    <div className="space-y-2">
      {[
        "Results-driven software engineer with 5+ years...",
        "Expertise in React, TypeScript, and cloud...",
        "Proven track record of delivering scalable..."
      ].map((line, i) => (
        <motion.div 
          key={i}
          className="h-2 bg-emerald-100 rounded"
          initial={{ width: 0 }}
          whileInView={{ width: "100%" }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.2, duration: 0.8 }}
          style={{ width: i === 0 ? '100%' : i === 1 ? '80%' : '90%' }}
        ></motion.div>
      ))}
    </div>
  </div>
);

const TemplateSelectionSVG = () => (
  <div className="mt-4 grid grid-cols-3 gap-2">
    {['Modern', 'Classic', 'Creative'].map((template, i) => (
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

const SectionOrderSVG = () => (
  <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
    <div className="text-xs text-gray-600 mb-3">Optimized Section Order:</div>
    <div className="space-y-2">
      {[
        { name: 'Professional Summary', priority: 'High' },
        { name: 'Work Experience', priority: 'High' },
        { name: 'Skills', priority: 'Medium' },
        { name: 'Education', priority: 'Medium' }
      ].map((section, i) => (
        <motion.div 
          key={section.name}
          className="flex items-center justify-between p-2 bg-amber-50 rounded text-xs"
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
        >
          <span className="font-medium">{section.name}</span>
          <span className={`px-2 py-1 rounded-full ${
            section.priority === 'High' ? 'bg-amber-200 text-amber-800' : 'bg-gray-200 text-gray-600'
          }`}>
            {section.priority}
          </span>
        </motion.div>
      ))}
    </div>
  </div>
);

const SecuritySVG = () => (
  <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
    <div className="flex items-center space-x-2 mb-3">
      <Shield className="w-4 h-4 text-rose-600" />
      <span className="text-xs font-medium text-gray-700">Security Features</span>
    </div>
    <div className="space-y-2 text-xs text-gray-600">
      <div className="flex items-center space-x-2">
        <CheckCircle className="w-3 h-3 text-green-500" />
        <span>256-bit encryption</span>
      </div>
      <div className="flex items-center space-x-2">
        <CheckCircle className="w-3 h-3 text-green-500" />
        <span>Secure data processing</span>
      </div>
      <div className="flex items-center space-x-2">
        <CheckCircle className="w-3 h-3 text-green-500" />
        <span>Privacy compliant</span>
      </div>
    </div>
  </div>
); 