import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, Copy, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as d3 from "d3";
import cloud from "d3-cloud";
import DefaultLayout from "@/components/layouts/default-layout";
import { calculateATSScore } from "@/lib/ats-score";
import { ResumeData } from "@/types/resume";

interface KeywordCategory {
  name: string;
  keywords: string[];
  color: string;
}

interface KeywordAnalysisResult {
  technicalSkills: string[];
  softSkills: string[];
  education: string[];
  responsibilities: string[];
  industryTerms: string[];
  tools: string[];
  certifications: string[];
}

interface WordCloudWord {
  text: string;
  value: number;
  category: string;
  color: string;
}

const categoryColors = {
  technicalSkills: "#3b82f6", // blue
  softSkills: "#10b981", // green
  education: "#8b5cf6", // purple
  responsibilities: "#f59e0b", // amber
  industryTerms: "#ef4444", // red
  tools: "#6366f1", // indigo
  certifications: "#ec4899", // pink
};

const categoryLabels = {
  technicalSkills: "Technical Skills",
  softSkills: "Soft Skills",
  education: "Education & Qualifications",
  responsibilities: "Job Responsibilities",
  industryTerms: "Industry Terms",
  tools: "Tools & Technologies",
  certifications: "Certifications",
};

const categoryDescriptions = {
  technicalSkills: "Hard skills and technical abilities required for the role",
  softSkills: "Interpersonal and professional attributes valued by employers",
  education: "Academic qualifications and educational requirements",
  responsibilities: "Key duties and tasks associated with the position",
  industryTerms: "Domain-specific terminology and knowledge areas",
  tools: "Software, platforms, and technologies used in the role",
  certifications: "Professional certifications and credentials relevant to the position"
};

