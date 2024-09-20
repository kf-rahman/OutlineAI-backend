import { google } from 'googleapis';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

let tokens = {};

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API);

export default async function handler(req, res) {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Please provide 'text' in the request body." });
  }

  try {
    const prompt = `Extract all important dates from the following text. Format your response as a JSON array of objects, where each object has a 'date' field (in YYYY-MM-DD format) and a 'description' field. Here's the text:\n\n${text}`;
    const result = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent(prompt);

    let output = result.response.text().replace(/```json\n|```/g, '').trim();

    // Parse the cleaned output as JSON
    let extractedData;
    try {
      extractedData = JSON.parse(output);
    } catch (error) {
      console.error("Failed to parse LLM output as JSON:", output);
      return res.status(500).json({ error: "Failed to parse LLM output as JSON.", output });
    }

    // Ensure tokens are available
    if (!tokens) {
      return res.status(401).send('Please authenticate first by visiting /auth');
    }

    oAuth2Client.setCredentials(tokens);

    // Initialize the Google Calendar API
    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    // Add each extracted date as an event
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

    const createdEvents = await Promise.all(eventPromises);
    res.json({ createdEvents });
  } catch (error) {
    console.error("Error during LLM call or event creation:", error);
    res.status(500).json({ error: "Failed to extract dates or create events." });
  }
}
