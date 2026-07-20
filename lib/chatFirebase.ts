// Chat en tiempo real sobre Firebase Firestore (proyecto alteha-4b694).
// Misma estructura que la app móvil: chats/{id} + subcolección mensajes.
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
    getFirestore, collection, doc, setDoc, addDoc, onSnapshot,
    query, where, orderBy, limit, type Firestore,
} from 'firebase/firestore';

const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyAWITL4P4miDwog5ez7o8gouY0YbrwiSH4',
    projectId: 'alteha-4b694',
};

let _db: Firestore | null = null;
export function db(): Firestore {
    if (_db) return _db;
    const app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
    _db = getFirestore(app);
    return _db;
}

export type ActorChat = { email: string; nombre: string; foto?: string | null; rol?: string };
export type Mensaje = { id: string; de: string; texto: string; en: number };
export type Conversacion = {
    id: string; participantes: string[]; info: ActorChat[];
    ultimoMensaje?: string; ultimoDe?: string; actualizadoEn?: number;
};

const limpio = (e: string) => e.toLowerCase().replace(/[^a-z0-9]/g, '_');

/** Id determinístico de la conversación entre dos correos. */
export const chatIdDe = (a: string, b: string) => [limpio(a), limpio(b)].sort().join('__');

/** Crea (o actualiza) la conversación con la info de ambos participantes. */
export async function asegurarChat(yo: ActorChat, otro: ActorChat): Promise<string> {
    const id = chatIdDe(yo.email, otro.email);
    await setDoc(doc(db(), 'chats', id), {
        participantes: [yo.email.toLowerCase(), otro.email.toLowerCase()],
        info: [
            { email: yo.email.toLowerCase(), nombre: yo.nombre || yo.email, foto: yo.foto || null, rol: yo.rol || '' },
            { email: otro.email.toLowerCase(), nombre: otro.nombre || otro.email, foto: otro.foto || null, rol: otro.rol || '' },
        ],
        actualizadoEn: Date.now(),
    }, { merge: true });
    return id;
}

export async function enviarMensaje(chatId: string, de: string, texto: string) {
    const t = texto.trim();
    if (!t) return;
    await addDoc(collection(db(), 'chats', chatId, 'mensajes'), {
        de: de.toLowerCase(), texto: t, en: Date.now(),
    });
    await setDoc(doc(db(), 'chats', chatId), {
        ultimoMensaje: t.slice(0, 120), ultimoDe: de.toLowerCase(), actualizadoEn: Date.now(),
    }, { merge: true });
}

/** Escucha en vivo los mensajes de una conversación (ascendente). */
export function escucharMensajes(chatId: string, cb: (m: Mensaje[]) => void) {
    return onSnapshot(
        query(collection(db(), 'chats', chatId, 'mensajes'), orderBy('en', 'asc'), limit(500)),
        (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))),
        () => cb([]),
    );
}

/** Escucha en vivo mis conversaciones (más recientes primero). */
export function escucharChats(miEmail: string, cb: (c: Conversacion[]) => void) {
    return onSnapshot(
        query(collection(db(), 'chats'), where('participantes', 'array-contains', miEmail.toLowerCase())),
        (snap) => cb(
            snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }) as Conversacion)
                .sort((a, b) => (b.actualizadoEn || 0) - (a.actualizadoEn || 0)),
        ),
        () => cb([]),
    );
}
