import { Card } from "@/components/ui/card";
import { 
  Clipboard, 
  CalendarCheck, 
  File, 
  FileText,
  TrendingUp
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

interface StatsCardsProps {
  jobApplications: any[];
}

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeText 
}: { 
  title: string;
  value: number | string;
  icon: React.ElementType;
  change?: "up" | "down" | null;
  changeText?: string;
}) => {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between space-x-2">
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
        <Icon className="h-4 w-4 text-primary-500" />
      </div>
      <div className="mt-2">
        <p className="text-2xl font-bold">{value}</p>
        {changeText && (
          <p className={`text-xs ${change === 'up' ? 'text-green-500' : change === 'down' ? 'text-red-500' : 'text-slate-500'}`}>
            {change === 'up' && (
              <TrendingUp className="inline h-3 w-3 mr-1" />
            )}
            <span>{changeText}</span>
          </p>
        )}
      </div>
    </Card>
  );
};

export default function StatsCards({ jobApplications }: StatsCardsProps) {
  const { user } = useAuth();
  
  const { data: resumes = [] } = useQuery({
    queryKey: ["/api/resumes"],
    enabled: !!user,
  });
  
  const { data: coverLetters = [] } = useQuery({
    queryKey: ["/api/cover-letters"],
    enabled: !!user,
  });
  
  // Filter applications by status
  const activeApplications = jobApplications.filter(app => 
    !['rejected', 'accepted'].includes(app.status)
  );
  
  const interviewApplications = jobApplications.filter(app => 
    app.status === 'interview'
  );
  
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard 
        title="Active Applications" 
        value={activeApplications.length}
        icon={Clipboard}
        change="up"
        changeText={activeApplications.length > 0 ? `${activeApplications.length} in progress` : 'No active applications'} 
      />
      
      <StatCard 
        title="Interviews" 
        value={interviewApplications.length}
        icon={CalendarCheck}
        change={interviewApplications.length > 0 ? "up" : null}
        changeText={interviewApplications.length > 0 ? `${interviewApplications.length} scheduled` : 'No interviews scheduled'} 
      />
      
      <StatCard 
        title="Resumes" 
        value={resumes.length}
        icon={File}
        changeText={resumes.length > 0 ? "Last updated 2 days ago" : 'No resumes created'} 
      />
      
      <StatCard 
        title="Cover Letters" 
        value={coverLetters.length}
        icon={FileText}
        changeText={coverLetters.length > 0 ? "Templates ready to use" : 'No cover letters created'} 
      />
    </div>
  );
}
