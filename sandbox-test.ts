import {SandboxService} from "./src/sandbox-service.ts";

if (import.meta.main) {
    const sandbox = new SandboxService();
    try {
        const result = await sandbox.runCode(
            {
                dataFeedIds: [ "AAVE" ],
                code: "\n" +
                    "// Fetch AAVE data from RedStone\n" +
                    "const data = await fetchRedStone();\n" +
                    "\n" +
                    "// Filter for AAVE data and sort by timestamp\n" +
                    "const aaveData = data\n" +
                    "  .filter(item => item.dataFeedId === 'AAVE')\n" +
                    "  .sort((a, b) => a.timestamp - b.timestamp);\n" +
                    "\n" +
                    "console.log(`Found ${aaveData.length} AAVE data points`);\n" +
                    "\n" +
                    "if (aaveData.length === 0) {\n" +
                    '  return { error: "No AAVE data found" };\n' +
                    "}\n" +
                    "\n" +
                    "// Function to calculate Simple Moving Average\n" +
                    "function calculateSMA(prices, period) {\n" +
                    "  const smaValues = [];\n" +
                    "  \n" +
                    "  for (let i = period - 1; i < prices.length; i++) {\n" +
                    "    const sum = prices.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0);\n" +
                    "    const sma = sum / period;\n" +
                    "    smaValues.push({\n" +
                    "      timestamp: prices[i].timestamp,\n" +
                    "      date: new Date(prices[i].timestamp).toISOString(),\n" +
                    "      price: prices[i].price,\n" +
                    "      sma: parseFloat(sma.toFixed(4))\n" +
                    "    });\n" +
                    "  }\n" +
                    "  \n" +
                    "  return smaValues;\n" +
                    "}\n" +
                    "\n" +
                    "// Extract price data with timestamps\n" +
                    "const priceData = aaveData.map(item => ({\n" +
                    "  timestamp: item.timestamp,\n" +
                    "  price: item.finalPrice\n" +
                    "}));\n" +
                    "\n" +
                    "// Calculate different SMA periods\n" +
                    "const sma7 = calculateSMA(priceData, 7);\n" +
                    "const sma14 = calculateSMA(priceData, 14);\n" +
                    "const sma30 = calculateSMA(priceData, 30);\n" +
                    "\n" +
                    "// Get latest data point\n" +
                    "const latestData = aaveData[aaveData.length - 1];\n" +
                    "\n" +
                    "console.log(`Latest AAVE price: $${latestData.finalPrice}`);\n" +
                    "console.log(`Data timestamp: ${new Date(latestData.timestamp).toISOString()}`);\n" +
                    "\n" +
                    "// Return comprehensive SMA analysis\n" +
                    "return {\n" +
                    "  summary: {\n" +
                    "    totalDataPoints: aaveData.length,\n" +
                    "    latestPrice: latestData.finalPrice,\n" +
                    "    latestTimestamp: new Date(latestData.timestamp).toISOString(),\n" +
                    "    dataRange: {\n" +
                    "      from: new Date(aaveData[0].timestamp).toISOString(),\n" +
                    "      to: new Date(aaveData[aaveData.length - 1].timestamp).toISOString()\n" +
                    "    }\n" +
                    "  },\n" +
                    "  smaAnalysis: {\n" +
                    "    sma7: {\n" +
                    "      period: 7,\n" +
                    "      dataPoints: sma7.length,\n" +
                    "      latest: sma7.length > 0 ? sma7[sma7.length - 1] : null\n" +
                    "    },\n" +
                    "    sma14: {\n" +
                    "      period: 14,\n" +
                    "      dataPoints: sma14.length,\n" +
                    "      latest: sma14.length > 0 ? sma14[sma14.length - 1] : null\n" +
                    "    },\n" +
                    "    sma30: {\n" +
                    "      period: 30,\n" +
                    "      dataPoints: sma30.length,\n" +
                    "      latest: sma30.length > 0 ? sma30[sma30.length - 1] : null\n" +
                    "    }\n" +
                    "  },\n" +
                    "  recentSMA7: sma7.slice(-5), // Last 5 SMA-7 values\n" +
                    "  recentSMA14: sma14.slice(-3), // Last 3 SMA-14 values\n" +
                    "  recentSMA30: sma30.slice(-2)  // Last 2 SMA-30 values\n" +
                    "};\n"
            }


        )
        console.log("Fetched data:", result);
    } catch (error) {
        console.error("Error:", error);
    }
}