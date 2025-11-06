import type { ExtendedSafeTransaction, SafeTransaction } from "shared-utils";

export const findToExecute = (
	txs: SafeTransaction[],
	version: string,
	chainId: number,
	targetSafeTxHash?: string,
): ExtendedSafeTransaction | null => {
	const eligibleTxs: SafeTransaction[] = [];
	for (const tx of txs) {
		if (tx.confirmationsRequired <= tx.confirmations.length) eligibleTxs.push(tx);
	}
	const targetSafeTx = (() => {
		if (targetSafeTxHash === undefined || targetSafeTxHash === "") {
			if (eligibleTxs.length === 0) return undefined;
			if (eligibleTxs.length !== 1) throw Error("Unexpected number of transactions");
			return eligibleTxs[0];
		}
		return eligibleTxs.find((txs) => txs.safeTxHash === targetSafeTxHash);
	})();
	if (targetSafeTx === undefined) return null;
	return {
		...targetSafeTx,
		data: targetSafeTx.data || "0x",
		version,
		chainId,
	};
};
