const express = require('express');
const axios = require('axios');
require('dotenv').config();

const date_question = "Please extract all the important dates that are listed. Format your response in a JSON format";
const { google } = require('googleapis');
const {response} = require("express");
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

// Middleware to parse JSON bodies
app.use(express.json());
// Route to handle question answering

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

    oAuth2Client.getToken(code, async (err, token) => {
        if (err) {
            console.error('Error retrieving access token:', err);
            return res.status(400).send('Error retrieving access token');
        }
        console.log('Access token received:', token);

        // Set the credentials
        oAuth2Client.setCredentials(token);
        tokens = token;  // Store the token for future API calls

        console.log('Tokens stored successfully.');

        // Simulate a context for LLM request (this should normally come from your app or be part of your flow)
        const context = "The event is on 20th August 2024. The deadline for submission is 15th August 2024.";

        try {
            const response = await axios.post(
                'https://api-inference.huggingface.co/models/deepset/roberta-base-squad2',
                {
                    inputs: { question: date_question, context },
                },
                {
                    headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` },
                }
            );

            // Return the answer from the model immediately after authentication
            res.json({
                message: 'Authentication successful! Here is the extracted data from LLM:',
                data: response.data,
            });

        } catch (error) {
            console.error("Error:", error.response ? error.response.data : error.message);
            res.status(500).json({ error: "Failed to get response from Hugging Face API." });
        }
    });
});
oAuth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
        console.log('Refresh token received:', tokens.refresh_token);
    }
    console.log('Access token refreshed:', tokens.access_token);
});
// Default route
app.get('/', (req, res) => {
    res.send('Welcome to the Hugging Face QA API!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});