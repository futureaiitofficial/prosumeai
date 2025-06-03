import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, Check, AlertTriangle, Info, PieChart, ChevronRight, CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { calculateATSScore } from "@/lib/ats-score";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResumeData } from "@/types/resume";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ATSScoreProps {
  resumeData: ResumeData & {
    updateData?: (data: any) => void;
  };
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
  
  // Track if this is the initial mount
  const isInitialMountRef = useRef(true);
  
  // Store resume ID to help with caching
  const resumeIdRef = useRef<number | string | null>(null);
  
  // Debounce timer reference
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleCalculateScore = async () => {
    try {      
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
      
      // Update keywords data
      const keywordsFeedback = {
        found: atsScore.feedback.keywordsFeedback?.found || [],
        missing: atsScore.feedback.keywordsFeedback?.missing || [],
        all: atsScore.feedback.keywordsFeedback?.all || [],
        categories: atsScore.feedback.keywordsFeedback?.categories || {}
      };
      
      setKeywords(keywordsFeedback);
      
      // Update the resumeData with the keywords feedback for use in other components
      if (resumeData.updateData && typeof resumeData.updateData === 'function') {
        resumeData.updateData({
          keywordsFeedback: keywordsFeedback
        });
      }
      
      // Update local storage cache for this resume
      if (resumeData.id) {
        try {
          localStorage.setItem(`ats_score_${resumeData.id}`, JSON.stringify({
            score: atsScore,
            timestamp: Date.now(),
            jobTitle: resumeData.targetJobTitle,
            jobDescriptionHash: hashString(resumeData.jobDescription || '')
          }));
        } catch (e) {
          console.warn('Failed to cache ATS score in localStorage:', e);
        }
      }
      
      // Open the sheet automatically when score is calculated manually
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

  // Simple string hashing function for comparing job descriptions
  const hashString = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  };
  
  // Try to load a cached score from localStorage
  const loadCachedScore = () => {
    if (!resumeData?.id) return null;
    
    try {
      const cachedData = localStorage.getItem(`ats_score_${resumeData.id}`);
      if (!cachedData) return null;
      
      const parsed = JSON.parse(cachedData);
      
      // Verify the cached data is still relevant
      const isRelevant = 
        parsed.jobTitle === resumeData.targetJobTitle &&
        parsed.jobDescriptionHash === hashString(resumeData.jobDescription || '');
      
      // Use cached data only if still relevant and less than 24 hours old
      const ONE_DAY = 24 * 60 * 60 * 1000;
      if (isRelevant && (Date.now() - parsed.timestamp) < ONE_DAY) {
        return parsed.score;
      }
    } catch (e) {
      console.warn('Failed to load cached ATS score:', e);
    }
    return null;
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
      // Skip validation - this is only called when we know we have the required data
      setIsCalculating(true);
      
      const atsScore = await calculateATSScore(resumeData);
      
      setScore(atsScore);
      
      // Update keywords data
      const keywordsFeedback = {
        found: atsScore.feedback.keywordsFeedback?.found || [],
        missing: atsScore.feedback.keywordsFeedback?.missing || [],
        all: atsScore.feedback.keywordsFeedback?.all || [],
        categories: atsScore.feedback.keywordsFeedback?.categories || {}
      };
      
      setKeywords(keywordsFeedback);
      
      // Update the resumeData with the keywords feedback for use in other components
      if (resumeData.updateData && typeof resumeData.updateData === 'function') {
        resumeData.updateData({
          keywordsFeedback: keywordsFeedback
        });
      }
      
      // Update localStorage cache
      if (resumeData.id) {
        try {
          localStorage.setItem(`ats_score_${resumeData.id}`, JSON.stringify({
            score: atsScore,
            timestamp: Date.now(),
            jobTitle: resumeData.targetJobTitle,
            jobDescriptionHash: hashString(resumeData.jobDescription || '')
          }));
        } catch (e) {
          console.warn('Failed to cache ATS score in localStorage:', e);
        }
      }
    } catch (error) {
      console.error("Silent ATS score calculation error:", error);
    } finally {
      setIsCalculating(false);
    }
  };
  
  // Load cached score on initial mount
  useEffect(() => {
    if (resumeData?.id) {
      const resumeId = String(resumeData.id); // Convert to string for consistent comparison
      if (resumeId !== String(resumeIdRef.current)) {
        resumeIdRef.current = resumeId;
        const cachedScore = loadCachedScore();
        if (cachedScore) {
          setScore(cachedScore);
          setKeywords({
            found: cachedScore.feedback.keywordsFeedback?.found || [],
            missing: cachedScore.feedback.keywordsFeedback?.missing || [],
            all: cachedScore.feedback.keywordsFeedback?.all || [],
            categories: cachedScore.feedback.keywordsFeedback?.categories || {}
          });
        }
      }
    }
  }, [resumeData?.id]);
  
  // Watch for resume data changes
  useEffect(() => {
    // Stringify the resumeData for comparison
    const currentResumeDataString = JSON.stringify({
      targetJobTitle: resumeData.targetJobTitle,
      jobDescription: resumeData.jobDescription,
      summary: resumeData.summary,
      workExperience: resumeData.workExperience,
      skills: resumeData.skills,
      technicalSkills: resumeData.technicalSkills,
      softSkills: resumeData.softSkills
    });
    
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
      if (isInitialMountRef.current) {
        isInitialMountRef.current = false;
      } else {
        // Only auto-calculate if we have sufficient resume content and data has actually changed
        if (hasEssentialContent && resumeData?.targetJobTitle && resumeData?.jobDescription) {
          // Check if cached score exists and is still valid
          const cachedScore = loadCachedScore();
          if (!cachedScore) {
            debouncedCalculateScore();
          }
        } else if (score && !hasEssentialContent) {
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
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
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
        </DialogTrigger>
        <DialogContent 
          className="max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] p-0 overflow-hidden"
        >
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Info className="w-5 h-5" />
              ATS Compatibility Score
            </DialogTitle>
            <DialogDescription>
              Analysis of how well your resume performs with Applicant Tracking Systems
            </DialogDescription>
          </DialogHeader>
          
          {score ? (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* Left Column - Main Score and Breakdown */}
                <div className="space-y-4">
                  {/* Main Score Display */}
                  <Card className="p-4 text-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <div className="inline-block relative">
                      <div className={cn(
                        "text-5xl font-bold mb-2",
                        getScoreColor(score.generalScore)
                      )}>
                        {score.generalScore}%
                      </div>
                      <Badge className={cn(
                        "absolute -top-1 -right-8 border-0 text-xs", 
                        score.generalScore >= 80 ? "bg-green-100 text-green-800" : 
                        score.generalScore >= 60 ? "bg-amber-100 text-amber-800" : 
                        "bg-red-100 text-red-800"
                      )}>
                        {getScoreGrade(score.generalScore)}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Overall ATS Compatibility</div>
                  </Card>
                  
                  {/* Score Breakdown */}
                  <Card className="p-4">
                    <h3 className="font-semibold text-base mb-4">Score Breakdown</h3>
                    <div className="space-y-3">
                      {score.feedback.generalFeedback.map((item, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{item.category}</span>
                            <span className={cn(
                              "font-semibold",
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
                          <p className="text-xs text-gray-600 dark:text-gray-400">{item.feedback}</p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Recalculate Button */}
                  <Button 
                    className="w-full" 
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

                {/* Middle Column - Job Match Score and Keywords */}
                <div className="space-y-4">
                  {score.jobSpecificScore !== undefined && score.feedback.keywordsFeedback && (
                    <Card className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-base">Job Match Score</h3>
                        <span className={cn("font-bold text-xl", getScoreColor(score.jobSpecificScore))}>
                          {score.jobSpecificScore}%
                        </span>
                      </div>
                      <Progress 
                        value={score.jobSpecificScore} 
                        className={cn("h-2 mb-4", getProgressColor(score.jobSpecificScore))} 
                      />
                      
                      {/* Keyword Categories */}
                      {Object.keys(score.feedback.keywordsFeedback.categories).length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold">Keyword Match by Category:</h4>
                          
                          <div className="space-y-2 max-h-80 overflow-y-auto">
                            {Object.entries(score.feedback.keywordsFeedback.categories)
                              .filter(([_, categoryData]) => categoryData.all.length > 0)
                              .map(([category, categoryData]) => (
                                <Collapsible 
                                  key={category}
                                  open={expandedCategories.includes(category)}
                                  onOpenChange={() => toggleCategory(category)}
                                  className="border rounded-lg overflow-hidden bg-white dark:bg-gray-950"
                                >
                                  <CollapsibleTrigger asChild>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm">{formatCategoryName(category)}</span>
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                          {categoryData.found.length}/{categoryData.all.length}
                                        </Badge>
                                      </div>
                                      {expandedCategories.includes(category) ? 
                                        <ChevronUp className="h-4 w-4" /> : 
                                        <ChevronDown className="h-4 w-4" />
                                      }
                                    </div>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="p-3 space-y-3">
                                    {categoryData.found.length > 0 && (
                                      <div>
                                        <h5 className="text-xs font-medium text-green-700 dark:text-green-400 mb-2">✓ Found Keywords:</h5>
                                        <div className="flex flex-wrap gap-1">
                                          {categoryData.found.map((keyword, i) => (
                                            <Badge key={i} variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                                                {keyword}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {categoryData.missing.length > 0 && (
                                      <div>
                                        <h5 className="text-xs font-medium text-red-700 dark:text-red-400 mb-2">✗ Missing Keywords:</h5>
                                        <div className="flex flex-wrap gap-1">
                                          {categoryData.missing.map((keyword, i) => (
                                            <Badge key={i} variant="outline" className="bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800 text-xs">
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
                        </div>
                      )}
                    </Card>
                  )}
                </div>

                {/* Right Column - Improvement Suggestions and Stats */}
                <div className="space-y-4">
                  {/* Quick Stats Summary */}
                  <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                    <h3 className="font-semibold text-base mb-3">Quick Stats</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg">
                        <div className="font-bold text-2xl text-green-600">{score.feedback.keywordsFeedback?.found.length || 0}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Keywords Found</div>
                      </div>
                      <div className="text-center p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg">
                        <div className="font-bold text-2xl text-red-600">{score.feedback.keywordsFeedback?.missing.length || 0}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Keywords Missing</div>
                      </div>
                      <div className="text-center p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg">
                        <div className="font-bold text-2xl text-blue-600">{Object.keys(score.feedback.keywordsFeedback?.categories || {}).length}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Categories</div>
                      </div>
                      <div className="text-center p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg">
                        <div className="font-bold text-2xl text-orange-600">{score.feedback.generalFeedback.filter(f => f.priority === 'high').length}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">High Priority</div>
                      </div>
                    </div>
                  </Card>

                  {/* Improvement Suggestions */}
                  {score.feedback.overallSuggestions && score.feedback.overallSuggestions.length > 0 && (
                    <Card className="p-4 flex-1">
                      <h3 className="font-semibold text-base mb-3">Improvement Suggestions</h3>
                      <ScrollArea className="h-64">
                        <div className="space-y-3 pr-4">
                          {score.feedback.overallSuggestions.map((suggestion, i) => (
                            <div key={i} className="flex items-start p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                              {score.generalScore >= 80 ? (
                                <Check className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
                              )}
                              <span className="text-sm leading-relaxed">{suggestion}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </Card>
                  )}
                </div>
              </div>
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
        </DialogContent>
      </Dialog>
    </div>
  );
}