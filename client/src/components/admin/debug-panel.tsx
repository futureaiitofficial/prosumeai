import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCopyToClipboard } from "../../hooks/use-copy-to-clipboard";
import { AlertCircle, CheckCircle, Copy, Database, ShieldAlert, Terminal, Trash, User } from "lucide-react";

export function AdminDebugPanel() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { copy } = useCopyToClipboard();
  
  // Fetch system debug info
  const fetchSystemInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest("GET", "/api/admin/debug");
      const data = await response.json();
      
      setSystemInfo(data);
      
      toast({
        title: "Debug Info Loaded",
        description: "System information has been loaded successfully.",
        variant: "default",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch system info");
      
      toast({
        title: "Error",
        description: "Failed to load system information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Format JSON for display
  const formatJSON = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (err) {
      return "Error formatting JSON";
    }
  };
  
  // Handle copy to clipboard
  const handleCopy = (text: string, label: string) => {
    copy(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
      variant: "default",
    });
  };
  
  // Check database connection
  const checkDatabase = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest("GET", "/api/admin/debug/database");
      const data = await response.json();
      
      if (data.status === "connected") {
        toast({
          title: "Database Connected",
          description: "The database connection is working properly.",
          variant: "default",
        });
      } else {
        toast({
          title: "Database Error",
          description: data.message || "Unknown database error.",
          variant: "destructive",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check database connection");
      
      toast({
        title: "Connection Error",
        description: "Failed to check database connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Force cache clear
  const clearCache = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest("POST", "/api/admin/debug/clear-cache");
      const data = await response.json();
      
      toast({
        title: "Cache Cleared",
        description: "Application cache has been cleared successfully.",
        variant: "default",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear cache");
      
      toast({
        title: "Error",
        description: "Failed to clear application cache.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin Debug Panel</CardTitle>
          <CardDescription>
            System diagnostics and maintenance tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You do not have admin privileges to access the debug panel.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Admin Debug Panel</CardTitle>
            <CardDescription>
              System diagnostics and maintenance tools
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={checkDatabase} 
              disabled={loading}
              className="gap-2"
            >
              <Database className="h-4 w-4" />
              Check Database
            </Button>
            <Button 
              variant="destructive" 
              onClick={clearCache} 
              disabled={loading}
              className="gap-2"
            >
              <Trash className="h-4 w-4" />
              Clear Cache
            </Button>
            <Button 
              onClick={fetchSystemInfo} 
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <Terminal className="h-4 w-4" />
                  Load Debug Info
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!systemInfo ? (
          <div className="text-center py-8">
            <Terminal className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No Debug Information</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Click the "Load Debug Info" button to fetch system diagnostics.
            </p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="user-info">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>User Information</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="rounded-md bg-muted p-4 relative">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute top-2 right-2"
                    onClick={() => handleCopy(formatJSON(user), "User info")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <pre className="text-xs overflow-auto">{formatJSON(user)}</pre>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="system-info">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  <span>System Information</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="rounded-md bg-muted p-4 relative">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute top-2 right-2"
                    onClick={() => handleCopy(formatJSON(systemInfo.system), "System info")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <pre className="text-xs overflow-auto">{formatJSON(systemInfo.system)}</pre>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="database-info">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span>Database Information</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="rounded-md bg-muted p-4 relative">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute top-2 right-2"
                    onClick={() => handleCopy(formatJSON(systemInfo.database), "Database info")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <pre className="text-xs overflow-auto">{formatJSON(systemInfo.database)}</pre>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="environment">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Environment Variables (Redacted)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="rounded-md bg-muted p-4 relative">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute top-2 right-2"
                    onClick={() => handleCopy(formatJSON(systemInfo.env), "Environment info")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <pre className="text-xs overflow-auto">{formatJSON(systemInfo.env)}</pre>
                </div>
                <Alert className="mt-4">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Security Notice</AlertTitle>
                  <AlertDescription>
                    Sensitive environment variables and secrets are automatically redacted for security.
                  </AlertDescription>
                </Alert>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        <p className="text-sm text-muted-foreground">
          System version: {systemInfo?.version || "Unknown"}
        </p>
        <p className="text-sm text-muted-foreground">
          Last updated: {systemInfo ? new Date().toLocaleString() : "Never"}
        </p>
      </CardFooter>
    </Card>
  );
}