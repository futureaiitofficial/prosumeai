import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  FileText, 
  Briefcase, 
  BarChart3,
  TrendingUp,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

interface JobApplication {
  id: string;
  status?: string;
}

interface StatsCardsProps {
  jobApplications: JobApplication[];
  className?: string;
}

export default function StatsCards({ jobApplications, className }: StatsCardsProps) {
  // Calculate stats from job applications
  const totalApplications = jobApplications.length;
  const interviewCount = jobApplications.filter(app => 
    app.status === 'INTERVIEW' || app.status === 'TECHNICAL_INTERVIEW'
  ).length;
  const rejectedCount = jobApplications.filter(app => 
    app.status === 'REJECTED'
  ).length;
  const pendingCount = jobApplications.filter(app => 
    app.status === 'APPLIED' || app.status === 'SUBMITTED'
  ).length;
  
  const stats = [
    {
      title: "Total Applications",
      value: totalApplications,
      icon: Briefcase,
      color: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Interviews",
      value: interviewCount,
      icon: Users,
      color: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      iconColor: "text-green-600 dark:text-green-400"
    },
    {
      title: "Pending",
      value: pendingCount,
      icon: Clock,
      color: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      iconColor: "text-amber-600 dark:text-amber-400"
    },
    {
      title: "Rejected",
      value: rejectedCount,
      icon: XCircle,
      color: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      iconColor: "text-red-600 dark:text-red-400"
    },
  ];

  return (
    <div className={cn("grid gap-4 grid-cols-2 md:grid-cols-4", className)}>
      {stats.map((stat, index) => (
        <Card key={index} className="overflow-hidden border-0 shadow-md">
          <CardContent className="p-0">
            <div className="flex flex-col h-full">
              <div className={cn("p-4 flex items-center justify-between", stat.color)}>
                <h3 className="font-medium text-sm">{stat.title}</h3>
                <stat.icon className={cn("h-5 w-5", stat.iconColor)} />
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 flex-1 flex items-center justify-center">
                <span className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                  {stat.value}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
