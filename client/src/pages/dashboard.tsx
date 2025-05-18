import { useQuery } from "@tanstack/react-query";
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
  
  const { data: jobApplications = [] } = useQuery<JobApplication[]>({
    queryKey: ["/api/job-applications"],
    enabled: !!user,
  });
  
  return (
    <DefaultLayout 
      pageTitle="Dashboard" 
      pageDescription="Welcome back! Here's an overview of your job search progress."
    >
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
