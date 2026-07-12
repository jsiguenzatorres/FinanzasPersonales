'use server';

import { createFinnClient } from '@flowfinance/finn/client';
import {
  buildClassifyExpensePrompt,
  expenseClassificationSchema,
} from '@flowfinance/finn/prompts/classify-expense';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function classifyExpenseCategory(input: {
  merchant_name?: string;
  description?: string;
  amount: number;
  currency: string;
}): Promise<{ category_id: string; category_name: string; confidence: number } | null> {
  if (!process.env.GEMINI_API_KEY) return null;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, parent_id')
    .is('archived_at', null)
    .not('parent_id', 'is', null);

  if (!categories || categories.length === 0) return null;

  const names = categories.map((c) => c.name);

  const client = createFinnClient({
    apiKey: process.env.GEMINI_API_KEY,
    nvidiaApiKey: process.env.NVIDIA_API_KEY,
  });
  const prompt = buildClassifyExpensePrompt({
    merchant_name: input.merchant_name,
    description: input.description,
    amount: input.amount,
    currency: input.currency,
    category_names: names,
  });

  try {
    const result = await client.classifyJson<unknown>(prompt);
    const parsed = expenseClassificationSchema.safeParse(result);
    if (!parsed.success) return null;

    const match = categories.find((c) => c.name === parsed.data.category_name);
    if (!match) return null;

    return {
      category_id: match.id,
      category_name: match.name,
      confidence: parsed.data.confidence,
    };
  } catch {
    return null;
  }
}
