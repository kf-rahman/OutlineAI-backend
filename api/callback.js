import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

let tokens = {};

export default async function handler(req, res) {
  const code = req.query.code;
  if (!code) return res.status(400).send('No authorization code received.');

  try {
    const { tokens: newTokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(newTokens);
    tokens = newTokens;

    // Redirect to the frontend after authentication
    res.redirect('https://your-frontend-url.vercel.app');
  } catch (error) {
    res.status(400).send('Error retrieving access token');
  }
}
