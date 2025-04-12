import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, Check, AlertTriangle, Info, PieChart, ChevronRight, CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { calculateATSScore } from "@/lib/ats-score";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResumeData } from "@/types/resume";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useFeatureGuard } from "@/hooks/use-feature-access";
import { featureAccessModal } from "@/lib/queryClient";

interface ATSScoreProps {
  resumeData: ResumeData;
}

interface KeywordCategory {
  found: string[];
  missing: string[];
  all: string[];
}

interface KeywordsFeedback {
  found: string[];
  missing: string[];
  all: string[];
  categories: {
    [category: string]: KeywordCategory;
  };
}

interface ATSScoreState {
  generalScore: number;
  jobSpecificScore?: number;
  feedback: {
    generalFeedback: { category: string; score: number; feedback: string; priority: "high" | "low" | "medium" }[];
    keywordsFeedback?: KeywordsFeedback;
    overallSuggestions: string[];
  };
}

// Helper function to format category names for display
const formatCategoryName = (category: string): string => {
  // Split by camelCase and capitalize first letter of each word
  return category
    .replace(/([A-Z])/g, ' $1') // Insert a space before all caps
    .replace(/^./, (str) => str.toUpperCase()); // Capitalize the first letter
};

export default function ATSScore({ resumeData }: ATSScoreProps) {
  const { toast } = useToast();
  const [isCalculating, setIsCalculating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [score, setScore] = useState<ATSScoreState | null>(null);
  const [keywords, setKeywords] = useState<KeywordsFeedback>({
    found: [],
    missing: [],
    all: [],
    categories: {}
  });
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  // Store previous resume data for comparison
  const previousResumeDataRef = useRef<string>("");
  
  // Debounce timer reference
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if user has access to the feature
  const { hasAccess } = useFeatureGuard("ats_score", { showToast: false });

  const handleCalculateScore = async () => {
    try {
      // Check if the user has access to this feature first
      if (!hasAccess) {
        // Show the feature access modal instead of calculating
        featureAccessModal.showModal("ats_score");
        return;
      }
      
      // Check if we have the required data
      if (!resumeData?.targetJobTitle) {
        toast({
          title: "Missing Information",
          description: "Please enter a target job title first.",
          variant: "destructive",
        });
        return;
      }

      if (!resumeData?.jobDescription) {
        toast({
          title: "Missing Information",
          description: "Please enter a job description to calculate an accurate ATS score.",
          variant: "destructive",
        });
        return;
      }

      setIsCalculating(true);
      
      const atsScore = await calculateATSScore(resumeData);
      
      setScore(atsScore);
      setKeywords({
        found: atsScore.feedback.keywordsFeedback?.found || [],
        missing: atsScore.feedback.keywordsFeedback?.missing || [],
        all: atsScore.feedback.keywordsFeedback?.all || [],
        categories: atsScore.feedback.keywordsFeedback?.categories || {}
      });
      // Open the sheet automatically when score is calculated
      setIsOpen(true);
    } catch (error) {
      toast({
        title: "Calculation Failed",
        description: "There was an error calculating your ATS score. Please try again.",
        variant: "destructive",
      });
      console.error("ATS score calculation error:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return "bg-green-600";
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-amber-600";
    return "bg-red-600";
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return "A+";
    if (score >= 85) return "A";
    if (score >= 80) return "A-";
    if (score >= 75) return "B+";
    if (score >= 70) return "B";
    if (score >= 65) return "B-";
    if (score >= 60) return "C+";
    if (score >= 55) return "C";
    if (score >= 50) return "C-";
    return "D";
  };
  
  // Debounced calculation function
  const debouncedCalculateScore = () => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set new timer (2 seconds debounce)
    debounceTimerRef.current = setTimeout(() => {
      // Only calculate if we have both target job title and job description
      if (resumeData?.targetJobTitle && resumeData?.jobDescription) {
        // Only calculate if not already calculating
        if (!isCalculating) {
          // Don't open the sheet automatically for automatic updates
          calculateScoreQuietly();
        }
      }
    }, 2000);
  };
  
  // Silent calculation that doesn't show toasts or open the sheet
  const calculateScoreQuietly = async () => {
    try {
      // Skip if user doesn't have access to this feature
      if (!hasAccess) return;
      
      // Skip validation - this is only called when we know we have the required data
      setIsCalculating(true);
      
      const atsScore = await calculateATSScore(resumeData);
      
      setScore(atsScore);
      setKeywords({
        found: atsScore.feedback.keywordsFeedback?.found || [],
        missing: atsScore.feedback.keywordsFeedback?.missing || [],
        all: atsScore.feedback.keywordsFeedback?.all || [],
        categories: atsScore.feedback.keywordsFeedback?.categories || {}
      });
      // Don't open the sheet automatically for the quiet update
    } catch (error) {
      console.error("Silent ATS score calculation error:", error);
    } finally {
      setIsCalculating(false);
    }
  };
  
  // Watch for resume data changes
  useEffect(() => {
    // Stringify the resumeData for comparison
    const currentResumeDataString = JSON.stringify(resumeData);
    
    // Compare with previous data
    if (previousResumeDataRef.current !== currentResumeDataString) {
      // Update reference for next comparison
      previousResumeDataRef.current = currentResumeDataString;
      
      // Check if resume has essential content before calculating
      const hasEssentialContent = 
        !!resumeData.summary || 
        (resumeData.workExperience && resumeData.workExperience.length > 0) ||
        (resumeData.skills && resumeData.skills.length > 0) || 
        (resumeData.technicalSkills && resumeData.technicalSkills.length > 0);
      
      // Skip the first run (when component mounts)
      if (previousResumeDataRef.current !== "") {
        // Only auto-calculate if we have sufficient resume content
        if (hasEssentialContent) {
          debouncedCalculateScore();
        } else if (score) {
          // If we previously had a score but the resume is now empty, reset the score
          setScore(null);
        }
      }
    }
    
    // Cleanup function to clear any pending timers when component unmounts
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [resumeData]);

  // Toggle a category's expanded state
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Check if resume is essentially empty
  const isResumeEmpty = 
    !resumeData.summary && 
    (!resumeData.workExperience || resumeData.workExperience.length === 0) &&
    (!resumeData.education || resumeData.education.length === 0) &&
    (!resumeData.skills || resumeData.skills.length === 0) &&
    (!resumeData.technicalSkills || resumeData.technicalSkills.length === 0) &&
    (!resumeData.softSkills || resumeData.softSkills.length === 0);

  return (
    <div className="inline-flex items-center">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "flex items-center gap-2 border border-gray-200 shadow-sm hover:bg-gray-100 transition-all h-9",
              score && `hover:border-${score.generalScore >= 80 ? 'green' : score.generalScore >= 60 ? 'amber' : 'red'}-400`
            )}
            onClick={score ? undefined : handleCalculateScore}
          >
            {isCalculating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Analyzing Resume...</span>
              </>
            ) : isResumeEmpty ? (
              <>
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span>Resume Incomplete</span>
              </>
            ) : score ? (
              <>
                <PieChart className={cn("h-4 w-4", getScoreColor(score.generalScore))} />
                <span className="font-medium">ATS Score: </span>
                <span className={cn("font-bold", getScoreColor(score.generalScore))}>
                  {score.generalScore}% <span className="text-xs">({getScoreGrade(score.generalScore)})</span>
                </span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Check ATS Compatibility</span>
              </>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="right" 
          className="w-full sm:w-3/4 md:w-2/3 lg:w-1/2 overflow-y-auto"
        >
          <SheetHeader className="mb-5">
            <SheetTitle className="flex items-center gap-2 text-xl">
              <Info className="w-5 h-5" />
              ATS Compatibility Score
            </SheetTitle>
            <SheetDescription>
              Analysis of how well your resume performs with Applicant Tracking Systems
            </SheetDescription>
          </SheetHeader>
          
          {score ? (
            <div className="space-y-6">
              <div className="text-center p-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="inline-block relative">
                  <div className={cn(
                    "text-5xl font-bold",
                    getScoreColor(score.generalScore)
                  )}>
                    {score.generalScore}%
                  </div>
                  <Badge className={cn(
                    "absolute -top-2 -right-10 border-0", 
                    score.generalScore >= 80 ? "bg-green-100 text-green-800" : 
                    score.generalScore >= 60 ? "bg-amber-100 text-amber-800" : 
                    "bg-red-100 text-red-800"
                  )}>
                    {getScoreGrade(score.generalScore)}
                  </Badge>
                </div>
                <div className="mt-2 text-sm text-gray-500">Overall ATS Compatibility</div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium">Score Breakdown</h3>
                <div className="space-y-3">
                  {score.feedback.generalFeedback.map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{item.category}</span>
                        <span className={cn(
                          "font-medium",
                          getScoreColor(item.score)
                        )}>{item.score}%</span>
                      </div>
                      <Progress 
                        value={item.score} 
                        className={cn(
                          "h-2",
                          "[&>div]:transition-all",
                          "[&>div]:bg-current",
                          getProgressColor(item.score).replace("bg-", "text-")
                        )}
                      />
                      <p className="text-xs text-gray-500 mt-1">{item.feedback}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {score.jobSpecificScore !== undefined && score.feedback.keywordsFeedback && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Job Match Score</h3>
                    <span className={`font-bold text-lg ${getScoreColor(score.jobSpecificScore)}`}>
                      {score.jobSpecificScore}%
                    </span>
                  </div>
                  <Progress 
                    value={score.jobSpecificScore} 
                    className={`h-2 ${getProgressColor(score.jobSpecificScore)}`} 
                  />
                  
                  {/* Display keywords by category */}
                  {Object.keys(score.feedback.keywordsFeedback.categories).length > 0 && (
                    <div className="space-y-2 mt-3">
                      <h4 className="text-sm font-medium">Keyword Match by Category:</h4>
                      
                      <div className="space-y-2">
                        {Object.entries(score.feedback.keywordsFeedback.categories)
                          .filter(([_, categoryData]) => categoryData.all.length > 0)
                          .map(([category, categoryData]) => (
                            <Collapsible 
                              key={category}
                              open={expandedCategories.includes(category)}
                              onOpenChange={() => toggleCategory(category)}
                              className="border rounded-md overflow-hidden"
                            >
                              <CollapsibleTrigger asChild>
                                <div className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-800 cursor-pointer">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{formatCategoryName(category)}</span>
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                      {categoryData.found.length}/{categoryData.all.length}
                                    </Badge>
                                  </div>
                                  {expandedCategories.includes(category) ? 
                                    <ChevronUp className="h-4 w-4" /> : 
                                    <ChevronDown className="h-4 w-4" />
                                  }
                                </div>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="p-3 bg-white dark:bg-gray-950 space-y-3">
                                {categoryData.found.length > 0 && (
                                  <div>
                                    <h5 className="text-xs font-medium text-gray-500 mb-2">Found:</h5>
                                    <div className="flex flex-wrap gap-2">
                                      {categoryData.found.map((keyword, i) => (
                                        <Badge key={i} variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800">
                                            {keyword}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {categoryData.missing.length > 0 && (
                                  <div>
                                    <h5 className="text-xs font-medium text-gray-500 mb-2">Missing:</h5>
                                    <div className="flex flex-wrap gap-2">
                                      {categoryData.missing.map((keyword, i) => (
                                        <Badge key={i} variant="outline" className="bg-red-50 text-red-800 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-900/50">
                                          {keyword}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </CollapsibleContent>
                            </Collapsible>
                          ))}
                      </div>
                      
                      <div className="mt-4 text-xs text-gray-500 italic">
                        <p>Keywords are extracted using AI analysis of the job description and organized into relevant categories.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {score.feedback.overallSuggestions && score.feedback.overallSuggestions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium">Improvement Suggestions</h3>
                  <ul className="space-y-2 text-sm">
                    {score.feedback.overallSuggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                        {score.generalScore >= 80 ? (
                          <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
                        )}
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <Button 
                className="w-full mt-6" 
                variant="outline"
                onClick={() => handleCalculateScore()}
                disabled={isCalculating}
              >
                {isCalculating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Updating Analysis...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Recalculate Score
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center py-10 space-y-4">
              <Sparkles className="h-16 w-16 mx-auto text-gray-400" />
              
              <div>
                <h3 className="text-lg font-medium">Analyze Your Resume</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Check how your resume performs with Applicant Tracking Systems (ATS)
                </p>
              </div>
              
              <Button 
                className="mt-4"
                onClick={handleCalculateScore}
                disabled={isCalculating}
              >
                {isCalculating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze Resume
                  </>
                )}
              </Button>
              
              <div className="text-xs text-gray-500 mt-4 max-w-sm mx-auto">
                Our AI will check for keywords, format, and completeness to help you optimize your resume
                for better results with employers' automated screening systems.
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}