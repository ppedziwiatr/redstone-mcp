import {DenoKVPriceDatabase} from "./src/storage/kv-storage.ts";
import {fetchPriceFeeds} from "./src/storage/redstone.ts";

async function loadPrices(lastTimestamp: number, db: DenoKVPriceDatabase) {
    try {
        console.log("Load feeds");
        const mappedData = await fetchPriceFeeds();
        const newTimestamp = mappedData["ETH"]!.timestamp;
        console.log(`Timestamps: current ${newTimestamp}, last ${lastTimestamp}`)
        if (newTimestamp !== lastTimestamp) {
            console.log("Storing data");
        } else {
            console.log(`Timestamps the same (current ${newTimestamp}, last ${lastTimestamp})`);
        }
        await db.storePriceData(mappedData);
        lastTimestamp = newTimestamp;
    } catch (e) {
        console.error(e);
    }
}

if (import.meta.main) {
    const db = await DenoKVPriceDatabase.create("./redstone_data.db", 30);
    let lastTimestamp = 0;

    setInterval(async () => {
        await loadPrices(lastTimestamp, db);
    }, 10100);
    await loadPrices(lastTimestamp, db);
}