import {mapRedStoneData} from "./src/redstone-mapper.ts";
import {REDSTONE_GW_URL} from "./src/constants.ts";
import {type RedStoneOracleData} from "./src/redstone-types.ts";

const exampleGwData = await (await fetch(REDSTONE_GW_URL)).json();

if (import.meta.main) {
    const result = mapRedStoneData(exampleGwData as RedStoneOracleData);
    console.log(result);
}