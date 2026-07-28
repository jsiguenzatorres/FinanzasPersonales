import { DebtForm } from './debt-form';

export default async function NewDebtPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-lg">
      <DebtForm error={error} />
    </div>
  );
}
