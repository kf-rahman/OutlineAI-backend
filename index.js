import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { google } from 'googleapis';
 // Fix CORS import
import { GoogleGenerativeAI } from "@google/generative-ai";
import cors from 'cors';
dotenv.config();
  // Initialize app before using it
const PORT = process.env.PORT || 3000;


const app = express();


let whitelist = ["https://out-line-ai-front-gx7yr8tpc-kf-rahmans-projects.vercel.app/"]
//add dev env variable to test locally
const corsOptions = {
    origin: whitelist
}
app.use(cors(corsOptions))
app.use(express.json()) // for parsing application/json



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
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
};

// OAuth authentication routes
app.get('/auth', (req, res) => {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    res.redirect(authUrl);
});
app.get('/', async (req, res) => {
   res.send('hello') ;
});

app.get('/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.status(400).send('No authorization code received.');

    try {
        const { tokens: newTokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(newTokens);
        tokens = newTokens;
        res.redirect("https://out-line-ai-front-end.vercel.app/");
        res.send('Authentication successful! You can now use the /extract-dates and /add-event endpoints.');
    } catch (error) {
        res.status(400).send('Error retrieving access token');
    }
});

// Endpoint to extract important dates from text
app.post('/extract-and-add-events', async (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: "Please provide 'text' in the request body." });
    }

    try {
        const prompt = `Extract all important dates from the following text. Format your response as a JSON array of objects, where each object has a 'date' field (in YYYY-MM-DD format if possible) and a 'description' field. Here's the text:\n\n${text}`;
        const result = await model.generateContent(prompt);
        let output = result.response.text();

        // Clean up the LLM response
        output = output.replace(/```json\n|```/g, '').trim();

        // Parse the cleaned output as JSON
        let extractedData;
        try {
            extractedData = JSON.parse(output);
        } catch (error) {
            console.error("Failed to parse LLM output as JSON:", output);
            return res.status(500).json({ error: "Failed to parse LLM output as JSON.", output });
        }

        // Check for valid tokens
        if (!tokens) {
            return res.status(401).send('Please authenticate first by visiting /auth');
        }

        // Set the OAuth credentials
        oAuth2Client.setCredentials(tokens);

        // Initialize the Google Calendar API
        const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

        // Loop through the extracted dates and create events
        const eventPromises = extractedData.map(async (event) => {
            const eventDetails = {
                summary: event.description,
                description: event.description,
                start: { date: event.date }, // All-day event with just a date
                end: { date: event.date },   // Google Calendar API requires a start and end date
            };

            try {
                const eventResponse = await calendar.events.insert({
                    calendarId: 'primary',
                    resource: eventDetails,
                });
                return eventResponse.data;
            } catch (error) {
                console.error("Error adding event:", error);
                return { error: 'Failed to add event to the calendar', event: eventDetails };
            }
        });

        // Wait for all events to be created
        const createdEvents = await Promise.all(eventPromises);

        // Return the list of created events
        res.json({ createdEvents });
    } catch (error) {
        console.error("Error during LLM call or event creation:", error);
        res.status(500).json({ error: "Failed to extract dates or create events." });
    }
});


// Endpoint to add event to the user's Google Calendar
app.post('/add-event', async (req, res) => {
    if (!tokens) return res.status(401).send('Please authenticate first by visiting /auth');

    const { summary, description, start, end } = req.body;
    if (!summary || !start || !end) {
        return res.status(400).json({ error: "Please provide 'summary', 'start', and 'end' in the request body." });
    }

    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    try {
        const event = {
            summary,
            description,
            start: { dateTime: start },
            end: { dateTime: end },
        };

        const eventResponse = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });

        res.json(eventResponse.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add event to the calendar.' });
    }
});

// Testing endpoint for LLM
app.get('/test-llm', async (req, res) => {
    try {
        const result = await model.generateContent("What are the most important dates");
        const output = result.response.text();
        res.json({ output });
    } catch (error) {
        res.status(500).json({ error: "Failed to get response from LLM" });
    }
});
app.post('/test-llm', async (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: "Please provide 'text' in the request body." });
    }

    try {
        const prompt = `Extract all important dates from the following text. Format your response as a JSON array of objects, where each object has a 'date' field (in YYYY-MM-DD format if possible) and a 'description' field. Here's the text:\n\n${text}`;

        const result = await model.generateContent(prompt);

        // Log the raw response for debugging
        const output = result.response.text();
        console.log('LLM Raw Response:', output);

        // Return the raw LLM response
        res.json({ output });
    } catch (error) {
        console.error("Error during LLM call:", error);
        res.status(500).json({ error: "Failed to get response from LLM." });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
