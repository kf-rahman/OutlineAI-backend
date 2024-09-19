import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Configure OAuth2 client with credentials
const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Scopes for accessing Google Calendar
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// In-memory storage for tokens (replace with a database in production)
let tokens = {};

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI("AIzaSyCf2OUI48rhKKeiiBmPEawC_L69fMsBA4w");

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
};

app.get('/auth', (req, res) => {
    console.log('Authentication started.');
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Redirecting to Google OAuth URL:', authUrl);
    res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
    console.log('Received OAuth callback.');
    const code = req.query.code;
    if (!code) {
        console.error('No authorization code received.');
        return res.status(400).send('No authorization code received.');
    }
    console.log('Authorization code received:', code);

    try {
        const { tokens: newTokens } = await oAuth2Client.getToken(code);
        console.log('Access token received:', newTokens);

        oAuth2Client.setCredentials(newTokens);
        tokens = newTokens;

        res.send('Authentication successful! You can now use the /extract-dates and /add-event endpoints.');
    } catch (error) {
        console.error('Error retrieving access token:', error);
        res.status(400).send('Error retrieving access token');
    }
});

app.post('/extract-dates', async (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: "Please provide 'text' in the request body." });
    }

    try {
        const prompt = `Extract all important dates from the following text. Format your response as a JSON array of objects, where each object has a 'date' field (in YYYY-MM-DD format if possible) and a 'description' field. Here's the text:\n\n${text}`;
        const result = await model.generateContent(prompt);
        console.log(result)
        const output = result.response.text();

        // Parse the JSON output

    } catch (error) {
        console.error("Error:", error);
        console.log(text)
        res.status(500).json({ error: "Failed to extract dates from the text." });
    }
});

app.post('/add-event', async (req, res) => {
    console.log('Attempting to add an event.');

    if (!tokens) {
        console.error('No tokens found. Please authenticate first.');
        return res.status(401).send('Please authenticate first by visiting /auth');
    }

    console.log('Setting OAuth credentials.');
    oAuth2Client.setCredentials(tokens);

    const { summary, description, start, end } = req.body;
    console.log('Event details received:', { summary, description, start, end });

    if (!summary || !start || !end) {
        console.error('Missing required event details.');
        return res.status(400).json({ error: "Please provide 'summary', 'start', and 'end' in the request body." });
    }

    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    try {
        const event = {
            summary: summary,
            description: description,
            start: { date: start },
            end: { date: end },
        };

        console.log('Inserting event into calendar:', event);
        const eventResponse = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });

        console.log('Event successfully added:', eventResponse.data);
        res.json(eventResponse.data);
    } catch (error) {
        console.error('Error adding event:', error);
        res.status(500).json({ error: 'Failed to add event to the calendar.' });
    }
});

app.get('/test-llm', async (req, res) => {
    try {
        const result = await model.generateContent("Hello, what's the weather like today?");
        const output = result.response.text();
        res.json({ output });
    } catch (error) {
        console.error("Error in /test-llm:", error);
        res.status(500).json({
            error: "Failed to get response from LLM",
            details: error.message,
            stack: error.stack
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});