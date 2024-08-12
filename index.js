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

app.post('/', async (req, res) => {
    const systemPrompt  = 'you are a historian';
    const userInput = 'can you tell me about the civil war'; // Hard-coded for now, can be dynamic from req.body as well

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

        // Extract the generated text from the response
        const generatedText = response.data.generated_text || response.data[0]?.generated_text;

        res.json({ generatedText });
        console.log(generatedText);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating text');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
