export abstract class ToolCall {
  protected content: string | null;
  protected args: any;

  constructor() {
    this.content = null;
  }

  abstract performCall(): Promise<any>;

  static getJsonSchema(): object {
    return {};
  }
}
