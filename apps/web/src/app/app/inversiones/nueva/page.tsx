import { InvestmentForm } from './investment-form';

export default async function NewInvestmentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-lg">
      <InvestmentForm error={error} />
    </div>
  );
}
