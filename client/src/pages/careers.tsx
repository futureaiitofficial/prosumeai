import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { ArrowLeft, Users, Building2, Globe, Briefcase, Heart, Zap, Target, Mail, MapPin, Clock, Code, Brain, Rocket, Award, CheckCircle, ArrowRight, Star } from 'lucide-react';
import SharedHeader from '@/components/layouts/shared-header';
import SharedFooter from '@/components/layouts/SharedFooter';
import { useBranding } from '@/components/branding/branding-provider';

export default function CareersPage() {
  const [, setLocation] = useLocation();
  const branding = useBranding();
  
  // Scroll to top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handle back navigation
  const handleBack = () => {
    window.location.href = "/";
  };

  return (
    <>
      <Helmet>
        <title>Careers - {branding.appName}</title>
        <meta name="description" content="Ready for the challenge? Join Futureaiit's mission to transform businesses with AI-driven digital solutions. Careers in AI, digital transformation & enterprise software." />
        <meta name="keywords" content="careers, jobs, AI careers, digital transformation, Futureaiit, tech jobs, machine learning, software engineering" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <SharedHeader forceBackground={true} />
        
        {/* Hero Section with integrated navigation */}
        <div className="relative pt-20 pb-16 bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative container mx-auto px-4 py-12">
            <div className="flex items-center mb-8">
              <Button 
                variant="ghost" 
                className="mr-4 text-white hover:text-indigo-200 hover:bg-white/10" 
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center text-white"
            >
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent"
              >
                Ready for the challenge?
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-xl md:text-2xl text-indigo-100 mb-8 max-w-4xl mx-auto leading-relaxed"
              >
                You'll have the freedom to experiment and build things your way – we believe that's how we'll win. 
                Transform businesses with AI-driven digital solutions that impact millions.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-gray-900 rounded-full text-lg font-bold shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
              >
                <Clock className="h-6 w-6 mr-3" />
                Positions Opening Soon
              </motion.div>
            </motion.div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-16">



          {/* We're a small team section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              We're building the future of AI-powered career development
            </h2>
            <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
              <span className="font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{branding.appName}</span> is revolutionizing how professionals create resumes, write cover letters, and land their dream jobs. 
              As part of <span className="font-bold text-slate-900">Futureaiit</span>, we're backed by a team with deep expertise in AI and enterprise solutions, 
              giving us the resources and knowledge to build something truly transformative.
            </p>
          </motion.div>

          {/* Company Values Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: <Users className="h-8 w-8" />,
                title: "You belong as you are",
                description: "There's no box for you to fit in with us, just be authentic. We celebrate diversity and believe the best ideas come from different perspectives.",
                color: "from-slate-600 to-slate-700"
              },
              {
                icon: <Rocket className="h-8 w-8" />,
                title: "We build career success stories", 
                description: "Your work directly impacts millions of job seekers. Every feature you build, every AI model you train helps someone land their dream job.",
                color: "from-indigo-600 to-indigo-700"
              },
              {
                icon: <Brain className="h-8 w-8" />,
                title: "You learn while solving real problems",
                description: "Got an innovative idea for resume AI or career matching? Pitch it and make it happen. We help you learn and grow with each challenge.",
                color: "from-slate-600 to-slate-700"
              },
              {
                icon: <Heart className="h-8 w-8" />,
                title: "Joy is part of work",
                description: "Building career tools should be fulfilling work. We choose projects that excite us and make a real difference in people's professional lives.",
                color: "from-slate-600 to-slate-700"
              },
              {
                icon: <Code className="h-8 w-8" />,
                title: "AI that empowers careers",
                description: "We're not just coding – we're building intelligent systems that understand resumes, job requirements, and career growth patterns.",
                color: "from-indigo-600 to-indigo-700"
              },
              {
                icon: <Award className="h-8 w-8" />,
                title: "Small team, big impact",
                description: "Every team member shapes the product direction. We move fast, make decisions quickly, and see our work impact users immediately.",
                color: "from-slate-600 to-slate-700"
              }
            ].map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 + index * 0.1, duration: 0.6 }}
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${value.color} rounded-xl mb-4 group-hover:scale-110 transition-transform`}>
                  <div className="text-white">
                    {value.icon}
                  </div>
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">{value.title}</h4>
                <p className="text-slate-600 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>

          {/* No open positions section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.0, duration: 0.6 }}
            className="text-center bg-slate-50 rounded-3xl p-12 mb-16"
          >
            <div className="max-w-2xl mx-auto">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 2.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-slate-400 to-slate-500 rounded-2xl mb-6"
              >
                <Briefcase className="h-10 w-10 text-white" />
              </motion.div>
              <h3 className="text-3xl font-bold text-slate-900 mb-4">No open positions at the moment</h3>
              <p className="text-xl text-slate-600 mb-8">Check back later for new opportunities!</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                <Star className="h-5 w-5 mr-2" />
                Get Notified
              </motion.button>
            </div>
          </motion.div>

          {/* What's Next - Hiring Process */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.4, duration: 0.6 }}
            className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 rounded-3xl p-8 md:p-16 mb-16 overflow-hidden"
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full"></div>
              <div className="absolute top-32 right-20 w-16 h-16 bg-white rounded-full"></div>
              <div className="absolute bottom-20 left-32 w-12 h-12 bg-white rounded-full"></div>
              <div className="absolute bottom-10 right-10 w-24 h-24 bg-white rounded-full"></div>
            </div>
            
            <div className="relative">
              <div className="text-center mb-16">
                <motion.h3 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.6, duration: 0.6 }}
                  className="text-3xl md:text-5xl font-bold text-white mb-6"
                >
                  What's next?
                </motion.h3>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.8, duration: 0.6 }}
                  className="text-xl text-indigo-200 max-w-2xl mx-auto"
                >
                  Here's how our hiring process works when we have open positions.
                </motion.p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                {[
                  {
                    step: "01",
                    title: "Apply with your best work",
                    description: "Share your resume, portfolio, or GitHub. Show us what you're passionate about building.",
                    icon: <Mail className="h-8 w-8" />,
                    color: "from-slate-600 to-slate-700"
                  },
                  {
                    step: "02", 
                    title: "Coffee chat (virtual)",
                    description: "A relaxed conversation about your experience, goals, and what excites you about AI and career tech.",
                    icon: <Users className="h-8 w-8" />,
                    color: "from-slate-600 to-slate-700"
                  },
                  {
                    step: "03",
                    title: "Build something cool",
                    description: "A fun technical challenge related to our product. We'll provide all the context and support you need.",
                    icon: <Code className="h-8 w-8" />,
                    color: "from-indigo-600 to-indigo-700"
                  },
                  {
                    step: "04",
                    title: "Meet the team",
                    description: "Present your solution and meet your potential teammates. We'll discuss your approach and answer any questions.",
                    icon: <CheckCircle className="h-8 w-8" />,
                    color: "from-indigo-600 to-indigo-700"
                  }
                ].map((item, index) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 3.0 + index * 0.2, duration: 0.8 }}
                    className="relative group"
                  >
                    <div className="flex items-start space-x-6">
                      {/* Step number */}
                      <div className="flex-shrink-0">
                        <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                          <span className="text-2xl font-bold text-white">{item.step}</span>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center mb-4">
                          <div className="text-white mr-3">
                            {item.icon}
                          </div>
                          <h4 className="text-2xl font-bold text-white">{item.title}</h4>
                        </div>
                        <p className="text-indigo-200 text-lg leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                    
                    {/* Connecting line for larger screens */}
                    {index < 3 && (
                      <div className="hidden lg:block absolute left-8 top-20 w-0.5 h-16 bg-gradient-to-b from-white/30 to-transparent"></div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Perks & Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.8, duration: 0.6 }}
            className="relative mb-16"
          >
            <div className="text-center mb-16">
              <motion.h3 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.0, duration: 0.6 }}
                className="text-3xl md:text-5xl font-bold text-slate-900 mb-4"
              >
                Perks & Benefits
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.2, duration: 0.6 }}
                className="text-xl text-slate-600 max-w-2xl mx-auto"
              >
                We believe great work deserves great rewards
              </motion.p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  emoji: "🌍",
                  title: "Work from anywhere",
                  description: "Complete flexibility to work remotely from any location in India",
                  gradient: "from-slate-600 to-slate-700",
                  bgGradient: "from-slate-50 to-slate-100"
                },
                {
                  emoji: "🏖️",
                  title: "24 days paid time off", 
                  description: "Generous PTO including mental health days and festival holidays",
                  gradient: "from-slate-600 to-slate-700",
                  bgGradient: "from-slate-50 to-slate-100"
                },
                {
                  emoji: "🎯",
                  title: "Annual team retreats",
                  description: "Fully-paid team trips to amazing destinations for bonding and planning",
                  gradient: "from-indigo-600 to-indigo-700",
                  bgGradient: "from-indigo-50 to-slate-50"
                },
                {
                  emoji: "🚀",
                  title: "₹50k learning budget",
                  description: "Annual budget for courses, conferences, books, and skill development",
                  gradient: "from-slate-600 to-slate-700",
                  bgGradient: "from-slate-50 to-slate-100"
                },
                {
                  emoji: "💪",
                  title: "Health & wellness covered",
                  description: "Complete health insurance plus ₹15k annual wellness allowance",
                  gradient: "from-slate-600 to-slate-700",
                  bgGradient: "from-slate-50 to-slate-100"
                },
                {
                  emoji: "💻",
                  title: "MacBook Pro + setup",
                  description: "Latest MacBook Pro, external monitor, all tools you need to excel",
                  gradient: "from-indigo-600 to-indigo-700",
                  bgGradient: "from-indigo-50 to-slate-50"
                }
              ].map((perk, index) => (
                <motion.div
                  key={perk.title}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    delay: 3.4 + index * 0.15, 
                    duration: 0.8,
                    type: "spring",
                    stiffness: 100
                  }}
                  className={`group relative bg-gradient-to-br ${perk.bgGradient} rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 border border-slate-200 overflow-hidden`}
                >
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                    <div className={`w-full h-full bg-gradient-to-br ${perk.gradient} rounded-full transform translate-x-8 -translate-y-8`}></div>
                  </div>
                  
                  {/* Icon with gradient background */}
                  <div className={`relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${perk.gradient} rounded-xl mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-2xl">{perk.emoji}</span>
                  </div>
                  
                  <h4 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-slate-700 transition-colors">
                    {perk.title}
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    {perk.description}
                  </p>
                  
                  {/* Hover effect overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${perk.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-3xl`}></div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Stay Connected Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.8, duration: 0.6 }}
            className="relative text-center bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white rounded-3xl p-8 md:p-12 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20"></div>
            <div className="relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 3.0, type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-6"
              >
                <Mail className="h-10 w-10 text-white" />
              </motion.div>
              <h3 className="text-3xl md:text-4xl font-bold mb-6">Stay Connected</h3>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                Be the first to know when we start hiring! Follow our journey and get notified about new opportunities.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 3.2, duration: 0.6 }}
                  className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20"
                >
                  <MapPin className="h-5 w-5 mr-3 text-indigo-300" />
                  <span className="text-white font-medium">Hyderabad, India</span>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 3.4, duration: 0.6 }}
                  className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20"
                >
                  <Mail className="h-5 w-5 mr-3 text-indigo-300" />
                  <span className="text-white font-medium">careers@futureaiit.com</span>
                </motion.div>
              </div>
              

            </div>
          </motion.div>
        </div>

        <SharedFooter />
      </div>
    </>
  );
} 