import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Clock, MoreVertical } from "lucide-react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RecentActivityProps {
  className?: string;
  jobApplications: any[];
}

export default function RecentActivity({ className, jobApplications }: RecentActivityProps) {
  // Sort applications by updated date
  const recentActivities = [...jobApplications]
    .sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    })
    .slice(0, 3); // Limit to 3 most recent activities

  const formatActivityDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return `Today at ${format(date, "h:mm a")}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, "h:mm a")}`;
    } else {
      return `${format(date, "EEE, MMM d")} at ${format(date, "h:mm a")}`;
    }
  };

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <h3 className="text-lg font-medium">Recent Activity</h3>
        <div className="mt-4 space-y-4">
          {recentActivities.length > 0 ? (
            <>
              {recentActivities.map((application) => (
                <div key={application.id} className="flex items-start space-x-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
                    <Activity className="h-5 w-5 text-primary-600 dark:text-primary-300" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{application.jobTitle} at {application.company}</h4>
                    <div className="mt-1 flex items-center text-sm text-slate-500">
                      <Clock className="mr-1 h-3 w-3" />
                      <span>{formatActivityDate(application.updatedAt)}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Status: {application.status}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/job-applications/${application.id}`}>
                          View Application
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              <Link href="/job-applications">
                <Button variant="outline" className="w-full mt-2">
                  View All Applications
                </Button>
              </Link>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-6">
              <Activity className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-2" />
              <h4 className="text-sm font-medium">No Recent Activity</h4>
              <p className="text-xs text-slate-500 mt-1">
                When you apply for jobs, your activity will appear here
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}