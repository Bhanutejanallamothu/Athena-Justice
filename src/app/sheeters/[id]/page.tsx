import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  FileText,
  Gavel,
  ShieldAlert,
  User,
  History,
  Mic,
  PlusCircle,
} from 'lucide-react';

import { getSheeterById } from '@/lib/data';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

export default function SheeterProfilePage({ params }: { params: { id: string } }) {
  const sheeter = getSheeterById(params.id);

  if (!sheeter) {
    notFound();
  }

  const riskLevelColor = {
    Low: 'bg-green-500',
    Medium: 'bg-yellow-500',
    High: 'bg-red-500',
  };

  return (
    <AppLayout>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <PageHeader 
            title={sheeter.personalDetails.name}
            description={`Sheeter ID: ${sheeter.id}`}
        >
            <Button asChild>
                <Link href={`/sheeters/${sheeter.id}/counsel`}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Start Counseling Session
                </Link>
            </Button>
        </PageHeader>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
              <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div
                  className={`h-4 w-4 rounded-full ${
                    riskLevelColor[sheeter.riskLevel]
                  }`}
                />
                <span className="text-2xl font-bold">{sheeter.riskLevel}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Age</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sheeter.personalDetails.age}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Area</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sheeter.personalDetails.area}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="lg:col-span-4 space-y-4">
                <Card>
                    <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Gavel className="h-5 w-5" />
                        Criminal History
                    </CardTitle>
                    </CardHeader>
                    <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Cases</TableHead>
                            <TableHead>Sections</TableHead>
                            <TableHead>Frequency</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {sheeter.criminalHistory.map((history, index) => (
                            <TableRow key={index}>
                            <TableCell>{history.cases}</TableCell>
                            <TableCell>{history.sections}</TableCell>
                            <TableCell>{history.frequency}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Previous Counseling Summaries
                    </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    {sheeter.previousCounselingSummaries.length > 0 ? sheeter.previousCounselingSummaries.map((summary, index) => (
                        <div key={index}>
                            <p className="text-sm text-muted-foreground">{summary}</p>
                            {index < sheeter.previousCounselingSummaries.length - 1 && <Separator className="mt-4" />}
                        </div>
                    )) : (
                        <p className="text-sm text-muted-foreground">No previous summaries available.</p>
                    )}
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-3 space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Behavioral Tags</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        {sheeter.behavioralTags.map((tag) => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" />
                            Voice Interaction History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Duration</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {sheeter.voiceInteractionHistory.length > 0 ? sheeter.voiceInteractionHistory.map((interaction, index) => (
                            <TableRow key={index}>
                            <TableCell>{interaction.date}</TableCell>
                            <TableCell>{interaction.duration}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={2} className="h-24 text-center">No interactions logged.</TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                    </CardContent>
              </Card>
            </div>
        </div>

      </main>
    </AppLayout>
  );
}
