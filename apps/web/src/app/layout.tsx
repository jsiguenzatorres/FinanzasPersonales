import '@flowfinance/ui/styles';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'FlowFinance',
    template: '%s · FlowFinance',
  },
  description: 'Finanzas personales con IA — diseñado para LATAM.',
  applicationName: 'FlowFinance',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-SV" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
