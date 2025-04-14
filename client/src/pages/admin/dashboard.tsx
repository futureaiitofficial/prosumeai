import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { Redirect } from "wouter";
import { AdminLayout } from "@/components/admin/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import { ResponsivePie } from "@nivo/pie";
import { 
  Users, 
  FileText, 
  CreditCard, 
  DollarSign, 
  TrendingUp,
  Download,
  BarChart,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Clock,
  Loader2,
  Database,
  Server,
  Activity
} from "lucide-react";

// Define interface for stats data
interface DashboardStats {
  users: number;
  resumes: number;
  coverLetters: number;
  applications: number;
}

// Define interface for server status data
interface ServerStatusData {
  status: string;
  timestamp: string;
  system: {
    platform: string;
    architecture: string;
    cpus: number;
    totalMemory: number;
    freeMemory: number;
    uptime: number;
    load: number[];
    nodeVersion: string;
    nodeEnv: string;
  };
  database: {
    connected: boolean;
    error: string | null;
  };
  users: {
    total: number;
    active: number;
    admins: number;
    totalResumes: number;
    totalCoverLetters: number;
    totalJobApplications: number;
  };
  session: {
    isAuthenticated: boolean;
    sessionID: string;
    cookie: {
      maxAge: number;
      httpOnly: boolean;
      secure: boolean;
      sameSite: string;
    };
  };
  rateLimiter: {
    enabled: boolean;
    windowMs: number;
    max: number;
  };
  cookieManager: {
    enabled: boolean;
    settings: {
      prefix: string;
      secure: boolean;
      sameSite: string;
    };
  };
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { isAdmin, isLoading: adminCheckLoading } = useAdmin();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch admin dashboard stats
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    resumes: 0,
    coverLetters: 0,
    applications: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Add state for server status data
  const [serverStatus, setServerStatus] = useState<ServerStatusData | null>(null);
  const [serverStatusLoading, setServerStatusLoading] = useState(true);
  const [serverStatusError, setServerStatusError] = useState<string | null>(null);
  
  const fetchStats = useCallback(async () => {
    if (!user || !isAdmin) return;
    
    try {
      setStatsLoading(true);
      
      // Get counts from different endpoints
      const [usersRes, resumesRes, coverLettersRes, jobAppsRes] = await Promise.all([
        fetch('/api/admin/users', { credentials: 'include' }),
        fetch('/api/resumes', { credentials: 'include' }),
        fetch('/api/cover-letters', { credentials: 'include' }),
        fetch('/api/job-applications', { credentials: 'include' })
      ]);
      
      if (!usersRes.ok || !resumesRes.ok || !coverLettersRes.ok || !jobAppsRes.ok) {
        throw new Error("One or more endpoints failed");
      }
      
      const users = await usersRes.json();
      const resumes = await resumesRes.json();
      const coverLetters = await coverLettersRes.json();
      const jobApps = await jobAppsRes.json();
      
      const statsData = {
        users: Array.isArray(users) ? users.length : 0,
        resumes: Array.isArray(resumes) ? resumes.length : 0,
        coverLetters: Array.isArray(coverLetters) ? coverLetters.length : 0,
        applications: Array.isArray(jobApps) ? jobApps.length : 0
      };
      
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }, [user, isAdmin]);
  
  // Add function to fetch server status
  const fetchServerStatus = useCallback(async () => {
    if (!user || !isAdmin) return;
    
    try {
      setServerStatusLoading(true);
      setServerStatusError(null);
      
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
      setServerStatus(data);
    } catch (err: any) {
      setServerStatusError(err.message || 'Failed to fetch server status');
      console.error("Error fetching server status:", err);
    } finally {
      setServerStatusLoading(false);
    }
  }, [user, isAdmin]);
  
  useEffect(() => {
    if (user && isAdmin) {
      fetchStats();
      fetchServerStatus();
      
      // Set up interval to refresh stats and server status
      const statsInterval = setInterval(fetchStats, 60000);
      const statusInterval = setInterval(fetchServerStatus, 30000);
      
      return () => {
        clearInterval(statsInterval);
        clearInterval(statusInterval);
      };
    }
  }, [fetchStats, fetchServerStatus, user, isAdmin]);
  
  // If not authenticated, redirect to login
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  // If not admin, redirect to home
  if (!adminCheckLoading && !isAdmin) {
    return <Redirect to="/" />;
  }
  
  // Format uptime to human-readable format
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  };
  
  // Format bytes to human-readable format
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Calculate memory usage percentage
  const getMemoryUsagePercent = () => {
    if (!serverStatus) return 0;
    
    const { totalMemory, freeMemory } = serverStatus.system;
    const usedMemory = totalMemory - freeMemory;
    return Math.round((usedMemory / totalMemory) * 100);
  };
  
