import { ChatCompletionTool } from "openai/resources/index.mjs";
import { ToolCall } from "../tools";
import { getOpenAIClient } from "../../openai/openai";
import { designerPrompt } from "../prompts/designer";
import * as logger from "firebase-functions/logger";

export const generateAssetTool: ChatCompletionTool = {
  type: "function",
  function: {
    name: "generate_asset",
    description:
      "Generate an asset image in webp format for a software project. Most assets should be a square image, but banners and thumbnails can be landscape or portrait.",
    parameters: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description:
            "Provide an extremely detailed prompt to generate the asset",
        },
        size: {
          type: "string",
          description:
            "The size of the asset: either '1024x1024' | '1792x1024' | '1024x1792'",
        },
      },
    },
  },
};

export class AssetGenerator extends ToolCall {
  static tool_name = "generate_asset";
  constructor(private prompt: string, private size: string) {
    super();
  }

  performCall = async () => {
    logger.info("[ Asset Generator ]", this.prompt, this.size);

    const openAIClient = getOpenAIClient();
    const response = await openAIClient.images.generate({
      model: "dall-e-3",
      prompt: designerPrompt + "\n" + this.prompt,
      n: 1,
      quality: "hd",
      response_format: "b64_json",
      size: this.size as any,
    });

    return {
      message: "A base image has been generated",
      content: {
        base64: response.data[0].b64_json,
        format: "image/webp",
      },
    };
  };
}
