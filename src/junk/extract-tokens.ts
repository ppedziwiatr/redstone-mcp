// main.ts
interface Token {
    blockchain: string;
    contractAddress: string;
    depositEnabled: boolean;
    displayName: string;
    maximumWithdrawal: string | null;
    minimumDeposit: string;
    minimumWithdrawal: string;
    withdrawEnabled: boolean;
    withdrawalFee: string;
}

interface CoinEntry {
    coingeckoId: string;
    displayName: string;
    symbol: string;
    tokens: Token[];
}

interface OutputFormat {
    quoteAsset: string;
    tokens: Record<string, {}>;
}

async function extractSymbolsWithTokens(inputFilePath: string, outputFilePath: string, quoteAsset: string = "USDT"): Promise<void> {
    try {
        // Read the JSON file
        const jsonData = await Deno.readTextFile(inputFilePath);
        const coinEntries: CoinEntry[] = JSON.parse(jsonData);

        // Extract symbols where tokens array is not empty
        const symbolTokens: Record<string, {}> = {};

        coinEntries.forEach((entry) => {
            if (entry.tokens && entry.tokens.length > 0) {
                symbolTokens[entry.symbol] = {};
            }
        });

        // Create the output structure
        const output: OutputFormat = {
            quoteAsset: quoteAsset,
            tokens: symbolTokens
        };

        // Write to output file
        await Deno.writeTextFile(outputFilePath, JSON.stringify(output, null, 2));

        console.log(`Successfully extracted ${Object.keys(symbolTokens).length} symbols with non-empty tokens`);
        console.log(`Output written to: ${outputFilePath}`);

    } catch (error) {
        console.error("Error processing file:", error);
    }
}

// Main execution
if (import.meta.main) {
    const inputFile = Deno.args[0] || "backpack-assets.json";
    const outputFile = Deno.args[1] || "backpack-usdc.json";
    const quoteAsset = Deno.args[2] || "USDC";

    await extractSymbolsWithTokens(inputFile, outputFile, quoteAsset);
}