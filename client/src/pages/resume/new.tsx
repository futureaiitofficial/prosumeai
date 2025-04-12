import MainLayout from "@/components/layouts/main-layout";
import { useNavigate } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function NewResumePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  return (
    <MainLayout>
      <div className="container max-w-screen-xl py-6 md:py-10">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Create New Resume</h1>
              <p className="text-muted-foreground">Select a template to get started</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 