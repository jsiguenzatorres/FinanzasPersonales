import { ImageResponse } from 'next/og';

/** Maskable: el glifo vive dentro de la zona segura (~80% central) — Android
 * recorta el ícono con formas (círculo, squircle, etc.) y puede comerse los
 * bordes. Fondo sólido a todo el cuadro, sin transparencia. */
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
          fontSize: 190,
          fontWeight: 700,
        }}
      >
        F
      </div>
    ),
    { width: 512, height: 512 },
  );
}
