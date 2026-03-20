const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
    const apiKey = process.argv[2];
    console.log("API Key provided:", apiKey ? "Yes" : "No");
    
    if (!apiKey) return;

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // ListModels is typically done via the client-side but let's try 
        // to reach the endpoint directly or via the model list if available.
        // In the SDK, it's often not directly exposed in the main class as a simple method 
        // but we can try to fetch the models list.
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        console.log("Available Models Data:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.log(`FAILED:`, e.message);
    }
}

test();