export default function KeywordGenerator() {
  const { toast } = useToast();
  const svgRef = useRef<SVGSVGElement>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordData, setKeywordData] = useState<KeywordAnalysisResult | null>(null);
  const [words, setWords] = useState<WordCloudWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("word-cloud");
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [flattenedKeywords, setFlattenedKeywords] = useState<string[]>([]);
  const wordCloudRef = useRef<HTMLDivElement>(null);
  const [forceRedraw, setForceRedraw] = useState(0);

  // Ensure authentication is maintained
  useEffect(() => {
    // Force refresh authentication status
    fetch('/api/user', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    }).then(res => {
      if (!res.ok) {
        console.error('Authentication check failed in KeywordGenerator');
        // Redirect will be handled by ProtectedRoute component
      }
    }).catch(err => {
      console.error('Error checking authentication:', err);
    });
  }, []);

  // Extract keywords when "Extract Keywords" button is clicked
  const handleExtractKeywords = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: "Error",
        description: "Please enter a job description first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Call the AI endpoint using the relative path
      const response = await fetch("/api/ai/analyze-job-description", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobDescription }),
      });

      // Log detailed error information
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details available');
        console.error(`API Error (${response.status}):`, errorText);
        throw new Error(`Failed to analyze job description: ${response.status} ${response.statusText}`);
      }

      const apiResponse = await response.json();
      console.log("Raw API response:", apiResponse);
      
      // Process the response to make it more ATS-friendly
      const processedResponse = processKeywordsForATS(apiResponse);
      console.log("Processed response:", processedResponse);
      
      // Extract all keywords from all categories
      const allKeywords: string[] = [];
      for (const category in processedResponse) {
        if (Array.isArray(processedResponse[category])) {
          allKeywords.push(...processedResponse[category]);
        }
      }
      
      // If we have no keywords, throw an error
      if (allKeywords.length === 0) {
        throw new Error('No keywords found in the job description');
      }
      
      // Always apply our smart categorization to ensure consistent categorization
      const categorized = categorizeKeywords(allKeywords);
      
      // Create the data structure for our component
      const data: KeywordAnalysisResult = {
        technicalSkills: categorized.technicalSkills,
        softSkills: categorized.softSkills,
        education: categorized.education,
        responsibilities: categorized.responsibilities,
        industryTerms: categorized.industryTerms,
        tools: categorized.tools,
        certifications: categorized.certifications
      };
      
      console.log("Categorized keywords:", data);
      setKeywordData(data);
      setFlattenedKeywords(allKeywords);
      
      // Prepare data for word cloud
      prepareWordCloudData(data);
    } catch (error) {
      console.error("Error extracting keywords:", error);
      toast({
        title: "Error",
        description: "Failed to extract keywords. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Process API response to break down longer phrases into ATS-friendly keywords
  const processKeywordsForATS = (apiResponse: any): any => {
    const result = { ...apiResponse };
    
    // Process each category
    for (const category in result) {
      if (Array.isArray(result[category])) {
        // New array to store processed keywords
        const processedKeywords: string[] = [];
        
        // Process each keyword in the category
        result[category].forEach((keyword: string) => {
          // Check if it's a long phrase (more than 5 words or 30 characters)
          if (keyword.split(/\s+/).length > 5 || keyword.length > 40) {
            // Break down complex phrases
            const tokens = breakDownPhrase(keyword, category);
            processedKeywords.push(...tokens);
          } else {
            // Keep shorter phrases as is
            processedKeywords.push(keyword);
          }
        });
        
        // Remove duplicates
        result[category] = Array.from(new Set(processedKeywords));
        
        // Further process phrases based on category-specific rules
        if (category === 'responsibilities') {
          // For responsibilities, start with action verbs when possible
          result[category] = result[category].map((resp: string) => {
            // If it doesn't start with a verb, try to extract the key action
            if (!/^(manage|develop|create|implement|design|provide|ensure|maintain|support|assist)/i.test(resp)) {
              // Extract subject-verb-object patterns
              const simpler = simplifyResponsibility(resp);
              return simpler || resp;
            }
            return resp;
          });
        }
      }
    }
    
    return result;
  };
  
  // Break down a complex phrase into smaller, more focused keywords
  const breakDownPhrase = (phrase: string, category: string): string[] => {
    const result: string[] = [];
    const words = phrase.split(/\s+/);
    
    // If it contains conjunctions ("and", "or", "as well as"), split by them
    if (/\band\b|\bor\b|\bas well as\b/.test(phrase)) {
      const segments = phrase.split(/\band\b|\bor\b|\bas well as\b/);
      segments.forEach(segment => {
        const trimmed = segment.trim();
        if (trimmed) {
          // Process each segment
          if (trimmed.split(/\s+/).length > 1) {
            result.push(trimmed);
          }
        }
      });
    }
    
    // For long phrases, try to extract key components
    if (words.length > 3) {
      // Extract key noun phrases
      const nounPhraseRegex = /(?:\w+\s){0,2}(?:skills|knowledge|experience|abilities|proficiency|expertise)/gi;
      const nounMatches = phrase.match(nounPhraseRegex);
      if (nounMatches) {
        result.push(...nounMatches);
      }
      
      // Extract action phrases for responsibilities
      if (category === 'responsibilities') {
        const actionPhraseRegex = /(?:manage|develop|create|implement|design|provide|ensure|maintain)\s+(?:\w+\s){0,3}\w+/gi;
        const actionMatches = phrase.match(actionPhraseRegex);
        if (actionMatches) {
          result.push(...actionMatches);
        }
      }
    }
    
    // If we couldn't extract meaningful sub-phrases, keep the original
    if (result.length === 0) {
      result.push(phrase);
    }
    
    return result;
  };
  
  // Simplify responsibility phrases
  const simplifyResponsibility = (responsibility: string): string | null => {
    // Try to extract the main action
    const actionVerbs = [
      'manage', 'develop', 'create', 'implement', 'design', 'provide', 'ensure',
      'maintain', 'support', 'assist', 'handle', 'coordinate', 'analyze', 'evaluate',
      'monitor', 'review', 'plan', 'organize', 'lead', 'direct', 'prepare', 'perform',
      'conduct', 'administer', 'collaborate', 'communicate', 'deliver', 'build'
    ];
    
    // Look for patterns like "[verb] [object]"
    for (const verb of actionVerbs) {
      const regex = new RegExp(`${verb}\\s+(?:\\w+\\s){0,3}\\w+`, 'i');
      const match = responsibility.match(regex);
      if (match) {
        return match[0];
      }
    }
    
    // If responsibility contains passive voice, try to convert to active
    if (/\b(?:is|are|was|were|be|been|being)\s+\w+ed\b/i.test(responsibility)) {
      const match = responsibility.match(/\b(\w+ed)\s+(?:\w+\s){0,3}\w+/i);
      if (match) {
        return match[0];
      }
    }
    
    return null;
  };

  // Robust keyword categorization function
  const categorizeKeywords = (keywords: string[]): KeywordAnalysisResult => {
    const result: KeywordAnalysisResult = {
      technicalSkills: [],
      softSkills: [],
      education: [],
      responsibilities: [],
      industryTerms: [],
      tools: [],
      certifications: []
    };
    
    // Define pattern matching for different categories (improved patterns)
    const patterns = {
      technicalSkills: /(programming|coding|development|software|web|api|database|framework|language|algorithm|architecture|front-end|back-end|full-stack|javascript|typescript|python|java|c\+\+|c#|ruby|php|html|css|sql|nosql|react|angular|vue|node|express|django|flask|spring|engineering|design|architecture|sysadmin|devops|data.science|machine.learning|ai|artificial.intelligence|testing|qa|ux|ui|infrastructure|scaling|performance|optimization|analysis|design.thinking|systems|networks|security|troubleshooting|debug|code|implementation|deployment)/i,
      
      softSkills: /(communication|leadership|teamwork|collaboration|problem.solving|critical.thinking|adaptability|time.management|creativity|work.ethic|interpersonal|flexibility|organization|analytical|attention.to.detail|conflict.resolution|decision.making|emotional.intelligence|empathy|negotiation|persuasion|presentation|stress.management|verbal|written|team.player|self.motivated|proactive|customer.service|management|mentoring|coaching|training|facilitation|public.speaking|liaison|coordination|motivation|passion|initiative|dedication|professionalism|detail.oriented|multi.tasking|prioritization|growth.mindset|learning|ownership|discipline|self.starter|independent)/i,
      
      education: /(degree|education|bachelor|master|phd|mba|certification|diploma|graduate|university|college|school|academic|study|major|minor|concentration|course|curriculum|thesis|dissertation|research|scholarship|fellowship|alumnus|alumni|graduation|accredited|program|qualification|credentials|licensed|training|field.of.study|gpa|academic|grade|educational|requirement)/i,
      
      responsibilities: /(responsible|responsibility|duty|duties|task|function|role|accountable|manage|coordinate|lead|direct|supervise|oversee|handle|execute|implement|develop|create|maintain|support|assist|help|provide|deliver|ensure|facilitate|monitor|report|review|analyze|evaluate|assess|resolve|address|respond|build|design|develop|optimize|innovate|transform|establish|define|prepare|perform|conduct|administer|operate|run|guide|drive|organize|plan|execute|track|follow|comply|enforce|leverage|utilize|streamline|conduct)/i,
      
      industryTerms: /(industry|sector|market|business|corporate|enterprise|commercial|professional|operational|strategic|compliance|regulatory|policy|procedure|standard|guideline|protocol|best.practice|benchmark|service|product|solution|client|customer|vendor|partner|stakeholder|user|roi|growth|revenue|profit|scalable|sustainable|innovative|disruptive|cutting.edge|state.of.the.art|agile|scrum|kanban|lean|waterfall|iterative|sprint|milestone|deliverable|requirements|specifications|architecture|mvp|poc|go.to.market|b2b|b2c|saas|ecommerce|fintech|healthtech|insurtech|regtech|blockchain|cryptocurrency|distributed.ledger)/i,
      
      tools: /(tool|software|platform|application|system|suite|environment|solution|technology|interface|dashboard|analytics|automation|infrastructure|cloud|saas|aws|azure|google|microsoft|office|excel|word|powerpoint|jira|trello|slack|github|gitlab|docker|kubernetes|jenkins|terraform|splunk|tableau|power.bi|salesforce|sap|oracle|adobe|windows|linux|unix|mac|ios|android|mobile|desktop|web|browser|framework|library|sdk|api|rest|soap|graphql|json|xml|yaml|database|sql|nosql|mysql|postgresql|mongodb|firebase|redux|react|angular|vue|svelte|next|nuxt|webpack|babel|typescript|golang|rust|scala)/i,
      
      certifications: /(certified|certification|certificate|license|credential|qualified|accredited|authorized|approved|recognized|validated|verified|pmp|agile|scrum|itil|cissp|cpa|cfa|series|aws.certified|microsoft.certified|google.certified|oracle.certified|cisco.certified|comptia|isaca|iso|ceh|security\+|network\+|azure|aws|gcp|professional|associate|expert|specialty|practitioner|foundation|advanced|master)/i
    };
    
    // First pass: categorize based on patterns
    keywords.forEach(keyword => {
      let categorized = false;
      const keywordLower = keyword.toLowerCase();
      let bestCategory = '';
      let bestScore = 0;
      
      // Try to match keyword to patterns - with scoring to handle overlaps
      for (const [category, pattern] of Object.entries(patterns)) {
        if (pattern.test(keywordLower)) {
          // Calculate match score based on word count and specificity
          const matches = keywordLower.match(pattern);
          const matchCount = matches ? matches.length : 0;
          const wordCount = keywordLower.split(/\s+/).length;
          
          // Calculate score - higher for more specific matches and multi-word phrases
          const score = matchCount * (1 + (wordCount > 1 ? 0.5 * wordCount : 0));
          
          if (score > bestScore) {
            bestScore = score;
            bestCategory = category;
          }
        }
      }
      
      // Add to best category if found
      if (bestCategory) {
        result[bestCategory as keyof KeywordAnalysisResult].push(keyword);
        categorized = true;
      }
      
      // If no pattern matches, make a better guess based on word characteristics
      if (!categorized) {
        if (keyword.includes(' ') && keyword.length > 15) {
          // Longer phrases are often responsibilities
          result.responsibilities.push(keyword);
        } else if (/^[A-Z]+$/.test(keyword) || /^[A-Z]{2,}/.test(keyword)) {
          // Uppercase acronyms are likely tools or certifications
          if (keyword.length <= 3 || /^[A-Z]+\+$/.test(keyword)) {
            // Short acronyms or those with '+' are often certifications (e.g., 'AWS', 'C++')
            result.certifications.push(keyword);
          } else {
            result.tools.push(keyword);
          }
        } else if (/\d/.test(keyword)) {
          // Keywords with numbers are often tools or certifications
          if (/certification|certified|license|credential/i.test(keyword)) {
            result.certifications.push(keyword);
          } else if (/version|v\d|\.io|\.\w{2,3}$|\d+\.\d+/.test(keyword)) {
            // Looks like a version number, domain, or software version
            result.tools.push(keyword);
          } else if (/degree|education|bachelor|master|phd/i.test(keyword)) {
            result.education.push(keyword);
          } else {
            // Default for numbers
            result.tools.push(keyword);
          }
        } else if (/ing$/.test(keyword) && !/(software|programming|engineering|computing|networking)/.test(keyword)) {
          // Words ending in 'ing' are often soft skills or responsibilities
          // But exclude some technical terms that end in 'ing'
          if (keyword.length < 12) {
            result.softSkills.push(keyword);
          } else {
            result.responsibilities.push(keyword);
          }
        } else if (keyword.includes(' ')) {
          // Multi-word phrases with certain patterns
          if (/^(manage|create|develop|implement|design|provide|ensure|maintain|support)/i.test(keyword)) {
            // Starts with action verb - likely responsibility
            result.responsibilities.push(keyword);
          } else if (/^(knowledge of|experience with|proficiency in|expertise in|familiarity with)/i.test(keyword)) {
            // Phrases about knowledge or experience
            result.technicalSkills.push(keyword);
          } else if (/degree|certification|diploma|license/i.test(keyword)) {
            // Education-related
            result.education.push(keyword);
          } else {
            // Default for multi-word phrases
            result.industryTerms.push(keyword);
          }
        } else {
          // Single words with no other categorization
          result.industryTerms.push(keyword);
        }
      }
    });
    
    return result;
  };

  // Generate word value/size based on word length and category
  const getWordValue = (word: string, category: keyof typeof categoryColors) => {
    // Base value between 10-30 depending on length (shorter words get larger size)
    const baseValue = Math.max(30 - word.length, 10);
    
    // Give slightly higher prominence to technical skills and responsibilities
    const categoryMultiplier = 
      category === "technicalSkills" ? 1.3 : 
      category === "responsibilities" ? 1.2 : 1;
    
    return baseValue * categoryMultiplier;
  };

  // Function to handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Force redraw when switching to word cloud
    if (value === "wordCloud") {
      setTimeout(() => setForceRedraw(prev => prev + 1), 50);
    }
  };

  // Generate and render word cloud
  useEffect(() => {
    // Only render when we have words and we're on the word cloud tab
    if (!words.length || !wordCloudRef.current || activeTab !== "wordCloud") return;
    
    // Clear any existing content
    const container = wordCloudRef.current;
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    
    const width = container.offsetWidth;
    const height = 500;
    
    // Create and append the SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", width.toString());
    svg.setAttribute("height", height.toString());
    container.appendChild(svg);
    
    // Create the group for centered words
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${width / 2},${height / 2})`);
    svg.appendChild(g);
    
    // Create tooltip div
    const tooltip = document.createElement("div");
    tooltip.className = "absolute hidden bg-black/90 text-white p-3 rounded-md text-sm z-50 pointer-events-none shadow-lg";
    tooltip.style.transition = "opacity 0.15s ease, transform 0.15s ease";
    tooltip.style.position = "absolute";
    tooltip.style.opacity = "0";
    tooltip.style.transform = "translateY(5px)";
    tooltip.style.maxWidth = "250px";
    tooltip.style.border = "1px solid rgba(255,255,255,0.1)";
    document.body.appendChild(tooltip); // Append to body instead for better positioning
    
    // Clean up on unmount
    const cleanupTooltip = () => {
      if (document.body.contains(tooltip)) {
        document.body.removeChild(tooltip);
      }
    };
    
    // Add clean up event listener
    container.addEventListener('DOMNodeRemoved', cleanupTooltip);
    
    // Generate the word cloud layout
    const layout = cloud()
      .size([width, height])
      .words(words.map(d => ({ ...d })))
      .padding(5)
      .rotate(() => 0)
      .font("Arial")
      .fontSize(d => (d as any).value)
      .on("end", drawWords);
    
    layout.start();
    
    function drawWords(words: any[]) {
      words.forEach(word => {
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("font-size", `${word.size}px`);
        text.setAttribute("font-family", "Arial");
        text.setAttribute("fill", word.color);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("transform", `translate(${word.x},${word.y})`);
        text.setAttribute("cursor", "pointer");
        text.textContent = word.text;
        
        // Add event listeners
        text.addEventListener("mouseover", (e) => {
          text.setAttribute("font-weight", "bold");
          text.setAttribute("text-decoration", "underline");
          
          // Show tooltip
          const categoryName = formatCategoryName(word.category);
          const description = categoryDescriptions[word.category as keyof typeof categoryDescriptions] || "";
          
          tooltip.innerHTML = `
            <div class="font-semibold">${word.text}</div>
            <div class="text-xs mt-1 opacity-90 flex items-center">
              <span class="inline-block w-2 h-2 rounded-full mr-1" style="background-color: ${word.color}"></span>
              ${categoryName}
            </div>
            <div class="text-xs mt-1 opacity-80">${description}</div>
          `;
          
          positionTooltip(e);
          
          // Show with animation
          tooltip.style.display = "block";
          requestAnimationFrame(() => {
            tooltip.style.opacity = "1";
            tooltip.style.transform = "translateY(0)";
          });
        });
        
        text.addEventListener("mouseout", () => {
          text.setAttribute("font-weight", "normal");
          text.setAttribute("text-decoration", "none");
          
          // Hide with animation
          tooltip.style.opacity = "0";
          tooltip.style.transform = "translateY(5px)";
          
          // Wait for animation to complete before hiding
          setTimeout(() => {
            tooltip.style.display = "none";
          }, 150);
        });
        
        text.addEventListener("mousemove", positionTooltip);
        
        g.appendChild(text);
      });
    }
    
    // Helper function to position tooltip
    function positionTooltip(e: MouseEvent) {
      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Position next to cursor
      let x = e.clientX + 15;
      let y = e.clientY + 10;
      
      // Check if tooltip would go beyond viewport and adjust accordingly
      if (x + tooltip.offsetWidth > viewportWidth - 10) {
        x = e.clientX - tooltip.offsetWidth - 10;
      }
      
      if (y + tooltip.offsetHeight > viewportHeight - 10) {
        y = e.clientY - tooltip.offsetHeight - 10;
      }
      
      // Set position
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
    }
  }, [words, activeTab, forceRedraw]);

  // Format category name (helper function)
  const formatCategoryName = (category: string): string => {
    return category
      .replace(/([A-Z])/g, ' $1') // Insert space before capital letters
      .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
  };

  // Copy all keywords to clipboard
  const copyKeywordsToClipboard = () => {
    if (flattenedKeywords.length === 0) return;
    
    navigator.clipboard.writeText(flattenedKeywords.join(", "))
      .then(() => {
        toast({
          title: "Copied!",
          description: "Keywords copied to clipboard",
        });
      })
      .catch(err => {
        console.error("Failed to copy keywords:", err);
        toast({
          title: "Error",
          description: "Failed to copy keywords",
          variant: "destructive",
        });
      });
  };

  // Download keywords as text file
  const downloadKeywords = () => {
    if (!keywordData) return;
    
    let content = "ATS KEYWORDS ANALYSIS\n\n";
    
    Object.entries(keywordData).forEach(([category, keywords]) => {
      if (keywords.length > 0) {
        content += `${categoryLabels[category as keyof typeof categoryLabels]}:\n`;
        content += keywords.join(", ") + "\n\n";
      }
    });
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ats-keywords.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper function to prepare word cloud data
  const prepareWordCloudData = (data: KeywordAnalysisResult) => {
    const cloudWords: WordCloudWord[] = [];
    
    Object.entries(data).forEach(([category, keywords]) => {
      if (Array.isArray(keywords)) {
        keywords.forEach(keyword => {
          cloudWords.push({
            text: keyword,
            value: getWordValue(keyword, category as keyof typeof categoryColors),
            category,
            color: categoryColors[category as keyof typeof categoryColors] || "#777777"
          });
        });
      }
    });
    
    setWords(cloudWords);
  };

  return (
    <DefaultLayout pageTitle="Keyword Generator" pageDescription="Extract ATS-optimized keywords from job descriptions">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">ATS Keyword Generator</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Extract Keywords from Job Description</CardTitle>
            <CardDescription>
              Paste a job description to extract ATS-optimized keywords for your resume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                placeholder="Paste job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
              
              <Button 
                onClick={handleExtractKeywords} 
                disabled={loading || !jobDescription.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Extract Keywords
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {keywordData && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Keyword Analysis Results</h2>
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyKeywordsToClipboard}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={downloadKeywords}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
            
            <Tabs defaultValue="wordCloud" value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="mb-4">
                <TabsTrigger value="wordCloud">Word Cloud</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
              </TabsList>
              
              <TabsContent value="wordCloud">
                <Card>
                  <CardContent className="pt-6">
                    <div 
                      ref={wordCloudRef} 
                      className="w-full h-[500px] flex items-center justify-center border rounded-lg"
                    >
                      {words.length === 0 && (
                        <p className="text-gray-400">No keywords to display</p>
                      )}
                    </div>
                    
                    <div className="mt-4 flex flex-wrap gap-3 justify-center">
                      {Object.entries(categoryColors).map(([category, color]) => (
                        <div key={category} className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: color }}
                          ></div>
                          <span className="text-xs font-medium">
                            {categoryLabels[category as keyof typeof categoryLabels]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="categories">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(keywordData).map(([category, keywords]) => (
                    keywords.length > 0 && (
                      <Card key={category} className="overflow-hidden">
                        <CardHeader className="pb-2 bg-gray-50 dark:bg-gray-800/50 border-b">
                          <CardTitle className="text-base flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: categoryColors[category as keyof typeof categoryColors] }}
                            ></div>
                            {categoryLabels[category as keyof typeof categoryLabels]}
                            <Badge className="ml-2 text-xs font-normal" variant="secondary">
                              {keywords.length}
                            </Badge>
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">
                            {categoryDescriptions[category as keyof typeof categoryDescriptions]}
                          </p>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="flex flex-wrap gap-2">
                            {keywords.map((keyword: string, i: number) => (
                              <Badge 
                                key={i} 
                                className="font-normal text-sm py-1 px-2"
                                style={{
                                  backgroundColor: categoryColors[category as keyof typeof categoryColors] + '15',
                                  color: categoryColors[category as keyof typeof categoryColors],
                                  borderColor: categoryColors[category as keyof typeof categoryColors] + '40'
                                }}
                                variant="outline"
                              >
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
}