import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Briefcase, MapPin, Calendar, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type JobApplication = {
  id: number;
  userId: number;
  company: string;
  jobTitle: string;
  jobDescription?: string;
  location?: string;
  workType?: string;
  salary?: string;
  jobUrl?: string;
  status: string;
  statusHistory?: StatusHistoryEntry[];
  appliedAt: string;
  resumeId?: number;
  coverLetterId?: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  priority?: string;
  deadlineDate?: string;
  updatedAt: string;
};

type StatusHistoryEntry = {
  id: string;
  status: string;
  date: string;
  notes: string | null;
};

interface KanbanViewProps {
  applications: JobApplication[];
  onStatusUpdate: (applicationId: number, newStatus: string) => void;
  onViewDetails: (application: JobApplication) => void;
  onEditApplication: (application: JobApplication) => void;
}

// Defines the status columns used in the Kanban board
// IMPORTANT: The 'id' field here must match the status values in the database

const statusColumns = [
  { id: "applied", title: "Applied" },
  { id: "screening", title: "Screening" },
  { id: "interview", title: "Interview" },
  { id: "assessment", title: "Assessment" },
  { id: "offer", title: "Offer" },
  { id: "rejected", title: "Rejected" },
  { id: "accepted", title: "Accepted" },
];

function getStatusBadgeColor(status: string) {
  switch (status.toLowerCase()) {
    case "applied":
      return "blue";
    case "screening":
      return "indigo";
    case "interview":
      return "yellow";
    case "assessment":
      return "violet";
    case "offer":
      return "green";
    case "rejected":
      return "red";
    case "accepted":
      return "emerald";
    default:
      return "gray";
  }
}

function getPriorityBadgeColor(priority: string) {
  switch (priority.toLowerCase()) {
    case "high":
      return "red";
    case "medium":
      return "amber";
    case "low":
      return "green";
    default:
      return "gray";
  }
}

export function KanbanView({
  applications,
  onStatusUpdate,
  onViewDetails,
  onEditApplication,
}: KanbanViewProps) {
  const getApplicationsByStatus = (status: string) => {
    return applications.filter(
      (app) => app.status.toLowerCase() === status.toLowerCase()
    );
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const applicationId = parseInt(draggableId);
    const newStatus = destination.droppableId;

    onStatusUpdate(applicationId, newStatus);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 overflow-x-auto pb-4">
        {statusColumns.map((column) => (
          <div
            key={column.id}
            className="flex-shrink-0 w-full md:w-[300px] flex flex-col"
          >
            <div className="bg-background shadow rounded-t-md p-3 border border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">{column.title}</h3>
                <Badge variant="outline" className="bg-muted">
                  {getApplicationsByStatus(column.id).length}
                </Badge>
              </div>
            </div>
            
            <Droppable droppableId={column.id}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex-1 bg-muted/30 rounded-b-md p-2 min-h-[500px] border-x border-b border-border"
                >
                  {getApplicationsByStatus(column.id).map((application, index) => (
                    <Draggable
                      key={application.id}
                      draggableId={application.id.toString()}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="mb-3"
                        >
                          <Card className="hover:shadow-md transition-shadow">
                            <CardHeader className="p-4 pb-0">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-md mb-1">
                                    {application.company}
                                  </CardTitle>
                                  <CardDescription>
                                    {application.jobTitle}
                                  </CardDescription>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => onViewDetails(application)}>
                                      View details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onEditApplication(application)}>
                                      Edit application
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {application.jobUrl && (
                                      <DropdownMenuItem onClick={() => window.open(application.jobUrl, '_blank')}>
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        Open job link
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </CardHeader>
                            <CardContent className="p-4">
                              {application.location && (
                                <div className="flex items-center text-xs text-muted-foreground mb-1">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {application.location}
                                  {application.workType && (
                                    <span className="ml-1">• {application.workType}</span>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3 mr-1" />
                                Applied: {format(new Date(application.appliedAt), "MMM d, yyyy")}
                              </div>
                            </CardContent>
                            <CardFooter className="p-4 pt-0">
                              <div className="flex justify-between items-center w-full">
                                {application.priority && (
                                  <Badge variant="outline" className={`bg-${getPriorityBadgeColor(application.priority)}-50 text-${getPriorityBadgeColor(application.priority)}-700 dark:bg-${getPriorityBadgeColor(application.priority)}-900 dark:text-${getPriorityBadgeColor(application.priority)}-300`}>
                                    {application.priority.charAt(0).toUpperCase() + application.priority.slice(1)}
                                  </Badge>
                                )}
                                <Button variant="secondary" size="sm" onClick={() => onViewDetails(application)}>
                                  View Details
                                </Button>
                              </div>
                            </CardFooter>
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}