import { sheeters } from '@/lib/data';
import { AppLayout } from '@/components/app-layout';
import { SheeterDataTable } from '@/components/sheeter-data-table';

export default function SheetersPage() {
  return (
    <AppLayout>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <SheeterDataTable initialSheeters={sheeters} />
      </main>
    </AppLayout>
  );
}
