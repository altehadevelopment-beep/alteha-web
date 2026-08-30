// Inicia el chat del paciente con el prestador de una oferta.
// Sin sesión → lo lleva a registrarse; con sesión de paciente → resuelve el
// correo del prestador y abre la conversación en /dashboard/patient/mensajes.
import { getStoredToken } from '@/lib/api';

export async function contactarPrestador(providerType?: string, providerId?: number): Promise<string> {
    const token = getStoredToken();
    if (!token) return '/register/patient';
    if (!providerType || !providerId) return '/dashboard/patient/mensajes';
    try {
        const r = await fetch(`/api/patient/chat/provider?type=${providerType}&id=${providerId}`, {
            headers: { 'X-Alteha-Token': token },
        }).then((x) => x.json());
        if (r?.code === '00' && r?.data?.email) {
            const d = r.data;
            const qs = new URLSearchParams({ otro: d.email, nombre: d.nombre || '', foto: d.foto || '', rol: d.rol || '' });
            return `/dashboard/patient/mensajes?${qs.toString()}`;
        }
    } catch {}
    return '/dashboard/patient/mensajes';
}
