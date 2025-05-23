import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation } from "wouter";
import DefaultLayout from "@/components/layouts/default-layout";
import StatsCards from "@/components/dashboard/stats-cards";
import ApplicationProgress from "@/components/dashboard/application-progress";
import RecentApplications from "@/components/dashboard/recent-applications";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight, FileText, FilePlus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { JobApplicationStatus } from "@/types/job-application";

// Define a type for job applications
interface JobApplication {
  id: string;
  // Add other properties based on your actual data structure
  // These are just examples:
  jobTitle?: string;
  company?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Define types for resumes and cover letters
interface Resume {
  id: string;
  title?: string;
  // Add other properties as needed
}

interface CoverLetter {
  id: string;
  title?: string;
  // Add other properties as needed
}

export default function Dashboard() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  
  // Check if user is newly registered and redirect to subscription page 
  // if there's no subscription and the "showSubscription" param is present
  useEffect(() => {
    if (user) {
      const urlParams = new URLSearchParams(window.location.search);
      const showSubscription = urlParams.get('showSubscription');
      
      // If the showSubscription parameter is present, redirect to subscription page with plans tab active
      if (showSubscription === 'true') {
        navigate('/user/subscription?tab=plans');
      }
    }
  }, [user, navigate]);
  
  const { data: jobApplications = [] } = useQuery<JobApplication[]>({
    queryKey: ["/api/job-applications"],
    enabled: !!user,
  });
  
  // Add queries for resumes and cover letters
  const { data: resumes = [] } = useQuery<Resume[]>({
    queryKey: ["/api/resumes"],
    enabled: !!user,
  });
  
  const { data: coverLetters = [] } = useQuery<CoverLetter[]>({
    queryKey: ["/api/cover-letters"],
    enabled: !!user,
  });
  
  // Add a query to check if the user has a subscription
  const { data: subscription, isLoading: isSubscriptionLoading } = useQuery({
    queryKey: ['userSubscription'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/user/subscription');
        const data = await response.json();
        return data && data.length > 0 ? data[0] : null;
      } catch (error) {
        console.error("Error fetching subscription:", error);
        return null;
      }
    },
    enabled: !!user,
  });

  // Animation variants for staggered loading
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  return (
    <DefaultLayout 
      pageTitle="Dashboard" 
      pageDescription="Welcome back! Here's an overview of your job search progress."
    >
      <motion.div
        className="space-y-4 max-w-full"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Subscription Notice - show for users without a subscription */}
        {!isSubscriptionLoading && !subscription && (
          <motion.div 
            variants={itemVariants}
            className="mb-2 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl shadow-sm dark:from-indigo-900/30 dark:to-purple-900/30 dark:border-indigo-800/30"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-medium text-indigo-800 dark:text-indigo-300">Choose a Subscription Plan</h3>
                <p className="text-indigo-700 dark:text-indigo-400 mt-1 text-sm">
                  Unlock all features with a premium plan
                </p>
              </div>
              <Button 
                onClick={() => navigate('/user/subscription?tab=plans')}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
                size="sm"
              >
                View Plans
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
        
        {/* Stats Cards */}
        <motion.div variants={itemVariants}>
          <StatsCards jobApplications={jobApplications} />
        </motion.div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Top Row - Application Progress Full Width */}
          <motion.div variants={itemVariants} className="lg:col-span-12">
            {/* Application Progress */}
            <div className="h-full">
              <ApplicationProgress jobApplications={jobApplications} />
            </div>
          </motion.div>
          
          {/* Middle Row - Document Cards */}
          <motion.div variants={itemVariants} className="lg:col-span-6">
            {/* Resumes Card */}
            <Card className="shadow-md h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">Resumes</CardTitle>
                    <CardDescription>You have {resumes.length} resume{resumes.length !== 1 ? 's' : ''}</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate('/resumes')}
                    className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {resumes.length > 0 ? (
                  <div className="space-y-2">
                    {resumes.slice(0, 3).map((resume: any) => (
                      <div 
                        key={resume.id} 
                        className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-indigo-500" />
                          <span className="font-medium text-sm">{resume.title || "Untitled Resume"}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate(`/resume-builder?id=${resume.id}`)}
                          className="h-8 w-8 p-0 rounded-full"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-full p-4 mb-4">
                      <FileText className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">No resumes created yet</p>
                    <Button 
                      onClick={() => navigate('/resumes/new')} 
                      className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                      size="sm"
                    >
                      Create Resume
                      <FilePlus className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants} className="lg:col-span-6">
            {/* Cover Letters Card */}
            <Card className="shadow-md h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">Cover Letters</CardTitle>
                    <CardDescription>You have {coverLetters.length} cover letter{coverLetters.length !== 1 ? 's' : ''}</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate('/cover-letters')}
                    className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {coverLetters.length > 0 ? (
                  <div className="space-y-2">
                    {coverLetters.slice(0, 3).map((letter: any) => (
                      <div 
                        key={letter.id} 
                        className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-purple-500" />
                          <span className="font-medium text-sm">{letter.title || "Untitled Cover Letter"}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate(`/cover-letter-builder?id=${letter.id}`)}
                          className="h-8 w-8 p-0 rounded-full"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-full p-4 mb-4">
                      <FileText className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">No cover letters created yet</p>
                    <Button 
                      onClick={() => navigate('/cover-letters/new')} 
                      className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                      size="sm"
                    >
                      Create Cover Letter
                      <FilePlus className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Bottom Row - Full Width Recent Applications */}
          <motion.div variants={itemVariants} className="lg:col-span-12">
            {/* Recent Applications */}
            <RecentApplications jobApplications={jobApplications} />
          </motion.div>
        </div>
      </motion.div>
      
      {/* Floating Action Button - Mobile Only */}
      <div className="fixed bottom-20 right-4 md:hidden z-10">
        <Button 
          size="icon" 
          className="h-14 w-14 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
          onClick={() => navigate('/job-applications')}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </DefaultLayout>
  );
}
