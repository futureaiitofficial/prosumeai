import { useRef } from 'react';
import { Link } from 'wouter';
import { motion, useScroll, useTransform } from 'framer-motion';
import ParallaxSection from '@/components/ParallaxSection';
import FloatingElement from '@/components/FloatingElement';
import Testimonial from '@/components/Testimonial';
import { useParallaxY, useParallaxOpacity } from '@/utils/animation';
import SharedHeader from '@/components/layouts/shared-header';

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const y1 = useParallaxY(scrollYProgress, -300);
  const y2 = useParallaxY(scrollYProgress, -150);
  const y3 = useParallaxY(scrollYProgress, -75);
  const heroOpacity = useParallaxOpacity(scrollYProgress, [0, 0.3], [1, 0]);

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden">
      <SharedHeader isLandingPage={true} />

      {/* Hero Section with Gradient Background */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-950 via-indigo-900 to-purple-900 overflow-hidden py-16 md:py-0">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        
        <FloatingElement y={20} duration={6} className="absolute w-64 md:w-96 h-64 md:h-96 rounded-full bg-indigo-500/20 blur-3xl">
          <div className="w-full h-full"></div>
        </FloatingElement>
        <FloatingElement y={15} duration={5} delay={0.5} className="absolute -right-20 top-20 w-48 md:w-64 h-48 md:h-64 rounded-full bg-purple-500/20 blur-3xl">
          <div className="w-full h-full"></div>
        </FloatingElement>
        <FloatingElement y={25} duration={7} delay={1} className="absolute left-20 md:left-40 bottom-20 w-60 md:w-80 h-60 md:h-80 rounded-full bg-blue-500/20 blur-3xl">
          <div className="w-full h-full"></div>
        </FloatingElement>

        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center pt-16 md:pt-0">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:w-1/2 text-center lg:text-left lg:pr-12 mb-10 lg:mb-0"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-2 md:mb-4 inline-block">FOR STUDENTS & EARLY CAREERS</span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6">
              Build Your <br className="hidden sm:block"/>
              <span className="text-indigo-400">Career</span>
            </h1>
            <p className="text-base md:text-lg text-indigo-200 mb-6 md:mb-8 max-w-md mx-auto lg:mx-0">
              Affordable AI-powered resume tools designed specifically for students and early career professionals. Beat the ATS and land more interviews.
            </p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
              <Link href="/auth?signup=true">
                <a className="px-6 md:px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition-colors text-center w-full sm:w-auto">
                  Get Started
                </a>
              </Link>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:w-1/2 w-full max-w-md lg:max-w-none mx-auto"
          >
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg blur opacity-30"></div>
              <div className="relative bg-slate-900 rounded-lg border border-slate-800 shadow-xl overflow-hidden">
                <img 
                  src="/images/dashboard-preview.svg" 
                  alt="ATScribe Dashboard" 
                  className="w-full h-auto" 
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Customer Loyalty Stats Section */}
      <section className="bg-slate-50 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 md:mb-6 text-center lg:text-left"
              >
                Build ATS-Optimized<br/>
                <span className="text-indigo-600">Resumes & Cover Letters</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-slate-600 mb-6 md:mb-8 text-center lg:text-left"
              >
                Our advanced AI algorithms analyze job descriptions and optimize your resume to pass ATS filters,
                ensuring your application gets seen by human recruiters. Affordable pricing makes these powerful
                tools accessible for students and early career professionals.
              </motion.p>
              <ul className="space-y-2 mb-8 max-w-lg mx-auto lg:mx-0">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-slate-700">AI-powered keyword extraction and optimization</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-slate-700">90%+ ATS success rate</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-slate-700">Student-friendly pricing</span>
                </li>
              </ul>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="bg-indigo-50 p-4 md:p-6 rounded-lg text-center"
              >
                <span className="block text-indigo-600 text-2xl md:text-3xl font-bold mb-1">90%+</span>
                <span className="text-slate-600 text-xs md:text-sm">ATS Success</span>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-indigo-50 p-4 md:p-6 rounded-lg text-center"
              >
                <span className="block text-indigo-600 text-2xl md:text-3xl font-bold mb-1">15K+</span>
                <span className="text-slate-600 text-xs md:text-sm">Resumes</span>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-indigo-50 p-4 md:p-6 rounded-lg text-center"
              >
                <span className="block text-indigo-600 text-2xl md:text-3xl font-bold mb-1">4.8</span>
                <span className="text-slate-600 text-xs md:text-sm">Rating</span>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="bg-indigo-50 p-4 md:p-6 rounded-lg text-center"
              >
                <span className="block text-indigo-600 text-2xl md:text-3xl font-bold mb-1">24/7</span>
                <span className="text-slate-600 text-xs md:text-sm">Support</span>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Online Shop Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-4 inline-block">BEAT THE ATS</span>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                ATS-Optimized <br/>
                <span className="text-indigo-600">Resumes</span>
              </h2>
              <p className="text-slate-600 mb-8">
                Our AI ensures your resume passes through Applicant Tracking Systems with a 90%+ success rate. 
                Stand out from the crowd with a resume specifically optimized for ATS, ensuring your 
                application gets seen by hiring managers.
              </p>
              <Link href="/auth?signup=true">
                <a className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition-colors inline-block">
                  Build Your Resume
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
                <div className="bg-slate-800 p-6 rounded-lg">
                  <div className="text-xs text-slate-400 mb-3">Resume Optimization</div>
                  <img 
                    src="/images/analytics-chart.svg" 
                    alt="resume optimization" 
                    className="w-full h-auto" 
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature categories ribbon */}
      <div className="bg-indigo-100 py-3 md:py-4 overflow-hidden">
        <div className="flex space-x-8 md:space-x-12 animate-marquee whitespace-nowrap">
          <span className="text-indigo-600 font-medium text-sm md:text-base mx-3 md:mx-4">✦ resumes</span>
          <span className="text-indigo-600 font-medium text-sm md:text-base mx-3 md:mx-4">✦ cover letters</span>
          <span className="text-indigo-600 font-medium text-sm md:text-base mx-3 md:mx-4">✦ job tracking</span>
          <span className="text-indigo-600 font-medium text-sm md:text-base mx-3 md:mx-4">✦ ats optimization</span>
          <span className="text-indigo-600 font-medium text-sm md:text-base mx-3 md:mx-4">✦ keywords</span>
          <span className="text-indigo-600 font-medium text-sm md:text-base mx-3 md:mx-4">✦ analytics</span>
          <span className="text-indigo-600 font-medium text-sm md:text-base mx-3 md:mx-4">✦ resumes</span>
          <span className="text-indigo-600 font-medium text-sm md:text-base mx-3 md:mx-4">✦ cover letters</span>
        </div>
      </div>

      {/* Online Marketing Section - Cover Letters */}
      <section className="bg-white py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-1 md:order-1 mb-8 md:mb-0"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-800 p-4 rounded-lg">
                  <img 
                    src="/images/analytics-chart.svg" 
                    alt="Analytics Chart" 
                    className="w-full h-auto" 
                  />
                </div>
                <div className="bg-slate-800 p-4 rounded-lg">
                  <img 
                    src="/images/pie-chart.svg" 
                    alt="Pie Chart" 
                    className="w-full h-auto" 
                  />
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-2 md:order-2"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-2 md:mb-4 inline-block">STAND OUT FROM THE CROWD</span>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 md:mb-4">
                Tailored <br className="hidden sm:block"/>
                <span className="text-indigo-600">Cover Letters</span>
              </h2>
              <p className="text-slate-600 mb-4 md:mb-6 text-sm md:text-base">
                Generate personalized cover letters that perfectly match both your experience and the job requirements.
                Our AI analyzes job descriptions to highlight the most relevant qualifications and skills, increasing your chances of landing an interview.
              </p>
              <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-slate-700 text-sm md:text-base">Personalized for each job application</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-slate-700 text-sm md:text-base">Highlights relevant experience</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-slate-700 text-sm md:text-base">Professional tone and formatting</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Business Insights Section */}
      <section className="bg-gradient-to-b from-indigo-950 via-indigo-900 to-purple-900 py-24 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-4 inline-block">STAY ORGANIZED</span>
            <h2 className="text-4xl font-bold mb-4">
              Track Your<br/>
              <span className="text-indigo-400">Applications</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Application Status</h3>
              <p className="text-indigo-200 text-sm">
                Keep track of all your job applications in one place with real-time status updates.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Document Management</h3>
              <p className="text-indigo-200 text-sm">
                Store all your resumes and cover letters with each application for easy reference.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Performance Analytics</h3>
              <p className="text-indigo-200 text-sm">
                Analyze your application success rate to continuously improve your job search strategy.
              </p>
            </motion.div>
          </div>
          
          <div className="bg-indigo-900/50 rounded-xl p-8 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">
                  From Struggle<br/>
                  <span className="text-indigo-400">To Solution</span>
                </h3>
                <p className="text-indigo-200 mb-6">
                  During my own job search, I experienced firsthand how costly and inefficient most resume tools were. 
                  I created this platform with a simple mission: no one should have to go through the same struggles I did.
                </p>
                <a href="#testimonials" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors inline-block text-sm">
                  Read Success Stories
                </a>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-800/50 p-4 rounded-lg">
                  <div className="mb-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-700/60 flex items-center justify-center mb-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-500"></div>
                    </div>
                  </div>
                  <div className="h-24 bg-gradient-to-t from-indigo-600/20 to-transparent rounded"></div>
                </div>
                <div className="grid grid-rows-2 gap-4">
                  <div className="bg-indigo-800/50 p-4 rounded-lg">
                    <div className="text-xs text-indigo-300">March Interviews</div>
                    <div className="text-lg font-bold">+24</div>
                  </div>
                  <div className="bg-indigo-800/50 p-4 rounded-lg">
                    <div className="text-xs text-indigo-300">April Interviews</div>
                    <div className="text-lg font-bold">+29</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Innovations Showcase */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 md:mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-2 md:mb-4 inline-block">POWERFUL FEATURES</span>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              AI-Powered Tools for<br/>
              <span className="text-indigo-600">Job Seekers</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              <div className="h-36 md:h-48 bg-gradient-to-br from-yellow-400 to-orange-600 overflow-hidden">
                <div className="h-full w-full flex items-center justify-center">
                  <svg className="w-16 h-16 md:w-24 md:h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>
              <div className="p-4 md:p-6">
                <h3 className="text-center text-lg font-semibold mb-2">Smart Keyword Extraction</h3>
                <p className="text-center text-slate-600 text-sm">
                  Our algorithm identifies and incorporates the exact keywords ATS systems are programmed to look for
                </p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              <div className="h-36 md:h-48 bg-gradient-to-br from-pink-400 to-purple-600 overflow-hidden">
                <div className="h-full w-full flex items-center justify-center">
                  <svg className="w-16 h-16 md:w-24 md:h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path>
                  </svg>
                </div>
              </div>
              <div className="p-4 md:p-6">
                <h3 className="text-center text-lg font-semibold mb-2">Tailored Resume Creation</h3>
                <p className="text-center text-slate-600 text-sm">
                  Generate personalized resumes that perfectly match both your experience and the job requirements
                </p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white rounded-lg shadow-lg overflow-hidden sm:col-span-2 md:col-span-1 mx-auto sm:mx-0 max-w-sm sm:max-w-none"
            >
              <div className="h-36 md:h-48 bg-gradient-to-br from-green-400 to-teal-600 overflow-hidden">
                <div className="h-full w-full flex items-center justify-center">
                  <svg className="w-16 h-16 md:w-24 md:h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                  </svg>
                </div>
              </div>
              <div className="p-4 md:p-6">
                <h3 className="text-center text-lg font-semibold mb-2">Application Tracking System</h3>
                <p className="text-center text-slate-600 text-sm">
                  Comprehensive dashboard to organize your job search and track all applications in one place
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-slate-50 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 md:mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-2 md:mb-4 inline-block">SUCCESS STORIES</span>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              What Our Users<br/>
              <span className="text-indigo-600">Are Saying</span>
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-sm md:text-base">
              Real stories from job seekers who transformed their career prospects using ATScribe's platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white p-4 md:p-6 rounded-lg shadow-md"
            >
              <p className="text-slate-600 mb-6 text-sm md:text-base">
                "Before using ATScribe, I applied to 50+ jobs with no responses. After optimizing my resume with the ATS feature, I started getting interviews within days. Now I've landed my dream job as a UX designer!"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12a4 4 0 110-8 4 4 0 010 8z"></path>
                    <path d="M20 21a8 8 0 00-16 0"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-sm md:text-base">Sarah Kim</h4>
                  <p className="text-xs md:text-sm text-slate-500">Recent Graduate</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white p-4 md:p-6 rounded-lg shadow-md"
            >
              <p className="text-slate-600 mb-6 text-sm md:text-base">
                "As a student on a budget, I couldn't afford expensive resume services. ATScribe provided everything I needed at a price I could actually afford. The AI-generated cover letters were perfectly tailored for each application."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12a4 4 0 110-8 4 4 0 010 8z"></path>
                    <path d="M20 21a8 8 0 00-16 0"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-sm md:text-base">James Wilson</h4>
                  <p className="text-xs md:text-sm text-slate-500">Computer Science Student</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white p-4 md:p-6 rounded-lg shadow-md"
            >
              <p className="text-slate-600 mb-6 text-sm md:text-base">
                "The application tracking system has been a game-changer. I can finally keep track of all my applications in one place, with all my documents organized. I've increased my application efficiency by 300%!"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12a4 4 0 110-8 4 4 0 010 8z"></path>
                    <path d="M20 21a8 8 0 00-16 0"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-sm md:text-base">Emily Rodriguez</h4>
                  <p className="text-xs md:text-sm text-slate-500">Marketing Intern</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 py-12 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6">
            Affordable Resume Tools<br/>
            <span className="text-indigo-200">For Students & Early Careers</span>
          </h2>
          <p className="text-base md:text-xl text-indigo-100 mb-8 md:mb-10 max-w-2xl mx-auto">
            Our AI-powered platform makes the job search process easier and more effective. 
            Get the tools you need to land your dream job at a price you can afford.
          </p>
          <a href="/auth?signup=true" className="px-6 md:px-8 py-3 bg-white hover:bg-indigo-50 text-indigo-600 font-medium rounded-md transition-colors inline-block">
            Start Your Job Search
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-10 md:py-12 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between mb-6 md:mb-8">
            <div className="mb-8 md:mb-0">
              <div className="text-xl md:text-2xl font-bold mb-3 md:mb-4">ATScribe</div>
              <p className="text-slate-400 max-w-xs text-sm md:text-base">
                AI-powered resume and cover letter builder to help students and early career professionals land their dream jobs.
              </p>
              <p className="text-slate-500 mt-3 md:mt-4 text-xs md:text-sm">
                A product of Futureaiit Consulting Private Limited
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 md:gap-8">
              <div>
                <h4 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Product</h4>
                <ul className="space-y-2">
                  <li><a href="#features" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm md:text-base">Resume Builder</a></li>
                  <li><Link href="/pricing"><a className="text-slate-400 hover:text-indigo-400 transition-colors text-sm md:text-base">Pricing</a></Link></li>
                  <li><a href="#features" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm md:text-base">Job Tracker</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Company</h4>
                <ul className="space-y-2">
                  <li><Link href="/about"><a className="text-slate-400 hover:text-indigo-400 transition-colors text-sm md:text-base">About Us</a></Link></li>
                  <li><a href="#testimonials" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm md:text-base">Testimonials</a></li>
                  <li><a href="mailto:contact@ATScribe.com" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm md:text-base">Contact</a></li>
                </ul>
              </div>
              
              <div className="col-span-2 sm:col-span-1 mt-6 sm:mt-0">
                <h4 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Legal</h4>
                <ul className="space-y-2">
                  <li><a href="/privacy" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm md:text-base">Privacy Policy</a></li>
                  <li><a href="/terms" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm md:text-base">Terms of Service</a></li>
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
                  <path fillRule="evenodd" d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" clipRule="evenodd"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 