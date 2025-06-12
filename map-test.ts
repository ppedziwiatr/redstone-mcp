import {mapRedStoneData} from "./src/redstone-mapper.ts";

const exampleGwData = {
    "AAVE": [
        {
            "timestampMilliseconds": 1749397130000,
            "signature": "Gs0NqX8jngCHulQxeskq2mVP/CISDLnlamN/FSuM3Kx6KwsOLGAMv0XbrK83XhZO45CDI8hDH5VloEbKFJPD8hw=",
            "isSignatureValid": true,
            "dataPoints": [
                {
                    "dataFeedId": "AAVE",
                    "value": 252.985,
                    "metadata": {
                        "value": "252.985",
                        "sourceMetadata": {
                            "binance-usdt": {
                                "tradeInfo": {
                                    "bidPrice": 253.10361369999998,
                                    "askPrice": 253.1136174,
                                    "volumeInUsd": 15661544.60705
                                },
                                "value": "253.10361369999998"
                            },
                            "bitget-usdt": {
                                "tradeInfo": {
                                    "bidPrice": 253.0135804,
                                    "askPrice": 253.0235841,
                                    "volumeInUsd": 3157633.4448
                                },
                                "value": "252.9235471"
                            },
                            "bitmart-usdt": {
                                "tradeInfo": {
                                    "bidPrice": 251.619864916,
                                    "askPrice": 254.592564408,
                                    "volumeInUsd": 226601.9968
                                },
                                "value": "252.9635619"
                            },
                            "kaiko-v2": {
                                "value": "252.91163460466444"
                            },
                            "kraken-usd": {
                                "tradeInfo": {
                                    "bidPrice": 252.93,
                                    "askPrice": 252.94,
                                    "volumeInUsd": 685018.5428707468
                                },
                                "value": "252.97"
                            },
                            "kucoin-usdt": {
                                "tradeInfo": {
                                    "bidPrice": 253.09260963,
                                    "askPrice": 253.09160925999998,
                                    "volumeInUsd": 1669261.3043023841
                                },
                                "value": "252.94555524"
                            },
                            "lbank-usdt": {
                                "tradeInfo": {
                                    "volumeInUsd": 1274126.8564999998
                                },
                                "value": "253.0435915"
                            },
                            "okx-usdt": {
                                "tradeInfo": {
                                    "bidPrice": 253.09360999999998,
                                    "askPrice": 253.10361369999998,
                                    "volumeInUsd": 3224426.6735494
                                },
                                "value": "252.9635619"
                            },
                            "bitfinex-usd": {
                                "tradeInfo": {
                                    "bidPrice": 252.96,
                                    "askPrice": 253.21,
                                    "volumeInUsd": 20331.9157653678
                                },
                                "value": "254.22"
                            },
                            "coinbase-usd": {
                                "tradeInfo": {
                                    "bidPrice": 253.12,
                                    "askPrice": 253.18,
                                    "volumeInUsd": 4533158.148519999
                                },
                                "value": "253.16"
                            },
                            "uniswap-v3-ethereum-weth-3000": {
                                "slippage": [
                                    {
                                        "isSuccess": true,
                                        "slippageAsPercent": "0.005309",
                                        "direction": "buy",
                                        "simulationValueInUsd": "20000"
                                    },
                                    {
                                        "isSuccess": true,
                                        "slippageAsPercent": "0.005327",
                                        "direction": "sell",
                                        "simulationValueInUsd": "20000"
                                    }
                                ],
                                "value": "253.88015091"
                            },
                            "xt": {
                                "value": "253"
                            }
                        },
                        "nodeLabel": "morpheus-main"
                    }
                }
            ],
            "dataServiceId": "redstone-primary-prod",
            "dataPackageId": "AAVE",
            "signerAddress": "0x51Ce04Be4b3E32572C4Ec9135221d0691Ba7d202",
            "dataFeedId": "AAVE"
        },
        {
            "timestampMilliseconds": 1749397130000,
            "signature": "ckovgV11d1xkU+zZNpjL2RsV/2vQb94DKgvMyWnKmnMwhDnopjhWrxDqFLp/w4KIDlz74ffs33kFwYGFvziV6Rw=",
            "isSignatureValid": true,
            "dataPoints": [
                {
                    "dataFeedId": "AAVE",
                    "value": 252.985,
                    "metadata": {
                        "value": "252.985",
                        "sourceMetadata": {
                            "binance-usdt": {
                                "tradeInfo": {
                                    "bidPrice": 253.10361369999998,
                                    "askPrice": 253.1136174,
                                    "volumeInUsd": 15661544.60705
                                },
                                "value": "253.10361369999998"
                            },
                            "bitget-usdt": {
                                "tradeInfo": {
                                    "bidPrice": 253.0135804,
                                    "askPrice": 253.0235841,
                                    "volumeInUsd": 3157633.4448
                                },
                                "value": "252.9235471"
                            },
                            "bitmart-usdt": {
                                "tradeInfo": {
                                    "bidPrice": 251.619864916,
                                    "askPrice": 254.592564408,
                                    "volumeInUsd": 226601.9968
                                },
                                "value": "252.9635619"
                            },
                            "kaiko-v2": {
                                "value": "252.91163460466444"
                            },
                            "kraken-usd": {
                                "tradeInfo": {
                                    "bidPrice": 252.93,
                                    "askPrice": 252.94,
                                    "volumeInUsd": 685018.5428707468
                                },
                                "value": "252.97"
                            },
                            "kucoin-usdt": {
                                "tradeInfo": {
                                    "bidPrice": 253.09260963,
                                    "askPrice": 253.09160925999998,
                                    "volumeInUsd": 1669261.3043023841
                                },
                                "value": "252.94555524"
                            },
                            "lbank-usdt": {
                                "tradeInfo": {
                                    "volumeInUsd": 1274126.8564999998
                                },
                                "value": "253.0435915"
                            },
                            "okx-usdt": {
                                "tradeInfo": {
                                    "bidPrice": 253.09360999999998,
                                    "askPrice": 253.10361369999998,
                                    "volumeInUsd": 3224426.6735494
                                },
                                "value": "252.9635619"
                            },
                            "bitfinex-usd": {
                                "tradeInfo": {
                                    "bidPrice": 252.96,
                                    "askPrice": 253.21,
                                    "volumeInUsd": 20331.9157653678
                                },
                                "value": "254.22"
                            },
                            "coinbase-usd": {
                                "tradeInfo": {
                                    "bidPrice": 253.12,
                                    "askPrice": 253.18,
                                    "volumeInUsd": 4533158.148519999
                                },
                                "value": "253.16"
                            },
                            "uniswap-v3-ethereum-weth-3000": {
                                "slippage": [
                                    {
                                        "isSuccess": true,
                                        "slippageAsPercent": "0.005309",
                                        "direction": "buy",
                                        "simulationValueInUsd": "20000"
                                    },
                                    {
                                        "isSuccess": true,
                                        "slippageAsPercent": "0.005327",
                                        "direction": "sell",
                                        "simulationValueInUsd": "20000"
                                    }
                                ],
                                "value": "253.88015091"
                            },
                            "xt": {
                                "value": "253"
                            }
                        },
                        "nodeLabel": "altair-main"
                    }
                }
            ],
            "dataServiceId": "redstone-primary-prod",
            "dataPackageId": "AAVE",
            "signerAddress": "0x8BB8F32Df04c8b654987DAaeD53D6B6091e3B774",
            "dataFeedId": "AAVE"
        },
        {
            "timestampMilliseconds": 1749397130000,
            "signature": "vaDhyFCeE15GsXs7jhgkSW7T7QwSBPJExngz9ClEWg8CSS3tJj6o0Tl8NSUsRpeHntBPzTFNAzS395E3FY7/VBw=",
            "isSignatureValid": true,
            "dataPoints": [
                {
                    "dataFeedId": "AAVE",
                    "value": 252.985,
                    "metadata": {
                        "value": "252.985",
                        "sourceMetadata": {
                            "binance-usdt": {
                                "tradeInfo": {
                                    "bidPrice": 253.10361369999998,
                                    "askPrice": 253.1136174,
                                    "volumeInUsd": 15661544.60705
                                },
                                "value": "253.10361369999998"
                            },
                            "bitget-usdt": {
                                "tradeInfo": {
                                    "bidPrice": 253.0135804,
                                    "askPrice": 253.0235841,
                                    "volumeInUsd": 3157633.4448
                                },
                                "value": "252.9235471"
                            },
                            "bitmart-usdt": {
                                "tradeInfo": {
                                    "bidPrice": 251.619864916,
                                    "askPrice": 254.592564408,
                                    "volumeInUsd": 226601.9968
                                },
                                "value": "252.9635619"
                            },
                            "kaiko-v2": {
                                "value": "252.91163460466444"
                            },
                            "kraken-usd": {
                                "tradeInfo": {
                                    "bidPrice": 252.93,
                                    "askPrice": 252.94,
                                    "volumeInUsd": 685018.5428707468
                                },
                                "value": "252.97"
                            },
                            "kucoin-usdt": {
                                "tradeInfo": {
                                    "bidPrice": 253.09260963,
                                    "askPrice": 253.09160925999998,
                                    "volumeInUsd": 1669261.3043023841
                                },
                                "value": "252.94555524"
                            },
                            "lbank-usdt": {
                                "tradeInfo": {
                                    "volumeInUsd": 1274126.8564999998
                                },
                                "value": "253.0435915"
                            },
                            "okx-usdt": {
                                "tradeInfo": {
                                    "bidPrice": 253.09360999999998,
                                    "askPrice": 253.10361369999998,
                                    "volumeInUsd": 3224426.6735494
                                },
                                "value": "252.9635619"
                            },
                            "bitfinex-usd": {
                                "tradeInfo": {
                                    "bidPrice": 252.96,
                                    "askPrice": 253.21,
                                    "volumeInUsd": 20331.9157653678
                                },
                                "value": "254.22"
                            },
                            "coinbase-usd": {
                                "tradeInfo": {
                                    "bidPrice": 253.12,
                                    "askPrice": 253.18,
                                    "volumeInUsd": 4533158.148519999
                                },
                                "value": "253.16"
                            },
                            "uniswap-v3-ethereum-weth-3000": {
                                "slippage": [
                                    {
                                        "isSuccess": true,
                                        "slippageAsPercent": "0.005309",
                                        "direction": "buy",
                                        "simulationValueInUsd": "20000"
                                    },
                                    {
                                        "isSuccess": true,
                                        "slippageAsPercent": "0.005327",
                                        "direction": "sell",
                                        "simulationValueInUsd": "20000"
                                    }
                                ],
                                "value": "253.88015091"
                            },
                            "xt": {
                                "value": "253"
                            }
                        },
                        "nodeLabel": "main"
                    }
                }
            ],
            "dataServiceId": "redstone-primary-prod",
            "dataPackageId": "AAVE",
            "signerAddress": "0x9c5AE89C4Af6aA32cE58588DBaF90d18a855B6de",
            "dataFeedId": "AAVE"
        },
        {
            "timestampMilliseconds": 1749397130000,
            "signature": "tXqDi7FQIR9qOhNEDedp24WJTy390zYR9ixrw6IR0OIW9/IyS5PORFe7nRoIvD/GDsCdlhEtpfVDl1KpyMzchBw=",
            "isSignatureValid": true,
            "dataPoints": [
                {
                    "dataFeedId": "AAVE",
                    "value": 252.985,
                    "metadata": {
                        "value": "252.985",
                        "sourceMetadata": {
                            "binance-usdt": {
                                "tradeInfo": {
                                    "bidPrice": 253.10361369999998,
                                    "askPrice": 253.1136174,
                                    "volumeInUsd": 15661544.60705
                                },
                                "value": "253.10361369999998"
                            },
                            "bitget-usdt": {
                                "tradeInfo": {
                                    "bidPrice": 253.0135804,
                                    "askPrice": 253.0235841,
                                    "volumeInUsd": 3157633.4448
                                },
                                "value": "252.9235471"
                            },
                            "bitmart-usdt": {
                                "tradeInfo": {
                                    "bidPrice": 251.619864916,
                                    "askPrice": 254.592564408,
                                    "volumeInUsd": 226601.9968
                                },
                                "value": "252.9635619"
                            },
                            "kaiko-v2": {
                                "value": "252.91163460466444"
                            },
                            "kraken-usd": {
                                "tradeInfo": {
                                    "bidPrice": 252.93,
                                    "askPrice": 252.94,
                                    "volumeInUsd": 685018.5428707468
                                },
                                "value": "252.97"
                            },
                            "kucoin-usdt": {
                                "tradeInfo": {
                                    "bidPrice": 253.09260963,
                                    "askPrice": 253.09160925999998,
                                    "volumeInUsd": 1669261.3043023841
                                },
                                "value": "252.94555524"
                            },
                            "lbank-usdt": {
                                "tradeInfo": {
                                    "volumeInUsd": 1274126.8564999998
                                },
                                "value": "253.0435915"
                            },
                            "okx-usdt": {
                                "tradeInfo": {
                                    "bidPrice": 253.09360999999998,
                                    "askPrice": 253.10361369999998,
                                    "volumeInUsd": 3224426.6735494
                                },
                                "value": "252.9635619"
                            },
                            "bitfinex-usd": {
                                "tradeInfo": {
                                    "bidPrice": 252.95,
                                    "askPrice": 253.21,
                                    "volumeInUsd": 20331.9157653678
                                },
                                "value": "254.22"
                            },
                            "coinbase-usd": {
                                "tradeInfo": {
                                    "bidPrice": 253.12,
                                    "askPrice": 253.18,
                                    "volumeInUsd": 4533158.148519999
                                },
                                "value": "253.16"
                            },
                            "uniswap-v3-ethereum-weth-3000": {
                                "slippage": [
                                    {
                                        "isSuccess": true,
                                        "slippageAsPercent": "0.005309",
                                        "direction": "buy",
                                        "simulationValueInUsd": "20000"
                                    },
                                    {
                                        "isSuccess": true,
                                        "slippageAsPercent": "0.005327",
                                        "direction": "sell",
                                        "simulationValueInUsd": "20000"
                                    }
                                ],
                                "value": "253.88015091"
                            },
                            "xt": {
                                "value": "253"
                            }
                        },
                        "nodeLabel": "ciri-main"
                    }
                }
            ],
            "dataServiceId": "redstone-primary-prod",
            "dataPackageId": "AAVE",
            "signerAddress": "0xDD682daEC5A90dD295d14DA4b0bec9281017b5bE",
            "dataFeedId": "AAVE"
        },
        {
            "timestampMilliseconds": 1749397130000,
            "signature": "z4dk2G9mCW5b6AkMEgM1rImoFhJo8C1m9IJQtDA7YJoN0fg3ExjB6OHXyhPkdVAeR27oDo7TH64BgqfnqmE+OBw=",
            "isSignatureValid": true,
            "dataPoints": [
                {
                    "dataFeedId": "AAVE",
                    "value": 252.985,
                    "metadata": {
                        "value": "252.985",
                        "sourceMetadata": {
                            "binance-usdt": {
                                "tradeInfo": {
                                    "bidPrice": 253.10361369999998,
                                    "askPrice": 253.1136174,
                                    "volumeInUsd": 15661544.60705
                                },
                                "value": "253.10361369999998"
                            },
                            "bitget-usdt": {
                                "tradeInfo": {
                                    "bidPrice": 253.0135804,
                                    "askPrice": 253.0235841,
                                    "volumeInUsd": 3157633.4448
                                },
                                "value": "252.9235471"
                            },
                            "bitmart-usdt": {
                                "tradeInfo": {
                                    "bidPrice": 251.619864916,
                                    "askPrice": 254.592564408,
                                    "volumeInUsd": 226601.9968
                                },
                                "value": "252.9635619"
                            },
                            "kaiko-v2": {
                                "value": "252.91163460466444"
                            },
                            "kraken-usd": {
                                "tradeInfo": {
                                    "bidPrice": 252.93,
                                    "askPrice": 252.94,
                                    "volumeInUsd": 685018.5428707468
                                },
                                "value": "252.97"
                            },
                            "kucoin-usdt": {
                                "tradeInfo": {
                                    "bidPrice": 253.09260963,
                                    "askPrice": 253.09160925999998,
                                    "volumeInUsd": 1669261.3043023841
                                },
                                "value": "252.94555524"
                            },
                            "lbank-usdt": {
                                "tradeInfo": {
                                    "volumeInUsd": 1274126.8564999998
                                },
                                "value": "253.0435915"
                            },
                            "okx-usdt": {
                                "tradeInfo": {
                                    "bidPrice": 253.1136174,
                                    "askPrice": 253.1436285,
                                    "volumeInUsd": 3224426.6735494
                                },
                                "value": "252.9635619"
                            },
                            "bitfinex-usd": {
                                "tradeInfo": {
                                    "bidPrice": 252.96,
                                    "askPrice": 253.21,
                                    "volumeInUsd": 20331.9157653678
                                },
                                "value": "254.22"
                            },
                            "coinbase-usd": {
                                "tradeInfo": {
                                    "bidPrice": 253.12,
                                    "askPrice": 253.18,
                                    "volumeInUsd": 4533158.148519999
                                },
                                "value": "253.16"
                            },
                            "uniswap-v3-ethereum-weth-3000": {
                                "slippage": [
                                    {
                                        "isSuccess": true,
                                        "slippageAsPercent": "0.005309",
                                        "direction": "buy",
                                        "simulationValueInUsd": "20000"
                                    },
                                    {
                                        "isSuccess": true,
                                        "slippageAsPercent": "0.005327",
                                        "direction": "sell",
                                        "simulationValueInUsd": "20000"
                                    }
                                ],
                                "value": "253.88015091"
                            },
                            "xt": {
                                "value": "253"
                            }
                        },
                        "nodeLabel": "wayfarer-fallback"
                    }
                }
            ],
            "dataServiceId": "redstone-primary-prod",
            "dataPackageId": "AAVE",
            "signerAddress": "0xdEB22f54738d54976C4c0fe5ce6d408E40d88499",
            "dataFeedId": "AAVE"
        }
    ],
    "ACRED_FUNDAMENTAL": [
        {
            "timestampMilliseconds": 1749397130000,
            "signature": "mbhWCFGOFtBYs7OGUUv2Wfu9kLqFtyiFSqKWxbSt5fQkhBkHF77yJMmNQw6icCedIUuE8PD20jGKxtDFw7L6Hhs=",
            "isSignatureValid": true,
            "dataPoints": [
                {
                    "dataFeedId": "ACRED_FUNDAMENTAL",
                    "value": 1026.554556,
                    "metadata": {
                        "value": "1026.554556",
                        "sourceMetadata": {
                            "securitize-api": {
                                "value": "1026.554556"
                            }
                        },
                        "nodeLabel": "morpheus-main"
                    }
                }
            ],
            "dataServiceId": "redstone-primary-prod",
            "dataPackageId": "ACRED_FUNDAMENTAL",
            "signerAddress": "0x51Ce04Be4b3E32572C4Ec9135221d0691Ba7d202",
            "dataFeedId": "ACRED_FUNDAMENTAL"
        },
        {
            "timestampMilliseconds": 1749397130000,
            "signature": "H1xY1Ou1e5oU0o1yP26ilYKbLCrHcsP5X45AZ4yA02hOIRlXZtuzvXGggwAwLflRLAerzrt9cVnnNgUTk0UFTxs=",
            "isSignatureValid": true,
            "dataPoints": [
                {
                    "dataFeedId": "ACRED_FUNDAMENTAL",
                    "value": 1026.554556,
                    "metadata": {
                        "value": "1026.554556",
                        "sourceMetadata": {
                            "securitize-api": {
                                "value": "1026.554556"
                            }
                        },
                        "nodeLabel": "altair-main"
                    }
                }
            ],
            "dataServiceId": "redstone-primary-prod",
            "dataPackageId": "ACRED_FUNDAMENTAL",
            "signerAddress": "0x8BB8F32Df04c8b654987DAaeD53D6B6091e3B774",
            "dataFeedId": "ACRED_FUNDAMENTAL"
        },
        {
            "timestampMilliseconds": 1749397130000,
            "signature": "kauV+uXhQLp+H51p11vy109No1t6dpRTP60KZvzpr41QrDLMk88NeatZXnj/742o7RtCaYJXzmnHljEv6f6/3hw=",
            "isSignatureValid": true,
            "dataPoints": [
                {
                    "dataFeedId": "ACRED_FUNDAMENTAL",
                    "value": 1026.554556,
                    "metadata": {
                        "value": "1026.554556",
                        "sourceMetadata": {
                            "securitize-api": {
                                "value": "1026.554556"
                            }
                        },
                        "nodeLabel": "main"
                    }
                }
            ],
            "dataServiceId": "redstone-primary-prod",
            "dataPackageId": "ACRED_FUNDAMENTAL",
            "signerAddress": "0x9c5AE89C4Af6aA32cE58588DBaF90d18a855B6de",
            "dataFeedId": "ACRED_FUNDAMENTAL"
        },
        {
            "timestampMilliseconds": 1749397130000,
            "signature": "W/u7zoMR7iWeM9qZpt7AWJsdxxvo+CAYBGJcf/t0ljtTXeqemW+duu5L5XDIwz/xR4ZY86Augretl5H/hlsc6hs=",
            "isSignatureValid": true,
            "dataPoints": [
                {
                    "dataFeedId": "ACRED_FUNDAMENTAL",
                    "value": 1026.554556,
                    "metadata": {
                        "value": "1026.554556",
                        "sourceMetadata": {
                            "securitize-api": {
                                "value": "1026.554556"
                            }
                        },
                        "nodeLabel": "ciri-main"
                    }
                }
            ],
            "dataServiceId": "redstone-primary-prod",
            "dataPackageId": "ACRED_FUNDAMENTAL",
            "signerAddress": "0xDD682daEC5A90dD295d14DA4b0bec9281017b5bE",
            "dataFeedId": "ACRED_FUNDAMENTAL"
        },
        {
            "timestampMilliseconds": 1749397130000,
            "signature": "DYJ6iGZ6glGP2h1F6DI0NyWNN3sZUvV5nJxXaPE7+OAs6SquZhkq11EKRrk+UuZqTo/+KFOcvSCD+fNetG/F4hs=",
            "isSignatureValid": true,
            "dataPoints": [
                {
                    "dataFeedId": "ACRED_FUNDAMENTAL",
                    "value": 1026.554556,
                    "metadata": {
                        "value": "1026.554556",
                        "sourceMetadata": {
                            "securitize-api": {
                                "value": "1026.554556"
                            }
                        },
                        "nodeLabel": "wayfarer-fallback"
                    }
                }
            ],
            "dataServiceId": "redstone-primary-prod",
            "dataPackageId": "ACRED_FUNDAMENTAL",
            "signerAddress": "0xdEB22f54738d54976C4c0fe5ce6d408E40d88499",
            "dataFeedId": "ACRED_FUNDAMENTAL"
        }
    ]
}

if (import.meta.main) {
    const result = mapRedStoneData(exampleGwData);
    console.log(result);
}