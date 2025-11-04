
import { SafeTransaction, ExtendedSafeTransaction } from 'shared-utils';

export const findToExecute = (txs: SafeTransaction[], version: string, chainId: number, targetSafeTxHash?: string): ExtendedSafeTransaction | null => {
    const eligableTxs: SafeTransaction[] = []
    for (const tx of txs) {
        if (tx.confirmationsRequired <= tx.confirmations.length)
            eligibleTxs.push(tx)
    }
    const targetSafeTx = (() => {
        if (targetSafeTxHash === undefined || targetSafeTxHash === "") {
            if (eligableTxs.length == 0) return undefined
            if (eligableTxs.length != 1) throw Error("Unexpected number of transactions")
            return eligableTxs[0]
        } else {
            return eligableTxs.find((txs) => txs.safeTxHash === targetSafeTxHash)
        }
    })()
    if (targetSafeTx === undefined) return null
    return {
        ...targetSafeTx,
        data: targetSafeTx.data || "0x",
        version,
        chainId
    }
}