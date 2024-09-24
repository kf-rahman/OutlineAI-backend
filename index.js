import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import { GoogleGenerativeAI } from "@google/generative-ai";
import cors from 'cors';
dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

// Whitelist allowed origins
let whitelist = ["https://out-line-ai-front-l8hh4axxn-kf-rahmans-projects.vercel.app"];
const corsOptions = {
    origin: whitelist
}

// JSON parser for incoming requests
app.use(cors(corsOptions))
app.use(express.json())

const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

let tokens = {};
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.get('/auth', (req, res) => {

    res.set('Access-Control-Allow-Origin', '*');
    res.send({ "msg": "This has CORS enabled " }) ;
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',

        scope: SCOPES,
    });

    res.redirect(authUrl);
});

// OAuth callback route
app.get('/callback', async (req, res) => {
        res.set('Access-Control-Allow-Origin', '*');

    const code = req.query.code;

    if (!code) return res.status(400).send('No authorization code received.');

    try {
        const { tokens: newTokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(newTokens);
        tokens = newTokens;

        // Redirect back to the frontend or automatically trigger the event extraction
        res.redirect(`https://out-line-ai-front-j6hky9lyk-kf-rahmans-projects.vercel.app/?token=${newTokens.access_token}`);
    } catch (error) {
        res.status(400).send('Error retrieving access token');
    }
});

// Middleware to check authentication and auto-redirect if not authenticated
const ensureAuthenticated = (req, res, next) => {
    if (!tokens || !tokens.access_token) {
        // Redirect to authentication flow if not authenticated
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });
        return res.redirect(authUrl);
    }
    next();
};

// Extract and add events endpoint with automatic authentication
app.post('/extract-and-add-events', ensureAuthenticated, async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.send({ "msg": "This has CORS enabled 🎈" });
    console.log(req.body);
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: "Please provide 'text' in the request body." });
    }

    try {
        const prompt = `Extract all important dates from the following text. Format your response as a JSON array of objects, where each object has a 'date' field (in YYYY-MM-DD format if possible) and a 'description' field. Here's the text:\n\n${text}`;
        const result = await model.generateContent(prompt);
        let output = result.response.text();
        console.log(output)
        // Clean up the LLM response
        //output = output.replace(/```json\n|```/g, '').trim();

        // Parse the cleaned output as JSON
        let extractedData;
        try {
            extractedData = JSON.parse(output);
        } catch (error) {
            console.error("Failed to parse LLM output as JSON:", output);
            return res.status(500).json({ error: "Failed to parse LLM output as JSON.", output });
        }

        // Set the OAuth credentials using the tokens
        oAuth2Client.setCredentials(tokens);

        // Initialize the Google Calendar API
        const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

        // Loop through the extracted dates and create events
        const eventPromises = extractedData.map(async (event) => {
            const eventDetails = {
                summary: event.description,
                description: event.description,
                start: { date: event.date },
                end: { date: event.date },
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
        // If no content, send an empty JSON
        res.status(200).json({});

        res.status(500).json({ error: "Failed to extract dates or create events." });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
