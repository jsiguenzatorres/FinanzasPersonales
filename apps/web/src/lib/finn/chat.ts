'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createFinnClient } from '@flowfinance/finn/client';
import { buildFinnSystemPrompt } from '@flowfinance/finn/prompts/system';
import { FINN_TOOLS } from '@flowfinance/finn/tools/definitions';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { buildFinnContext } from './context';
import { executeFinnTool } from './tools';

/** Mensajes de chat permitidos por día, según plan (spec §8.1). */
const RATE_LIMITS: Record<string, number> = {
  free: 5,
  starter: 30,
  pro: 50,
  elite: 100,
};

export async function sendFinnMessageAction(formData: FormData) {
  const message = String(formData.get('message') ?? '').trim();
  const existingConversationId = String(formData.get('conversation_id') ?? '') || null;

  if (!message) {
    redirect('/app/finn' + (existingConversationId ? `?conversation_id=${existingConversationId}` : ''));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, country, currency_default, plan')
    .eq('id', user.id)
    .single();

  const plan = profile?.plan ?? 'free';

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { count: todayCount } = await supabase
    .from('finn_messages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('role', 'user')
    .gte('created_at', startOfDay.toISOString());

  const limit = RATE_LIMITS[plan] ?? RATE_LIMITS.free!;
  if ((todayCount ?? 0) >= limit) {
    redirect(
      '/app/finn?' +
        (existingConversationId ? `conversation_id=${existingConversationId}&` : '') +
        'error=' +
        encodeURIComponent(`Alcanzaste tu límite diario de FINN (${limit} mensajes). Vuelve mañana.`),
    );
  }

  let conversationId = existingConversationId;
  if (!conversationId) {
    const { data: conv } = await supabase
      .from('finn_conversations')
      .insert({ user_id: user.id, session_kind: 'chat', model_used: 'gemini-2.5-flash' })
      .select('id')
      .single();
    conversationId = conv?.id ?? null;
  }

  if (!conversationId) {
    redirect('/app/finn?error=' + encodeURIComponent('No se pudo iniciar la conversación.'));
  }

  const { data: history } = await supabase
    .from('finn_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(20);

  const geminiHistory = (history ?? [])
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && m.content)
    .map((m) => ({
      role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
      parts: [{ text: m.content! }],
    }));

  if (!process.env.GEMINI_API_KEY) {
    redirect(
      `/app/finn?conversation_id=${conversationId}&error=` +
        encodeURIComponent('FINN no está configurado (falta GEMINI_API_KEY).'),
    );
  }

  await supabase.from('finn_messages').insert({
    conversation_id: conversationId,
    user_id: user.id,
    role: 'user',
    content: message,
  });

  const context = await buildFinnContext(supabase, user.id);

  const systemPrompt = buildFinnSystemPrompt({
    plan,
    displayName: profile?.display_name ?? 'Usuario',
    country: profile?.country ?? 'SV',
    currency: profile?.currency_default ?? 'USD',
    contextJson: JSON.stringify(context, null, 2),
  });

  const client = createFinnClient({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const result = await client.chatWithTools({
      systemPrompt,
      history: geminiHistory,
      message,
      tools: FINN_TOOLS,
      executeTool: (name, args) => executeFinnTool(supabase, user.id, name, args),
    });

    await supabase.from('finn_messages').insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: 'assistant',
      content: result.text,
      tokens_in: result.tokensIn,
      tokens_out: result.tokensOut,
      model: 'gemini-2.5-flash',
    });
  } catch {
    redirect(
      `/app/finn?conversation_id=${conversationId}&error=` +
        encodeURIComponent('FINN está tomando una siesta. Reintenta en un momento.'),
    );
  }

  revalidatePath('/app/finn');
  redirect(`/app/finn?conversation_id=${conversationId}`);
}
