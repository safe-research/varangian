import { ChainInfo, EthTransaction } from "./types"

const BASE_URL = "https://safe-client.safe.global"

// A realistic User-Agent string for a recent Chrome version on Windows
const CHROME_USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// The domain you want to simulate the request is coming *from*
const SAFE_DOMAIN = "https://app.safe.global";

const HEADER = {
    // --- Browser Simulation ---
    "User-Agent": CHROME_USER_AGENT,

    // --- Domain Simulation ---
    // 'Origin' is standard for fetch/XHR requests
    "Origin": SAFE_DOMAIN,

    // 'Referer' is also good to include, as it's very common
    "Referer": `${SAFE_DOMAIN}/`,

    // Add other headers Chrome might send
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Connection": "keep-alive",
}

export const relayEthTransaction = async (chainId: number, tx: EthTransaction): Promise<string> => {
    const resp = await fetch(`${BASE_URL}/v1/chains/${chainId}/relay`, {
        method: "POST",
        headers: {
            ...HEADER,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            version: "1.0.0",
            ...tx
        })
    })
    return resp.text();
}

export const loadChainInfo = async (chainId: string): Promise<ChainInfo> => {
    const resp = await fetch(`${BASE_URL}/v1/chains/${chainId}`, { headers: HEADER })
    console.log(resp)
    const serviceInfo: ChainInfo = await resp.json()
    return serviceInfo
}