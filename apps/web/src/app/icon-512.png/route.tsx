import { ImageResponse } from 'next/og';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#3E5A45',
          color: '#F7F0E3',
          fontSize: 290,
          fontWeight: 700,
        }}
      >
        F
      </div>
    ),
    { width: 512, height: 512 },
  );
}
