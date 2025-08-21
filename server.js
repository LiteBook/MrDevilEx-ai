const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

// API এন্ডপয়েন্টটি এখন 'language' প্যারামিটারও গ্রহণ করবে
app.post('/api/generate', async (req, res) => {
    // এখন আমরা userPrompt এর সাথে language ও নিচ্ছি
    const { userPrompt, language } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'API key not configured on the server.' });
    }
    if (!userPrompt || !language) {
        return res.status(400).json({ error: 'Prompt and language are required.' });
    }

    let fullPrompt;

    // ব্যবহারকারীর পছন্দের ভাষার উপর ভিত্তি করে AI-কে নির্দেশ দেওয়া হচ্ছে
    if (language === 'python') {
        fullPrompt = `You are an expert Python developer. Your task is to generate a complete, runnable Python script based on the user's request. 
        The script should be well-commented to explain the logic. 
        Do not include any explanations or markdown formatting like \`\`\`python. 
        The output must be ONLY the raw Python code itself.
        User Request: "${userPrompt}"`;
    } else { // ডিফল্ট 'web' এর জন্য
        fullPrompt = `You are an expert web developer. Your task is to generate a complete, self-contained HTML file based on the user's request. 
        The file must include all necessary HTML, CSS (inside a <style> tag), and JavaScript (inside a <script> tag). 
        Do not include any explanations or markdown formatting like \`\`\`html. 
        The output must be ONLY the raw HTML code itself, starting with <!DOCTYPE html>.
        User Request: "${userPrompt}"`;
    }

    const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

    try {
        const geminiResponse = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
        });

        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.json();
            throw new Error(errorData.error?.message || 'Failed to fetch from Google AI');
        }

        const data = await geminiResponse.json();
        const generatedCode = data.candidates[0].content.parts[0].text;
        res.status(200).json({ code: generatedCode });

    } catch (error) {
        console.error("Error calling Google AI:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
