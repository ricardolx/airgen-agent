export abstract class ToolCall {
  abstract performCall(): Promise<{ message: string; content: any }>;
}
