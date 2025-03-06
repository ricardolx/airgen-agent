import { ChatCompletionTool } from "openai/resources/index.mjs";
import { ToolCall } from "../tools";
import { removeBackground } from "@imgly/background-removal-node";
import * as logger from "firebase-functions/logger";
import sharp from "sharp";

export const removeBackgroundTool: ChatCompletionTool = {
  type: "function",
  function: {
    name: "remove_background",
    description:
      "Remove the background from an image. The background should be removed if the image is a logo or an icon.",
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

export class RemoveBackgroundTool extends ToolCall {
  static tool_name = "remove_background";

  constructor(private imageBase64: string) {
    super();
  }

  performCall = async () => {
    logger.info("[ REMOVE BACKGROUND ]", this.imageBase64.substring(0, 10));

    let base64Data = this.imageBase64;

    const imageBuffer = Buffer.from(base64Data, "base64");

    const pngBuffer = await sharp(imageBuffer).png().toBuffer();
    const blob = new Blob([pngBuffer], { type: "image/png" });

    // Remove background
    const resultBlob = await removeBackground(blob);

    // Result is a blob, convert to base64
    const resultArrayBuffer = await resultBlob.arrayBuffer();
    const resultBuffer = Buffer.from(resultArrayBuffer);

    // Trim transparent pixels and convert back to base64
    const trimmedBuffer = await sharp(resultBuffer)
      .ensureAlpha() // Make sure we have an alpha channel
      .trim({
        threshold: 0, // Any pixel with alpha > 0 will be considered non-transparent
        background: { r: 0, g: 0, b: 0, alpha: 0 }, // Ensure transparent background
      })
      .png() // Ensure PNG format to preserve transparency
      .toBuffer();

    return {
      message: "Background has been removed",
      content: { base64: trimmedBuffer.toString("base64"), format: "image/png" },
    };
  };
}
