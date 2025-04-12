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
  education: "Education",
  responsibilities: "Responsibilities",
  industryTerms: "Industry Terms",
  tools: "Tools & Technologies",
  certifications: "Certifications",
};

export default function KeywordGenerator() {
  const { toast } = useToast();
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [keywordData, setKeywordData] = useState<KeywordAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState("wordCloud");
  const [flattenedKeywords, setFlattenedKeywords] = useState<string[]>([]);
  const wordCloudRef = useRef<HTMLDivElement>(null);
  const [words, setWords] = useState<WordCloudWord[]>([]);
  const [forceRedraw, setForceRedraw] = useState(0);

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

    setIsLoading(true);

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
      
      // Extract all keywords from all categories
      const allKeywords: string[] = [];
      for (const category in apiResponse) {
        if (Array.isArray(apiResponse[category])) {
          allKeywords.push(...apiResponse[category]);
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
      setIsLoading(false);
    }
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
    
    // Define pattern matching for different categories
    const patterns = {
      technicalSkills: /(programming|coding|development|software|web|api|database|framework|language|algorithm|architecture|front-end|back-end|full-stack|javascript|typescript|python|java|c\+\+|c#|ruby|php|html|css|sql|nosql|react|angular|vue|node|express|django|flask|spring|engineering|design|architecture|sysadmin|devops|data.science|machine.learning|ai|testing|qa|ux|ui)/i,
      
      softSkills: /(communication|leadership|teamwork|collaboration|problem.solving|critical.thinking|adaptability|time.management|creativity|work.ethic|interpersonal|flexibility|organization|analytical|attention.to.detail|conflict.resolution|decision.making|emotional.intelligence|empathy|negotiation|persuasion|presentation|stress.management|verbal|written|team.player|self.motivated|proactive|customer.service)/i,
      
      education: /(degree|education|bachelor|master|phd|mba|certification|diploma|graduate|university|college|school|academic|study|major|minor|concentration|course|curriculum|thesis|dissertation|research|scholarship|fellowship|alumnus|alumni|graduation)/i,
      
      responsibilities: /(responsible|responsibility|duty|task|function|role|accountable|manage|coordinate|lead|direct|supervise|oversee|handle|execute|implement|develop|create|maintain|support|assist|help|provide|deliver|ensure|facilitate|monitor|report|review|analyze|evaluate|assess|resolve|address|respond|build|design|develop|optimize|innovate|transform|establish|define)/i,
      
      industryTerms: /(industry|sector|market|business|corporate|enterprise|commercial|professional|operational|strategic|compliance|regulatory|policy|procedure|standard|guideline|protocol|best.practice|benchmark|service|product|solution|client|customer|vendor|partner|stakeholder|user|roi|growth|revenue|profit|scalable|sustainable|innovative|disruptive|cutting.edge|state.of.the.art)/i,
      
      tools: /(tool|software|platform|application|system|suite|environment|solution|technology|interface|dashboard|analytics|automation|infrastructure|cloud|saas|aws|azure|google|microsoft|office|excel|word|powerpoint|jira|trello|slack|github|gitlab|docker|kubernetes|jenkins|terraform|splunk|tableau|power.bi|salesforce|sap|oracle|adobe)/i,
      
      certifications: /(certified|certification|certificate|license|credential|qualified|accredited|authorized|approved|recognized|validated|verified|pmp|agile|scrum|itil|cissp|cpa|cfa|series|aws.certified|microsoft.certified|google.certified|oracle.certified|cisco.certified|comptia|isaca|iso)/i
    };
    
    // First pass: categorize based on patterns
    keywords.forEach(keyword => {
      let categorized = false;
      
      // Try to match keyword to patterns
      for (const [category, pattern] of Object.entries(patterns)) {
        if (pattern.test(keyword.toLowerCase())) {
          result[category as keyof KeywordAnalysisResult].push(keyword);
          categorized = true;
          break;
        }
      }
      
      // If no pattern matches, make a best guess based on word characteristics
      if (!categorized) {
        if (keyword.includes(' ') && keyword.length > 15) {
          // Longer phrases are often responsibilities
          result.responsibilities.push(keyword);
        } else if (/^[A-Z]+$/.test(keyword) || /^[A-Z]{2,}/.test(keyword)) {
          // Uppercase acronyms are often tools or certifications
          result.tools.push(keyword);
        } else if (/\d/.test(keyword)) {
          // Keywords with numbers are often tools or certifications
          result.tools.push(keyword);
        } else {
          // Default to industry terms for anything else
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
        text.addEventListener("mouseover", () => {
          text.setAttribute("font-weight", "bold");
        });
        text.addEventListener("mouseout", () => {
          text.setAttribute("font-weight", "normal");
        });
        
        g.appendChild(text);
      });
    }
    
  }, [words, activeTab, forceRedraw]);

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
                disabled={isLoading || !jobDescription.trim()}
                className="w-full"
              >
                {isLoading ? (
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
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      {Object.entries(categoryColors).map(([category, color]) => (
                        <div key={category} className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-1" 
                            style={{ backgroundColor: color }}
                          ></div>
                          <span className="text-xs">
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
                      <Card key={category}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">
                            {categoryLabels[category as keyof typeof categoryLabels]}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {keywords.map((keyword: string, i: number) => (
                              <Badge 
                                key={i} 
                                className="font-normal"
                                style={{
                                  backgroundColor: categoryColors[category as keyof typeof categoryColors] + '20',
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