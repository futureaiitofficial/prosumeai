import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Calendar, Clock, FileText, Briefcase, CheckCircle2, XCircle } from "lucide-react";
import { JobApplicationStatus, statusColors } from "@/types/job-application";

interface JobApplication {
  id: string;
  jobTitle?: string;
  company?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface RecentActivityProps {
  jobApplications: JobApplication[];
  className?: string;
}

export default function RecentActivity({ jobApplications, className }: RecentActivityProps) {
  // Get the most recent 5 activities
  const recentActivities = [...jobApplications]
    .sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5);
    
  // Function to format date to relative time (e.g. "2 days ago")
  const getRelativeTime = (dateString?: string) => {
    if (!dateString) return "Unknown date";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hr ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  };
  
  // Function to get activity icon based on status
  const getActivityIcon = (status?: string) => {
    if (!status) return <FileText className="h-4 w-4 text-slate-500" />;
    
    switch (status) {
      case JobApplicationStatus.Applied:
        return <Briefcase className="h-4 w-4 text-blue-500" />;
      case JobApplicationStatus.Screening:
      case JobApplicationStatus.Interview:
        return <Calendar className="h-4 w-4 text-purple-500" />;
      case JobApplicationStatus.Assessment:
        return <FileText className="h-4 w-4 text-green-500" />;
      case JobApplicationStatus.Offer:
        return <CheckCircle2 className="h-4 w-4 text-orange-500" />;
      case JobApplicationStatus.Accepted:
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case JobApplicationStatus.Rejected:
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-slate-500" />;
    }
  };
  
  // Function to get status badge color
  const getStatusBadgeClass = (status?: string) => {
    if (!status) return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
    
    const color = statusColors[status] || statusColors.default;
    
    switch (color) {
      case "blue":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "purple":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "cyan":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300";
      case "green":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "orange":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "red":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "emerald":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
    }
  };
  
  return (
    <Card className={cn("shadow-md h-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        <CardDescription>Your latest job application updates</CardDescription>
      </CardHeader>
      <CardContent>
        {recentActivities.length > 0 ? (
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
              >
                <div className="mt-0.5">
                  {getActivityIcon(activity.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                      {activity.jobTitle || "Untitled Position"}
                    </h4>
                    <Badge variant="outline" className={cn("text-xs whitespace-nowrap", getStatusBadgeClass(activity.status))}>
                      {activity.status || "Unknown Status"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {activity.company || "Unknown Company"}
                  </p>
                  <div className="flex items-center mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="h-3 w-3 mr-1" />
                    {getRelativeTime(activity.updatedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-slate-500 dark:text-slate-400">No recent activity</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Start tracking your job applications
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}