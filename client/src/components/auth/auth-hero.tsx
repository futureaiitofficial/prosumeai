import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function AuthHero() {
  const features = [
    "Create ATS-optimized resumes with multiple templates",
    "Generate personalized cover letters for each job",
    "Track all your job applications in one place",
    "Get insights on your job search progress",
    "Affordable plans for students and early careers"
  ];

  return (
    <div className="relative hidden md:flex flex-1 items-center justify-center bg-indigo-950 overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900"></div>
      
      {/* Animated orbs */}
      <div className="absolute w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl -top-20 -right-20"></div>
      <div className="absolute w-64 h-64 rounded-full bg-purple-500/20 blur-3xl bottom-20 -left-20"></div>
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-md text-center px-8 py-12"
      >
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-white/10 p-4 backdrop-blur-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-10 w-10 text-white"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-white mb-2">
          ATScribe
        </h1>
        
        <p className="text-lg text-indigo-200 mb-8">
          AI-powered tools to help you land your dream job
        </p>
        
        <div className="mb-10">
          <ul className="space-y-4 text-left">
            {features.map((feature, index) => (
              <motion.li 
                key={index} 
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
              >
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-indigo-400 mt-0.5" />
                <span className="text-white">{feature}</span>
              </motion.li>
            ))}
          </ul>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="rounded-lg bg-white/10 p-6 backdrop-blur-sm border border-white/10"
        >
          <blockquote>
            <p className="text-base italic text-indigo-200">
              "ATScribe helped me organize my job search and land my dream position. The AI-powered resume tools were a game-changer for my career."
            </p>
            <footer className="mt-4 font-medium text-white">
              — Sarah Johnson, Software Engineer
            </footer>
          </blockquote>
        </motion.div>
      </motion.div>
    </div>
  );
}
