import { getFirestore } from 'firebase/firestore';
import { app } from './firebase';

// Firestore instance, imported only by chat features (useChat, ConversationsList,
// GlobalChatListener). Keeping it out of ./firebase means the Firestore SDK stays out
// of the global bundle that AuthContext loads on every page.
export const db = getFirestore(app);
