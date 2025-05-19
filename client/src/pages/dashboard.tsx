import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation } from "wouter";
import DefaultLayout from "@/components/layouts/default-layout";
import StatsCards from "@/components/dashboard/stats-cards";
import ApplicationProgress from "@/components/dashboard/application-progress";
import RecentActivity from "@/components/dashboard/recent-activity";
import RecentApplications from "@/components/dashboard/recent-applications";
import { useAuth } from "@/hooks/use-auth";

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

export default function Dashboard() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  
  // Check if user is newly registered and redirect to subscription page 
  // if there's no subscription and the "showSubscription" param is present
  useEffect(() => {
    if (user) {
      const urlParams = new URLSearchParams(window.location.search);
      const showSubscription = urlParams.get('showSubscription');
      
      // If the showSubscription parameter is present, redirect to subscription page
      if (showSubscription === 'true') {
        navigate('/user/subscription');
      }
    }
  }, [user, navigate]);
  
  const { data: jobApplications = [] } = useQuery<JobApplication[]>({
    queryKey: ["/api/job-applications"],
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
  
  return (
    <DefaultLayout 
      pageTitle="Dashboard" 
      pageDescription="Welcome back! Here's an overview of your job search progress."
    >
      {/* Subscription Notice - show for users without a subscription */}
      {!isSubscriptionLoading && !subscription && (
        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <h3 className="text-lg font-medium text-indigo-800">Choose a Subscription Plan</h3>
          <p className="text-indigo-700 mt-1">
            You haven't selected a subscription plan yet. To unlock all features,{' '}
            <button
              onClick={() => navigate('/user/subscription')}
              className="text-indigo-600 font-medium underline hover:text-indigo-800"
            >
              choose a plan
            </button>.
          </p>
        </div>
      )}
      
      {/* Stats Cards */}
      <StatsCards jobApplications={jobApplications} />
      
      <div className="grid gap-6 md:grid-cols-5">
        {/* Application Progress */}
        <ApplicationProgress className="md:col-span-3" jobApplications={jobApplications} />
        
        {/* Recent Activity */}
        <RecentActivity className="md:col-span-2" jobApplications={jobApplications} />
      </div>
      
      {/* Recent Applications */}
      <RecentApplications jobApplications={jobApplications} />
    </DefaultLayout>
  );
}
