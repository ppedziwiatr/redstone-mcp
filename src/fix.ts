import "@std/dotenv/load";
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";
import { encode as base64Encode } from "https://deno.land/std@0.208.0/encoding/base64.ts";
import { mainWs } from "./ws-binance.ts";

interface FIXConfig {
  apiKey: string;
  privateKeyPath: string;
  senderCompID: string;
  targetCompID: string;
  heartbeatInterval: number;
}

interface TradeMessage {
  symbol: string;
  tradeId: string;
  price: string;
  quantity: string;
  time: string;
  isBuyerMaker: boolean;
}

class BinanceFIXClient {
  private socket?: Deno.TlsConn;
  private msgSeqNum = 1;
  private config: FIXConfig;
  private privateKey?: CryptoKey;
  private subscriptions = new Map<string, string>();
  private SOH = String.fromCharCode(1);
  private kv: Deno.Kv | null = null;

  constructor(config: FIXConfig) {
    this.config = config;
  }

  // Load Ed25519 private key from PEM file
  private async loadPrivateKey(): Promise<void> {
    const pemContent = await Deno.readTextFile(this.config.privateKeyPath);

    // Extract the base64 content from PEM
    const base64Key = pemContent
      .replace(/-----BEGIN PRIVATE KEY-----/, "")
      .replace(/-----END PRIVATE KEY-----/, "")
      .replace(/\s/g, "");

    const keyData = base64Decode(base64Key);

    // Import the Ed25519 private key
    this.privateKey = await crypto.subtle.importKey(
      "pkcs8",
      keyData,
      {
        name: "Ed25519",
        namedCurve: "Ed25519",
      },
      false,
      ["sign"],
    );
  }

  // Calculate FIX checksum
  private calculateChecksum(message: string): string {
    let sum = 0;
    for (let i = 0; i < message.length; i++) {
      sum += message.charCodeAt(i);
    }
    const checksum = (sum % 256).toString();
    return checksum.padStart(3, "0");
  }

  // Build FIX message
  private buildMessage(msgType: string, fields: Array<[number, string]>): string {
    // Header fields (excluding 8 and 9)
    const header = [
      [35, msgType],
      [34, this.msgSeqNum.toString()],
      [49, this.config.senderCompID],
      [52, this.getUTCTimestamp()],
      [56, this.config.targetCompID],
    ];

    // Combine header and body fields
    const allFields = [...header, ...fields];

    // Build the message body (everything after tag 9)
    const bodyParts = allFields.map(([tag, value]) => `${tag}=${value}`);
    const body = bodyParts.join(this.SOH);

    // Calculate body length (in bytes, not characters)
    const bodyBytes = new TextEncoder().encode(body + this.SOH);
    const bodyLength = bodyBytes.length;

    // Build the complete message without checksum
    const messageWithoutChecksum =
      `8=FIX.4.4${this.SOH}9=${bodyLength}${this.SOH}${body}${this.SOH}`;

    // Calculate checksum
    const checksum = this.calculateChecksum(messageWithoutChecksum);

    // Build final message
    const finalMessage = `${messageWithoutChecksum}10=${checksum}${this.SOH}`;

    this.msgSeqNum++;
    return finalMessage;
  }

  // Generate UTC timestamp in FIX format
  private getUTCTimestamp(): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = (now.getUTCMonth() + 1).toString().padStart(2, "0");
    const day = now.getUTCDate().toString().padStart(2, "0");
    const hours = now.getUTCHours().toString().padStart(2, "0");
    const minutes = now.getUTCMinutes().toString().padStart(2, "0");
    const seconds = now.getUTCSeconds().toString().padStart(2, "0");
    const millis = now.getUTCMilliseconds().toString().padStart(3, "0");

