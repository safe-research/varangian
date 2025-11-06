import { ethers } from "ethers";
import type { ExtendedSafeTransaction } from "shared-utils";
import { describe, expect, it } from "vitest";
import { allowedDelegateCalls } from "./allowedDelegateCalls";

const extendedSafeTx = (partial?: Partial<ExtendedSafeTransaction>): ExtendedSafeTransaction => {
	return {
		safeTxHash: ethers.hexlify(ethers.randomBytes(32)),
		safe: ethers.Wallet.createRandom().address,
		to: ethers.ZeroAddress,
		value: "0",
		data: "0x",
		operation: 0,
		nonce: 0,
		safeTxGas: "",
		baseGas: "",
		gasPrice: "",
		gasToken: "",
		refundReceiver: "",
		confirmations: [],
		confirmationsRequired: 1,
		chainId: 100,
		version: "1.4.1",
		...partial,
	};
};

// --- Tests ---
describe("allowedDelegateCalls", () => {
	it("should allow calls", async () => {
		// Funtion throws if there is an error
		allowedDelegateCalls(extendedSafeTx());
	});
	it("should throw for invalid operation", async () => {
		expect(() => {
			allowedDelegateCalls(extendedSafeTx({ operation: 2 }));
		}).toThrowError("Unexpected operation");
	});
	it("should allow delegate calls to multi send call only contracts", async () => {
		// TODO: here we could load the addresses from the safe-deployments repo to check
		// Multisend Call Only 1.3.0
		allowedDelegateCalls(extendedSafeTx({ to: "0x526643F69b81B008F46d95CD5ced5eC0edFFDaC6", operation: 1 }));
		// Multisend Call Only 1.3.0 - eip155
		allowedDelegateCalls(extendedSafeTx({ to: "0xA1dabEF33b3B82c7814B6D82A79e50F4AC44102B", operation: 1 }));
		// Multisend Call Only 1.4.1
		allowedDelegateCalls(extendedSafeTx({ to: "0x9641d764fc13c8B624c04430C7356C1C7C8102e2", operation: 1 }));
		// Multisend Call Only 1.5.0
		allowedDelegateCalls(extendedSafeTx({ to: "0xA83c336B20401Af773B6219BA5027174338D1836", operation: 1 }));
	});
	it("should allow delegate calls to Safe migration contracts", async () => {
		// TODO: here we could load the addresses from the safe-deployments repo to check
		// Safe Migration 1.4.1
		allowedDelegateCalls(extendedSafeTx({ to: "0x40A2aCCbd92BCA938b02010E17A5b8929b49130D", operation: 1 }));
		// Safe Migration 1.5.0
		allowedDelegateCalls(extendedSafeTx({ to: "0x6439e7ABD8Bb915A5263094784C5CF561c4172AC", operation: 1 }));
	});
	it("should allow delegate calls to Safe message lib contracts", async () => {
		// TODO: here we could load the addresses from the safe-deployments repo to check
		// Sign Message Lib 1.3.0
		allowedDelegateCalls(extendedSafeTx({ to: "0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2", operation: 1 }));
		// Sign Message Lib 1.3.0 - eip155
		allowedDelegateCalls(extendedSafeTx({ to: "0x98FFBBF51bb33A056B08ddf711f289936AafF717", operation: 1 }));
		// Sign Message Lib 1.4.1
		allowedDelegateCalls(extendedSafeTx({ to: "0xd53cd0aB83D845Ac265BE939c57F53AD838012c9", operation: 1 }));
		// Sign Message Lib 1.5.0
		allowedDelegateCalls(extendedSafeTx({ to: "0x4FfeF8222648872B3dE295Ba1e49110E61f5b5aa", operation: 1 }));
	});
	it("should throw for delegate calls to invalid target", async () => {
		expect(() => {
			allowedDelegateCalls(extendedSafeTx({ operation: 1 }));
		}).toThrowError("Unexpected delegatecall");
	});
});
