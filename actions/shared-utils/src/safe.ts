import { ethers } from 'ethers'
import { safeInterface } from './encoding'
import { EthTransaction, SafeInfo, SafeSignature, SafeTransaction } from './types'

export const loadSafeInfo = async (serviceUrl: string, safeAddress: string): Promise<SafeInfo> => {
    const resp = await fetch(`${serviceUrl}/api/v1/safes/${safeAddress}`)
    return await resp.json()
}

export const loadNextTxs = async (serviceUrl: string, safeInfo: SafeInfo): Promise<Array<SafeTransaction>> => {
    const resp = await fetch(`${serviceUrl}/api/v1/safes/${safeInfo.address}/multisig-transactions/?nonce__gte=${safeInfo.nonce}&nonce__lte=${safeInfo.nonce}`)
    const page = await resp.json()
    return page.results
}

const buildSafeTxSignatures = (signatures: SafeSignature[]): string => {
    return "0x" + signatures
        .slice()
        .sort((left, right) => left.owner.toLowerCase().localeCompare(right.owner.toLowerCase()))
        .map((s) => s.signature.slice(2))
        .join("")
}

export const buildEthTransaction = (tx: SafeTransaction, coSignerSig: string): EthTransaction => {
    const signatures = buildSafeTxSignatures(tx.confirmations)
    const data = safeInterface.encodeFunctionData("execTransaction", [
        tx.to,
        tx.value,
        tx.data || "0x",
        tx.operation,
        tx.safeTxGas,
        tx.baseGas,
        tx.gasPrice,
        tx.gasToken || ethers.ZeroAddress,
        tx.refundReceiver || ethers.ZeroAddress,
        signatures
    ])
    const to = tx.safe
    return {
        to,
        data
    }
}