"use client";

import { useState, useRef } from "react";
import { generateTestCases, reviewRequirements, refineRequirements } from "@/lib/actions";
import { TestCase, ReviewResult } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Download, Play, AlertTriangle, CheckCircle, FileUp, Sparkles, BrainCircuit } from "lucide-react";

export default function Dashboard() {
  const [requirement, setRequirement] = useState("");
  const [testCases, setTestCases] = useState<TestCase[] | null>(null);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [thoughtProcess, setThoughtProcess] = useState<string[] | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [refineLoading, setRefineLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState("review");
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setRequirement(event.target.result as string);
      }
    };
    reader.readAsText(file);
    
    // Reset value to allow uploading same file again
    e.target.value = "";
  };

  const handleExportReport = () => {
    if (!reviewResult && !testCases) return;

    const date = new Date().toISOString().split('T')[0];
    let content = `# QualityGuardian 分析报告 - ${date}\n\n`;

    // 1. 需求评审
    if (reviewResult) {
      content += `## 1. 需求评审\n\n`;
      content += `### 总结\n${reviewResult.summary}\n\n`;
      content += `### 详细发现\n`;
      reviewResult.comments.forEach((comment, idx) => {
        content += `#### ${idx + 1}. ${comment.issueDescription}\n`;
        content += `- **严重程度**: ${getSeverityLabel(comment.severity)}\n`;
        content += `- **改进建议**: ${comment.improvementSuggestion}\n`;
        if (comment.relatedTestCaseId) {
          content += `- **关联用例**: ${comment.relatedTestCaseId}\n`;
        }
        content += `\n`;
      });
    }

    // 2. 测试用例
    if (testCases) {
      content += `## 2. 测试用例\n\n`;
      testCases.forEach((tc) => {
        content += `### ${tc.id}: ${tc.title}\n`;
        content += `- **优先级**: ${tc.priority}\n`;
        content += `- **前置条件**: ${tc.preconditions}\n`;
        content += `- **测试步骤**:\n`;
        tc.steps.forEach((step, sIdx) => {
          content += `  ${sIdx + 1}. ${step}\n`;
        });
        content += `- **预期结果**: ${tc.expectedResult}\n\n`;
      });
    }

    // 3. AI 思考过程
    if (thoughtProcess) {
      content += `## 3. AI 思考过程\n\n`;
      thoughtProcess.forEach((step) => {
        content += `- ${step}\n`;
      });
    }

    // Create and trigger download
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quality-guardian-report-${date}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleStartAnalysis = async () => {
    if (!requirement.trim()) return;

    setLoading(true);
    setError(null);
    setTestCases(null);
    setReviewResult(null);
    setThoughtProcess(null);
    setActiveTab("review");

    try {
      // Step 1: Generate Test Cases
      const tcResult = await generateTestCases(requirement);
      
      if (!tcResult.success || !tcResult.data) {
        throw new Error(tcResult.error || "Failed to generate test cases");
      }

      setTestCases(tcResult.data.testCases);
      if (tcResult.data.thoughtProcess) {
        setThoughtProcess(tcResult.data.thoughtProcess);
      }
      setLoading(false);

      // Step 2: Auto-trigger Requirement Review
      setReviewLoading(true);
      const reviewRes = await reviewRequirements(requirement, tcResult.data.testCases);

      if (!reviewRes.success || !reviewRes.data) {
         console.error("Review failed:", reviewRes.error);
      } else {
        setReviewResult(reviewRes.data);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
      setReviewLoading(false);
    }
  };

  const handleRefineRequirement = async () => {
    if (!requirement || !reviewResult) return;
    
    setRefineLoading(true);
    try {
      const result = await refineRequirements(requirement, reviewResult.comments);
      if (result.success && result.data) {
        setRequirement(result.data.refinedRequirement);
        // Optionally switch back to test cases or show a success message
        setActiveTab("test-cases"); 
        // Reset analysis state to force re-run if needed, or keep it to show "before/after" context?
        // Let's keep the current state but maybe highlight that the req has changed.
        setError(null);
      } else {
        setError("Failed to refine requirements: " + result.error);
      }
    } catch (err: any) {
      setError("Failed to refine requirements: " + err.message);
    } finally {
      setRefineLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "P0": return "destructive"; // Red
      case "P1": return "default"; // Black/White
      case "P2": return "secondary"; // Gray
      default: return "outline";
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case "High": return "高";
      case "Medium": return "中";
      case "Low": return "低";
      default: return severity;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between bg-card sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
           <div className="bg-primary w-8 h-8 rounded-lg flex items-center justify-center text-primary-foreground font-bold shadow-sm">Q</div>
           <h1 className="text-xl font-bold tracking-tight">QualityGuardian AI</h1>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={handleExportReport}
          disabled={!testCases && !reviewResult}
        >
          <Download className="h-4 w-4" />
          导出报告
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-73px)] overflow-hidden">
        
        {/* Left: Input Zone */}
        <section className="md:col-span-1 flex flex-col gap-4 h-full min-h-0">
          <div 
            className="bg-muted/30 p-6 rounded-xl border border-dashed flex flex-col items-center justify-center text-muted-foreground text-sm hover:bg-muted/50 cursor-pointer transition-colors group"
            onClick={() => fileInputRef.current?.click()}
          >
             <div className="bg-background p-3 rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                <FileUp className="h-6 w-6 text-primary" />
             </div>
             <span className="font-medium">上传需求文档</span>
             <span className="text-xs opacity-70 mt-1">.md, .txt, .json</span>
             <input 
               type="file" 
               ref={fileInputRef} 
               className="hidden" 
               accept=".md,.txt,.json" 
               onChange={handleFileUpload}
             />
          </div>
          
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-sm font-medium text-muted-foreground">需求详情</span>
                <Badge variant="secondary" className="text-xs opacity-50 font-normal pointer-events-none">支持 Markdown</Badge>
            </div>
            <Textarea 
                placeholder="在此输入或粘贴您的需求文档..." 
                className="flex-1 resize-none p-4 font-mono text-sm leading-relaxed rounded-xl shadow-sm focus-visible:ring-primary"
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
            />
          </div>

          <Button 
            size="lg" 
            className="w-full font-semibold shadow-md hover:shadow-lg transition-all" 
            onClick={handleStartAnalysis}
            disabled={loading || !requirement.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                正在生成测试用例...
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5 fill-current" />
                开始分析
              </>
            )}
          </Button>
          
          {error && (
              <Alert variant="destructive" className="animate-in fade-in slide-in-from-bottom-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>错误</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
              </Alert>
          )}
        </section>

        {/* Right: Result Zone */}
        <section className="md:col-span-2 h-full flex flex-col bg-card rounded-xl border shadow-sm overflow-hidden min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
            <div className="px-4 pt-4 border-b bg-muted/10">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                  <TabsTrigger value="review">
                      需求评审
                      {reviewLoading && <Loader2 className="ml-2 h-3 w-3 animate-spin text-primary" />}
                  </TabsTrigger>
                  <TabsTrigger value="test-cases">测试用例 {testCases && `(${testCases.length})`}</TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="review" className="flex-1 overflow-hidden p-0 m-0 data-[state=active]:flex flex-col">
                 <ScrollArea className="flex-1 p-6">
                    {reviewResult ? (
                        <div className="space-y-6 max-w-4xl mx-auto">
                            <Card className="bg-primary/5 border-primary/10 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2 text-primary">
                                        <CheckCircle className="h-5 w-5" />
                                        评审总结
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="leading-relaxed text-foreground/90">{reviewResult.summary}</p>
                                    {/* Refine Requirement Button */}
                                    <div className="mt-6 flex justify-end">
                                        <Button 
                                            onClick={handleRefineRequirement} 
                                            disabled={refineLoading}
                                            className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md transition-all hover:shadow-lg"
                                        >
                                            {refineLoading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Sparkles className="h-4 w-4" />
                                            )}
                                            一键优化需求
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <h3 className="font-semibold text-lg">详细发现</h3>
                                    <Badge variant="outline">{reviewResult.comments.length} 个问题</Badge>
                                </div>
                                {reviewResult.comments.map((comment, idx) => (
                                    <Alert key={idx} variant={comment.severity === 'High' ? 'destructive' : 'default'} className={`border-l-4 shadow-sm ${comment.severity === 'High' ? 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20' : 'border-l-orange-400 bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900'}`}>
                                        <AlertTriangle className={`h-4 w-4 ${comment.severity === 'High' ? 'text-red-500' : 'text-orange-500'}`} />
                                        <AlertTitle className="flex items-center gap-2 text-base font-semibold">
                                            {comment.issueDescription}
                                            <Badge variant={comment.severity === 'High' ? 'destructive' : 'outline'} className="ml-auto uppercase text-[10px] tracking-wider shrink-0">
                                                {getSeverityLabel(comment.severity)}
                                            </Badge>
                                        </AlertTitle>
                                        <AlertDescription className="mt-3">
                                            <div className="flex flex-col gap-2">
                                                <div className="bg-background/50 p-3 rounded-md border border-black/5 dark:border-white/5">
                                                    <span className="font-semibold text-xs uppercase tracking-wide opacity-70 block mb-1">建议</span>
                                                    <p>{comment.improvementSuggestion}</p>
                                                </div>
                                                {comment.relatedTestCaseId && (
                                                    <p className="text-xs opacity-60 flex items-center gap-1 mt-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                                        关联测试用例： <span className="font-mono">{comment.relatedTestCaseId}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </AlertDescription>
                                    </Alert>
                                ))}
                            </div>
                            <div className="h-10"></div>
                        </div>
                    ) : reviewLoading ? (
                         <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center min-h-[400px]">
                            <Loader2 className="h-10 w-10 animate-spin mb-6 text-primary" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">正在评审需求...</h3>
                            <p className="max-w-xs mx-auto text-sm opacity-80">AI 正在结合生成的测试用例分析您的需求，以发现潜在的逻辑漏洞。</p>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center min-h-[400px]">
                             <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6 opacity-50">
                                <BrainCircuit className="h-10 w-10 text-muted-foreground" />
                             </div>
                             <h3 className="text-lg font-semibold text-foreground mb-2">等待分析</h3>
                             <p className="max-w-xs mx-auto text-sm opacity-80">需求评审将在测试用例生成后自动开始。</p>
                        </div>
                    )}
                 </ScrollArea>
            </TabsContent>

            <TabsContent value="test-cases" className="flex-1 overflow-hidden p-0 m-0 data-[state=active]:flex flex-col relative">
                <ScrollArea className="flex-1 p-6">
                    {/* Agent Thinking Panel */}
                    {thoughtProcess && thoughtProcess.length > 0 && (
                        <div className="mb-6 max-w-4xl mx-auto">
                            <Accordion type="single" collapsible defaultValue="thinking">
                                <AccordionItem value="thinking" className="border rounded-lg bg-muted/20 px-4">
                                    <AccordionTrigger className="hover:no-underline py-3">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                                            <BrainCircuit className="h-4 w-4" />
                                            AI 思考过程
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="pl-6 border-l-2 border-primary/20 space-y-3 py-2">
                                            {thoughtProcess.map((step, idx) => (
                                                <div key={idx} className="text-sm text-muted-foreground relative">
                                                    <span className="absolute -left-[31px] bg-background border border-primary/30 rounded-full w-5 h-5 flex items-center justify-center text-[10px] text-primary font-mono top-0">
                                                        {idx + 1}
                                                    </span>
                                                    {step}
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    )}

                    {testCases ? (
                        <div className="space-y-4 max-w-4xl mx-auto">
                            {testCases.map((tc) => (
                                <Card key={tc.id} className="border-l-4 border-l-primary/40 hover:border-l-primary transition-all shadow-sm hover:shadow-md group">
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="font-mono text-xs bg-muted/50">{tc.id}</Badge>
                                                    <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">{tc.title}</CardTitle>
                                                </div>
                                            </div>
                                            <Badge variant={getPriorityColor(tc.priority) as any} className="shrink-0 px-2 py-0.5">{tc.priority}</Badge>
                                        </div>
                                        <CardDescription className="mt-2 text-sm bg-muted/30 p-2 rounded border border-dashed">
                                            <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wide mr-2">前置条件：</span>
                                            {tc.preconditions}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3 text-sm">
                                            <div>
                                                <span className="font-semibold text-muted-foreground block mb-2 text-xs uppercase tracking-wide">测试步骤</span>
                                                <ol className="list-decimal list-inside space-y-2 pl-2 marker:text-muted-foreground/50">
                                                    {tc.steps.map((step, idx) => (
                                                        <li key={idx} className="text-foreground/90 pl-1">{step}</li>
                                                    ))}
                                                </ol>
                                            </div>
                                            <div className="mt-4 pt-3 border-t flex items-start gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                                <div>
                                                    <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wide block mb-1">预期结果</span>
                                                    <span className="text-foreground/90">{tc.expectedResult}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            <div className="h-10"></div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center min-h-[400px]">
                            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                <Play className="h-8 w-8 text-muted-foreground/30 ml-1" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">准备分析</h3>
                            <p className="max-w-xs mx-auto text-sm opacity-80">在左侧输入您的需求，点击“开始分析”以利用 AI 生成全面的测试用例。</p>
                        </div>
                    )}
                </ScrollArea>
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}