import { Card, CardContent } from '@flowfinance/ui';
import { Bot, AlertCircle } from 'lucide-react';
import { FINN_NAME_BY_PLAN } from '@flowfinance/finn/prompts/system';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { VoiceMessageForm } from '@/components/finn/voice-message-form';
import { SpeakButton } from '@/components/finn/speak-button';

const SUGGESTED_QUESTIONS = [
  '¿Cuánto llevo gastado este mes?',
  '¿Cómo va mi presupuesto?',
  '¿Cuál es mi patrimonio neto?',
  '¿Cuánto tengo en mis cuentas?',
];

export default async function FinnPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation_id?: string; error?: string }>;
}) {
  const { conversation_id: conversationId, error } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user!.id)
    .single();

  const finnName = FINN_NAME_BY_PLAN[profile?.plan ?? 'free'] ?? 'Neto';

  let messages: Array<{ role: string; content: string | null }> = [];
  if (conversationId) {
    const { data } = await supabase
      .from('finn_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    messages = data ?? [];
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-landing-forest">
          <Bot className="h-5 w-5 text-landing-cream" aria-hidden="true" />
        </div>
        <div>
          <h1 className="font-display text-2xl">{finnName}</h1>
          <p className="text-sm text-muted-foreground">Pregúntale sobre tus finanzas reales</p>
        </div>
      </div>

      {error && (
        <p className="mb-4 flex items-center gap-2 rounded-xl border border-ff-red/25 bg-ff-red/10 px-4 py-3 text-sm text-ff-red">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto">
        {messages.length === 0 ? (
          <Card className="animate-fade-in-up">
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full animate-empty-breathe bg-landing-forest/10">
                <Bot className="h-6 w-6 text-landing-forest" aria-hidden="true" />
              </div>
              <p className="text-muted-foreground">¡Hola! Soy {finnName}. Pregúntame cosas como:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <span
                    key={q}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground"
                  >
                    {q}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`flex items-end gap-2 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {m.role === 'assistant' && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-landing-forest">
                  <Bot className="h-3.5 w-3.5 text-landing-cream" aria-hidden="true" />
                </div>
              )}
              <div className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                    m.role === 'user'
                      ? 'rounded-br-sm bg-primary text-primary-foreground'
                      : 'rounded-bl-sm border border-border bg-card'
                  }`}
                >
                  {m.content}
                </div>
                {m.role === 'assistant' && m.content && <SpeakButton text={m.content} />}
              </div>
            </div>
          ))
        )}
      </div>

      <VoiceMessageForm conversationId={conversationId ?? null} />
    </div>
  );
}
