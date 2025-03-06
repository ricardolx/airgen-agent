import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";
import { invokeAgent } from "./ai/agent/agent";

const openAiApiKey = defineSecret("OPENAI_API_KEY");

console.log("[ OpenAI API Key ]", { openAiApiKey: openAiApiKey });

export const generateImage = onRequest(
  { secrets: [openAiApiKey] },
  async (request, response) => {
    try {
      const { prompt } = request.body;
      console.log(request.body);

      if (!prompt) {
        response.status(400).send({ error: "Prompt is required" });
        return;
      }

      const result = await invokeAgent(prompt);

      // Convert base64 to binary buffer and send as image
      const imageBuffer = Buffer.from(result.base64, "base64");
      response.setHeader("Content-Type", result.format);
      response.send(imageBuffer);
    } catch (error) {
      logger.error("Error generating image:", error);
      response.status(500).send({ error: "Failed to generate image" });
    }
  }
);
