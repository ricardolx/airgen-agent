import { ChatCompletionTool } from "openai/resources/index.mjs";
import { ToolCall } from "../tools";
import { getOpenAIClient } from "../../openai/openai";

export const generateAssetTool: ChatCompletionTool = {
  type: "function",
  function: {
    name: "generate_asset",
    description:
      "Generate an asset image in webp format for a software project",
    parameters: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "The prompt to generate the asset",
        },
      },
    },
  },
};

export class AssetGenerator extends ToolCall {
  static tool_name = "generate_asset";
  constructor(private prompt: string) {
    super();
  }

  performCall = async () => {
    const openAIClient = getOpenAIClient();
    const response = await openAIClient.images.generate({
      prompt: this.prompt,
      n: 1,
      quality: "hd",
      response_format: "b64_json",
      size: "1024x1024",
    });

    return response.data[0].b64_json;
  };
  static getJsonSchema(): object {
    return generateAssetTool;
  }
}
