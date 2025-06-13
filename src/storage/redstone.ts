import { REDSTONE_GW_URL } from "../constants.ts";
import type { RedStoneOracleData } from "../redstone-types.ts";
import { mapRedStoneData } from "../redstone-mapper.ts";

export async function fetchPriceFeeds() {
  const response = await fetch(REDSTONE_GW_URL);
  if (response.ok) {
    const rawResult = await response.json() as RedStoneOracleData;
    return mapRedStoneData(rawResult);
  } else {
    throw new Error(`Wrong response from RedStone ${response.status}: ${response.statusText}`);
  }
}
