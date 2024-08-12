const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Get the API key from the environment variables
const API_KEY = process.env.GOOGLE_API_KEY;

// Route to fetch events from your public calendar
app.get('/public-calendar-events', async (req, res) => {
    const calendarId = 'b8ab0e5c431dbd0f7799b4af682e2047e71c42b9a912903a0c115920178b354a@group.calendar.google.com';

    try {
        const response = await axios.get(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
            {
                params: {
                    key: API_KEY,
                    timeMin: new Date().toISOString(), // Fetch events from the current date/time
                    singleEvents: true,
                    orderBy: 'startTime',
                },
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching public calendar events:', error);
        res.status(500).json({ error: 'Failed to fetch events from the public calendar.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