    return `${year}${month}${day}-${hours}:${minutes}:${seconds}.${millis}`;
  }

  // Sign logon message with consistent timestamp
  private async signLogonMessage(sendingTime: string): Promise<string> {
    if (!this.privateKey) {
      throw new Error("Private key not loaded");
    }

    const msgType = "A";
    const senderCompId = this.config.senderCompID;
    const targetCompId = this.config.targetCompID;
    const msgSeqNum = this.msgSeqNum.toString();

    // Build signature payload
    const payload = [
      msgType,
      senderCompId,
      targetCompId,
      msgSeqNum,
      sendingTime,
    ].join(this.SOH);

    // Sign the payload
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const signature = await crypto.subtle.sign("Ed25519", this.privateKey, data);

    // Base64 encode the signature
    return base64Encode(new Uint8Array(signature));
  }

  // Connect to Binance FIX Market Data endpoint
  async connect(): Promise<void> {
    try {
      this.kv = await Deno.openKv("./trades-fix.db");
      console.log("✅ Deno KV database connected");
    } catch (error) {
      console.error("❌ Failed to connect to Deno KV:", error);
      throw error;
    }

    await this.loadPrivateKey();

    console.log("Connecting to Binance FIX Market Data...");

    // Connect with TLS
    this.socket = await Deno.connectTls({
      hostname: "fix-md.binance.com",
      port: 9000,
    });

    console.log("Connected, sending logon...");

    // Send logon message
    await this.sendLogon();

    // Start reading messages
    this.readMessages();

    // Start heartbeat
    this.startHeartbeat();
  }

  // Send logon message
  private async sendLogon(): Promise<void> {
    const sendingTime = this.getUTCTimestamp();
    const signature = await this.signLogonMessage(sendingTime);

    const fields: Array<[number, string]> = [
      [95, signature.length.toString()], // RawDataLength
      [96, signature], // RawData (signature)
      [98, "0"], // EncryptMethod
      [108, this.config.heartbeatInterval.toString()], // HeartBtInt
      [141, "Y"], // ResetSeqNumFlag
      [553, this.config.apiKey], // Username (API key)
      [25035, "1"], // MessageHandling (UNORDERED)
    ];

    // We need to manually build the logon message to ensure sending time consistency
    const header = [
      [35, "A"],
      [34, this.msgSeqNum.toString()],
      [49, this.config.senderCompID],
      [52, sendingTime], // Use the same sending time that was signed
      [56, this.config.targetCompID],
    ];

    const allFields = [...header, ...fields];
    const bodyParts = allFields.map(([tag, value]) => `${tag}=${value}`);
    const body = bodyParts.join(this.SOH);

    const bodyBytes = new TextEncoder().encode(body + this.SOH);
    const bodyLength = bodyBytes.length;

    const messageWithoutChecksum =
      `8=FIX.4.4${this.SOH}9=${bodyLength}${this.SOH}${body}${this.SOH}`;
    const checksum = this.calculateChecksum(messageWithoutChecksum);
    const finalMessage = `${messageWithoutChecksum}10=${checksum}${this.SOH}`;

    this.msgSeqNum++;
    await this.sendMessage(finalMessage);
  }

  // Send message to socket
  private async sendMessage(message: string): Promise<void> {
    if (!this.socket) {
      throw new Error("Not connected");
    }

    const encoder = new TextEncoder();
    await this.socket.write(encoder.encode(message));
    console.log(`Sent: ${this.prettyPrintFIX(message)}`);
  }

  // Parse FIX message
  private parseMessage(message: string): Map<number, string> {
    const fields = new Map<number, string>();
    const parts = message.split(this.SOH);

    for (const part of parts) {
      if (part.includes("=")) {
        const [tag, value] = part.split("=");
        fields.set(parseInt(tag!), value!);
      }
    }

    return fields;
  }

  // Pretty print FIX message for debugging
  private prettyPrintFIX(message: string): string {
    return message.replace(new RegExp(this.SOH, "g"), "|");
  }

  // Read messages from socket
  // Read messages from socket
  private async readMessages(): Promise<void> {
    if (!this.socket) { return; }

    const buffer = new Uint8Array(65536);
    let accumulated = "";

    try {
      while (true) {
        const n = await this.socket.read(buffer);
        if (n === null) { break; }

        const decoder = new TextDecoder();
        accumulated += decoder.decode(buffer.subarray(0, n));

        // Process complete messages
        while (true) {
          // Find the end of a FIX message (checksum field)
          const checksumPattern = "10=";
          const checksumIndex = accumulated.indexOf(checksumPattern);

          if (checksumIndex === -1) { break; }

          // Find the SOH after the checksum
          const sohAfterChecksum = accumulated.indexOf(this.SOH, checksumIndex + 3);

          if (sohAfterChecksum === -1) { break; }

          // Extract the complete message
          const message = accumulated.substring(0, sohAfterChecksum + 1);
          accumulated = accumulated.substring(sohAfterChecksum + 1);

          // Handle the message
          await this.handleMessage(message);
        }
      }
    } catch (error) {
      console.error("Error reading messages:", error);
    }
  }

  private async handleMessage(message: string): Promise<void> {
    console.log(`Received: ${this.prettyPrintFIX(message)}`);
    const receivedAt = Date.now();

    const fields = this.parseMessage(message);
    const msgType = fields.get(35);

    switch (msgType) {
      case "A": { // Logon response
        console.log("Logon successful!");
        // Subscribe to trade streams after successful logon
        await this.subscribeToTrades();
        break;
      }

      case "0": { // Heartbeat
        const testReqID = fields.get(112);
        if (testReqID) {
          // Respond to TestRequest with Heartbeat
          await this.sendHeartbeat(testReqID);
        }
        break;
      }

      case "1": { // TestRequest
        const reqID = fields.get(112);
        if (reqID) {
          await this.sendHeartbeat(reqID);
        }
        break;
      }

      case "3": { // Reject
        console.error("Message rejected:", fields.get(58));
        break;
      }

      case "5": { // Logout
        console.log("Logout received:", fields.get(58));
        break;
      }

      case "W": { // MarketDataSnapshot
        console.log("Market data snapshot received");
        break;
      }

      case "X": { // MarketDataIncrementalRefresh
        this.handleTradeUpdate(message, receivedAt);
        break;
      }

      case "Y": { // MarketDataRequestReject
        console.error("Market data request rejected:", fields.get(58));
        break;
      }
    }
  }

  // Subscribe to trade streams for specified symbols
  private async subscribeToTrades(): Promise<void> {
    // const symbols = ["ETHUSDT", "BTCUSDT", "USDCUSDT"];
    const symbols = ["ETHUSDT"];

    for (const symbol of symbols) {
      const mdReqID = `TRADE_${symbol}_${Date.now()}`;
      this.subscriptions.set(symbol, mdReqID);

      const fields: Array<[number, string]> = [
        [262, mdReqID], // MDReqID
        [263, "1"], // SubscriptionRequestType (SUBSCRIBE)
        [264, "1"], // MarketDepth
        [266, "Y"], // AggregatedBook
        [146, "1"], // NoRelatedSym
        [55, symbol], // Symbol
        [267, "1"], // NoMDEntryTypes
        [269, "2"], // MDEntryType (TRADE)
      ];

      const msg = this.buildMessage("V", fields);
      await this.sendMessage(msg);

      console.log(`Subscribed to trades for ${symbol}`);
    }
  }

  // Handle trade updates from MarketDataIncrementalRefresh
  private handleTradeUpdate(message: string, receivedAt: number): void {
    const fields = this.parseMessage(message);
    const mdReqID = fields.get(262);
    const numEntries = parseInt(fields.get(268) || "0");

    if (numEntries === 0) return;

    // Find which symbol this update is for
    let symbol = "";
    for (const [sym, reqId] of this.subscriptions) {
      if (reqId === mdReqID) {
        symbol = sym;
        break;
      }
    }

    if (!symbol) return;

    // Parse the repeating group entries
    const entries = this.parseRepeatingGroup(message, 268);

    for (const entry of entries) {
      const mdEntryType = entry.get(269);

      if (mdEntryType === "2") { // TRADE
        // Symbol might be specified per entry or inherited from subscription
        const entrySymbol = entry.get(55) || symbol;

        const trade: TradeMessage = {
          symbol: entrySymbol,
          tradeId: entry.get(1003) || "",
          price: entry.get(270) || "",
          quantity: entry.get(271) || "",
          time: entry.get(60) || "",
          isBuyerMaker: entry.get(54) === "1",
        };
        this.saveTradeToKV(trade, receivedAt).catch(console.error);

        console.log(`Trade: ${trade.symbol} - Price: ${trade.price}, Qty: ${trade.quantity}, Time: ${trade.time}, ID: ${trade.tradeId}`);
      }
    }
  }

