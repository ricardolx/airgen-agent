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
import { ConvertToVectorTool, convertToVectorTool } from "./tools/pngToVector";
import { ChatCompletionMessage } from "openai/src/resources/index.js";

export const invokeAgent = async (prompt: string) => {
  const messages: Array<ChatCompletionMessageParam> = [
    { role: "system", content: agentPrompt },
    { role: "user", content: prompt },
  ];

  return await handleAgent(messages);
};

export const handleAgent = async (
  messages: Array<ChatCompletionMessageParam>,
  base64?: string,
  format?: string
): Promise<{ base64: string; format: string }> => {
  const responseMessage = await callLlm(messages);
  messages.push(responseMessage);

  const tools = responseMessage.tool_calls;

  let toolCall: ToolCall;

  if (tools) {
    for (const tool of tools) {
      const toolName = tool.function.name;
      logger.info("---[ TOOL 🔨 ]---", toolName);

      if (tool.function.name === AssetGenerator.tool_name && !base64) {
        const args = JSON.parse(tool.function.arguments);
        toolCall = new AssetGenerator(args.prompt, args.size);
      } else if (tool.function.name === RemoveBackgroundTool.tool_name) {
        toolCall = new RemoveBackgroundTool(base64!);
      } else if (tool.function.name === ConvertToVectorTool.tool_name) {
        toolCall = new ConvertToVectorTool(base64!);
      } else {
        messages.push({
          role: "tool",
          content: "No tool call found",
          tool_call_id: tool.id,
        });
        continue;
      }

      const result = await toolCall.performCall();

      console.log("[ Result ]", {
        b64: result.content.base64.substring(0, 10),
        format: result.content.format,
      });

      base64 = result.content.base64;
      format = result.content.format;

      console.log("[ New Format ]", format);

      messages.push({
        role: "tool",
        content: result.message,
        tool_call_id: tool.id,
      });
    }
    return await handleAgent(messages, base64, format);
  }
  return { base64: base64 || "", format: format || "" };
};

export const callLlm = async (
  messages: Array<ChatCompletionMessageParam>
): Promise<ChatCompletionMessage> => {
  const openAIClient = getOpenAIClient();
  const response = await openAIClient.chat.completions.create({
    model: OpenAIModels.GPT_4o_MINI,
    messages,
    tools: [generateAssetTool, removeBackgroundTool, convertToVectorTool],
  });

  console.log("[ Response Usage ]", response.usage);

  const tools = response.choices[0].message.tool_calls;
  if (tools) {
    console.log(
      "[ Response with Tools ]",
      tools.map(tool => tool.function.name).join(", ")
    );
  }

  return response.choices[0].message;
};
