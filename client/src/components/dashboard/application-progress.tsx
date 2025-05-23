import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LabelList, Cell } from "recharts";
import { JobApplicationStatus, statusColors } from "@/types/job-application";

interface JobApplication {
  id: string;
  status?: string;
}

interface ApplicationProgressProps {
  jobApplications: JobApplication[];
  className?: string;
}

export default function ApplicationProgress({ jobApplications, className }: ApplicationProgressProps) {
  // Count applications by status
  const statusCounts = jobApplications.reduce((acc: Record<string, number>, app) => {
    const status = app.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // Define status categories and colors
  const statusCategories = [
    { name: 'Applied', statuses: [JobApplicationStatus.Applied], color: statusColors[JobApplicationStatus.Applied] === 'blue' ? '#3b82f6' : '#3b82f6' },
    { name: 'Interview', statuses: [JobApplicationStatus.Interview, JobApplicationStatus.Screening], color: statusColors[JobApplicationStatus.Interview] === 'cyan' ? '#06b6d4' : '#8b5cf6' },
    { name: 'Assessment', statuses: [JobApplicationStatus.Assessment], color: statusColors[JobApplicationStatus.Assessment] === 'green' ? '#10b981' : '#10b981' },
    { name: 'Offer', statuses: [JobApplicationStatus.Offer], color: statusColors[JobApplicationStatus.Offer] === 'orange' ? '#f59e0b' : '#f59e0b' },
    { name: 'Rejected', statuses: [JobApplicationStatus.Rejected], color: statusColors[JobApplicationStatus.Rejected] === 'red' ? '#ef4444' : '#ef4444' },
    { name: 'Accepted', statuses: [JobApplicationStatus.Accepted], color: statusColors[JobApplicationStatus.Accepted] === 'emerald' ? '#10b981' : '#10b981' },
    { name: 'Other', statuses: ['unknown'], color: '#94a3b8' }
  ];

  // Calculate data for chart
  const chartData = statusCategories.map(category => {
    const count = category.statuses.reduce((total, status) => {
      return total + (statusCounts[status] || 0);
    }, 0);
    
    return {
      name: category.name,
      value: count,
      color: category.color
    };
  }).filter(item => item.value > 0);

  // Calculate success rate
  const totalApplications = jobApplications.length;
  const interviewCount = (statusCounts[JobApplicationStatus.Interview] || 0) + 
                         (statusCounts[JobApplicationStatus.Screening] || 0);
  const offerCount = statusCounts[JobApplicationStatus.Offer] || 0;
  
  const interviewRate = totalApplications ? Math.round((interviewCount / totalApplications) * 100) : 0;
  const offerRate = totalApplications ? Math.round((offerCount / totalApplications) * 100) : 0;

  return (
    <Card className={cn("shadow-md", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Application Progress</CardTitle>
        <CardDescription>Track your job application success rates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chart */}
          <div className="h-[200px] sm:h-[250px] flex items-center justify-center">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
                  barSize={30}
                >
                  <XAxis 
                    dataKey="name" 
                    scale="point" 
                    padding={{ left: 10, right: 10 }} 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <Tooltip
                    formatter={(value: number) => [`${value} applications`, 'Count']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '0.5rem',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      padding: '0.5rem 1rem',
                    }}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[4, 4, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                      />
                    ))}
                    <LabelList 
                      dataKey="value" 
                      position="top" 
                      fill="#6b7280" 
                      fontSize={12} 
                      offset={5}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 dark:text-slate-500">
                No application data available
              </div>
            )}
          </div>
          
          {/* Success Rates */}
          <div className="space-y-6 flex flex-col justify-center">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-sm font-medium">Interview Rate</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Applications that led to interviews
                  </p>
                </div>
                <span className="text-lg font-bold">{interviewRate}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full" 
                  style={{ width: `${interviewRate}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-sm font-medium">Offer Rate</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Applications that led to job offers
                  </p>
                </div>
                <span className="text-lg font-bold">{offerRate}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full" 
                  style={{ width: `${offerRate}%` }}
                />
              </div>
            </div>
            
            <div className="pt-2 grid grid-cols-3 gap-2">
              {statusCategories.filter(category => category.name !== 'Other' || chartData.some(data => data.name === 'Other')).map((category, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                  <span className="text-xs text-slate-600 dark:text-slate-300">{category.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
