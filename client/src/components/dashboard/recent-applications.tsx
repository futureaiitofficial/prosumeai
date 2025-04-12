import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useState } from "react";

interface RecentApplicationsProps {
  jobApplications: any[];
}

const statusColors: Record<string, string> = {
  applied: "blue",
  screening: "blue",
  interview: "yellow",
  assessment: "green",
  offer: "orange",
  rejected: "red",
  accepted: "emerald",
};

export default function RecentApplications({ jobApplications }: RecentApplicationsProps) {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const applicationsPerPage = 3;
  
  // Sort applications by date (newest first)
  const sortedApplications = [...jobApplications].sort((a, b) => 
    new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
  );
  
  const totalPages = Math.ceil(sortedApplications.length / applicationsPerPage);
  const paginatedApplications = sortedApplications.slice(
    (currentPage - 1) * applicationsPerPage,
    currentPage * applicationsPerPage
  );
  
  const getStatusBadge = (status: string) => {
    const color = statusColors[status] || "gray";
    return (
      <Badge className={`bg-${color}-100 text-${color}-800 dark:bg-${color}-900 dark:text-${color}-300`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Recent Applications</h3>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Plus className="mr-1 h-4 w-4" />
              Add Application
            </Button>
          </div>
        </div>
        <div className="mt-6 overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-left text-sm font-medium text-slate-500 dark:border-slate-800">
                <th className="pb-3 pl-0">Company</th>
                <th className="pb-3">Position</th>
                <th className="pb-3">Applied</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 pr-0 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedApplications.length > 0 ? (
                paginatedApplications.map((application) => (
                  <tr key={application.id} className="border-b border-slate-200 text-sm dark:border-slate-800">
                    <td className="py-3 pl-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                          <span className="font-medium">
                            {application.company.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium">{application.company}</span>
                      </div>
                    </td>
                    <td className="py-3">{application.position}</td>
                    <td className="py-3">
                      <span>{format(new Date(application.appliedAt), "MMM d, yyyy")}</span>
                    </td>
                    <td className="py-3">
                      {getStatusBadge(application.status)}
                    </td>
                    <td className="py-3 pr-0 text-right">
                      <Button variant="ghost" size="icon" className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-sm text-slate-500">
                    No applications found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {jobApplications.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {paginatedApplications.length} of {jobApplications.length} applications
            </p>
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </Button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(page)}
                  >
                    <span className="text-sm">{page}</span>
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
