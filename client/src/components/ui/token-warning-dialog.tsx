import React from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { useLocation } from 'wouter';

interface TokenWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName: string;
  tokenUsage: number;
  tokenLimit: number;
  resetFrequency?: string;
  resetDate?: string;
}

export function TokenWarningDialog({
  open,
  onOpenChange,
  featureName,
  tokenUsage,
  tokenLimit,
  resetFrequency = 'monthly',
  resetDate,
}: TokenWarningDialogProps) {
  const [, navigate] = useLocation();
  const percentage = Math.min(Math.round((tokenUsage / tokenLimit) * 100), 100);
  const isCritical = percentage >= 90;
  
  const formatResetDate = (dateString?: string) => {
    if (!dateString) return 'on next reset';
    return `on ${new Date(dateString).toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric' 
    })}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCritical ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <Sparkles className="h-5 w-5 text-primary" />
            )}
            Token Usage {isCritical ? 'Limit Almost Reached' : 'Warning'}
          </DialogTitle>
          <DialogDescription>
            You're approaching your {resetFrequency} token limit for {featureName}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Current Usage</span>
              <span className="text-muted-foreground">
                {tokenUsage} / {tokenLimit} tokens ({percentage}%)
              </span>
            </div>
            <Progress 
              value={percentage} 
              className={`h-2 ${isCritical ? 'bg-red-200' : ''}`} 
            />
            <p className="text-sm text-muted-foreground">
              Your token usage will reset {formatResetDate(resetDate)}.
            </p>
          </div>
          
          <div className="text-sm space-y-2">
            <p>
              To continue using this feature with full functionality:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Wait for your usage to reset {resetFrequency}</li>
              <li>Upgrade your subscription plan for higher token limits</li>
              <li>Be more selective about when you use AI-powered features</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter className="flex sm:justify-between">
          <DialogClose asChild>
            <Button variant="secondary">Continue with limited usage</Button>
          </DialogClose>
          
          <Button onClick={() => navigate('/subscription')}>
            Upgrade Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 