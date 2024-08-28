import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI("AIzaSyCf2OUI48rhKKeiiBmPEawC_L69fMsBA4w");
// Converts local file information to a GoogleGenerativeAI.Part object.
function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType
    },
  };
}

// Turn images to Part objects
const filePart1 = fileToGenerativePart("test-outline1.pdf", "")
async function run() {
  // Choose a Gemini model.
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  const prompt = "Please give me all the most important dates";

  const imageParts = [
    filePart1

  ];

  const generatedContent = await model.generateContent([prompt, ...imageParts]);

  console.log(generatedContent.response.text());
}

run();
