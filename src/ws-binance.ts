export interface TradeData {
  e: string;      // Event type
  E: number;      // Event time
  s: string;      // Symbol
  t: number;      // Trade ID
  p: string;      // Price
  q: string;      // Quantity
  T: number;      // Trade time
  m: boolean;     // Is the buyer the market maker?
  M: boolean;     // Ignore
}

class BinanceWebSocketClient {
  private ws: WebSocket | null = null;
  private pingInterval: number | null = null;
  private readonly baseUrl = "wss://stream.binance.com:9443";
  private isConnected = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 5000; // 5 seconds
  private readonly streams = ["btcusdt@trade","ethusdt@trade","usdcusdt@trade"];
  private kv: Deno.Kv | null = null;

  constructor() {
  }

  public async connect(): Promise<void> {
    try {
      this.kv = await Deno.openKv("./trades.db");
      console.log("✅ Deno KV database connected");
    } catch (error) {
      console.error("❌ Failed to connect to Deno KV:", error);
      throw error;
    }

    const url = `${this.baseUrl}/ws`;
    console.log(`Connecting to: ${url}`);

    this.ws = new WebSocket(url);

    this.ws.onopen = this.handleOpen.bind(this);
    this.ws.onmessage = this.handleMessage.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
    this.ws.onerror = this.handleError.bind(this);
  }

  private handleOpen(): void {
    console.log(`Connected to Binance WebSocket`);
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.subscribe(this.streams);
  }

  private handleMessage(event: MessageEvent): void {
    const receivedAt = Date.now();
    try {
      const data = JSON.parse(event.data) as TradeData;
      if (!data.e) {
        console.log("subscribed message", data);
        return;
      }
      this.processTradeData(data, receivedAt).catch(console.error);
    } catch (error) {
      console.error("Error parsing message:", error);
      console.log("Raw message:", event.data);
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket closed: ${event.code} - ${event.reason}`);
    this.isConnected = false;
    this.cleanup();

    // Attempt to reconnect
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectDelay}ms...`);
      setTimeout(() => this.connect(), this.reconnectDelay);
    } else {
      console.log("Max reconnection attempts reached. Please restart manually.");
    }
  }

  private handleError(error: Event): void {
    console.error("WebSocket error:", error);
  }

  private async processTradeData(trade: TradeData, receivedAt: number): Promise<void> {
    // console.log(trade);
    const timestamp = new Date(trade.E).toISOString();
    const price = parseFloat(trade.p);
    const quantity = parseFloat(trade.q);
    const volume = price * quantity;

    // Save to Deno KV database
    this.saveTradeToKV(trade, receivedAt).catch(console.error);

    console.log(`
🔄 Trade Event for ${trade.s}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ Time: ${timestamp}
🆔 Trade ID: ${trade.t}
💰 Price: $${price.toFixed(8)}
📊 Quantity: ${quantity.toFixed(8)}
💵 Volume: $${volume.toFixed(2)}
${trade.m ? '🔴 Market Sell' : '🟢 Market Buy'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
  }

  private async saveTradeToKV(trade: TradeData, receivedAt: number): Promise<void> {
    if (!this.kv) {
      console.error("❌ KV database not initialized");
      return;
    }

    try {
      // Use Trade ID as the key with symbol prefix for better organization
      const key = ["trades", trade.t];

      // Add metadata for easier querying
      const tradeRecord = {
        ...trade,
        receivedAt: receivedAt,
        priceFloat: parseFloat(trade.p),
        quantityFloat: parseFloat(trade.q),
        volumeUSD: parseFloat(trade.p) * parseFloat(trade.q)
      };

      await this.kv.set(key, tradeRecord);

      console.log(`💾 Trade ${trade.t} saved to KV database`);
    } catch (error) {
      console.error("❌ Error saving trade to KV:", error);
    }
  }

  private cleanup(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public disconnect(): void {
    console.log("Disconnecting WebSocket...");
    this.cleanup();

    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }

    this.isConnected = false;
  }

  public isSocketConnected(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  // Method to subscribe to additional streams after connection
  public subscribe(streams: string[]): void {
    if (!this.isSocketConnected()) {
      console.error("WebSocket is not connected");
      return;
    }

    const subscribeMessage = {
      method: "SUBSCRIBE",
      params: streams,
      id: Date.now()
    };

    this.ws!.send(JSON.stringify(subscribeMessage));
    console.log(`Subscribed to streams: ${streams.join(", ")}`);
  }

  // Method to unsubscribe from streams
  public unsubscribe(streams: string[]): void {
    if (!this.isSocketConnected()) {
      console.error("WebSocket is not connected");
      return;
    }

    const unsubscribeMessage = {
      method: "UNSUBSCRIBE",
      params: streams,
      id: Date.now()
    };

    this.ws!.send(JSON.stringify(unsubscribeMessage));
    console.log(`Unsubscribed from streams: ${streams.join(", ")}`);
  }
}

// Example usage
async function main() {
  const client = new BinanceWebSocketClient();

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
  client.connect();

  // Keep the process running
  console.log("🚀 Binance WebSocket client started. Press Ctrl+C to stop.");

  // Keep the process alive
  while (true) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Run the main function
if (import.meta.main) {
  main().catch(console.error);
}

export { BinanceWebSocketClient };