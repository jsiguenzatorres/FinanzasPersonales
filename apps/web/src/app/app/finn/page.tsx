import { Card, CardContent } from '@flowfinance/ui';
import { FINN_NAME_BY_PLAN } from '@flowfinance/finn/prompts/system';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { VoiceMessageForm } from '@/components/finn/voice-message-form';
import { SpeakButton } from '@/components/finn/speak-button';

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
      <div className="mb-4">
        <h1 className="font-display text-2xl">
          <span className="text-ff-green">{finnName}</span>
        </h1>
        <p className="text-sm text-muted-foreground">Pregúntale sobre tus finanzas reales</p>
      </div>

      {error && (
        <p className="mb-4 rounded-md border border-ff-red/30 bg-ff-red/10 px-4 py-3 text-sm text-ff-red">
          {error}
        </p>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto">
        {messages.length === 0 ? (
          <Card>
            <CardContent className="space-y-2 py-8 text-center text-muted-foreground">
              <p>¡Hola! Soy {finnName}. Pregúntame cosas como:</p>
              <div className="space-y-1 text-sm">
                <p>&quot;¿Cuánto llevo gastado este mes?&quot;</p>
                <p>&quot;¿Cómo va mi presupuesto?&quot;</p>
                <p>&quot;¿Cuál es mi patrimonio neto?&quot;</p>
                <p>&quot;¿Cuánto tengo en mis cuentas?&quot;</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-lg px-4 py-2 text-sm ${
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-card'
                }`}
              >
                {m.content}
              </div>
              {m.role === 'assistant' && m.content && <SpeakButton text={m.content} />}
            </div>
          ))
        )}
      </div>

      <VoiceMessageForm conversationId={conversationId ?? null} />
    </div>
  );
}
