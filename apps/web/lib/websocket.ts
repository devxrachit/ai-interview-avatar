const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

type MessageHandler = (msg: Record<string, unknown>) => void;

export class InterviewWebSocket {
  private ws: WebSocket | null = null;
  private sessionId: string;
  private token: string;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnects = 5;

  constructor(sessionId: string, token: string) {
    this.sessionId = sessionId;
    this.token = token;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `${WS_BASE}/ws/${this.sessionId}?token=${this.token}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onerror = (e) => reject(e);

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const handlers = this.handlers.get(msg.type) || [];
          handlers.forEach((h) => h(msg));
          const allHandlers = this.handlers.get("*") || [];
          allHandlers.forEach((h) => h(msg));
        } catch {}
      };

      this.ws.onclose = () => {
        if (this.reconnectAttempts < this.maxReconnects) {
          this.reconnectAttempts++;
          setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
        }
      };
    });
  }

  on(type: string, handler: MessageHandler) {
    if (!this.handlers.has(type)) this.handlers.set(type, []);
    this.handlers.get(type)!.push(handler);
    return () => this.off(type, handler);
  }

  off(type: string, handler: MessageHandler) {
    const list = this.handlers.get(type) || [];
    this.handlers.set(type, list.filter((h) => h !== handler));
  }

  send(msg: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  sendReady() { this.send({ type: "ready" }); }
  sendTextAnswer(questionId: string, text: string, code?: string) {
    this.send({ type: "text_answer", question_id: questionId, text, code });
  }
  sendNextQuestion() { this.send({ type: "next_question" }); }
  sendEndSession() { this.send({ type: "end_session" }); }

  disconnect() {
    this.maxReconnects = 0;
    this.ws?.close();
  }
}
