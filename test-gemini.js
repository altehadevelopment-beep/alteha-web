const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
    const apiKey = process.argv[2];
    console.log("API Key provided:", apiKey ? "Yes" : "No");
    
    if (!apiKey) return;

    const genAI = new GoogleGenerativeAI(apiKey);
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
    
    for (const modelName of models) {
        console.log(`Testing model: ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hola");
            const response = await result.response;
            console.log(`SUCCESS with ${modelName}:`, response.text());
            break; 
        } catch (e) {
            console.log(`FAILED with ${modelName}:`, e.message);
            if (e.status) console.log(`Status: ${e.status}`);
        }
    }
}

test();