  // Mock data for charts
  const revenueData = [
    { month: "Jan", revenue: 1200 },
    { month: "Feb", revenue: 1380 },
    { month: "Mar", revenue: 1520 },
    { month: "Apr", revenue: 1740 },
    { month: "May", revenue: 2050 },
    { month: "Jun", revenue: 1890 },
    { month: "Jul", revenue: 2300 },
  ];
  
  const userActivityData = [
    {
      id: "user activity",
      data: [
        { x: "Mon", y: 24 },
        { x: "Tue", y: 18 },
        { x: "Wed", y: 35 },
        { x: "Thu", y: 27 },
        { x: "Fri", y: 42 },
        { x: "Sat", y: 15 },
        { x: "Sun", y: 12 },
      ],
    },
  ];
  
  const documentDistributionData = [
    { id: "resumes", label: "Resumes", value: stats.resumes, color: "hsl(210, 70%, 50%)" },
    { id: "coverLetters", label: "Cover Letters", value: stats.coverLetters, color: "hsl(40, 70%, 50%)" },
    { id: "applications", label: "Applications", value: stats.applications, color: "hsl(120, 70%, 50%)" },
  ];
  
  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome back to your admin dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Last updated:</span>
          <span className="text-sm font-medium">{new Date().toLocaleTimeString()}</span>
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">User Activity</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex items-center justify-center h-10">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats.users}</div>
                    <div className="flex items-center pt-1 text-xs text-green-500">
                      <ArrowUpRight className="mr-1 h-3 w-3" />
                      <span>12% from last month</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Resumes</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex items-center justify-center h-10">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats.resumes}</div>
                    <div className="flex items-center pt-1 text-xs text-green-500">
                      <ArrowUpRight className="mr-1 h-3 w-3" />
                      <span>18% from last month</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$2,350</div>
                <div className="flex items-center pt-1 text-xs text-green-500">
                  <ArrowUpRight className="mr-1 h-3 w-3" />
                  <span>7% from last month</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">105</div>
                <div className="flex items-center pt-1 text-xs text-red-500">
                  <ArrowDownRight className="mr-1 h-3 w-3" />
                  <span>3% from last month</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts and Tables */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Monthly revenue for the current year</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveBar
                    data={revenueData}
                    keys={["revenue"]}
                    indexBy="month"
                    margin={{ top: 20, right: 30, bottom: 50, left: 60 }}
                    padding={0.3}
                    valueScale={{ type: "linear" }}
                    colors={{ scheme: "accent" }}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: "Month",
                      legendPosition: "middle",
                      legendOffset: 40,
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: "Revenue ($)",
                      legendPosition: "middle",
                      legendOffset: -50,
                    }}
                    labelSkipWidth={12}
                    labelSkipHeight={12}
                    labelTextColor={{ from: "color", modifiers: [["darker", 1.6]] }}
                    animate={true}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Document Distribution</CardTitle>
                <CardDescription>Types of documents created</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {documentDistributionData.every(item => item.value === 0) ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                      <FileText className="h-16 w-16 mb-4 opacity-20" />
                      <p className="text-lg font-medium">No documents created yet</p>
                      <p className="text-sm">Document statistics will appear here when users create resumes, cover letters, or applications</p>
                    </div>
                  ) : (
                    <ResponsivePie
                      data={documentDistributionData}
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                      innerRadius={0.5}
                      padAngle={0.7}
                      cornerRadius={3}
                      colors={{ scheme: "accent" }}
                      borderWidth={1}
                      borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
                      arcLabelsSkipAngle={10}
                      arcLabelsTextColor="#333333"
                      arcLinkLabelsSkipAngle={10}
                      arcLinkLabelsTextColor="#333333"
                      arcLinkLabelsThickness={1}
                      arcLinkLabelsColor={{ from: "color" }}
                      animate={true}
                      transitionMode="startAngle"
                      defs={[
                        {
                          id: "dots",
                          type: "patternDots",
                          background: "inherit",
                          color: "rgba(255, 255, 255, 0.3)",
                          size: 4,
                          padding: 1,
                          stagger: true,
                        },
                        {
                          id: "lines",
                          type: "patternLines",
                          background: "inherit",
                          color: "rgba(255, 255, 255, 0.3)",
                          rotation: -45,
                          lineWidth: 6,
                          spacing: 10,
                        },
                      ]}
                      fill={[
                        { match: { id: "resumes" }, id: "dots" },
                        { match: { id: "coverLetters" }, id: "lines" },
                      ]}
                      legends={[
                        {
                          anchor: "bottom",
                          direction: "row",
                          translateY: 30,
                          itemWidth: 100,
                          itemHeight: 20,
                          itemTextColor: "#999",
                          symbolSize: 12,
                          symbolShape: "circle",
                          effects: [
                            {
                              on: "hover",
                              style: {
                                itemTextColor: "#000",
                              },
                            },
                          ],
                        },
                      ]}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Activity and Status */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest user and system activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">New user registered</p>
                      <p className="text-xs text-muted-foreground">A new user created an account</p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        <span>10 minutes ago</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="bg-green-100 p-2 rounded-full">
                      <CreditCard className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">New subscription</p>
                      <p className="text-xs text-muted-foreground">User upgraded to Pro plan</p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        <span>25 minutes ago</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">Resume generated</p>
                      <p className="text-xs text-muted-foreground">User created a new resume</p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        <span>1 hour ago</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-100 p-2 rounded-full">
                      <Download className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">Template downloaded</p>
                      <p className="text-xs text-muted-foreground">User downloaded a premium template</p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        <span>3 hours ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>Current system status and resources</CardDescription>
                </div>
                {serverStatusLoading && (
                  <div className="animate-spin">
                    <Loader2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {serverStatusError ? (
                  <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded-md">
                    Failed to load system status: {serverStatusError}
                  </div>
                ) : serverStatus ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${serverStatus.database.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="font-medium">Database</span>
                      </div>
                      <span className={`text-sm font-medium ${serverStatus.database.connected ? 'text-green-500' : 'text-red-500'}`}>
                        {serverStatus.database.connected ? 'Operational' : 'Disconnected'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                        <span className="font-medium">API Services</span>
                      </div>
                      <span className="text-sm text-green-500 font-medium">Operational</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                        <span className="font-medium">Authentication</span>
                      </div>
                      <span className="text-sm text-green-500 font-medium">
                        {serverStatus.session.isAuthenticated ? 'Operational' : 'Issue Detected'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${serverStatus.cookieManager.enabled ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        <span className="font-medium">Cookie Manager</span>
                      </div>
                      <span className={`text-sm font-medium ${serverStatus.cookieManager.enabled ? 'text-green-500' : 'text-yellow-500'}`}>
                        {serverStatus.cookieManager.enabled ? 'Operational' : 'Limited'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${serverStatus.rateLimiter.enabled ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        <span className="font-medium">Rate Limiter</span>
                      </div>
                      <span className={`text-sm font-medium ${serverStatus.rateLimiter.enabled ? 'text-green-500' : 'text-yellow-500'}`}>
                        {serverStatus.rateLimiter.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    
                    <div className="pt-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <Server className="h-3 w-3" />
                            <span>Server Load</span>
                          </span>
                          <span>
                            {serverStatus.system.load[0].toFixed(2)} 
                            <span className="text-xs text-muted-foreground ml-1">(1m avg)</span>
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <div 
                            className={`h-2 rounded-full ${
                              serverStatus.system.load[0] > 3 
                                ? 'bg-red-500' 
                                : serverStatus.system.load[0] > 1.5 
                                  ? 'bg-yellow-500' 
                                  : 'bg-green-500'
                            }`} 
                            style={{ width: `${Math.min(100, serverStatus.system.load[0] * 10)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span>Memory Usage</span>
                          <span>{getMemoryUsagePercent()}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <div 
                            className={`h-2 rounded-full ${
                              getMemoryUsagePercent() > 80 
                                ? 'bg-red-500' 
                                : getMemoryUsagePercent() > 60 
                                  ? 'bg-yellow-500' 
                                  : 'bg-green-500'
                            }`}
                            style={{ width: `${getMemoryUsagePercent()}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex flex-col text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Platform:</span>
                          <span>{serverStatus.system.platform} ({serverStatus.system.architecture})</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Uptime:</span>
                          <span>{formatUptime(serverStatus.system.uptime)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Node:</span>
                          <span>{serverStatus.system.nodeVersion} ({serverStatus.system.nodeEnv})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Activity</CardTitle>
              <CardDescription>Weekly user activity trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveLine
                  data={userActivityData}
                  margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                  xScale={{ type: "point" }}
                  yScale={{ type: "linear", min: "auto", max: "auto", stacked: false, reverse: false }}
                  curve="cardinal"
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: "Day of Week",
                    legendOffset: 36,
                    legendPosition: "middle",
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: "Actions",
                    legendOffset: -40,
                    legendPosition: "middle",
                  }}
                  colors={{ scheme: "accent" }}
                  pointSize={10}
                  pointColor={{ theme: "background" }}
                  pointBorderWidth={2}
                  pointBorderColor={{ from: "serieColor" }}
                  pointLabel="y"
                  pointLabelYOffset={-12}
                  useMesh={true}
                  animate={true}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analysis</CardTitle>
              <CardDescription>Monthly revenue breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveBar
                  data={revenueData}
                  keys={["revenue"]}
                  indexBy="month"
                  margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                  padding={0.3}
                  valueScale={{ type: "linear" }}
                  colors={{ scheme: "accent" }}
                  borderWidth={1}
                  borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: "Month",
                    legendPosition: "middle",
                    legendOffset: 36,
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: "Revenue ($)",
                    legendPosition: "middle",
                    legendOffset: -40,
                  }}
                  labelSkipWidth={12}
                  labelSkipHeight={12}
                  labelTextColor={{ from: "color", modifiers: [["darker", 1.6]] }}
                  animate={true}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}