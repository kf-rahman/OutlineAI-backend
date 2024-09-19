/*
 * Install the Generative AI SDK
 *
 * $ npm install @google/generative-ai
 */

const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const apiKey = "AIzaSyCf2OUI48rhKKeiiBmPEawC_L69fMsBA4w";
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

async function run() {
  const chatSession = model.startChat({
    generationConfig,
 // safetySettings: Adjust safety settings
 // See https://ai.google.dev/gemini-api/docs/safety-settings
    history: [
      {
        role: "user",
        parts: [

          {text: ''},
        ],
      },
      {
        role: "model",
        parts: [
          {text: "Here are the importaniemardiNov Curves) due.\n* **November 30:** Project due by 11:59 pm ET.\n* **December 2:** T10 (Life Table Methods) due. \n* **December 5:** TBD - Make-up class or exam review session.\n* **December 6:** Last day of classes, T10 due by 12:30 pm, Project peer reviews due.\n* **December 8:** Final exam period begins (December 9-23), final exam TBD. \n\n**Key Notes:**\n\n* All SAS Tutorial exercises are due by 12:30 pm ET on Fridays.\n* All assignments (A1, A2, A3) are due by 11:59 pm ET on Wednesdays. \n* The midterm exam is on October 31 during the regularly scheduled lecture time.\n* The final exam is scheduled sometime between December 9th and December 23rd (exact date to be announced by the Registrar).\n\nRemember: This is a tentative schedule, and changes might occur. It is always best to refer to the course's LEARN page or contact the instructor for the most up-to-date information. \n"},
        ],
      },
    ],
  });



  const outline = ''

  const result = await chatSession.sendMessage(outline);
  console.log(result.response.text());
}

run();