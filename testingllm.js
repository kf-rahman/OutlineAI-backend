const axios = require('axios');
require('dotenv').config();

const testHuggingFaceAPI = async (retries = 3) => {
    try {
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/Intel/dynamic_tinybert',
            {
                inputs: {
                    question: "Your job is to assist me in collecting all the important dates in a text. Make sure to " +
                        "extract all assignment due dates, midterm dates, final exam dates, tutorial dates, lab dates, and class dates. Organize your response in " +
                        "the following manner \n" +
                        "    summary: Final Exam,\n" +
                        "    start: {\n" +
                        "        date: 2024-08-11, '\n" +
                        "    },\n" +
                        "    end: {\n" +
                        "        date: 2024-12-01,'\n" +
                        "    },\n" +
                        "}; ",  // Example question
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
                        "L09 Fridays 14:30 – 17:20 L10 Fridays 14:30 – 17:20"
                },
            },
            {
                headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` },
            }
        );

        console.log("API Response:", response.data);
    } catch (error) {
        if (error.response && error.response.data && error.response.data.error === 'Model Intel/dynamic_tinybert is currently loading') {
            const estimatedTime = error.response.data.estimated_time || 20;
            console.log(`Model is currently loading, retrying in ${estimatedTime} seconds...`);

            if (retries > 0) {
                await new Promise(res => setTimeout(res, estimatedTime * 1000));
                return testHuggingFaceAPI(retries - 1);
            } else {
                console.error("Max retries reached. Model is still loading.");
            }
        } else {
            console.error("Error:", error.response ? error.response.data : error.message);
        }
    }
};

testHuggingFaceAPI();
