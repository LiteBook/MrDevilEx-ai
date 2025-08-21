const express = require('express');
const path = require('path');
require('dotenv').config(); // .env ফাইল থেকে ভ্যারিয়েবল লোড করার জন্য

const app = express();
const PORT = process.env.PORT || 3000;

// JSON বডি পার্স করার জন্য মিডলওয়্যার
app.use(express.json());

// স্ট্যাটিক ফাইল (যেমন index.html) পরিবেশন করার জন্য
app.use(express.static(path.join(__dirname, '/')));

// API অনুরোধ হ্যান্ডেল করার জন্য একটি নিরাপদ এন্ডপয়েন্ট
app.post('/api/generate', async (req, res) => {
    const { userPrompt } = req.body;
    // Render-এর Environment Variable থেকে কী নেওয়া হবে
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'API key not configured on the server.' });
    }
    if (!userPrompt) {
        return res.status(400).json({ error: 'Prompt is required.' });
    }

    const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";
    const fullPrompt = `You are an expert web developer. Your task is to generate a complete, self-contained HTML file based on the user's request. The file must include all necessary HTML, CSS (inside a <style> tag), and JavaScript (inside a <script> tag). Do not include any explanations, comments, or markdown formatting like \`\`\`html. The output must be ONLY the raw HTML code itself, starting with <!DOCTYPE html>. User Request: "${userPrompt}"`;

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

// সার্ভার চালু করার জন্য
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
