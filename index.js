const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Route to handle question answering
app.post('/answer', async (req, res) => {
    const { question, context } = req.body;

    if (!question || !context) {
        return res.status(400).json({ error: "Please provide both 'question' and 'context' in the request body." });
    }

    try {
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/deepset/roberta-base-squad2',
            {
                inputs: { question, context },
            },
            {
                headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` },
            }
        );

        // Return the answer from the model
        res.json(response.data);
        console.log(response.data);
    } catch (error) {
        console.error("Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Failed to get response from Hugging Face API." });
    }
});

// Default route
app.get('/', (req, res) => {
    res.send('Welcome to the Hugging Face QA API!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
