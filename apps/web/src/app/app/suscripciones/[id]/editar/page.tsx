import { notFound } from 'next/navigation';
import { SubscriptionForm } from '../../nueva/subscription-form';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function EditSubscriptionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const [{ data: sub }, { data: categories }] = await Promise.all([
    supabase.from('subscriptions').select('*').eq('id', id).single(),
    supabase.from('categories').select('id, name').is('archived_at', null).not('parent_id', 'is', null).order('name'),
  ]);

  if (!sub) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <SubscriptionForm
        categories={categories ?? []}
        error={error}
        initialValues={{
          id: sub.id,
          service_name: sub.service_name,
          plan: sub.plan ?? '',
          amount: String(sub.amount),
          currency: sub.currency,
          frequency: sub.frequency,
          next_charge_date: sub.next_charge_date,
          start_date: sub.start_date,
          category_id: sub.category_id ?? '',
          cancel_url: sub.cancel_url ?? '',
          notes: sub.notes ?? '',
          usage_score: sub.usage_score ? String(sub.usage_score) : '',
          is_active: sub.is_active,
        }}
      />
    </div>
  );
}
