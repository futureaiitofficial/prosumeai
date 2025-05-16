import React, { useState, useEffect, FC } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { format } from 'date-fns';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CalendarIcon, CheckCircle, ExternalLinkIcon, RefreshCw, Shield, Users, Download, Plus, MoreHorizontal } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import TransactionDialogExplanation from './transaction-dialog-text';
import {  
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";

interface UserSubscription {
  id: number;
  userId: number;
  planId: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'CANCELLED' | 'GRACE_PERIOD' | 'EXPIRED';
  autoRenew: boolean;
  paymentReference: string;
  planName: string;
  planDescription: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
  userEmail?: string;
  username?: string;
  razorpayCustomerId?: string;
  gracePeriodEnd?: string;
  paymentFailureCount?: number;
}

interface User {
  id: number;
  email: string;
  username: string;
  fullName: string;
  razorpayCustomerId?: string;
}

interface PaymentTransaction {
  id: number;
  userId: number;
  subscriptionId: number;
  amount: string;
  currency: string;
  gateway: string;
  gatewayTransactionId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  planId?: number;
  planName?: string;
  refundReason?: string;
  correctPlanPrice?: string;
  correctPlanCurrency?: string;
  metadata?: Record<string, any>;
  isDuplicate?: boolean;
  isPrimary?: boolean;
}

interface Transaction {
  id: number;
  userId: number;
  subscriptionId: number;
  amount: string;
  currency: string;
  gateway: string;
  gatewayTransactionId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  planId?: number;
  planName?: string;
  refundReason?: string;
  correctPlanPrice?: string;
  correctPlanCurrency?: string;
  metadata?: Record<string, any>;
}

interface SyncResponse {
  success: boolean;
  message: string;
  subscription?: UserSubscription;
  razorpayStatus?: string;
}

// Define types for tracking data
type IpAddress = {
  ipAddress: string;
  lastSeen?: string;
};

type Device = {
  deviceId: string;
  lastSeen?: string;
  userAgent?: string;
};

type SharedAccount = {
  userId: number;
  username: string;
  shareType: string;
};

type DeviceTrackingData = {
  ipAddresses?: IpAddress[];
  devices?: Device[];
  sharedAccounts?: SharedAccount[];
};

const UserSubscriptionManagement: FC = () => {
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewTransactionsModalOpen, setViewTransactionsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>(undefined);
  const [endDateFilter, setEndDateFilter] = useState<Date | undefined>(undefined);
  const [transactionDateFilter, setTransactionDateFilter] = useState<Date | undefined>(undefined);
  const [transactionStatusFilter, setTransactionStatusFilter] = useState<string>('all');
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<UserSubscription | null>(null);
  const [syncingSubscription, setSyncingSubscription] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [statusActionModalOpen, setStatusActionModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResponse | null>(null);
  const [dialogContent, setDialogContent] = useState<{ title: string; content: React.ReactNode; showDeleteButton: boolean; showCancelButton: boolean; confirmText: string; confirmVariant: 'default' | 'destructive' | 'secondary' } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<number[]>([]);
  const [addSubscriptionModalOpen, setAddSubscriptionModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/admin/user-subscriptions');
        setSubscriptions(response.data);
      } catch (error) {
        console.error(error);
        toast({
          title: 'Error',
          description: 'Failed to load user subscriptions',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const processTransactions = (transactions: PaymentTransaction[]) => {
    const transactionGroups: Record<string, PaymentTransaction[]> = {};
    
    transactions.forEach(tx => {
      if (!tx.gatewayTransactionId) return;
      
      if (!transactionGroups[tx.gatewayTransactionId]) {
        transactionGroups[tx.gatewayTransactionId] = [];
      }
      transactionGroups[tx.gatewayTransactionId].push(tx);
    });
    
    const processedTransactions: (PaymentTransaction & { isDuplicate?: boolean, isPrimary?: boolean })[] = [];
    
    Object.entries(transactionGroups).forEach(([_, group]) => {
      if (group.length === 1) {
        processedTransactions.push({...group[0]});
      } else {
        let primaryIndex = 0;
        let hasPrimaryWithMatchingCurrency = false;
        
        group.forEach((tx, index) => {
          if (tx.metadata?.paymentDetails?.expectedCurrency === tx.currency) {
            primaryIndex = index;
            hasPrimaryWithMatchingCurrency = true;
          }
        });
        
        if (!hasPrimaryWithMatchingCurrency) {
          group.forEach((tx, index) => {
            if (parseFloat(tx.amount) > 0) {
              primaryIndex = index;
            }
          });
        }
        
        group.forEach((tx, index) => {
          processedTransactions.push({
            ...tx,
            isPrimary: index === primaryIndex,
            isDuplicate: index !== primaryIndex
          });
        });
      }
    });
    
    return processedTransactions;
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      if (selectedUserId !== null) {
        setLoadingTransactions(true);
        try {
          const userResponse = await axios.get(`/api/admin/users/${selectedUserId}`);
          setSelectedUser(userResponse.data);
          
          const txResponse = await axios.get(`/api/admin/user-transactions/${selectedUserId}`);
          if (txResponse.data && txResponse.data.transactions) {
            const transactions = Array.isArray(txResponse.data.transactions) ? txResponse.data.transactions : [];
            setTransactions(processTransactions(transactions));
          } else {
            const transactions = Array.isArray(txResponse.data) ? txResponse.data : [];
            setTransactions(processTransactions(transactions));
          }
        } catch (error) {
          console.error(error);
          setSelectedUser(null);
          setTransactions([]);
          toast({
            title: 'Error',
            description: 'Failed to load user transactions',
            variant: 'destructive'
          });
        } finally {
          setLoadingTransactions(false);
        }
      }
    };
    
    if (selectedUserId) {
      fetchTransactions();
    }
  }, [selectedUserId, toast]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCancelSubscription = async (subscriptionId: number) => {
    try {
      await axios.post(`/api/admin/cancel-subscription/${subscriptionId}`);
      toast({
        title: 'Success',
        description: 'Subscription cancelled successfully',
      });
      const response = await axios.get('/api/admin/user-subscriptions');
      setSubscriptions(response.data);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription',
        variant: 'destructive'
      });
    }
  };

  const handleViewTransactions = (userId: number) => {
    setSelectedUserId(userId);
    setViewTransactionsModalOpen(true);
  };

  const uniquePlans = Array.from(new Set(subscriptions.map(sub => sub.planName)));

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = 
      sub.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.razorpayCustomerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.paymentReference?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesPlan = planFilter === 'all' || sub.planName === planFilter;
    const matchesStartDate = !startDateFilter || new Date(sub.startDate) >= startDateFilter;
    const matchesEndDate = !endDateFilter || new Date(sub.endDate) <= endDateFilter;

    return matchesSearch && matchesStatus && matchesPlan && matchesStartDate && matchesEndDate;
  });

  const filteredTransactions = Array.isArray(transactions) ? transactions.filter(tx => {
    const matchesDate = !transactionDateFilter || 
      new Date(tx.createdAt).toDateString() === transactionDateFilter.toDateString();
    const matchesStatus = transactionStatusFilter === 'all' || tx.status === transactionStatusFilter;
    return matchesDate && matchesStatus;
  }) : [];

  const resetFilters = () => {
    setStatusFilter('all');
    setPlanFilter('all');
    setStartDateFilter(undefined);
    setEndDateFilter(undefined);
  };

  const resetTransactionFilters = () => {
    setTransactionDateFilter(undefined);
    setTransactionStatusFilter('all');
  };

  const formatCurrencyAmount = (amount: string, currency: string) => {
    const numericAmount = parseFloat(amount);
    
    if (numericAmount === 0) {
      return currency === 'INR' ? '₹0.00' : '$0.00';
    }
    
    if (currency === 'INR') {
      return `₹${numericAmount.toLocaleString('en-IN')}`;
    } else if (currency === 'USD') {
      return `$${numericAmount.toFixed(2)}`;
    } else {
      return `${numericAmount.toFixed(2)} ${currency}`;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-600">Active</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-600">Cancelled</Badge>;
      case 'GRACE_PERIOD':
        return <Badge className="bg-yellow-600">Grace Period</Badge>;
      case 'EXPIRED':
        return <Badge className="bg-gray-600">Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTransactionStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-600">Completed</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-600">Failed</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-600">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const renderRazorpayLinks = () => {
    if (!selectedUser || !selectedUser.razorpayCustomerId) {
      return <p className="text-yellow-500">No Razorpay customer ID linked to this user</p>;
    }

    const subscriptionPaymentRef = transactions.length > 0 && transactions[0].gatewayTransactionId 
      ? transactions[0].gatewayTransactionId
      : null;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Razorpay Customer ID:</span>
          <span>{selectedUser.razorpayCustomerId}</span>
          <a 
            href={`https://dashboard.razorpay.com/app/customers/${selectedUser.razorpayCustomerId}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 inline-flex items-center"
          >
            View in Razorpay <ExternalLinkIcon className="ml-1 h-4 w-4" />
          </a>
        </div>
        
        {subscriptionPaymentRef && (
          <div className="flex items-center gap-2">
            <span className="font-semibold">Latest Transaction:</span>
            <a 
              href={`https://dashboard.razorpay.com/app/payments/${subscriptionPaymentRef}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 inline-flex items-center"
            >
              {subscriptionPaymentRef} <ExternalLinkIcon className="ml-1 h-4 w-4" />
            </a>
          </div>
        )}
      </div>
    );
  };

  const handleSyncSubscription = async (subscription: UserSubscription) => {
    setSelectedSubscription(subscription);
    setSyncingSubscription(true);
    setSyncModalOpen(true);
    
    try {
      const response = await axios.post(`/api/admin/sync-subscription/${subscription.id}`);
      setSyncResult(response.data);
      
      if (response.data.success) {
        const subscriptionsResponse = await axios.get('/api/admin/user-subscriptions');
        setSubscriptions(subscriptionsResponse.data);
      }
    } catch (error) {
      console.error('Error syncing subscription with Razorpay:', error);
      setSyncResult({
        success: false,
        message: 'Failed to sync subscription with Razorpay'
      });
    } finally {
      setSyncingSubscription(false);
    }
  };

  const handleChangeStatus = (subscription: UserSubscription, status: string) => {
    setSelectedSubscription(subscription);
    setTargetStatus(status);
    setStatusActionModalOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedSubscription || !targetStatus) return;
    
    setChangingStatus(true);
    
    try {
      const response = await axios.post(`/api/admin/change-subscription-status/${selectedSubscription.id}`, {
        status: targetStatus
      });
      
      if (response.data.success) {
        toast({
          title: 'Status Updated',
          description: `Subscription status changed to ${targetStatus}`,
        });
        
        const subscriptionsResponse = await axios.get('/api/admin/user-subscriptions');
        setSubscriptions(subscriptionsResponse.data);
      } else {
        toast({
          title: 'Error',
          description: response.data.message || 'Failed to update subscription status',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error changing subscription status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update subscription status',
        variant: 'destructive'
      });
    } finally {
      setChangingStatus(false);
      setStatusActionModalOpen(false);
    }
  };

  const getStatusBadgeWithDetails = (subscription: UserSubscription) => {
    switch (subscription.status) {
      case 'ACTIVE':
        return (
          <div className="space-y-1">
            <Badge className="bg-green-600">Active</Badge>
            <div className="text-xs text-gray-600">
              Auto-renew: {subscription.autoRenew ? 'Yes' : 'No'}
            </div>
            <div className="text-xs text-gray-600">
              Ends: {format(new Date(subscription.endDate), 'MMM d, yyyy')}
            </div>
          </div>
        );
      case 'CANCELLED':
        return (
          <div className="space-y-1">
            <Badge className="bg-red-600">Cancelled</Badge>
            <div className="text-xs text-gray-600">
              Active until: {format(new Date(subscription.endDate), 'MMM d, yyyy')}
            </div>
          </div>
        );
      case 'GRACE_PERIOD':
        return (
          <div className="space-y-1">
            <Badge className="bg-yellow-600">Grace Period</Badge>
            <div className="text-xs text-gray-600">
              Grace ends: {subscription.gracePeriodEnd ? 
                format(new Date(subscription.gracePeriodEnd), 'MMM d, yyyy') : 'Unknown'}
            </div>
            <div className="text-xs text-gray-600">
              Payment failures: {subscription.paymentFailureCount || 0}
            </div>
          </div>
        );
      case 'EXPIRED':
        return (
          <div className="space-y-1">
            <Badge className="bg-gray-600">Expired</Badge>
            <div className="text-xs text-gray-600">
              Expired on: {format(new Date(subscription.endDate), 'MMM d, yyyy')}
            </div>
          </div>
        );
      default:
        return <Badge>{subscription.status}</Badge>;
    }
  };

  const fetchIpTrackingData = async (userId: number): Promise<DeviceTrackingData | null> => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/users/${userId}/device-tracking`);
      return response.data;
    } catch (error) {
      console.error('Error fetching IP tracking data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load IP tracking data',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const resetDeviceTracking = async (userId: number) => {
    try {
      const response = await axios.post(`/api/admin/users/${userId}/reset-device-tracking`);
      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Device tracking data reset successfully',
        });
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error('Error resetting device tracking:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset device tracking data',
        variant: 'destructive',
      });
    }
  };

  const renderDeviceTrackingButton = (user: any) => {
    const isFreemium = user.planFreemium;
    
    if (!isFreemium) return null;
    
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          const trackingData = await fetchIpTrackingData(user.userId);
          if (trackingData) {
            setDialogContent({
              title: `Device Tracking for ${user.userName}`,
              content: (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">User IP and Device History</h3>
                  {trackingData.ipAddresses && trackingData.ipAddresses.length > 0 ? (
                    <div>
                      <h4 className="font-medium mb-2">IP Addresses:</h4>
                      <ul className="list-disc pl-5">
                        {trackingData.ipAddresses && trackingData.ipAddresses.map((ip: IpAddress, index: number) => (
                          <li key={index} className="mb-1">
                            {ip.ipAddress}
                            {ip.lastSeen && <span className="text-sm text-gray-500 ml-2">Last seen: {new Date(ip.lastSeen).toLocaleString()}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p>No IP address data available</p>
                  )}
                  
                  {trackingData.devices && trackingData.devices.length > 0 ? (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Devices:</h4>
                      <ul className="list-disc pl-5">
                        {trackingData.devices && trackingData.devices.map((device: Device, index: number) => (
                          <li key={index} className="mb-1">
                            Device ID: {device.deviceId}
                            {device.lastSeen && <span className="text-sm text-gray-500 ml-2">Last seen: {new Date(device.lastSeen).toLocaleString()}</span>}
                            {device.userAgent && <div className="text-xs text-gray-500 mt-1">{device.userAgent}</div>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p>No device data available</p>
                  )}
                  
                  {trackingData.sharedAccounts && trackingData.sharedAccounts.length > 0 && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
                      <h4 className="font-medium mb-2 text-amber-800">Shared Resources:</h4>
                      <p className="text-sm text-amber-700 mb-2">
                        This user shares IP addresses or devices with the following accounts:
                      </p>
                      <ul className="list-disc pl-5">
                        {trackingData.sharedAccounts && trackingData.sharedAccounts.map((account: SharedAccount, index: number) => (
                          <li key={index} className="mb-1 text-amber-700">
                            {account.username} (ID: {account.userId})
                            <span className="text-xs ml-2">{account.shareType}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t">
                    <h4 className="font-medium mb-2">Actions:</h4>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to reset device tracking data for this user? This will allow them to create a new freemium account.')) {
                          resetDeviceTracking(user.userId);
                        }
                      }}
                    >
                      Reset Device Tracking
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      This will remove all IP and device tracking data for this user, allowing them to create a new freemium account.
                    </p>
                  </div>
                </div>
              ),
              showDeleteButton: false,
              showCancelButton: true,
              confirmText: 'Close',
              confirmVariant: 'secondary'
            });
            setIsDialogOpen(true);
          }
        }}
      >
        <Users className="h-4 w-4 mr-1" />
        <span>Track</span>
      </Button>
    );
  };

  const fetchUserTransactions = async (userId: number) => {
    setSelectedUserId(userId);
    setViewTransactionsModalOpen(true);
  };

  const correctTransactionCurrency = async (transactionId: number, correctCurrency: string) => {
    try {
      await axios.post(`/api/admin/transactions/${transactionId}/correct-currency`, {
        correctCurrency
      });
      toast({
        title: "Success",
        description: "Transaction currency corrected successfully",
      });
      // Refresh transactions
      if (selectedUserId) {
        const txResponse = await axios.get(`/api/admin/user-transactions/${selectedUserId}`);
        if (txResponse.data && txResponse.data.transactions) {
          const transactions = Array.isArray(txResponse.data.transactions) ? txResponse.data.transactions : [];
          setTransactions(processTransactions(transactions));
        } else {
          const transactions = Array.isArray(txResponse.data) ? txResponse.data : [];
          setTransactions(processTransactions(transactions));
        }
      }
    } catch (error) {
      console.error('Error correcting transaction currency:', error);
      toast({
        title: "Error",
        description: "Failed to correct transaction currency",
        variant: "destructive"
      });
    }
  };

  const renderSyncResults = () => {
    if (!syncResult) return null;
    
    if (syncResult.success) {
      return (
        <div className="rounded-md bg-green-50 p-4 border border-green-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Sync Successful
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>{syncResult.message}</p>
                {syncResult.razorpayStatus && (
                  <p className="mt-1">Razorpay Status: {syncResult.razorpayStatus}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Sync Failed
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{syncResult.message}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  const handleAddSubscription = () => {
    setAddSubscriptionModalOpen(true);
  };

  const handleExportData = (exportType: string) => {
    try {
      const dataToExport = filteredSubscriptions.map(sub => ({
        id: sub.id,
        userId: sub.userId,
        username: sub.username || 'Unknown',
        email: sub.userEmail || 'Unknown',
        plan: sub.planName,
        status: sub.status,
        startDate: format(new Date(sub.startDate), 'yyyy-MM-dd'),
        endDate: format(new Date(sub.endDate), 'yyyy-MM-dd'),
        autoRenew: sub.autoRenew ? 'Yes' : 'No'
      }));

      let content, filename, type;

      if (exportType === 'csv') {
        // Create CSV
        const headers = Object.keys(dataToExport[0]).join(',');
        const rows = dataToExport.map(row => Object.values(row).join(',')).join('\n');
        content = `${headers}\n${rows}`;
        filename = `subscriptions-export-${new Date().toISOString().slice(0,10)}.csv`;
        type = 'text/csv';
      } else {
        // Create JSON
        content = JSON.stringify(dataToExport, null, 2);
        filename = `subscriptions-export-${new Date().toISOString().slice(0,10)}.json`;
        type = 'application/json';
      }

      // Create download link
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export successful',
        description: `Data exported as ${exportType.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Export failed',
        description: 'There was a problem exporting the data',
        variant: 'destructive'
      });
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedSubscriptions.length === 0) {
      toast({
        title: 'No subscriptions selected',
        description: 'Please select at least one subscription to perform this action',
        variant: 'destructive'
      });
      return;
    }

    if (action === 'cancel' && confirm(`Are you sure you want to cancel ${selectedSubscriptions.length} subscription(s)?`)) {
      // Implement cancel logic
      toast({
        title: 'Cancellation in progress',
        description: `Cancelling ${selectedSubscriptions.length} subscription(s)...`,
      });
    } else if (action === 'extend') {
      // Implement extend logic
      toast({
        title: 'Extension in progress',
        description: `Extending ${selectedSubscriptions.length} subscription(s)...`,
      });
    } else if (action === 'delete' && confirm(`Are you sure you want to delete ${selectedSubscriptions.length} subscription(s)? This action cannot be undone.`)) {
      // Implement delete logic
      toast({
        title: 'Deletion in progress',
        description: `Deleting ${selectedSubscriptions.length} subscription(s)...`,
      });
    }
  };

  const toggleSubscriptionSelection = (subscriptionId: number) => {
    setSelectedSubscriptions(prev => 
      prev.includes(subscriptionId) 
        ? prev.filter(id => id !== subscriptionId) 
        : [...prev, subscriptionId]
    );
  };

  const toggleAllSubscriptions = () => {
    if (selectedSubscriptions.length === filteredSubscriptions.length) {
      setSelectedSubscriptions([]);
    } else {
      setSelectedSubscriptions(filteredSubscriptions.map(sub => sub.id));
    }
  };

  return (
    <div className="space-y-4 p-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <CardTitle className="text-2xl">User Subscription Management</CardTitle>
            <div className="flex gap-2 mt-2 sm:mt-0">
              <Button variant="outline" size="sm" onClick={handleAddSubscription}>
                <Plus className="mr-1 h-4 w-4" />
                Add Subscription
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={selectedSubscriptions.length === 0}>
                    Bulk Actions ({selectedSubscriptions.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Manage Selected</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => handleBulkAction('cancel')}>
                    Cancel Subscriptions
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleBulkAction('extend')}>
                    Extend End Date
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onSelect={() => handleBulkAction('delete')}
                    className="text-red-600 focus:text-red-600"
                  >
                    Delete Subscriptions
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="mr-1 h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => handleExportData('csv')}>
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleExportData('json')}>
                    Export as JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4 items-center">
            <Input
              placeholder="Search by email, username, plan, or Razorpay ID..."
              value={searchTerm}
              onChange={handleSearch}
              className="max-w-md"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="GRACE_PERIOD">Grace Period</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                {uniquePlans.map(plan => (
                  <SelectItem key={plan} value={plan}>{plan}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-[180px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDateFilter ? format(startDateFilter, 'yyyy-MM-dd') : <span>Start Date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDateFilter}
                  onSelect={(date) => {
                    setStartDateFilter(date);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-[180px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDateFilter ? format(endDateFilter, 'yyyy-MM-dd') : <span>End Date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDateFilter}
                  onSelect={(date) => {
                    setEndDateFilter(date);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm" onClick={resetFilters}>Reset Filters</Button>
          </div>
          {loading ? (
            <div className="text-center py-10">Loading...</div>
          ) : (
            <div className="rounded-lg border shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input 
                        type="checkbox" 
                        checked={filteredSubscriptions.length > 0 && selectedSubscriptions.length === filteredSubscriptions.length}
                        onChange={toggleAllSubscriptions}
                        className="h-4 w-4"
                      />
                    </TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Ref</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center">No subscriptions found</TableCell>
                    </TableRow>
                  ) : (
                    filteredSubscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <input 
                            type="checkbox" 
                            checked={selectedSubscriptions.includes(sub.id)}
                            onChange={() => toggleSubscriptionSelection(sub.id)}
                            className="h-4 w-4"
                          />
                        </TableCell>
                        <TableCell>{sub.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{sub.username || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">{sub.userEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{sub.planName}</div>
                          <div className="text-xs text-gray-500">{sub.billingCycle}</div>
                        </TableCell>
                        <TableCell>{getStatusBadgeWithDetails(sub)}</TableCell>
                        <TableCell>{sub.paymentReference || 'N/A'}</TableCell>
                        <TableCell>{format(new Date(sub.startDate), 'yyyy-MM-dd')}</TableCell>
                        <TableCell>{format(new Date(sub.endDate), 'yyyy-MM-dd')}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUserId(sub.userId);
                                setViewTransactionsModalOpen(true);
                              }}
                            >
                              Transactions
                            </Button>
                            {renderDeviceTrackingButton(sub)}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => handleSyncSubscription(sub)}>
                                  Sync with Razorpay
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => handleChangeStatus(sub, 'ACTIVE')}>
                                  Mark as Active
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleChangeStatus(sub, 'CANCELLED')}>
                                  Cancel Subscription
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleChangeStatus(sub, 'GRACE_PERIOD')}>
                                  Set to Grace Period
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={viewTransactionsModalOpen} onOpenChange={setViewTransactionsModalOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>User Transactions and Payment Details</DialogTitle>
            <DialogDescription>
              <TransactionDialogExplanation />
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="transactions">
            <TabsList className="mb-4">
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="gateway">Payment Gateway</TabsTrigger>
            </TabsList>
            
            <TabsContent value="transactions">
              <div className="flex flex-wrap gap-4 mb-4 items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-[180px] justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {transactionDateFilter ? format(transactionDateFilter, 'yyyy-MM-dd') : <span>Filter by Date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={transactionDateFilter}
                      onSelect={(date) => {
                        setTransactionDateFilter(date);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Select value={transactionStatusFilter} onValueChange={setTransactionStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={resetTransactionFilters}>Reset Filters</Button>
              </div>
              
              {loadingTransactions ? (
                <div className="text-center py-10">Loading transactions...</div>
              ) : (
                <div className="rounded-lg border shadow-sm mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Gateway</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center">No transactions found</TableCell>
                        </TableRow>
                      ) : (
                        filteredTransactions.map(tx => {
                          const planDetails = tx.metadata?.planDetails;
                          const paymentDetails = tx.metadata?.paymentDetails;
                          const isUpgrade = tx.metadata?.isUpgrade;
                          
                          return (
                            <TableRow key={tx.id} className={tx.isDuplicate ? 'bg-gray-50' : ''}>
                              <TableCell>{tx.id}</TableCell>
                              <TableCell>
                                <div className="font-medium">
                                  {parseFloat(tx.amount) === 0 && tx.status === 'COMPLETED' && paymentDetails?.correctPlanPrice ? (
                                    <div>
                                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Authorization</span>
                                      <div className="text-sm mt-1">
                                        {formatCurrencyAmount(paymentDetails.correctPlanPrice, paymentDetails.correctPlanCurrency || 'USD')}
                                      </div>
                                    </div>
                                  ) : (
                                    formatCurrencyAmount(tx.amount, tx.currency)
                                  )}
                                  
                                  {paymentDetails?.hasCurrencyMismatch && (
                                    <div className="space-y-1">
                                      <div className="text-xs text-red-600 font-medium mt-1 px-1 py-0.5 bg-red-50 rounded-sm inline-block">
                                        Wrong currency
                                      </div>
                                      <div className="flex gap-1 mt-1">
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          className="h-6 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                          onClick={() => correctTransactionCurrency(tx.id, paymentDetails.correctPlanCurrency || 'USD')}
                                        >
                                          Fix to {paymentDetails.correctPlanCurrency || 'USD'}
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {tx.isDuplicate && (
                                    <div className="text-xs text-orange-600 font-medium mt-1 px-1 py-0.5 bg-orange-50 rounded-sm inline-block">
                                      Duplicate record
                                    </div>
                                  )}
                                  
                                  {tx.isPrimary && (
                                    <div className="text-xs text-green-600 font-medium mt-1 px-1 py-0.5 bg-green-50 rounded-sm inline-block">
                                      Primary record
                                    </div>
                                  )}
                                  
                                  {paymentDetails?.correctPlanPrice && parseFloat(tx.amount) !== 0 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Expected: {formatCurrencyAmount(
                                        paymentDetails.correctPlanPrice,
                                        paymentDetails.correctPlanCurrency || 'USD'
                                      )}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{getTransactionStatusBadge(tx.status)}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  parseFloat(tx.amount) === 0 && tx.status === 'COMPLETED'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : paymentDetails?.hasCurrencyMismatch
                                      ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                      : isUpgrade
                                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                        : 'bg-green-100 text-green-800 border border-green-200'
                                }`}>
                                  {parseFloat(tx.amount) === 0 && tx.status === 'COMPLETED'
                                    ? 'Authorization'
                                    : paymentDetails?.hasCurrencyMismatch
                                      ? 'Currency Mismatch'
                                      : isUpgrade
                                        ? 'Plan Upgrade'
                                        : 'Subscription Payment'}
                                </span>
                              </TableCell>
                              <TableCell>{tx.gateway}</TableCell>
                              <TableCell>
                                {planDetails?.name || tx.planName || '-'}
                                {planDetails?.cycle && (
                                  <span className="text-xs text-gray-500 block mt-1">
                                    {planDetails.cycle}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <span className="text-sm font-mono truncate max-w-[120px]">{tx.gatewayTransactionId}</span>
                                  {tx.gateway === 'RAZORPAY' && tx.gatewayTransactionId && (
                                    <a 
                                      href={`https://dashboard.razorpay.com/app/payments/${tx.gatewayTransactionId}`}
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="ml-1 text-blue-500"
                                    >
                                      <ExternalLinkIcon className="h-4 w-4" />
                                    </a>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{format(new Date(tx.createdAt), 'yyyy-MM-dd HH:mm')}</TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="gateway">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">
                    Razorpay Integration Details
                  </h3>
                  <Separator className="my-2" />
                  {loadingTransactions ? (
                    <div className="text-center py-4">Loading payment gateway details...</div>
                  ) : renderRazorpayLinks()}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={statusActionModalOpen} onOpenChange={setStatusActionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Subscription Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to change this subscription's status?
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubscription && (
            <div className="py-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-sm font-medium">Current Status:</div>
                <div>{getStatusBadge(selectedSubscription.status)}</div>
                
                <div className="text-sm font-medium">New Status:</div>
                <div>{getStatusBadge(targetStatus)}</div>
                
                <div className="text-sm font-medium">User:</div>
                <div>{selectedSubscription.userEmail || selectedSubscription.username}</div>
                
                <div className="text-sm font-medium">Plan:</div>
                <div>{selectedSubscription.planName}</div>
              </div>
              
              {targetStatus === 'GRACE_PERIOD' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Moving to Grace Period</AlertTitle>
                  <AlertDescription>
                    User will maintain access for 7 days while payment issues are resolved.
                  </AlertDescription>
                </Alert>
              )}
              
              {targetStatus === 'ACTIVE' && selectedSubscription.status === 'GRACE_PERIOD' && (
                <Alert className="bg-green-50 text-green-800 border-green-200">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Reactivating Subscription</AlertTitle>
                  <AlertDescription>
                    This will mark the subscription as active again and extend access.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setStatusActionModalOpen(false)}
              disabled={changingStatus}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmStatusChange}
              disabled={changingStatus}
            >
              {changingStatus ? 'Processing...' : 'Confirm Change'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={syncModalOpen} onOpenChange={setSyncModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sync Subscription with Razorpay</DialogTitle>
            <DialogDescription>
              Checking the current status of this subscription in Razorpay and updating our records.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {syncingSubscription ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <p>Syncing subscription details with Razorpay...</p>
              </div>
            ) : syncResult ? (
              <div className="space-y-4">
                {renderSyncResults()}
              </div>
            ) : null}
          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => setSyncModalOpen(false)}
              disabled={syncingSubscription}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogContent?.title}</DialogTitle>
            <DialogDescription>
              {dialogContent?.content}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant={dialogContent?.confirmVariant}
              onClick={() => setIsDialogOpen(false)}
            >
              {dialogContent?.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addSubscriptionModalOpen} onOpenChange={setAddSubscriptionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Subscription</DialogTitle>
            <DialogDescription>
              Manually add a subscription for a user.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">User</Label>
              <Input id="user" placeholder="User ID or email" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Plan</Label>
              <Select>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Free Plan</SelectItem>
                  <SelectItem value="2">Basic Plan</SelectItem>
                  <SelectItem value="3">Pro Plan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Start Date</Label>
              <Input id="startDate" type="date" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">End Date</Label>
              <Input id="endDate" type="date" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSubscriptionModalOpen(false)}>Cancel</Button>
            <Button>Add Subscription</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserSubscriptionManagement;