'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

/**
 * Lee ?error= / ?message= de la URL y los muestra como toast — reemplaza los
 * banners estáticos que antes se repetían en cada página. Monta una sola vez
 * en el layout autenticado; limpia la URL después para que un refresh o un
 * "atrás" del navegador no vuelva a disparar el mismo toast.
 */
export function ToastFromParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shown = useRef(false);

  const error = searchParams.get('error');
  const message = searchParams.get('message');

  useEffect(() => {
    if (shown.current) return;
    if (!error && !message) return;
    shown.current = true;

    if (error) toast.error(error);
    if (message) toast.success(message);

    const params = new URLSearchParams(searchParams.toString());
    params.delete('error');
    params.delete('message');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [error, message, pathname, router, searchParams]);

  return null;
}
