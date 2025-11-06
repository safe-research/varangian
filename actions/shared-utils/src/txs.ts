import type { SafeInfo, SafeTransaction } from "./types";

export const loadChainId = async (serviceUrl: string): Promise<number> => {
	const resp = await fetch(`${serviceUrl}/api/v1/about/ethereum-rpc/`);
	const serviceInfo: { chain_id: number; chain: string } = await resp.json();
	return serviceInfo.chain_id;
};

export const loadSafeInfo = async (serviceUrl: string, safeAddress: string): Promise<SafeInfo> => {
	const resp = await fetch(`${serviceUrl}/api/v1/safes/${safeAddress}`);
	return await resp.json();
};

export const loadNextTxs = async (serviceUrl: string, safeInfo: SafeInfo): Promise<Array<SafeTransaction>> => {
	const resp = await fetch(
		`${serviceUrl}/api/v1/safes/${safeInfo.address}/multisig-transactions/?nonce__gte=${safeInfo.nonce}&nonce__lte=${safeInfo.nonce}`,
	);
	const page = await resp.json();
	return page.results;
};
