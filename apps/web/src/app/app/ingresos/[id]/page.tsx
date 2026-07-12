import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button, Card, CardContent } from '@flowfinance/ui';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { listAttachments } from '@/lib/attachments/actions';
import { AttachmentsSection } from '@/components/attachments-section';

const INCOME_TYPE_LABELS: Record<string, string> = {
  salary: 'Laboral',
  freelance: 'Freelance',
  rental: 'Renta',
  investment_yield: 'Rendimientos',
  loan_payment: 'Abono préstamo',
  business: 'Negocio',
  eventual: 'Eventual',
  other: 'Otro',
};

export default async function IncomeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: income } = await supabase
    .from('income_entries')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (!income) notFound();

  const attachments = await listAttachments('income_entry', id);

  const amountFmt = new Intl.NumberFormat('es-SV', {
    style: 'currency',
    currency: income.currency,
  }).format(income.net_amount);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Link href="/app/ingresos" className="text-sm text-muted-foreground hover:underline">
        ← Ingresos
      </Link>

      <Card>
        <CardContent className="space-y-3 py-5">
          <div>
            <p className="text-sm text-muted-foreground">{income.source_name}</p>
            <p className="font-mono text-2xl text-ff-green">{amountFmt}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <p>Fecha: {income.income_date}</p>
            <p>Tipo: {INCOME_TYPE_LABELS[income.type] ?? income.type}</p>
          </div>
          {!income.is_collected && <p className="text-sm text-ff-yellow">Pendiente de cobro</p>}
          {income.notes && <p className="text-sm text-muted-foreground">{income.notes}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-5">
          <AttachmentsSection
            entityType="income_entry"
            entityId={id}
            initialAttachments={attachments}
          />
        </CardContent>
      </Card>

      <Button asChild variant="outline" className="w-full">
        <Link href="/app/ingresos">Volver</Link>
      </Button>
    </div>
  );
}
