import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, CheckCircle, PlayCircle, StopCircle, RefreshCw, ClockIcon, FileText } from 'lucide-react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';

interface CronStatus {
  isRunning: boolean;
  pid: string | null;
  logFile: string | null;
  lastRunTimestamp: string | null;
  logPreview: string | null;
  interval: number;
}

interface LogFile {
  filename: string;
  size: number;
  created: string;
}

const CronJobManagement: React.FC = () => {
  const { toast } = useToast();
  const [status, setStatus] = useState<CronStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogFile[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(false);
  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  const [logContent, setLogContent] = useState<string | null>(null);
  const [logContentLoading, setLogContentLoading] = useState<boolean>(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/cron/status');
      setStatus(response.data);
    } catch (error) {
      console.error('Error fetching cron status:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch cron job status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const response = await axios.get('/api/admin/cron/logs');
      setLogs(response.data.logs);
    } catch (error) {
      console.error('Error fetching log files:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch log files',
        variant: 'destructive',
      });
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchLogContent = async (filename: string) => {
    setLogContentLoading(true);
    try {
      const response = await axios.get(`/api/admin/cron/logs/${filename}`);
      setLogContent(response.data.content);
      setSelectedLog(filename);
    } catch (error) {
      console.error('Error fetching log content:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch log content',
        variant: 'destructive',
      });
      setLogContent(null);
    } finally {
      setLogContentLoading(false);
    }
  };

  const startCronJob = async () => {
    setActionLoading(true);
    try {
      await axios.post('/api/admin/cron/start');
      toast({
        title: 'Success',
        description: 'Cron job started successfully',
      });
      // Refresh status after a brief delay to allow the job to start
      setTimeout(fetchStatus, 1000);
    } catch (error) {
      console.error('Error starting cron job:', error);
      toast({
        title: 'Error',
        description: 'Failed to start cron job',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const stopCronJob = async () => {
    setActionLoading(true);
    try {
      await axios.post('/api/admin/cron/stop');
      toast({
        title: 'Success',
        description: 'Cron job stopped successfully',
      });
      // Refresh status after a brief delay to allow the job to stop
      setTimeout(fetchStatus, 1000);
    } catch (error) {
      console.error('Error stopping cron job:', error);
      toast({
        title: 'Error',
        description: 'Failed to stop cron job',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchLogs();
    
    // Set up periodic refresh
    const intervalId = setInterval(fetchStatus, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimestamp = (timestamp: string): string => {
    try {
      return format(new Date(timestamp), 'MMM d, yyyy HH:mm:ss');
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <ClockIcon className="mr-2 h-6 w-6" />
            Cron Job Management
          </CardTitle>
          <CardDescription>
            Manage background jobs for data synchronization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="status">
            <TabsList className="mb-4">
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="status" className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading status...</span>
                </div>
              ) : status ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center mb-2">
                          <span className="font-semibold mr-2">Current Status:</span>
                          {status.isRunning ? (
                            <Badge className="bg-green-500">Running</Badge>
                          ) : (
                            <Badge variant="secondary">Stopped</Badge>
                          )}
                        </div>
                        
                        {status.pid && (
                          <div className="mb-2">
                            <span className="font-semibold">Process ID:</span> {status.pid}
                          </div>
                        )}
                        
                        <div className="mb-2">
                          <span className="font-semibold">Sync Interval:</span> {status.interval} seconds
                        </div>
                        
                        {status.lastRunTimestamp && (
                          <div className="mb-2">
                            <span className="font-semibold">Last Run:</span> {formatTimestamp(status.lastRunTimestamp)}
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="flex space-x-2">
                        <Button 
                          onClick={fetchStatus}
                          variant="outline"
                          size="sm"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>
                        
                        {status.isRunning ? (
                          <Button 
                            onClick={stopCronJob}
                            variant="destructive"
                            size="sm"
                            disabled={actionLoading}
                          >
                            <StopCircle className="h-4 w-4 mr-2" />
                            Stop Job
                          </Button>
                        ) : (
                          <Button 
                            onClick={startCronJob}
                            variant="default"
                            size="sm"
                            disabled={actionLoading}
                          >
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Start Job
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Job Description</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="mb-2">
                          This cron job synchronizes subscription invoices from Razorpay with the local database.
                        </p>
                        <p className="mb-2">
                          It ensures all subscription payments are properly recorded in the system, even if webhook
                          delivery fails.
                        </p>
                        <Alert className="mt-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Important Note</AlertTitle>
                          <AlertDescription>
                            Running this job too frequently may cause API rate limiting. The recommended interval is
                            every 5-15 minutes in production.
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {status.logPreview && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Log Preview</CardTitle>
                        {status.logFile && (
                          <CardDescription>
                            From {status.logFile}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                          <pre className="text-xs font-mono">{status.logPreview}</pre>
                        </ScrollArea>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => status.logFile && fetchLogContent(status.logFile)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Full Log
                        </Button>
                      </CardFooter>
                    </Card>
                  )}
                </>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to load cron job status
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
            
            <TabsContent value="logs" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-lg">Log Files</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {logsLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <RefreshCw className="h-6 w-6 animate-spin" />
                        <span className="ml-2">Loading logs...</span>
                      </div>
                    ) : logs.length > 0 ? (
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-2">
                          {logs.map((log) => (
                            <div 
                              key={log.filename}
                              className={`p-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors ${
                                selectedLog === log.filename ? 'bg-gray-100 border border-gray-300' : ''
                              }`}
                              onClick={() => fetchLogContent(log.filename)}
                            >
                              <div className="font-medium truncate">{log.filename}</div>
                              <div className="text-xs text-gray-500 flex justify-between">
                                <span>{formatBytes(log.size)}</span>
                                <span title={format(new Date(log.created), 'MMM d, yyyy HH:mm:ss')}>
                                  {formatDistanceToNow(new Date(log.created), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No log files found
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchLogs}
                      className="w-full"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Logs
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {selectedLog ? `Log Content: ${selectedLog}` : 'Log Content'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {logContentLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <RefreshCw className="h-6 w-6 animate-spin" />
                        <span className="ml-2">Loading log content...</span>
                      </div>
                    ) : logContent ? (
                      <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                        <pre className="text-xs font-mono whitespace-pre-wrap">{logContent}</pre>
                      </ScrollArea>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        Select a log file to view its content
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CronJobManagement; 