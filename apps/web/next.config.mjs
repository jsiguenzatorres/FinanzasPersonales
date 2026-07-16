/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',         // requerido para Docker en VPS Hostinger
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@flowfinance/shared', '@flowfinance/ui', '@flowfinance/finn'],
  // @google-cloud/text-to-speech (voz de Neto) usa gRPC nativo — no lo
  // empaquetes con webpack/turbopack, requiere Node runtime real.
  serverExternalPackages: ['@google-cloud/text-to-speech'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  images: {
    remotePatterns: [
      // Avatares Supabase Storage
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
      // Avatares Google OAuth
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
