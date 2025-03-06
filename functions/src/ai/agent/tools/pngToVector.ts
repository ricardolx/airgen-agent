import { ChatCompletionTool } from "openai/resources/index.mjs";
import { ToolCall } from "../tools";
import * as logger from "firebase-functions/logger";
import sharp from "sharp";
import * as potrace from "potrace";

export const convertToVectorTool: ChatCompletionTool = {
  type: "function",
  function: {
    name: "convert_to_vector",
    description:
      "Convert an image to a vector. The image should be a vectorizable image.",
    parameters: {
      type: "object",
      properties: {
        imageBase64: {
          type: "string",
          description: "The base64 encoded string",
        },
      },
    },
  },
};

export class ConvertToVectorTool extends ToolCall {
  static tool_name = "convert_to_vector";

  constructor(private imageBase64: string) {
    super();
  }

  performCall = async () => {
    logger.info("[ CONVERT TO VECTOR ]", this.imageBase64.substring(0, 10));

    const result = await convertToVector(this.imageBase64);

    return {
      message: "Image has been converted to a vector",
      content: { base64: result, format: "image/svg+xml" },
    };
  };
}

async function convertToVector(base64Image: string): Promise<string> {
  try {
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Image, "base64");

    // Convert to black and white bitmap using sharp
    const bwBuffer = await sharp(imageBuffer).grayscale().toBuffer();

    // Convert to SVG using potrace
    const svg = await new Promise<string>((resolve, reject) => {
      potrace.trace(bwBuffer, (err, svg) => {
        if (err) reject(err);
        else resolve(svg);
      });
    });

    // Return SVG as base64
    return Buffer.from(svg).toString("base64");
  } catch (error) {
    logger.error("Error converting to vector:", error);
    throw new Error("Failed to convert image to vector");
  }
}
