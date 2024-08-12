const axios = require('axios');
require('dotenv').config();

const testHuggingFaceAPI = async () => {
    try {
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/deepset/roberta-base-squad2',  // Updated to use the deepset/roberta-base-squad2 model
            {
                inputs: {
                    question: "What is the capital of France?",  // Example question
                    context: "France is a country in Europe. The capital of France is Paris."  // Example context
                },
            },
            {
                headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` },
            }
        );

        console.log("API Response:", response.data);
    } catch (error) {
        console.error("Error:", error.response ? error.response.data : error.message);
    }
};

testHuggingFaceAPI();
