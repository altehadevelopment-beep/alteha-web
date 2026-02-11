const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET || "1x00000000000000000000000000000000AA";

export async function verifyCaptcha(token: string): Promise<boolean> {
    // For SliderCaptcha, we just check if any token (like "human") was passed from the client
    return !!token;
}
