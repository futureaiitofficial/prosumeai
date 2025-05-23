import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, ChevronRight, Building, Calendar, Clock, Eye, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { JobApplicationStatus, statusColors } from "@/types/job-application";

interface JobApplication {
  id: string;
  jobTitle?: string;
  company?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  location?: string;
}

interface RecentApplicationsProps {
  jobApplications: JobApplication[];
  className?: string;
}

export default function RecentApplications({ jobApplications, className }: RecentApplicationsProps) {
  // Get the most recent 5 applications
  const recentApplications = [...jobApplications]
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5);

  // Function to format date to readable format
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown date";
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
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
    <Card className={cn("shadow-md", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Recent Applications</CardTitle>
            <CardDescription>Your most recently submitted job applications</CardDescription>
          </div>
          <Link href="/job-applications">
            <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {recentApplications.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {recentApplications.map((application) => (
                <motion.div
                  key={application.id}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  <div className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate">
                          {application.jobTitle || "Untitled Position"}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {application.company && (
                            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                              <Building className="mr-1 h-3 w-3" />
                              <span className="truncate">{application.company}</span>
                            </div>
                          )}
                          {application.location && (
                            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                              <span className="truncate">{application.location}</span>
                            </div>
                          )}
                          {application.createdAt && (
                            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                              <Calendar className="mr-1 h-3 w-3" />
                              <span>{formatDate(application.createdAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={cn("whitespace-nowrap", getStatusBadgeClass(application.status))}>
                          {application.status || "Unknown Status"}
                        </Badge>
                        <Link href={`/job-applications?id=${application.id}`}>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-full p-4 mb-4">
              <Building className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">No applications yet</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
              Start tracking your job applications to see them here
            </p>
            <Link href="/job-applications">
              <Button className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                Add Application
                <Plus className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
