import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { getOpenAIClient, OpenAIModels } from "../openai/openai";
import { agentPrompt } from "./prompts/agent";
import { ToolCall } from "./tools";
import { AssetGenerator, generateAssetTool } from "./tools/generateAsset";
import * as logger from "firebase-functions/logger";

export const invokeAgent = async (prompt: string) => {
  const messages: Array<ChatCompletionMessageParam> = [
    { role: "system", content: agentPrompt },
    { role: "user", content: prompt },
  ];

  return await handleAgent(messages);
};

export const handleAgent = async (
  messages: Array<ChatCompletionMessageParam>
) => {
  logger.info("[ HANDLE AGENT ]", { messages });
  const openAIClient = getOpenAIClient();
  const response = await openAIClient.chat.completions.create({
    model: OpenAIModels.GPT_4o,
    messages,
    tools: [generateAssetTool],
  });

  logger.info("[ Agent Response ]", { response });

  const tools = response.choices[0].message.tool_calls;
  messages.push(response.choices[0].message);

  let toolCall: ToolCall;
  if (tools) {
    for (const tool of tools) {
      messages.push({
        role: "assistant",
        content: JSON.stringify(tool),
      });

      if (tool.function.name === "generate_asset") {
        toolCall = new AssetGenerator(tool.function.arguments);
      } else {
        break;
      }

      const result = await toolCall.performCall();

      messages.push({
        role: "tool",
        content: JSON.stringify(result),
        tool_call_id: tool.id,
      });

      return result;
    }
  }
};
