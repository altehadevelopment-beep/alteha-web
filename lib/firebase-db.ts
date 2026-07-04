import { initializeFirestore } from 'firebase/firestore';
import { app } from './firebase';

// Firestore instance, imported only by chat features (useChat, ConversationsList,
// GlobalChatListener). Keeping it out of ./firebase means the Firestore SDK stays out
// of the global bundle that AuthContext loads on every page.
//
// Singleton vía globalThis: bajo el hot-reload de Next (dev) este módulo puede
// re-evaluarse y crear watch-streams duplicados sobre el mismo estado interno,
// lo que dispara "FIRESTORE INTERNAL ASSERTION FAILED: Unexpected state (ID: ca9)".
// experimentalAutoDetectLongPolling además estabiliza el stream en redes/proxies problemáticos.
const g = globalThis as any;
export const db =
    g.__altehaFirestoreDb ??
    (g.__altehaFirestoreDb = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
    }));
