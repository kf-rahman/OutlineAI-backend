const axios = require('axios');
require('dotenv').config();

const testHuggingFaceAPI = async () => {
    try {
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/deepset/roberta-base-squad2',  // Updated to use the deepset/roberta-base-squad2 model
            {
                inputs: {
                    question: "What are the important dates mentioned?",  // Example question
                    context: "COURSE DESCRIPTION\n" +
                        "Analog and digital electronics; operational amplifier circuits; multistage amplifiers; oscillators;\n" +
                        "analog and digital integrated circuits; data converters; amplifier frequency response; feedback\n" +
                        "and stability; computer aids to analysis and design.\n" +
                        "Three lectures, one tutorial, one lab every other week; first term\n" +
                        "PRE-REQUISITES AND ANTI-REQUISITES\n" +
                        "Prerequisite(s): Registration in any Computer Engineering or Electrical Engineering Program,\n" +
                        "ELECENG 2CJ4 and ELECENG 2EI5 or 2EI4; and ELECENG 2CI5 or 2CI4\n" +
                        "SCHEDULE and MODE OF DELIVERY\n" +
                        "The material for this course will be delivered through a mixture of online videos, textbook\n" +
                        "readings, live lectures, tutorials, and laboratories.\n" +
                        "Lecture: Monday and Thursday, 9:30 – 10:20, and Tuesday, 10:30 – 11:20\n" +
                        "Tutorial: Thursday 11:30 – 12:20\n" +
                        "Lab: The 1st lab starts on Monday, Sept. 11, 2023, from the odd group (i.e., L01, L03 …) and\n" +
                        "every other week.\n" +
                        "L01 Mondays 14:30 – 17:20 L02 Mondays 14:30 – 17:20\n" +
                        "L03 Tuesdays 14:30 – 17:20 L04 Tuesdays 14:30 – 17:20\n" +
                        "L05 Wednesdays 14:30 – 17:20 L06 Wednesdays 14:30 – 17:20\n" +
                        "L07 Thursdays 14:30 – 17:20 L08 Thursdays 14:30 – 17:20\n" +
                        "L09 Fridays 14:30 – 17:20 L10 Fridays 14:30 – 17:20"  // Example context
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
