import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { useBranding } from "@/components/branding/branding-provider";
import { Redirect } from "wouter";
import { AdminLayout } from "@/components/admin/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import { ResponsivePie } from "@nivo/pie";
import { 
  Users, 
  FileText, 
  CreditCard, 
  DollarSign, 
  TrendingUp,
  ArrowUpRight,
  Loader2,
  Activity,
  Filter
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import React from "react";

// Define interface for stats data
interface DashboardStats {
  userStats: {
    total: number;
    recentRegistrations: number;
  };
  aiStats: {
    totalTokens: number;
  };
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}

const StatsCard = ({ title, value, icon, description }: StatsCardProps) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center">
        {icon}
        <div className="ml-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="text-2xl font-bold">{value}</div>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function AdminDashboard() {
  const { user } = useAuth();
  const { isAdmin, isLoading: adminCheckLoading } = useAdmin();
  const branding = useBranding();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({ users: 0, resumes: 0, coverLetters: 0, applications: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Revenue filter states
  const [revenueTimeframe, setRevenueTimeframe] = useState("12");
  const [revenuePeriod, setRevenuePeriod] = useState("monthly"); // monthly or yearly
  const [revenueCurrency, setRevenueCurrency] = useState("all"); // all, USD, INR

  // Fetch dashboard stats using React Query
  const { data: dashboardStats, isLoading: dashboardStatsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/dashboard"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user && isAdmin,
  });

  // Fetch revenue analytics with filters
  const { data: revenueAnalytics, isLoading: revenueLoading } = useQuery({
    queryKey: ["/api/admin/analytics/revenue", { 
      timeframe: revenueTimeframe, 
      period: revenuePeriod,
      currency: revenueCurrency 
    }],
    queryFn: async () => {
      const params = new URLSearchParams({
        timeframe: revenueTimeframe,
        period: revenuePeriod,
        currency: revenueCurrency
      });
      const response = await fetch(`/api/admin/analytics/revenue?${params}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch revenue analytics');
      return response.json();
    },
    enabled: !!user && isAdmin,
  });

  // Fetch user activity analytics
  const { data: userActivityAnalytics, isLoading: activityLoading } = useQuery({
    queryKey: ["/api/admin/analytics/user-activity", { timeframe: "30" }],
    queryFn: async () => {
      const response = await fetch('/api/admin/analytics/user-activity?timeframe=30', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch user activity analytics');
      return response.json();
    },
    enabled: !!user && isAdmin,
  });

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
  
  // Effect to fetch stats on mount and periodically
  useEffect(() => {
    if (user && isAdmin) {
      fetchStats();
      
      // Set up interval to refresh stats
      const statsInterval = setInterval(fetchStats, 60000);
      
      return () => {
        clearInterval(statsInterval);
      };
    }
  }, [fetchStats, user, isAdmin]);
  
  // If not authenticated, redirect to login
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  // If not admin, redirect to home
  if (!adminCheckLoading && !isAdmin) {
    return <Redirect to="/" />;
  }

  // Transform revenue data for charts
  const revenueData = React.useMemo(() => {
    if (!revenueAnalytics?.monthlyRevenue) return [];
    
    const monthlyData: Record<string, { month: string; usd: number; inr: number }> = {};
    
    Object.values(revenueAnalytics.monthlyRevenue).forEach((item: any) => {
      const date = new Date(item.month + '-01');
      const month = revenuePeriod === 'yearly' 
        ? date.getFullYear().toString()
        : date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      if (!monthlyData[month]) {
        monthlyData[month] = { month, usd: 0, inr: 0 };
      }
      monthlyData[month][item.currency.toLowerCase() as 'usd' | 'inr'] = item.amount;
    });

    let data = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
    
    // If yearly, group by year
    if (revenuePeriod === 'yearly') {
      const yearlyData: Record<string, { month: string; usd: number; inr: number }> = {};
      
      data.forEach(item => {
        const year = item.month;
        if (!yearlyData[year]) {
          yearlyData[year] = { month: year, usd: 0, inr: 0 };
        }
        yearlyData[year].usd += item.usd;
        yearlyData[year].inr += item.inr;
      });
      
      data = Object.values(yearlyData).sort((a, b) => a.month.localeCompare(b.month));
    }
    
    return data;
  }, [revenueAnalytics, revenuePeriod]);

  // Determine chart keys based on currency filter
  const chartKeys = React.useMemo(() => {
    if (revenueCurrency === 'USD') return ['usd'];
    if (revenueCurrency === 'INR') return ['inr'];
    return ['usd', 'inr'];
  }, [revenueCurrency]);

  // Chart colors based on selected currencies
  const chartColors = React.useMemo(() => {
    if (revenueCurrency === 'USD') return ['#3b82f6'];
    if (revenueCurrency === 'INR') return ['#f59e0b'];
    return ['#3b82f6', '#f59e0b'];
  }, [revenueCurrency]);

  // Transform user activity data for charts
  const userActivityData = React.useMemo(() => {
    if (!userActivityAnalytics?.dailyActivity) return [{ id: "user activity", data: [] }];
    
    const last7Days = userActivityAnalytics.dailyActivity.slice(-7);
    const chartData = last7Days.map((day: any) => ({
      x: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
      y: day.totalActivity
    }));

    return [{ id: "user activity", data: chartData }];
  }, [userActivityAnalytics]);

  // Document distribution data from actual stats
  const documentDistributionData = [
    { id: "resumes", label: "Resumes", value: stats.resumes || 0, color: "hsl(210, 70%, 50%)" },
    { id: "coverLetters", label: "Cover Letters", value: stats.coverLetters || 0, color: "hsl(40, 70%, 50%)" },
    { id: "applications", label: "Applications", value: stats.applications || 0, color: "hsl(120, 70%, 50%)" },
  ];

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{branding.appName} Admin Dashboard</h1>
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <StatsCard 
              title="Total Users" 
              value={dashboardStatsLoading ? "Loading..." : dashboardStats?.userStats.total || 0}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard 
              title="Recent Signups" 
              value={dashboardStatsLoading ? "Loading..." : dashboardStats?.userStats.recentRegistrations || 0}
              icon={<ArrowUpRight className="h-4 w-4 text-green-500" />}
              description="Last 7 days"
            />
            <StatsCard 
              title="Active Users" 
              value={activityLoading ? "Loading..." : userActivityAnalytics?.summary?.activeUsers || 0}
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
              description="Last 7 days"
            />
          </div>

          {/* Revenue Summary Cards */}
          {revenueAnalytics?.summary && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(revenueAnalytics.summary.totalRevenue).map(([currency, data]: [string, any]) => (
                <Card key={currency}>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <div className="ml-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          Total Revenue ({currency.toUpperCase()})
                        </p>
                        <div className="text-2xl font-bold">
                          {currency === 'USD' ? '$' : '₹'}{data.amount.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {data.transactions} transactions
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {Object.entries(revenueAnalytics.summary.mrr).map(([currency, mrr]: [string, any]) => (
                <Card key={`mrr-${currency}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      <div className="ml-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          MRR ({currency.toUpperCase()})
                        </p>
                        <div className="text-2xl font-bold">
                          {currency === 'USD' ? '$' : '₹'}{mrr.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Monthly recurring
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* Charts and Tables */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Monthly revenue by currency (last 12 months)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {revenueLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : (
                    <ResponsiveBar
                      data={revenueData.slice(-12)} // Show last 12 months for overview
                      keys={["usd", "inr"]}
                      indexBy="month"
                      margin={{ top: 20, right: 110, bottom: 50, left: 60 }}
                      padding={0.3}
                      valueScale={{ type: "linear" }}
                      colors={["#3b82f6", "#f59e0b"]}
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
                        legend: "Revenue",
                        legendPosition: "middle",
                        legendOffset: -50,
                      }}
                      labelSkipWidth={12}
                      labelSkipHeight={12}
                      labelTextColor={{ from: "color", modifiers: [["darker", 1.6]] }}
                      legends={[
                        {
                          dataFrom: 'keys',
                          anchor: 'bottom-right',
                          direction: 'column',
                          justify: false,
                          translateX: 120,
                          translateY: 0,
                          itemsSpacing: 2,
                          itemWidth: 100,
                          itemHeight: 20,
                          itemDirection: 'left-to-right',
                          itemOpacity: 0.85,
                          symbolSize: 20,
                          effects: [
                            {
                              on: 'hover',
                              style: {
                                itemOpacity: 1
                              }
                            }
                          ]
                        }
                      ]}
                      animate={true}
                    />
                  )}
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
                  {statsLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin" />
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
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Activity Trends</CardTitle>
              <CardDescription>Daily user activity over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {activityLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
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
                      legend: "Total Activity",
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
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activity Summary Cards */}
          {userActivityAnalytics?.summary && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-blue-500" />
                    <div className="ml-2">
                      <p className="text-sm font-medium text-muted-foreground">New Registrations</p>
                      <div className="text-2xl font-bold">{userActivityAnalytics.summary.registrations}</div>
                      <p className="text-xs text-muted-foreground">Last 30 days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-green-500" />
                    <div className="ml-2">
                      <p className="text-sm font-medium text-muted-foreground">Resumes Created</p>
                      <div className="text-2xl font-bold">{userActivityAnalytics.summary.resumes}</div>
                      <p className="text-xs text-muted-foreground">Last 30 days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <CreditCard className="h-4 w-4 text-purple-500" />
                    <div className="ml-2">
                      <p className="text-sm font-medium text-muted-foreground">New Subscriptions</p>
                      <div className="text-2xl font-bold">{userActivityAnalytics.summary.subscriptions}</div>
                      <p className="text-xs text-muted-foreground">Last 30 days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="revenue" className="space-y-6">
          {/* Revenue Filter Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Revenue Filters
              </CardTitle>
              <CardDescription>
                Customize your revenue analysis view
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time Period</label>
                  <Select value={revenuePeriod} onValueChange={setRevenuePeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly View</SelectItem>
                      <SelectItem value="yearly">Yearly View</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Currency</label>
                  <Select value={revenueCurrency} onValueChange={setRevenueCurrency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Currencies</SelectItem>
                      <SelectItem value="USD">USD Only</SelectItem>
                      <SelectItem value="INR">INR Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Timeframe</label>
                  <Select value={revenueTimeframe} onValueChange={setRevenueTimeframe}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">Last 6 {revenuePeriod === 'yearly' ? 'Years' : 'Months'}</SelectItem>
                      <SelectItem value="12">Last 12 {revenuePeriod === 'yearly' ? 'Years' : 'Months'}</SelectItem>
                      <SelectItem value="24">Last 24 {revenuePeriod === 'yearly' ? 'Years' : 'Months'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Analysis</CardTitle>
              <CardDescription>
                {revenuePeriod === 'yearly' ? 'Yearly' : 'Monthly'} revenue breakdown
                {revenueCurrency !== 'all' && ` - ${revenueCurrency} only`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {revenueLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <ResponsiveBar
                    data={revenueData}
                    keys={chartKeys}
                    indexBy="month"
                    margin={{ top: 20, right: 110, bottom: 50, left: 80 }}
                    padding={0.3}
                    valueScale={{ type: "linear" }}
                    colors={chartColors}
                    borderWidth={1}
                    borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: revenuePeriod === 'yearly' ? 'Year' : 'Month',
                      legendPosition: "middle",
                      legendOffset: 36,
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: "Revenue",
                      legendPosition: "middle",
                      legendOffset: -60,
                    }}
                    labelSkipWidth={12}
                    labelSkipHeight={12}
                    labelTextColor={{ from: "color", modifiers: [["darker", 1.6]] }}
                    legends={revenueCurrency === 'all' ? [
                      {
                        dataFrom: 'keys',
                        anchor: 'bottom-right',
                        direction: 'column',
                        justify: false,
                        translateX: 120,
                        translateY: 0,
                        itemsSpacing: 2,
                        itemWidth: 100,
                        itemHeight: 20,
                        itemDirection: 'left-to-right',
                        itemOpacity: 0.85,
                        symbolSize: 20,
                        effects: [
                          {
                            on: 'hover',
                            style: {
                              itemOpacity: 1
                            }
                          }
                        ]
                      }
                    ] : []}
                    animate={true}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Plans Revenue */}
          {revenueAnalytics?.topPlans && revenueAnalytics.topPlans.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Plans</CardTitle>
                <CardDescription>
                  Subscription plans by revenue
                  {revenueCurrency !== 'all' && ` - ${revenueCurrency} only`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueAnalytics.topPlans
                    .filter((plan: any) => revenueCurrency === 'all' || plan.currency === revenueCurrency)
                    .slice(0, 5)
                    .map((plan: any, index: number) => (
                    <div key={`${plan.planId}-${plan.currency}`} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{plan.planName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {plan.subscriptionCount} subscriptions
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {plan.currency === 'USD' ? '$' : '₹'}{plan.totalRevenue.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {plan.currency}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}