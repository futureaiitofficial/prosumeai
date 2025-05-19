import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { SubscriptionErrorDialog } from "@/components/ui/subscription-error-dialog";

// State to track if an error dialog is currently shown
let isErrorDialogShowing = false;

interface ErrorHandlerOptions {
  showDialog?: boolean;
  setDialogState?: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Handles API errors specifically for subscription and limit-related issues
 * @param error The error object from the catch block
 * @param toast The toast function from useToast hook
 * @param options Additional options for error handling
 * @returns Boolean indicating if the error was handled
 */
export const handleSubscriptionError = (
  error: any, 
  toast: ReturnType<typeof useToast>['toast'],
  options: ErrorHandlerOptions = {}
) => {
  console.error('API error:', error);
  
  // Default error message if we can't parse the response
  let errorMessage = "Operation failed. Please try again.";
  let errorTitle = "Error";
  let errorType: 'limit' | 'subscription' | 'access' | null = null;
  let usageInfo = null;

  try {
    // Handle different error scenarios
    if (error.response?.status === 403) {
      // Parse response data
      const responseData = error.response?.data || {};
      
      // Specific limit error (tokens or usage count)
      if (responseData.message?.includes('Token usage limit exceeded') || 
          responseData.message?.includes('limit exceeded')) {
        
        const { limit, current, resetFrequency } = responseData;
        
        errorTitle = "Usage Limit Reached";
        errorMessage = `You've reached your ${resetFrequency?.toLowerCase() || ''} limit. ` +
                      `Current usage: ${current || 'Unknown'} / ${limit || 'Unknown'}. ` +
                      `Please upgrade your plan or wait for your limit to reset.`;
        
        errorType = 'limit';
        usageInfo = {
          current: current || 0,
          limit: limit || 100,
          resetFrequency: resetFrequency || 'monthly'
        };
        
        // Always show a toast for immediate feedback
        toast({
          title: errorTitle,
          description: "Usage limit reached. Please upgrade your plan for continued access.",
          variant: "destructive",
        });
        
        // Check if we should show the dialog
        if (options.showDialog && options.setDialogState && !isErrorDialogShowing) {
          isErrorDialogShowing = true;
          options.setDialogState(true);
          
          // Reset after dialog is likely closed
          setTimeout(() => {
            isErrorDialogShowing = false;
          }, 10000);
        }
        
        return true;
      }
      
      // No active subscription
      if (responseData.message?.includes('No active subscription')) {
        errorTitle = "Subscription Required";
        errorMessage = "This feature requires an active subscription. Please subscribe to access this feature.";
        errorType = 'subscription';
        
        toast({
          title: errorTitle,
          description: "Subscription required for this feature.",
          variant: "destructive",
        });
        
        // Show dialog if requested
        if (options.showDialog && options.setDialogState && !isErrorDialogShowing) {
          isErrorDialogShowing = true;
          options.setDialogState(true);
          
          setTimeout(() => {
            isErrorDialogShowing = false;
          }, 10000);
        }
        
        return true;
      }
      
      // Feature not in plan
      if (responseData.message?.includes('not available in your subscription')) {
        errorTitle = "Feature Not Available";
        errorMessage = "This feature is not available in your current plan. Please upgrade to access this feature.";
        errorType = 'access';
        
        toast({
          title: errorTitle,
          description: "Feature not available in your current plan.",
          variant: "destructive",
        });
        
        // Show dialog if requested
        if (options.showDialog && options.setDialogState && !isErrorDialogShowing) {
          isErrorDialogShowing = true;
          options.setDialogState(true);
          
          setTimeout(() => {
            isErrorDialogShowing = false;
          }, 10000);
        }
        
        return true;
      }

      // Generic 403 error
      errorTitle = "Access Denied";
      errorMessage = responseData.message || "You don't have permission to access this feature.";
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
      return true;
    }
    
    // Rate limiting from OpenAI
    if (error.response?.status === 429) {
      errorTitle = "Rate Limit Exceeded";
      errorMessage = "Too many requests. Please try again later.";
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
      return true;
    }
    
    // Server error
    if (error.response?.status >= 500) {
      errorTitle = "Server Error";
      errorMessage = "Something went wrong on our server. Please try again later.";
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
      return true;
    }
    
    // Get error message from response if available
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
      return true;
    }
    
    // For Axios errors without response
    if (error.message) {
      errorMessage = error.message;
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
      return true;
    }
  } catch (parseError) {
    console.error('Error parsing error response:', parseError);
  }
  
  // If we haven't handled the error specifically, use the default message
  toast({
    title: errorTitle,
    description: errorMessage,
    variant: "destructive",
  });
  
  return true;
};

/**
 * React hook to handle subscription errors with a dialog
 * @returns Error handling utilities
 */
export const useSubscriptionErrorHandler = () => {
  const { toast } = useToast();
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorInfo, setErrorInfo] = useState({
    title: "",
    description: "",
    errorType: 'subscription' as 'limit' | 'subscription' | 'access',
    usageInfo: undefined as undefined | {
      current: number;
      limit: number;
      resetFrequency?: string;
    }
  });
  
  const handleError = (error: any) => {
    try {
      console.error('Subscription error:', error);
      
      if (error.response?.status === 403) {
        const responseData = error.response?.data || {};
        
        // Token limit exceeded
        if (responseData.message?.includes('Token usage limit exceeded') || 
            responseData.message?.includes('limit exceeded')) {
          
          const { limit, current, resetFrequency } = responseData;
          
          setErrorInfo({
            title: "Usage Limit Reached",
            description: "You've reached your usage limit for this feature.",
            errorType: 'limit',
            usageInfo: {
              current: current || 0,
              limit: limit || 100,
              resetFrequency: resetFrequency?.toLowerCase() || 'monthly'
            }
          });
          
          setShowErrorDialog(true);
          return true;
        }
        
        // No subscription
        if (responseData.message?.includes('No active subscription')) {
          setErrorInfo({
            title: "Subscription Required",
            description: "This feature requires an active subscription.",
            errorType: 'subscription',
            usageInfo: undefined
          });
          
          setShowErrorDialog(true);
          return true;
        }
        
        // Feature not in plan
        if (responseData.message?.includes('not available in your subscription')) {
          setErrorInfo({
            title: "Feature Not Available",
            description: "This feature is not available in your current plan.",
            errorType: 'access',
            usageInfo: undefined
          });
          
          setShowErrorDialog(true);
          return true;
        }
        
        // Show toast for generic 403 errors
        toast({
          title: "Access Denied",
          description: responseData.message || "You don't have permission to access this feature.",
          variant: "destructive",
        });
        return true;
      }
      
      // For other error types, use toast
      return handleSubscriptionError(error, toast);
      
    } catch (parseError) {
      console.error('Error in error handler:', parseError);
      return false;
    }
  };
  
  // Component to render the dialog
  const ErrorDialog = function() {
    return (
      <SubscriptionErrorDialog
        open={showErrorDialog}
        onOpenChange={setShowErrorDialog}
        title={errorInfo.title}
        description={errorInfo.description}
        errorType={errorInfo.errorType}
        usageInfo={errorInfo.usageInfo}
      />
    );
  };
  
  return {
    handleError,
    ErrorDialog,
    showErrorDialog,
    setShowErrorDialog
  };
}; 