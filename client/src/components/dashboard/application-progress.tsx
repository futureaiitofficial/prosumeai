import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ApplicationProgressProps {
  className?: string;
  jobApplications: any[];
}

export default function ApplicationProgress({ className, jobApplications }: ApplicationProgressProps) {
  const [timeRange, setTimeRange] = useState<'weekly' | 'monthly'>('monthly');
  
  // Count applications by status
  const statusCounts = {
    applied: 0,
    screening: 0,
    assessment: 0,
    offer: 0,
    rejected: 0,
    accepted: 0,
  };
  
  jobApplications.forEach(app => {
    if (statusCounts.hasOwnProperty(app.status)) {
      statusCounts[app.status as keyof typeof statusCounts]++;
    }
  });
  
  // Define progress stages with their counts
  const stages = [
    { name: 'Applied', count: statusCounts.applied, height: 'h-24' },
    { name: 'Screening', count: statusCounts.screening, height: 'h-16' },
    { name: 'Assessment', count: statusCounts.assessment, height: 'h-12' },
    { name: 'Offer', count: statusCounts.offer, height: 'h-8' },
    { name: 'Accepted', count: statusCounts.accepted, height: 'h-4' },
  ];
  
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Application Progress</h3>
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              className={cn(
                "rounded-md px-2 py-1 text-xs",
                timeRange === 'weekly' && "bg-slate-100 dark:bg-slate-800"
              )}
              onClick={() => setTimeRange('weekly')}
            >
              Weekly
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className={cn(
                "rounded-md px-2 py-1 text-xs",
                timeRange === 'monthly' && "bg-slate-100 dark:bg-slate-800"
              )}
              onClick={() => setTimeRange('monthly')}
            >
              Monthly
            </Button>
          </div>
        </div>
        <div className="mt-6">
          <div className="flex h-40 items-end justify-between">
            {stages.map((stage, index) => (
              <div key={stage.name} className="flex flex-col items-center">
                <div className={cn(
                  stage.count > 0 ? stage.height : "h-2",
                  "w-12 rounded-t-md",
                  `bg-primary-${200 + (index * 100)} dark:bg-primary-${900 - (index * 100)}`
                )}></div>
                <span className="mt-2 text-xs">{stage.name}</span>
                <span className="font-medium">{stage.count}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
