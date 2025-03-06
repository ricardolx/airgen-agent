import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { getOpenAIClient, OpenAIModels } from "../openai/openai";
import { agentPrompt } from "./prompts/agent";
import { ToolCall } from "./tools";
import { AssetGenerator, generateAssetTool } from "./tools/generateAsset";
import * as logger from "firebase-functions/logger";
import {
  RemoveBackgroundTool,
  removeBackgroundTool,
} from "./tools/removeBackground";

export const invokeAgent = async (prompt: string) => {
  const messages: Array<ChatCompletionMessageParam> = [
    { role: "system", content: agentPrompt },
    { role: "user", content: prompt },
  ];

  return await handleAgent(messages);
};

export const handleAgent = async (
  messages: Array<ChatCompletionMessageParam>,
  base64?: string
): Promise<any> => {
  const openAIClient = getOpenAIClient();
  const response = await openAIClient.chat.completions.create({
    model: OpenAIModels.GPT_4o,
    messages,
    tools: [generateAssetTool, removeBackgroundTool],
  });

  const tools = response.choices[0].message.tool_calls;
  messages.push(response.choices[0].message);

  let toolCall: ToolCall;
  if (tools) {
    for (const tool of tools) {
      const toolName = tool.function.name;
      logger.info("---[ TOOL ]---", toolName);
      if (tool.function.name === AssetGenerator.tool_name) {
        const args = JSON.parse(tool.function.arguments);
        toolCall = new AssetGenerator(args.prompt, args.size);
      } else if (tool.function.name === RemoveBackgroundTool.tool_name) {
        toolCall = new RemoveBackgroundTool(base64!);
      } else {
        break;
      }

      const result = await toolCall.performCall();

      messages.push({
        role: "tool",
        content: result.message,
        tool_call_id: tool.id,
      });

      return await handleAgent(messages, result.content.base64);
    }
  }
  return base64;
};
