import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LockKeyhole, AlertTriangle, Sparkles } from 'lucide-react';
import { useLocation } from 'wouter';

interface SubscriptionErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  errorType: 'limit' | 'subscription' | 'access';
  usageInfo?: {
    current: number;
    limit: number;
    resetFrequency?: string;
  };
}

export function SubscriptionErrorDialog({
  open,
  onOpenChange,
  title,
  description,
  errorType,
  usageInfo,
}: SubscriptionErrorDialogProps) {
  const [, navigate] = useLocation();
  
  // Calculate percentage if usage info is available
  const percentage = usageInfo 
    ? Math.min(Math.round((usageInfo.current / usageInfo.limit) * 100), 100) 
    : 0;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {errorType === 'limit' ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : errorType === 'subscription' ? (
              <LockKeyhole className="h-5 w-5 text-destructive" />
            ) : (
              <Sparkles className="h-5 w-5 text-primary" />
            )}
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Show usage info if available */}
          {usageInfo && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Current Usage</span>
                <span className="text-muted-foreground">
                  {usageInfo.current} / {usageInfo.limit} ({percentage}%)
                </span>
              </div>
              <Progress 
                value={percentage} 
                className={`h-2 ${percentage > 90 ? 'bg-red-200' : ''}`} 
              />
              {usageInfo.resetFrequency && (
                <p className="text-sm text-muted-foreground">
                  Your usage will reset {usageInfo.resetFrequency.toLowerCase()}.
                </p>
              )}
            </div>
          )}
          
          {/* Information based on error type */}
          <div className="text-sm space-y-2">
            {errorType === 'limit' && (
              <>
                <p>To continue using this feature with full functionality:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Wait for your usage to reset</li>
                  <li>Upgrade your subscription plan for higher limits</li>
                </ul>
              </>
            )}
            
            {errorType === 'subscription' && (
              <>
                <p>This feature requires an active subscription:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Subscribe to our service to access this feature</li>
                  <li>Compare available plans on our subscription page</li>
                </ul>
              </>
            )}
            
            {errorType === 'access' && (
              <>
                <p>This feature is not available in your current plan:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Upgrade to a higher tier plan to access this feature</li>
                  <li>Compare available plans on our subscription page</li>
                </ul>
              </>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          
          <Button onClick={() => navigate('/subscription')}>
            View Subscription Plans
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 