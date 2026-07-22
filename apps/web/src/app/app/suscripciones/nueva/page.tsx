import { SubscriptionForm } from './subscription-form';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function NewSubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .is('archived_at', null)
    .not('parent_id', 'is', null)
    .order('name');

  return (
    <div className="mx-auto max-w-lg">
      <SubscriptionForm categories={categories ?? []} error={error} />
    </div>
  );
}
