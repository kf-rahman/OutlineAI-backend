const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Root route
app.get('/', (req, res) => {
    res.send('Welcome to the LLM API!');
});

app.post('/generate-text', async (req, res) => {
    const { systemPrompt, userInput } = req.body;

    try {
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/gpt2',  // Replace with your model of choice
            {
                inputs: `${systemPrompt}\n${userInput}`,
            },
            {
                headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` },
            }
        );

        res.json({ generatedText: response.data });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating text');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});