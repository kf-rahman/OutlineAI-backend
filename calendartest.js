const express = require('express');
const { google } = require('googleapis');
require('dotenv').config();

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

// Step 1: Authenticate user and get the token
app.get('/auth', (req, res) => {
    console.log('Authentication started.');
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Redirecting to Google OAuth URL:', authUrl);
    res.redirect(authUrl);
});

// Step 2: Handle OAuth2 callback and store the token
app.get('/callback', (req, res) => {
    console.log('Received OAuth callback.');
    const code = req.query.code;
    if (!code) {
        console.error('No authorization code received.');
        return res.status(400).send('No authorization code received.');
    }
    console.log('Authorization code received:', code);

    oAuth2Client.getToken(code, (err, token) => {
        if (err) {
            console.error('Error retrieving access token:', err);
            return res.status(400).send('Error retrieving access token');
        }
        console.log('Access token received:', token);

        // Set the credentials
        oAuth2Client.setCredentials(token);
        tokens = token;  // Store the token for future API calls

        console.log('Tokens stored successfully.');
        res.send('Authentication successful! You can now add events to your calendar.');
    });
});

// Step 3: Add an event to the calendar
app.post('/add-event', async (req, res) => {
    console.log('Attempting to add an event.');

    if (!tokens) {
        console.error('No tokens found. Please authenticate first.');
        return res.status(401).send('Please authenticate first by visiting /auth');
    }

    console.log('Setting OAuth credentials.');
    oAuth2Client.setCredentials(tokens);

    const { summary, description, start, end, timeZone } = req.body;
    console.log('Event details received:', { summary, description, start, end, timeZone });

    if (!summary || !start || !end) {
        console.error('Missing required event details.');
        return res.status(400).json({ error: "Please provide 'summary', 'start', and 'end' in the request body." });
    }

    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    try {
        const event = {
            summary: summary,
            description: description || '',
            start: {
                dateTime: start, // Example: '2024-08-13T09:00:00-07:00'
                timeZone: timeZone || 'America/Los_Angeles',
            },
            end: {
                dateTime: end, // Example: '2024-08-13T10:00:00-07:00'
                timeZone: timeZone || 'America/Los_Angeles',
            },
        };

        console.log('Inserting event into calendar:', event);
        const eventResponse = await calendar.events.insert({
            calendarId: 'primary', // Use 'primary' or the specific calendar ID
            resource: event,
        });

        console.log('Event successfully added:', eventResponse.data);
        res.json(eventResponse.data);
    } catch (error) {
        console.error('Error adding event:', error);
        res.status(500).json({ error: 'Failed to add event to the calendar.' });
    }
});

// Automatically refresh access token when needed
oAuth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
        console.log('Refresh token received:', tokens.refresh_token);
        // Store the refresh token securely
    }
    console.log('Access token refreshed:', tokens.access_token);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
