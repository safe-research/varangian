import { ChainInfo, EthTransaction } from "./types"

const BASE_URL = "https://safe-client.safe.global"

export const relayEthTransaction = async (chainId: number, tx: EthTransaction): Promise<string> => {
    const resp = await fetch(`${BASE_URL}/v1/chains/${chainId}/relay`, {
        method: "POST",
        headers: {
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
    const resp = await fetch(`${BASE_URL}/v1/chains/${chainId}`)
    const serviceInfo: ChainInfo = await resp.json()
    return serviceInfo
}