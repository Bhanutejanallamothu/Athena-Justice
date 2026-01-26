'use client';

import * as React from 'react';
import Link from 'next/link';
import { MoreHorizontal, PlusCircle, Search } from 'lucide-react';

import type { Sheeter } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AddSheeterDialog } from './add-sheeter-dialog';
import { PageHeader } from './page-header';

interface SheeterDataTableProps {
  initialSheeters: Sheeter[];
}

export function SheeterDataTable({ initialSheeters }: SheeterDataTableProps) {
  const [sheeters, setSheeters] = React.useState(initialSheeters);
  const [filter, setFilter] = React.useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);

  const filteredSheeters = sheeters.filter(
    (sheeter) =>
      sheeter.personalDetails.name.toLowerCase().includes(filter.toLowerCase()) ||
      sheeter.id.toLowerCase().includes(filter.toLowerCase()) ||
      sheeter.personalDetails.area.toLowerCase().includes(filter.toLowerCase())
  );

  const handleSheeterAdded = () => {
    // In a real app, you'd refetch the data. Here we'll just log it.
    console.log('Sheeter added, refetch data.');
  };

  const riskLevelVariant = {
    Low: 'default',
    Medium: 'secondary',
    High: 'destructive',
  } as const;

  return (
    <div className="space-y-4">
      <PageHeader 
        title="Sheeter Profiles"
        description="Manage and view all rowdy sheeter profiles in the system."
      >
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Sheeter
        </Button>
      </PageHeader>
      
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by name, ID, or area..."
          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Sheeter ID</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSheeters.length > 0 ? (
              filteredSheeters.map((sheeter) => (
                <TableRow key={sheeter.id}>
                  <TableCell className="font-medium">
                    {sheeter.personalDetails.name}
                  </TableCell>
                  <TableCell>{sheeter.id}</TableCell>
                  <TableCell>{sheeter.personalDetails.area}</TableCell>
                  <TableCell>
                    <Badge variant={riskLevelVariant[sheeter.riskLevel]}>
                      {sheeter.riskLevel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/sheeters/${sheeter.id}`}>View Profile</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <AddSheeterDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSheeterAdded={handleSheeterAdded}
      />
    </div>
  );
}
