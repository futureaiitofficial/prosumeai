import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Database, Server, User, Shield, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ServerStatusProps {
  isAdmin: boolean;
}

export default function ServerStatus({ isAdmin }: ServerStatusProps) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchServerStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/server-status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Status: ${response.status}`);
      }
      
      const data = await response.json();
      setStatus(data);
      console.log('Client received server status:', JSON.stringify(data, null, 2));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch server status');
      toast({
        title: "Error",
        description: `Failed to fetch server status: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearRateLimits = async () => {
    try {
      const response = await fetch('/api/admin/clear-rate-limits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Status: ${response.status}`);
      }
      
      const data = await response.json();
      toast({
        title: "Success",
        description: data.message || "Rate limits cleared successfully",
      });
      
      // Refresh status
      fetchServerStatus();
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Failed to clear rate limits: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchServerStatus();
      
      // Set up auto-refresh every 30 seconds
      const intervalId = setInterval(fetchServerStatus, 30000);
      
      return () => clearInterval(intervalId);
    }
  }, [isAdmin]);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You do not have permission to view server status information.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Server Status</CardTitle>
          <CardDescription>
            Real-time performance and health metrics
          </CardDescription>
        </div>
        <Button
          onClick={fetchServerStatus}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {loading && !status ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : status ? (
          <div className="space-y-6">
            {/* System Information */}
            <div>
              <h3 className="text-sm font-medium flex items-center mb-2">
                <Server className="h-4 w-4 mr-2" />
                System Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-slate-50 p-3 rounded-md">
                  <div className="text-xs text-slate-500">Platform</div>
                  <div className="font-medium">{status.system.platform} ({status.system.architecture || status.system.arch})</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-md">
                  <div className="text-xs text-slate-500">Uptime</div>
                  <div className="font-medium">{formatUptime(status.system.uptime)}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-md">
                  <div className="text-xs text-slate-500">CPU Cores</div>
                  <div className="font-medium">{status.system.cpus}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-md">
                  <div className="text-xs text-slate-500">Load Average</div>
                  <div className="font-medium">
                    {Array.isArray(status.system.load) || Array.isArray(status.system.loadAvg) 
                      ? (status.system.load || status.system.loadAvg).map((load: number) => load.toFixed(2)).join(', ')
                      : '?'}
                  </div>
                </div>
              </div>
              
              {/* Memory Usage */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Memory Usage</span>
                  <span>
                    {formatBytes(
                      (status.system.totalMemory || status.system.totalMem || 0) - 
                      (status.system.freeMemory || status.system.freeMem || 0)
                    )} / {formatBytes(status.system.totalMemory || status.system.totalMem || 0)}
                  </span>
                </div>
                <Progress 
                  value={((
                    (status.system.totalMemory || status.system.totalMem || 0) - 
                    (status.system.freeMemory || status.system.freeMem || 0)
                  ) / (status.system.totalMemory || status.system.totalMem || 1)) * 100} 
                />
              </div>
            </div>
            
            {/* Database Status */}
            <div>
              <h3 className="text-sm font-medium flex items-center mb-2">
                <Database className="h-4 w-4 mr-2" />
                Database Connection
              </h3>
              
              <div className="flex items-center">
                <Badge 
                  variant={status.database.connected ? "default" : "destructive"}
                  className={`mr-2 ${status.database.connected ? "bg-green-500" : ""}`}
                >
                  {status.database.connected ? "Connected" : "Disconnected"}
                </Badge>
                {status.database.error && (
                  <span className="text-sm text-red-500">{status.database.error}</span>
                )}
              </div>
            </div>
            
            {/* Cookie & Session Information */}
            <div>
              <h3 className="text-sm font-medium flex items-center mb-2">
                <Shield className="h-4 w-4 mr-2" />
                Security & Sessions
              </h3>
              
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Cookie Prefix</TableCell>
                    <TableCell>
                      {status.cookieManager?.settings?.prefix || status.cookieManager?.prefix || 'N/A'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Active Sessions</TableCell>
                    <TableCell>{status.sessions?.count || 0}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Rate Limiter</TableCell>
                    <TableCell className="flex items-center justify-between">
                      <span>{status.rateLimiter?.enabled ? 'Enabled' : 'Disabled'}</span>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={clearRateLimits}
                        disabled={!status.rateLimiter?.enabled}
                      >
                        Clear Rate Limits
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            
            {/* User Statistics */}
            <div>
              <h3 className="text-sm font-medium flex items-center mb-2">
                <User className="h-4 w-4 mr-2" />
                User Statistics
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-3 rounded-md">
                  <div className="text-xs text-slate-500">Total Users</div>
                  <div className="font-medium">{status.users?.total || status.users?.totalUsers || 0}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-md">
                  <div className="text-xs text-slate-500">Active Users</div>
                  <div className="font-medium">{status.users?.active || status.users?.recentLogins || 0}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-md">
                  <div className="text-xs text-slate-500">Admin Users</div>
                  <div className="font-medium">{status.users?.admins || 0}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-md">
                  <div className="text-xs text-slate-500">Total Resumes</div>
                  <div className="font-medium">{status.users?.totalResumes || 0}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-md">
                  <div className="text-xs text-slate-500">Cover Letters</div>
                  <div className="font-medium">{status.users?.totalCoverLetters || 0}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-md">
                  <div className="text-xs text-slate-500">Job Applications</div>
                  <div className="font-medium">{status.users?.totalJobApplications || 0}</div>
                </div>
              </div>
            </div>
            
            {/* Last Updated */}
            <div className="text-xs text-slate-500 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Last updated: {new Date(status.timestamp).toLocaleString()}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
} 