// Parse repeating group from FIX message
  private parseRepeatingGroup(message: string, countTag: number): Array<Map<number, string>> {
    const parts = message.split(this.SOH);
    const entries: Array<Map<number, string>> = [];

    // Find the count field
    let countIndex = -1;
    let count = 0;

    for (let i = 0; i < parts.length; i++) {
      if (parts[i]!.startsWith(`${countTag}=`)) {
        count = parseInt(parts[i]!.split('=')[1]!);
        countIndex = i;
        break;
      }
    }

    if (count === 0 || countIndex === -1) return entries;

    // Define the repeating group structure for MarketDataIncrementalRefresh
    // First field of each entry is 279 (MDUpdateAction)
    const repeatingGroupStartTag = 279;

    // Parse each entry in the repeating group
    let currentEntry = new Map<number, string>();
    let entryCount = 0;
    let inRepeatingGroup = false;

    for (let i = countIndex + 1; i < parts.length; i++) {
      const part = parts[i]!;
      if (!part.includes('=')) continue;

      const [tagStr, value] = part.split('=', 2);
      const tag = parseInt(tagStr!);

      // Check if this is the start of a new entry
      if (tag === repeatingGroupStartTag) {
        if (inRepeatingGroup && currentEntry.size > 0) {
          entries.push(currentEntry);
          currentEntry = new Map<number, string>();
          entryCount++;
        }
        inRepeatingGroup = true;
      }

      // Add field to current entry if we're in the repeating group
      if (inRepeatingGroup) {
        currentEntry.set(tag, value!);

        // Check if we've reached the end of repeating group
        // This happens when we encounter a field that's not part of the group
        // Common fields that appear after repeating groups: 893 (LastFragment)
        if (tag === 893 || (entryCount >= count - 1 && this.isEndOfRepeatingGroup(tag))) {
          if (currentEntry.size > 0) {
            entries.push(currentEntry);
          }
          break;
        }
      }
    }

    // Add the last entry if not already added
    if (inRepeatingGroup && currentEntry.size > 0 && entries.length < count) {
      entries.push(currentEntry);
    }

    return entries;
  }

