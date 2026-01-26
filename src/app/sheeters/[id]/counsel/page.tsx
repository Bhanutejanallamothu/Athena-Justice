'use client';

import * as React from 'react';
import { notFound, useRouter } from 'next/navigation';
import { Bot, ChevronLeft, Loader2, Mic, Send, FileText, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { aiCounselingPrep, AICounselingPrepOutput } from '@/ai/flows/ai-counseling-prep';
import { generateQuestion } from '@/ai/flows/voice-to-voice-question-flow';
import { automatedInteractionReport, AutomatedInteractionReportOutput } from '@/ai/flows/automated-interaction-report';

import { getSheeterById } from '@/lib/data';
import type { Sheeter } from '@/lib/types';

import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

type Message = {
  role: 'ai' | 'sheeter';
  content: string;
};

export default function CounselPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const sheeter = React.useMemo(() => getSheeterById(params.id), [params.id]);

  const [prepData, setPrepData] = React.useState<AICounselingPrepOutput | null>(null);
  const [reportData, setReportData] = React.useState<AutomatedInteractionReportOutput | null>(null);
  const [isLoadingPrep, setIsLoadingPrep] = React.useState(true);
  const [isLoadingReport, setIsLoadingReport] = React.useState(false);
  const [isLoadingQuestion, setIsLoadingQuestion] = React.useState(false);
  const [sessionStarted, setSessionStarted] = React.useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = React.useState(false);

  const [messages, setMessages] = React.useState<Message[]>([]);
  const [currentResponse, setCurrentResponse] = React.useState('');

  React.useEffect(() => {
    if (!sheeter) return;

    async function getPrepData() {
      try {
        const data = await aiCounselingPrep({
          personalDetails: { ...sheeter.personalDetails, id: sheeter.id },
          criminalHistory: sheeter.criminalHistory,
          behavioralTags: sheeter.behavioralTags,
          riskLevel: sheeter.riskLevel,
          previousCounselingSummaries: sheeter.previousCounselingSummaries,
        });
        setPrepData(data);
      } catch (error) {
        console.error('Failed to get AI counseling prep data', error);
        toast({
            variant: 'destructive',
            title: 'AI Prep Failed',
            description: 'Could not load AI-powered suggestions.'
        })
      } finally {
        setIsLoadingPrep(false);
      }
    }

    getPrepData();
  }, [sheeter, toast]);

  const handleStartSession = async () => {
    setSessionStarted(true);
    if (prepData?.suggestedQuestions?.[0]) {
      setMessages([{ role: 'ai', content: prepData.suggestedQuestions[0] }]);
    } else {
        await getNextQuestion();
    }
  };

  const getNextQuestion = async () => {
    if (!sheeter) return;
    setIsLoadingQuestion(true);
    try {
        const previousResponses = messages.filter(m => m.role === 'sheeter').map(m => m.content).join('\n');
        const result = await generateQuestion({
            profileDetails: JSON.stringify(sheeter.personalDetails),
            criminalHistory: sheeter.criminalHistory.map(h => h.cases).join(', '),
            behavioralPatterns: sheeter.behavioralTags.join(', '),
            previousResponses: previousResponses,
        });
        setMessages(prev => [...prev, { role: 'ai', content: result.question }]);
    } catch (error) {
        console.error('Failed to generate question', error);
        toast({
            variant: 'destructive',
            title: 'AI Question Failed',
            description: 'Could not generate the next question.'
        })
    } finally {
        setIsLoadingQuestion(false);
    }
  }

  const handleSendResponse = async () => {
    if (!currentResponse.trim()) return;
    setMessages(prev => [...prev, { role: 'sheeter', content: currentResponse }]);
    setCurrentResponse('');
    await getNextQuestion();
  };

  const handleEndSession = async () => {
    if (!sheeter) return;
    setIsLoadingReport(true);
    setIsReportDialogOpen(true);
    try {
        const sessionTranscript = messages.map(m => `${m.role}: ${m.content}`).join('\n');
        const report = await automatedInteractionReport({
            criminalHistory: sheeter.criminalHistory.map(h => h.cases).join(', '),
            behavioralPatterns: sheeter.behavioralTags.join(', '),
            previousCounselingResponses: sheeter.previousCounselingSummaries.join('\n'),
            sessionTranscript: sessionTranscript,
        });
        setReportData(report);
    } catch (error) {
        console.error('Failed to generate report', error);
         toast({
            variant: 'destructive',
            title: 'Report Generation Failed',
            description: 'Could not generate the session report.'
        })
    } finally {
        setIsLoadingReport(false);
    }
  };

  if (!sheeter) {
    return notFound();
  }

  const renderPrepSkeleton = () => (
    <>
        <Skeleton className="h-6 w-1/2 mb-4" />
        <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-6 w-1/3 mt-6 mb-4" />
        <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
        </div>
    </>
  )

  const renderReportSkeleton = () => (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
            <div key={i}>
                <Skeleton className="h-5 w-1/3 mb-2" />
                <Skeleton className="h-4 w-full" />
            </div>
        ))}
      </div>
  )

  return (
    <AppLayout>
      <main className="flex h-screen flex-col">
        <div className="p-4 md:p-8 border-b">
            <PageHeader title={`Counseling Session: ${sheeter.personalDetails.name}`}>
                <Button variant="outline" asChild>
                    <Link href={`/sheeters/${sheeter.id}`}>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back to Profile
                    </Link>
                </Button>
            </PageHeader>
        </div>
        
        <div className="grid md:grid-cols-3 flex-1 overflow-hidden">
            <aside className="md:col-span-1 border-r bg-muted/20 p-4 md:p-6 flex flex-col">
                <h2 className="font-headline text-lg font-semibold flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary"/> AI Counseling Prep</h2>
                <Separator className="my-4" />
                <ScrollArea className="flex-1">
                    {isLoadingPrep ? renderPrepSkeleton() : (
                    prepData ? (
                        <div className="space-y-6 pr-4">
                            <div>
                                <h3 className="font-semibold text-md mb-2">Focus Areas</h3>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                    {prepData.focusAreas.map((area, i) => <li key={i}>{area}</li>)}
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-md mb-2">Suggested Questions</h3>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                    {prepData.suggestedQuestions.map((q, i) => <li key={i}>{q}</li>)}
                                </ul>
                            </div>
                        </div>
                    ) : <p className="text-sm text-muted-foreground">Could not load AI suggestions.</p>
                    )}
                </ScrollArea>
            </aside>

            <div className="md:col-span-2 flex flex-col h-full p-4 md:p-6">
                {!sessionStarted ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Card className="max-w-md">
                            <CardHeader>
                                <CardTitle>Ready to Begin?</CardTitle>
                                <CardDescription>Start the voice-to-voice counseling session with {sheeter.personalDetails.name}.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button size="lg" onClick={handleStartSession} disabled={isLoadingPrep}>
                                    {isLoadingPrep ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mic className="mr-2 h-4 w-4" />}
                                    Start Session
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <>
                        <ScrollArea className="flex-1 -mx-4 px-4">
                            <div className="space-y-4">
                                {messages.map((message, index) => (
                                    <div key={index} className={`flex items-start gap-3 ${message.role === 'ai' ? '' : 'justify-end'}`}>
                                        {message.role === 'ai' && <Avatar className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center"><Bot className="h-5 w-5"/></Avatar>}
                                        <div className={`rounded-lg p-3 max-w-lg ${message.role === 'ai' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                                            <p className="text-sm">{message.content}</p>
                                        </div>
                                    </div>
                                ))}
                                {isLoadingQuestion && (
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center"><Bot className="h-5 w-5"/></Avatar>
                                        <div className="rounded-lg p-3 bg-muted">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        <div className="mt-4 flex flex-col gap-4">
                            <div className="flex gap-2">
                                <Textarea
                                    placeholder="Transcribe sheeter's response here..."
                                    value={currentResponse}
                                    onChange={(e) => setCurrentResponse(e.target.value)}
                                    className="flex-1"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendResponse();
                                        }
                                    }}
                                />
                                <Button onClick={handleSendResponse} disabled={!currentResponse.trim() || isLoadingQuestion}><Send className="h-4 w-4"/></Button>
                            </div>
                            <Button variant="destructive" onClick={handleEndSession}>End Session & Generate Report</Button>
                        </div>
                    </>
                )}
            </div>
        </div>
      </main>

      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl"><FileText/> Automated Interaction Report</DialogTitle>
            <DialogDescription>
              AI-generated summary and analysis of the session with {sheeter.personalDetails.name}.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] p-1">
            <div className="p-4 space-y-6">
                {isLoadingReport ? renderReportSkeleton() : reportData ? (
                    <>
                        <div>
                            <h3 className="font-semibold">Session Summary</h3>
                            <p className="text-sm text-muted-foreground">{reportData.sessionSummary}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <h3 className="font-semibold">Emotional Indicators</h3>
                                <p className="text-sm text-muted-foreground">{reportData.emotionalIndicators}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold">Cooperation Level</h3>
                                <p className="text-sm text-muted-foreground">{reportData.cooperationLevel}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold">Behavioral Change Trend</h3>
                                <p className="text-sm text-muted-foreground">{reportData.behavioralChangeTrend}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold">Risk Level Reassessment</h3>
                                <p className="text-sm text-muted-foreground">{reportData.riskLevelReassessment}</p>
                            </div>
                        </div>
                        <div>
                            <Alert>
                                <Sparkles className="h-4 w-4"/>
                                <AlertTitle className="font-semibold">Recommended Next Action</AlertTitle>
                                <AlertDescription>{reportData.recommendedNextAction}</AlertDescription>
                            </Alert>
                        </div>
                    </>
                ) : <p className="text-sm text-muted-foreground text-center py-8">Could not generate report.</p>}
            </div>
            </ScrollArea>
          <DialogFooter>
            <Button onClick={() => setIsReportDialogOpen(false)}>Close</Button>
            <Button onClick={() => {
                toast({ title: 'Report Saved', description: 'The interaction report has been saved to the sheeter profile.'});
                setIsReportDialogOpen(false);
                router.push(`/sheeters/${params.id}`);
            }}>Save Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
