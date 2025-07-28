// main.ts
interface Token {
   market: string;
}

interface OutputFormat {
    quoteAsset: string;
    tokens: Record<string, {}>;
}

async function extractSymbolsWithTokens(outputFilePath: string, quoteAsset: string = "USDT"): Promise<void> {
    try {
        // Read the JSON file
        const jsonData: Token[] = await (await fetch("https://th-api.upbit.com/v1/market/all")).json()

        // Extract symbols where tokens array is not empty
        const symbolTokens: Record<string, {}> = {};

        jsonData.forEach((entry) => {
            if (entry.market.startsWith("USDT-")) {
                const parts = entry.market.split("-");
                symbolTokens[parts[1] as string] = {};
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
    const outputFile = Deno.args[1] || "upbit-usdt.json";
    const quoteAsset = Deno.args[2] || "USDT";

    await extractSymbolsWithTokens(outputFile, quoteAsset);
}