// Check if a tag indicates end of repeating group for MarketDataIncrementalRefresh
  private isEndOfRepeatingGroup(tag: number): boolean {
    // Tags that typically appear after the repeating group
    const endTags = [10, 893]; // Checksum, LastFragment
    return endTags.includes(tag);
  }

  private async saveTradeToKV(trade: TradeMessage, receivedAt: number): Promise<void> {
    if (!this.kv) {
      console.error("❌ KV database not initialized");
      return;
    }

    try {
      const key = ["trades", trade.tradeId];

      const tradeRecord = {
        ...trade,
        receivedAt: receivedAt,
        priceFloat: parseFloat(trade.price),
        quantityFloat: parseFloat(trade.quantity),
        volumeUSD: parseFloat(trade.price) * parseFloat(trade.quantity),
      };

      await this.kv.set(key, tradeRecord);

      console.log(`💾 Trade ${trade.tradeId} saved to KV database`);
    } catch (error) {
      console.error("❌ Error saving trade to KV:", error);
    }
  }

  // Send heartbeat
  private async sendHeartbeat(testReqID?: string): Promise<void> {
    const fields: Array<[number, string]> = [];
    if (testReqID) {
      fields.push([112, testReqID]);
    }

    const msg = this.buildMessage("0", fields);
    await this.sendMessage(msg);
  }

  // Start heartbeat timer
  private startHeartbeat(): void {
    setInterval(async () => {
      await this.sendHeartbeat();
    }, this.config.heartbeatInterval * 1000);
  }

  // Disconnect
  async disconnect(): Promise<void> {
    if (!this.socket) { return; }

    // Send logout
    const msg = this.buildMessage("5", []);
    await this.sendMessage(msg);

    // Close socket
    this.socket.close();
    console.log("Disconnected");
  }
}

// Helper function to decode base64
function base64Decode(input: string): Uint8Array {
  const binString = atob(input);
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return bytes;
}

// Main function
async function main() {
  // Configuration
  const config: FIXConfig = {
    apiKey: Deno.env.get("FIX_BINANCE_API_KEY") || "",
    privateKeyPath: "./private_key.pem", // Path to your Ed25519 private key
    senderCompID: "TRADER1", // Must be unique across active sessions
    targetCompID: "SPOT",
    heartbeatInterval: 30, // seconds
  };

  if (!config.apiKey) {
    console.error("Please set BINANCE_API_KEY environment variable");
    Deno.exit(1);
  }

  const client = new BinanceFIXClient(config);

  try {
    // Connect and subscribe
    await client.connect();

    // Keep running until interrupted
    await new Promise(() => {});
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.disconnect();
  }
}

// Run the client
if (import.meta.main) {
  void main();
  void mainWs();
}
