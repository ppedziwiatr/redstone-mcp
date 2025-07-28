class WebSocketStreamClient {
  private url: string;
  private headers: HeadersInit;
  private wss: WebSocketStream | null = null;
  private reader: ReadableStreamDefaultReader<string | Uint8Array<ArrayBuffer>> | null = null;
  private writer: WritableStreamDefaultWriter<string | Uint8Array<ArrayBuffer>> | null = null;
  private shouldReconnect = true;
  private reconnectDelay = 5000;

  constructor() {
    this.url = "wss://data.lo.tech/ws/v1/binance";
    this.headers = {
      "X-API-KEY": "",
    };
  }

  async connect() {
    try {
      this.wss = new WebSocketStream(this.url, {
        headers: this.headers,
      });

      const { readable, writable } = await this.wss.opened;
      console.log("WebSocket connected");

      this.reader = readable.getReader();
      this.writer = writable.getWriter();

      // Start reading messages
      this.readLoop();

      // Monitor connection closure
      this.wss.closed.then(() => {
        console.log("WebSocket closed normally");
        this.handleDisconnect();
      }).catch((error) => {
        console.error("WebSocket error:", error);
        this.handleDisconnect();
      });
    } catch (error) {
      console.error("Failed to connect:", error);
      this.scheduleReconnect();
    }
  }

  private async readLoop() {
    if (!this.reader) { return; }

    try {
      while (true) {
        const { value, done } = await this.reader.read();
        if (done) { break; }

        this.onMessage(value);
      }
    } catch (error) {
      console.error("Read error:", error);
    }
  }

  private onMessage(data: string | Uint8Array<ArrayBuffer>) {
    console.log("Received:", data);

    // Process your messages here
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        // Handle different message types
        console.log("Parsed:", parsed);
      } catch (e) {
        console.log("Non-JSON message:", data);
      }
    }
  }

  async send(data: string | Uint8Array<ArrayBuffer>) {
    if (!this.writer) {
      console.error("Not connected");
      return;
    }

    try {
      await this.writer.write(data);
    } catch (error) {
      console.error("Send error:", error);
    }
  }

  private handleDisconnect() {
    this.reader = null;
    this.writer = null;
    this.wss = null;

    if (this.shouldReconnect) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    console.log(`Reconnecting in ${this.reconnectDelay / 1000} seconds...`);
    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect();
      }
    }, this.reconnectDelay);
  }

  async disconnect() {
    this.shouldReconnect = false;

    if (this.writer) {
      await this.writer.close();
    }

    if (this.wss) {
      this.wss.close();
    }
  }

  async subscribe() {
    await this.send(JSON.stringify(
      { "op": "SUBSCRIBE", "topics": [{ "type": "TOP_OF_BOOK", "symbol": "BTC-USDT:SPOT" }] },
    ));
  }
}

// Example usage
async function mainWs() {
  const client = new WebSocketStreamClient();

  // Handle graceful shutdown
  const handleShutdown = () => {
    console.log("\n🛑 Shutting down gracefully...");
    client.disconnect();
    Deno.exit(0);
  };

  // Listen for interrupt signals
  Deno.addSignalListener("SIGINT", handleShutdown);
  Deno.addSignalListener("SIGTERM", handleShutdown);

  // Connect to the WebSocket
  await client.connect();
  await client.subscribe();

  console.log("🚀 Binance Experimental WebSocket client started. Press Ctrl+C to stop.");
}

// Run the main function
if (import.meta.main) {
  mainWs().catch(console.error);
}
