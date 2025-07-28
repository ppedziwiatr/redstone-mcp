import { nowMicros } from "./tardis.ts";

async function main() {
  setInterval(async () => {
    const hereBeforeRequest = nowMicros();
    const response = await fetch("https://eapi.binance.com/eapi/v1/time");
    const hereAfterRequest = nowMicros();
    const result = (await response.json())["serverTime"] * 1000;
    const reqDuration = hereAfterRequest - hereBeforeRequest;
    const times = [{
      name: "binance",
      time: result,
    }, {
      name: "here-before-request",
      time: hereBeforeRequest,
    }, {
      name: "here-after-request",
      time: hereAfterRequest,
    }];
    const sortedAsc = times.sort((
      a: { name: string; time: number },
      b: { name: string; time: number },
    ) => a.time - b.time);

    console.log({
      binance: result,
      "here-before-request": {
        time: hereBeforeRequest,
        diff: `${result - hereBeforeRequest} [µs]`,
      },
      "here-after-request": {
        time: hereAfterRequest,
        diff: `${result - hereAfterRequest} [µs]`,
      },
      sorted: sortedAsc,
      "request-duration": `${reqDuration} [µs]`,
    });
  }, 1000);
}

// Run the main function
if (import.meta.main) {
  await main();
  //mainWs("./trades-2.db").catch(console.error);
}
