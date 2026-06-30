"use client";

import dynamic from 'next/dynamic';

// These run on every page but are NOT needed for first paint:
//  - GlobalChatListener: renders null, only sets up a Firestore listener in an effect.
//  - TehaChatbot: a floating widget that is hidden until the user opens it (pulls in Gemini SDK).
// Loading them client-side after hydration keeps them off the critical render path of every route.
const GlobalChatListener = dynamic(
    () => import('@/components/chat/GlobalChatListener').then(m => m.GlobalChatListener),
    { ssr: false }
);

const TehaChatbot = dynamic(
    () => import('@/components/ui/TehaChatbot').then(m => m.TehaChatbot),
    { ssr: false }
);

export default function DeferredGlobals() {
    return (
        <>
            <GlobalChatListener />
            <TehaChatbot />
        </>
    );
}
