import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** iOS no acepta transparencia — fondo sólido, sin radio (iOS lo recorta solo). */
export default function AppleIcon() {
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
          fontSize: 100,
          fontWeight: 700,
        }}
      >
        F
      </div>
    ),
    { ...size },
  );
}
