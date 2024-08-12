const axios = require('axios');
require('dotenv').config();

const testHuggingFaceAPI = async () => {
    try {
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/gpt2',  // Replace with your model of choice
            {
                inputs: "Hello, how are you?",
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
