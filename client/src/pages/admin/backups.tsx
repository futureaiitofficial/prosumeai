import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { Redirect } from "wouter";
import { AdminLayout } from "@/components/admin/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, RefreshCw, Download, AlertTriangle, Server, Calendar, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function BackupsPage() {
  const { user } = useAuth();
  const { isAdmin, isLoading: adminCheckLoading } = useAdmin();
  const [backupLoading, setBackupLoading] = useState(false);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("backup");
  
  // If not authenticated, redirect to login
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  // If not admin, redirect to home
  if (!adminCheckLoading && !isAdmin) {
    return <Redirect to="/" />;
  }

  const handleDatabaseBackup = async () => {
    try {
      setBackupLoading(true);
      toast({
        title: "Creating Backup",
        description: "Database backup is being generated...",
      });
      
      // Create a link element to trigger download
      const link = document.createElement('a');
      link.href = '/api/admin/backup/database';
      // Set download attribute to force browser to download instead of navigate
      link.setAttribute('download', '');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Backup Complete",
        description: "Database backup has been downloaded.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Failed to download database backup: ${err instanceof Error ? err.message : "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setBackupLoading(false);
    }
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Database Backup & Restore</h1>
          <p className="text-muted-foreground">
            Manage database backups and restoration for your application
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="backup">Backup</TabsTrigger>
            <TabsTrigger value="restore">Restore</TabsTrigger>
          </TabsList>
          
          {/* Backup Tab */}
          <TabsContent value="backup">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    <CardTitle>Database Backup</CardTitle>
                  </div>
                  <CardDescription>
                    Create a complete backup of your application database
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="rounded-md bg-blue-50 p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <Server className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">Database Information</h3>
                          <div className="mt-2 text-sm text-blue-700">
                            <ul className="list-inside space-y-1">
                              <li className="flex items-center">
                                <span className="font-medium mr-2">Type:</span> PostgreSQL
                              </li>
                              <li className="flex items-center">
                                <span className="font-medium mr-2">Status:</span> 
                                <Badge variant="default" className="bg-green-500">Connected</Badge>
                              </li>
                              <li className="flex items-center">
                                <span className="font-medium mr-2">Last Backup:</span> {new Date().toLocaleDateString()}
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleDatabaseBackup}
                    disabled={backupLoading}
                    className="w-full"
                  >
                    {backupLoading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Creating Backup...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download Database Backup
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <CardTitle>Backup Information</CardTitle>
                  </div>
                  <CardDescription>
                    Important information about database backups
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="rounded-md bg-amber-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertTriangle className="h-5 w-5 text-amber-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-amber-800">Best Practices</h3>
                          <div className="mt-2 text-sm text-amber-700">
                            <ul className="list-disc list-inside space-y-1">
                              <li>Schedule regular backups</li>
                              <li>Store backups in multiple secure locations</li>
                              <li>Test your backups by restoring to a test environment</li>
                              <li>Follow your organization's data retention policies</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="rounded-md bg-green-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <CheckCircle2 className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-800">What's Included</h3>
                          <div className="mt-2 text-sm text-green-700">
                            <ul className="list-disc list-inside space-y-1">
                              <li>User data and profiles</li>
                              <li>Resumes and cover letters</li>
                              <li>Job applications</li>
                              <li>System settings and configurations</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Restore Tab */}
          <TabsContent value="restore">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  <CardTitle>Database Restore</CardTitle>
                </div>
                <CardDescription>
                  Restore your database from a previous backup
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Important Notice</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>
                          Database restoration is available only through the command line interface for security reasons.
                          Please contact your system administrator to restore from a backup.
                        </p>
                        <p className="mt-2">
                          <strong>Command example:</strong>
                        </p>
                        <pre className="mt-1 rounded bg-gray-800 p-2 text-xs text-white overflow-auto">
                          psql -U username -d database_name -f backup_file.sql
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
} 