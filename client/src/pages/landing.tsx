import { useRef, useEffect, useState } from 'react';
import { Link } from 'wouter';
import { motion, useScroll, useTransform, useSpring, AnimatePresence, useInView } from 'framer-motion';
import ParallaxSection from '@/components/ParallaxSection';
import FloatingElement from '@/components/FloatingElement';
import Testimonial from '@/components/Testimonial';
import { useParallaxY, useParallaxOpacity, useParallaxRotate, useParallaxScale } from '@/utils/animation';
import SharedHeader from '@/components/layouts/shared-header';
import SharedFooter from '@/components/layouts/SharedFooter';
import { useBranding } from '@/components/branding/branding-provider';

export default function LandingPage() {
  const branding = useBranding();
  const containerRef = useRef<HTMLDivElement>(null);
  const heroButtonsRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const isButtonsInView = useInView(heroButtonsRef, { once: false });

  // Simplified scroll tracking with throttling
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  
  // Reduced spring animation complexity
  const smoothScrollYProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Optimized scroll handler with throttling
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    setIsReady(true);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Simplified parallax values with reduced computation
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

  // Simplified section animations
  const sectionAnimationProps = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  // Optimized button animations
  const buttonVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1 + 0.3,
        duration: 0.5,
        ease: "easeOut"
      }
    }),
    hover: { 
      scale: 1.02,
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 25
      }
    },
    tap: { scale: 0.98 }
  };

  // Simplified floating animation
  const floatingAnimation = {
    y: [0, -10, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      repeatType: "reverse" as const,
      ease: "easeInOut"
    }
  };

  // Helper function for smooth scrolling
  const scrollToElement = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden bg-slate-50">
      <SharedHeader isLandingPage={true} />

      {/* Hero Section with Enhanced Gradient Background */}
      <motion.section 
        className="relative flex items-center justify-center bg-gradient-to-b from-indigo-950 via-indigo-900 to-purple-900 overflow-hidden pt-20 min-h-screen"
        style={{ 
          opacity: heroOpacity,
          scale: heroScale
        }}
      >
        {/* Simplified animated background grid */}
        <div 
          className="absolute inset-0 bg-grid-pattern opacity-10"
          style={{ 
            transform: `translateY(${scrollY * 0.1}px)`
          }}
        ></div>
        
        {/* Simplified floating blobs */}
        <motion.div 
          className="absolute w-[400px] h-[400px] rounded-full bg-indigo-500/20 blur-3xl -left-32 -top-32"
          animate={floatingAnimation}
        ></motion.div>
        <motion.div 
          className="absolute w-[300px] h-[300px] rounded-full bg-purple-500/20 blur-3xl -right-16 top-32"
          animate={{
            ...floatingAnimation,
            transition: { ...floatingAnimation.transition, delay: 1 }
          }}
        ></motion.div>

        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center z-10 pt-16 md:pt-0">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:w-1/2 text-center lg:text-left lg:pr-12 mb-10 lg:mb-0"
          >
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-2 md:mb-4 inline-block"
            >
              AFFORDABLE AI-POWERED TOOLS
            </motion.span>
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6"
            >
              Land Your Dream Job with{" "}
              <motion.span 
                className="text-indigo-400 inline-block"
                animate={{ 
                  color: ["#818cf8", "#a5b4fc", "#818cf8"],
                  textShadow: [
                    "0 0 5px rgba(129, 140, 248, 0)",
                    "0 0 15px rgba(129, 140, 248, 0.5)",
                    "0 0 5px rgba(129, 140, 248, 0)"
                  ]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  repeatType: "reverse" 
                }}
              >
                AI-Optimized
              </motion.span> Applications
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-base md:text-lg text-indigo-200 mb-6 md:mb-8 max-w-md mx-auto lg:mx-0"
            >
              The most affordable, AI-powered platform designed specifically for students and early career professionals. Create ATS-optimized resumes, tailored cover letters, and track your applications—all in one secure place.
            </motion.p>
            <motion.div 
              ref={heroButtonsRef}
              className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 sm:gap-5"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.2
                  }
                }
              }}
            >
              <motion.div
                custom={0}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className="w-full sm:w-auto flex"
              >
                <Link href="/register">
                  <a className="inline-flex items-center justify-center px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition-all duration-300 shadow-lg shadow-indigo-600/30 w-full h-[56px] sm:w-auto min-w-[180px]">
                    <span className="flex items-center">
                      <span>Get Started Free</span>
                      <motion.svg 
                        className="w-5 h-5 ml-2" 
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", repeatDelay: 2 }}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                      </motion.svg>
                    </span>
                  </a>
                </Link>
              </motion.div>
              <motion.div
                custom={1}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className="w-full sm:w-auto flex"
              >
                <a 
                  href="#features"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToElement('features');
                  }}
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-indigo-400 text-indigo-200 hover:bg-indigo-800/30 hover:border-indigo-300 hover:text-indigo-100 font-medium rounded-md transition-all duration-300 w-full h-[56px] sm:w-auto min-w-[180px] cursor-pointer"
                >
                  <span className="flex items-center">
                    <span>Explore Features</span>
                  </span>
                </a>
              </motion.div>
            </motion.div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:w-1/2 w-full max-w-md lg:max-w-none mx-auto z-10"
          >
            <div className="relative">
              <motion.div 
                className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg blur opacity-30"
                animate={{ 
                  opacity: [0.2, 0.3, 0.2]
                }}
                transition={{ 
                  duration: 8,
                  repeat: Infinity,
                  repeatType: "reverse" 
                }}
              ></motion.div>
              <motion.div 
                className="relative bg-slate-900 rounded-lg border border-slate-800 shadow-xl overflow-hidden"
                whileHover={{ 
                  scale: 1.01,
                  boxShadow: "0 20px 40px -10px rgba(79, 70, 229, 0.4)"
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <img 
                  src="/images/dashboard-preview.svg" 
                  alt={`${branding.appName} Dashboard - AI-powered ATS resume builder and job application tracker`} 
                  className="w-full h-auto" 
                  width="800"
                  height="600"
                  loading="eager"
                />
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-t from-indigo-900/50 to-transparent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 1 }}
                ></motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Key Features Overview */}
      <motion.section 
        id="features" 
        className="bg-white py-16 md:py-20 relative"
        {...sectionAnimationProps}
      >
        <motion.div 
          className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50"
          style={{ 
            opacity: useTransform(smoothScrollYProgress, [0.1, 0.3], [0, 1]) 
          }}
        ></motion.div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="text-center mb-12 md:mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-2 md:mb-4 inline-block">WHY CHOOSE {branding.appName.toUpperCase()}</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              The Complete Job Application Solution
            </h2>
            <p className="text-slate-600 max-w-3xl mx-auto">
              {branding.appName} combines advanced AI technology with affordable pricing to give students and early career professionals the edge they need in today's competitive job market.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ 
                y: -10, 
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
              }}
              className="bg-slate-50 p-6 rounded-xl border border-slate-100 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 text-indigo-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Student-Friendly Pricing</h3>
              <p className="text-slate-600">
                Premium AI tools at an affordable price, specifically designed for students and those starting their careers.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ 
                y: -10, 
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
              }}
              className="bg-slate-50 p-6 rounded-xl border border-slate-100 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 text-indigo-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Perfect ATS Optimization</h3>
              <p className="text-slate-600">
                Advanced algorithms ensure your resume passes through Applicant Tracking Systems with real-time scoring.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ 
                y: -10, 
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
              }}
              className="bg-slate-50 p-6 rounded-xl border border-slate-100 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 text-indigo-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Tailored Content</h3>
              <p className="text-slate-600">
                Every resume and cover letter is uniquely crafted based on your experience and the specific job you're applying for.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ 
                y: -10, 
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
              }}
              className="bg-slate-50 p-6 rounded-xl border border-slate-100 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 text-indigo-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Application Tracking</h3>
              <p className="text-slate-600">
                Maintain discipline and consistency with a comprehensive system to track all your job applications in one secure place.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ATS-Optimized Resumes Section */}
      <motion.section 
        className="bg-slate-50 py-16 md:py-24 relative overflow-hidden"
        {...sectionAnimationProps}
      >
        <motion.div 
          className="absolute -left-32 top-0 w-[300px] h-[300px] rounded-full bg-indigo-100 blur-3xl opacity-50"
          animate={floatingAnimation}
        ></motion.div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }} // Faster animation
                className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 md:mb-6 text-center lg:text-left"
              >
                ATS-Optimized<br/>
                <span className="text-indigo-600">Resumes That Get Results</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }} // Faster with shorter delay
                className="text-slate-600 mb-6 md:mb-8 text-center lg:text-left"
              >
                Our intelligent AI analyzes job descriptions to create perfectly tailored resumes that pass ATS filters and highlight your key achievements. Get real-time ATS scores and personalized suggestions to optimize each section of your resume.
              </motion.p>
              <ul className="space-y-3 mb-8 max-w-lg mx-auto lg:mx-0">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-slate-700">Smart keyword extraction and optimization for each job</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-slate-700">Highlights key achievements in your experience</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-slate-700">AI-generated professional summaries tailored to each position</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-slate-700">Real-time ATS score calculation with improvement suggestions</span>
                </li>
              </ul>
              
              {/* Learn More Button for Resume Builder AI */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-center lg:text-left"
              >
                <Link href="/resume-builder-ai">
                  <motion.a 
                    className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all duration-300 shadow-lg shadow-indigo-600/30"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                    </svg>
                    Learn More About AI Resume Builder
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </motion.a>
                </Link>
              </motion.div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-2 gap-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-white p-6 rounded-lg shadow-md border border-slate-100 col-span-2 hover:shadow-xl transition-all duration-300"
              >
                <h3 className="text-lg font-semibold text-indigo-700 mb-3">ATS Score Optimization</h3>
                <div className="bg-indigo-50 rounded-lg p-4 mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-700">Current Score</span>
                    <span className="text-indigo-600 font-bold">85%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <p className="text-sm text-slate-600">Get real-time feedback and suggestions to improve your ATS compatibility score.</p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white p-6 rounded-lg shadow-md border border-slate-100 col-span-2 hover:shadow-xl transition-all duration-300"
              >
                <h3 className="text-lg font-semibold text-indigo-700 mb-3">Keywords Extracted</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">React.js</span>
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">TypeScript</span>
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">UI/UX</span>
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">Frontend</span>
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">CSS</span>
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">Agile</span>
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">Tailwind</span>
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">Jest</span>
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">Git</span>
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">API</span>
                </div>
                <p className="text-sm text-slate-600">Intelligent keyword extraction from job descriptions, displayed as a visual word cloud.</p>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Feature categories ribbon - using CSS instead of JS animation for better performance */}
      <div className="bg-indigo-100 py-3 md:py-4 overflow-hidden">
        <div className="flex space-x-8 md:space-x-12 animate-marquee whitespace-nowrap will-change-transform">
          <span className="text-indigo-600 font-medium text-sm md:text-base mx-3 md:mx-4">✦ ATS optimization</span>
          <span className="text-indigo-600 font-medium text-sm md:text-base mx-3 md:mx-4">✦ tailored resumes</span>
          <span className="text-indigo-600 font-medium text-sm md:text-base mx-3 md:mx-4">✦ smart cover letters</span>
          <span className="text-indigo-600 font-medium text-sm md:text-base mx-3 md:mx-4">✦ job tracking</span>
          <span className="text-indigo-600 font-medium text-sm md:text-base mx-3 md:mx-4">✦ keywords extraction</span>
          <span className="text-indigo-600 font-medium text-sm md:text-base mx-3 md:mx-4">✦ affordable pricing</span>
          <span className="text-indigo-600 font-medium text-sm md:text-base mx-3 md:mx-4">✦ secure encryption</span>
          <span className="text-indigo-600 font-medium text-sm md:text-base mx-3 md:mx-4">✦ student friendly</span>
        </div>
      </div>

      {/* Final CTA Section */}
      <motion.section 
        className="bg-gradient-to-r from-indigo-600 to-purple-600 py-16 md:py-24 relative overflow-hidden"
        {...sectionAnimationProps}
      >
        <motion.div 
          className="absolute -right-32 -top-32 w-[300px] h-[300px] rounded-full bg-purple-500/20 blur-3xl"
          animate={floatingAnimation}
        ></motion.div>
        
        <motion.div 
          className="absolute -left-32 -bottom-32 w-[400px] h-[400px] rounded-full bg-indigo-500/20 blur-3xl"
          animate={{
            ...floatingAnimation,
            transition: { ...floatingAnimation.transition, delay: 2 }
          }}
        ></motion.div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div 
            className="max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Begin Your Job Search Journey Today
            </h2>
            <p className="text-xl text-indigo-100 mb-8 md:mb-10">
              {branding.appName} offers the most affordable, AI-powered tools to help students and early career professionals land their dream jobs. Join now and transform your job search experience.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <motion.div
                custom={0}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className="w-full sm:w-auto flex"
              >
                <Link href="/register">
                  <a className="inline-flex items-center justify-center px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition-all duration-300 shadow-lg shadow-indigo-600/30 w-full h-[56px] sm:w-auto min-w-[180px]">
                    <span className="flex items-center">
                      <span>Get Started Free</span>
                      <motion.svg 
                        className="w-5 h-5 ml-2" 
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", repeatDelay: 2 }}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                      </motion.svg>
                    </span>
                  </a>
                </Link>
              </motion.div>
              <motion.div
                custom={1}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className="w-full sm:w-auto flex"
              >
                <a href="/register" className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white hover:bg-white/10 text-white font-medium text-lg rounded-md transition-all duration-300 w-full h-[56px] sm:w-auto min-w-[180px]">
                  Sign Up
                </a>
              </motion.div>
            </div>
            <div className="mt-10 md:mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-white/10 backdrop-blur-sm p-4 rounded-lg"
              >
                <h3 className="text-white font-semibold mb-1">Student-Friendly</h3>
                <p className="text-indigo-200 text-sm">Affordable pricing for students</p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white/10 backdrop-blur-sm p-4 rounded-lg"
              >
                <h3 className="text-white font-semibold mb-1">ATS-Optimized</h3>
                <p className="text-indigo-200 text-sm">Get past the digital gatekeepers</p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white/10 backdrop-blur-sm p-4 rounded-lg"
              >
                <h3 className="text-white font-semibold mb-1">Secure</h3>
                <p className="text-indigo-200 text-sm">End-to-end data encryption</p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white/10 backdrop-blur-sm p-4 rounded-lg"
              >
                <h3 className="text-white font-semibold mb-1">Advanced AI</h3>
                <p className="text-indigo-200 text-sm">Cutting-edge algorithms</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Cover Letters Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: 20 }} // Reduced movement
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="order-1 md:order-1 mb-8 md:mb-0"
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-20"></div>
                <div className="bg-white relative p-6 md:p-8 rounded-xl border border-slate-100 shadow-lg will-change-transform">
                  <h3 className="text-xl font-bold text-indigo-700 mb-4">Cover Letter Generator</h3>
                  <div className="bg-slate-50 p-4 rounded-lg mb-5">
                    <p className="text-sm text-slate-700 italic mb-3">
                      "Dear Hiring Manager,
                    </p>
                    <p className="text-sm text-slate-700 italic mb-3">
                      I am writing to express my interest in the Frontend Developer position at Acme Tech. With my strong foundation in React.js and TypeScript, combined with my passion for creating responsive and accessible user interfaces, I believe I am an excellent candidate for this role.
                    </p>
                    <p className="text-sm text-slate-700 italic">
                      My experience developing interactive web applications aligns perfectly with your requirements..."
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mr-3">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-slate-700">AI-Generated</span>
                    </div>
                    <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">Job-Specific</span>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: -20 }} // Reduced movement
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="order-2 md:order-2"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-2 md:mb-4 inline-block">PERSONALIZED OUTREACH</span>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 md:mb-4">
                AI-Powered <br className="hidden sm:block"/>
                <span className="text-indigo-600">Cover Letters</span>
              </h2>
              <p className="text-slate-600 mb-4 md:mb-6 text-sm md:text-base">
                Our advanced AI analyzes both your resume and the job description to generate highly personalized cover letters that showcase your relevant experiences and skills. Each letter is uniquely tailored to highlight why you're the perfect fit for the specific position.
              </p>
              <ul className="space-y-3 mb-6 md:mb-8">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-slate-700 text-sm md:text-base">Personalized for each specific job application</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-slate-700 text-sm md:text-base">Highlights the most relevant experience and achievements</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-slate-700 text-sm md:text-base">Maintains professional tone with compelling content</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-slate-700 text-sm md:text-base">Multiple export formats with perfect formatting</span>
                </li>
              </ul>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <a className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition-colors inline-block">
                    Create Your Cover Letter
                  </a>
                </Link>
                <Link href="/cover-letter-ai">
                  <motion.a 
                    className="inline-flex items-center justify-center px-6 py-3 border border-indigo-600 hover:bg-indigo-50 text-indigo-600 font-medium rounded-md transition-all duration-300"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                    </svg>
                    Learn About AI Cover Letters
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </motion.a>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Application Tracking System Section */}
      <section className="bg-gradient-to-b from-indigo-950 via-indigo-900 to-purple-900 py-24 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-4 inline-block">STAY ORGANIZED & FOCUSED</span>
            <h2 className="text-4xl font-bold mb-4">
              Comprehensive<br/>
              <span className="text-indigo-400">Application Tracking</span>
            </h2>
            <p className="text-indigo-200 max-w-2xl mx-auto">
              Keep your job search disciplined and organized with our powerful application tracking system. Monitor status changes, upcoming interviews, and application deadlines—all in a secure, encrypted environment.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-indigo-900/30 rounded-xl p-6 backdrop-blur-sm border border-indigo-800/50"
            >
              <div className="w-12 h-12 mb-4 flex items-center justify-center bg-indigo-800/50 rounded-xl">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Multi-stage Tracking</h3>
              <p className="text-indigo-200 text-sm">
                Track each application through every stage: Applied, Screening, Interview, Assessment, Offer, Rejected, or Accepted with complete status history.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-indigo-900/30 rounded-xl p-6 backdrop-blur-sm border border-indigo-800/50"
            >
              <div className="w-12 h-12 mb-4 flex items-center justify-center bg-indigo-800/50 rounded-xl">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Interview Management</h3>
              <p className="text-indigo-200 text-sm">
                Never miss an interview with our integrated calendar features. Track interview types, dates, and preparation notes all in one place.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-indigo-900/30 rounded-xl p-6 backdrop-blur-sm border border-indigo-800/50"
            >
              <div className="w-12 h-12 mb-4 flex items-center justify-center bg-indigo-800/50 rounded-xl">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Document Association</h3>
              <p className="text-indigo-200 text-sm">
                Link the exact version of your resume and cover letter used for each application, ensuring you always know which documents you submitted.
              </p>
            </motion.div>
          </div>
          
          <div className="bg-indigo-900/50 rounded-xl p-8 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">
                  Visualize Your<br/>
                  <span className="text-indigo-400">Job Search Progress</span>
                </h3>
                <p className="text-indigo-200 mb-6">
                  Our intuitive Kanban board interface gives you a visual overview of all your applications at different stages, helping you stay organized and focused on your job search goals.
                </p>
                <Link href="/register">
                  <a className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition-colors inline-block text-sm">
                    Start Tracking Applications
                  </a>
                </Link>
              </div>
              
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg blur opacity-30"></div>
                <div className="relative bg-indigo-900 rounded-lg border border-indigo-700 overflow-hidden">
                  <div className="bg-indigo-800/80 p-3 text-xs font-medium text-indigo-200">Application Tracker</div>
                  <div className="grid grid-cols-3 gap-2 p-4">
                    <div className="bg-indigo-800/50 p-2 rounded">
                      <div className="text-xs text-indigo-300 mb-1">Applied</div>
                      <div className="bg-indigo-700/50 p-2 rounded mb-2">
                        <div className="h-2 w-12 bg-indigo-500/50 rounded mb-1"></div>
                        <div className="h-2 w-16 bg-indigo-500/50 rounded"></div>
                      </div>
                      <div className="bg-indigo-700/50 p-2 rounded">
                        <div className="h-2 w-14 bg-indigo-500/50 rounded mb-1"></div>
                        <div className="h-2 w-10 bg-indigo-500/50 rounded"></div>
                      </div>
                    </div>
                    <div className="bg-indigo-800/50 p-2 rounded">
                      <div className="text-xs text-indigo-300 mb-1">Interview</div>
                      <div className="bg-cyan-700/50 p-2 rounded mb-2">
                        <div className="h-2 w-12 bg-cyan-500/50 rounded mb-1"></div>
                        <div className="h-2 w-16 bg-cyan-500/50 rounded"></div>
                      </div>
                    </div>
                    <div className="bg-indigo-800/50 p-2 rounded">
                      <div className="text-xs text-indigo-300 mb-1">Offer</div>
                      <div className="bg-emerald-700/50 p-2 rounded mb-2">
                        <div className="h-2 w-12 bg-emerald-500/50 rounded mb-1"></div>
                        <div className="h-2 w-16 bg-emerald-500/50 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Data Protection Section */}
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
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-4 inline-block">YOUR DATA, PROTECTED</span>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Enterprise-Grade <br/>
                <span className="text-indigo-600">Security</span>
              </h2>
              <p className="text-slate-600 mb-8">
                We take your privacy seriously. {branding.appName} employs advanced encryption for all sensitive data, 
                ensuring your personal information and job application details remain secure and private.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mb-3 text-indigo-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                  </div>
                  <h3 className="text-slate-900 font-semibold mb-1">Data Encryption</h3>
                  <p className="text-sm text-slate-600">All sensitive information is encrypted at rest and in transit.</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mb-3 text-indigo-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                    </svg>
                  </div>
                  <h3 className="text-slate-900 font-semibold mb-1">Secure Authentication</h3>
                  <p className="text-sm text-slate-600">Advanced authentication protocols protect your account access.</p>
                </div>
              </div>
              <Link href="/privacy">
                <a className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center">
                  Learn about our privacy practices
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </a>
              </Link>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-1 lg:order-2"
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-20"></div>
                <div className="bg-indigo-50 relative p-6 md:p-8 rounded-xl border border-slate-100 shadow-lg">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-5 text-indigo-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">Your Data, Your Control</h3>
                  <ul className="space-y-3 mb-5">
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="text-slate-700 text-sm">Field-level encryption for sensitive information</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="text-slate-700 text-sm">Compliance with data protection regulations</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="text-slate-700 text-sm">Download or delete your data at any time</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="text-slate-700 text-sm">Secure middleware for all sensitive operations</span>
                    </li>
                  </ul>
                  <div className="rounded-lg bg-white p-4 border border-slate-200 flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-3 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <p className="text-sm text-slate-700">Your data is encrypted using industry-standard protocols to ensure maximum security</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Keyword Extraction Section */}
      <section className="bg-slate-50 py-16 md:py-20" id="features">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-1 lg:order-2"
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-20"></div>
                <div className="bg-white relative p-6 md:p-8 rounded-xl border border-slate-100 shadow-lg">
                  <h3 className="text-xl font-bold text-indigo-700 mb-4">Keyword Analysis</h3>
                  <p className="text-sm text-slate-600 mb-4">Job Description Keywords Extracted:</p>
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-3 py-1.5 bg-indigo-600 text-white rounded-full text-sm">React.js</span>
                      <span className="px-3 py-1.5 bg-indigo-500 text-white rounded-full text-sm">TypeScript</span>
                      <span className="px-3 py-1.5 bg-indigo-400 text-white rounded-full text-sm">Frontend</span>
                      <span className="px-3 py-1.5 bg-indigo-500 text-white rounded-full text-sm">UI/UX</span>
                      <span className="px-3 py-1.5 bg-indigo-300 text-indigo-900 rounded-full text-sm">CSS</span>
                      <span className="px-3 py-1.5 bg-indigo-300 text-indigo-900 rounded-full text-sm">Agile</span>
                      <span className="px-3 py-1.5 bg-indigo-400 text-white rounded-full text-sm">Tailwind</span>
                      <span className="px-3 py-1.5 bg-indigo-600 text-white rounded-full text-sm">Jest</span>
                      <span className="px-3 py-1.5 bg-indigo-500 text-white rounded-full text-sm">Git</span>
                      <span className="px-3 py-1.5 bg-indigo-400 text-white rounded-full text-sm">API</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mr-3">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-slate-700">AI Analyzed</span>
                    </div>
                    <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">Intelligent Categorization</span>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-2 md:mb-4 inline-block">INTELLIGENT ANALYSIS</span>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 md:mb-4">
                Advanced <br className="hidden sm:block"/>
                <span className="text-indigo-600">Keyword Extraction</span>
              </h2>
              <p className="text-slate-600 mb-4 md:mb-6 text-sm md:text-base">
                Our sophisticated AI doesn't just scan for keywords—it intelligently categorizes them by importance and relevance. Get a beautiful, interactive word cloud visualization that helps you understand exactly what employers are looking for.
              </p>
              <ul className="space-y-3 mb-6 md:mb-8">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-slate-700 text-sm md:text-base">Visual word cloud with intelligent categorization</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-slate-700 text-sm md:text-base">Differentiation between technical and soft skills</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-slate-700 text-sm md:text-base">Identification of primary, secondary, and tertiary requirements</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-slate-700 text-sm md:text-base">Smart suggestions to incorporate keywords naturally</span>
                </li>
              </ul>
              <Link href="/register">
                <a className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition-colors inline-block">
                  Try Keyword Extraction
                </a>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Future Features Section */}
      <section className="bg-white py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-2 md:mb-4 inline-block">CONTINUOUS INNOVATION</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Coming Soon
            </h2>
            <p className="text-slate-600 max-w-3xl mx-auto">
              We're constantly evolving {branding.appName} with innovative features to make your job search even more effective.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-slate-50 p-6 rounded-xl border border-slate-100"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">AI Interview Coach</h3>
              <p className="text-slate-600">
                Practice interviews with our AI coach that adapts questions based on the job description and provides feedback on your responses.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-slate-50 p-6 rounded-xl border border-slate-100"
            >
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Salary Insights</h3>
              <p className="text-slate-600">
                Get accurate, up-to-date salary information for specific roles, helping you negotiate better compensation packages.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-slate-50 p-6 rounded-xl border border-slate-100"
            >
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4 text-amber-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Career Path Planner</h3>
              <p className="text-slate-600">
                Map your long-term career growth with AI-driven suggestions for skills development and potential career trajectories.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <SharedFooter />
    </div>
  );
} 