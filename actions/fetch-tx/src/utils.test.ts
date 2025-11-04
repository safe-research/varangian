import { describe, assert, it, expect } from "vitest"; // or '@jest/globals'
import { findToExecute } from "./utils";
import { SafeSignature, SafeTransaction } from "shared-utils";
import { ethers } from "ethers";


const VERSION = "1.3.0";
const CHAIN_ID = 100;

const buildSafeSignature = (partial?: Partial<SafeSignature>): SafeSignature => {
  return {
    owner: ethers.Wallet.createRandom().address,
    signature: "",
    signatureType: "",
    ...partial
  }
}

const buildSafeTx = (partial?: Partial<SafeTransaction>): SafeTransaction => {
  return {
    safeTxHash: ethers.hexlify(ethers.randomBytes(32)),
    safe: ethers.Wallet.createRandom().address,
    to: "",
    value: "",
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
    ...partial
  }
}

// --- Tests ---
describe("findToExecute", () => {
  it("should throw if multiple transaction are eligible", () => {
    const txs: SafeTransaction[] = [
      buildSafeTx({ confirmations: [buildSafeSignature()] }),
      buildSafeTx({ confirmations: [buildSafeSignature()] })
    ]
    assert.throws(() => { findToExecute(txs, VERSION, CHAIN_ID) })
  });

  it("should return null if no transaction found", () => {
    const txs: SafeTransaction[] = []
    expect(findToExecute(txs, VERSION, CHAIN_ID)).toBeNull()
  });

  it("should return available transaction", () => {
    const expectedTx = buildSafeTx({ confirmations: [buildSafeSignature()] })
    const txs: SafeTransaction[] = [
      expectedTx,
      buildSafeTx()
    ]
    expect(findToExecute(txs, VERSION, CHAIN_ID)).toStrictEqual({
      ...expectedTx,
      version: VERSION,
      chainId: CHAIN_ID
    })
  });

  it("should return null if specified tx hash is not eligible", () => {
    const txs: SafeTransaction[] = [
      buildSafeTx({ confirmations: [buildSafeSignature()] }),
      buildSafeTx({ safeTxHash: "0xtest" })
    ]
    expect(findToExecute(txs, VERSION, CHAIN_ID, "0xtest")).toBeNull()
  });

  it("should return specific transaction if tx is available", () => {
    const expectedTx = buildSafeTx({ safeTxHash: "0xtest", confirmations: [buildSafeSignature()] })
    const txs: SafeTransaction[] = [
      expectedTx,
      buildSafeTx({ confirmations: [buildSafeSignature()] })
    ]
    expect(findToExecute(txs, VERSION, CHAIN_ID, "0xtest")).toStrictEqual({
      ...expectedTx,
      version: VERSION,
      chainId: CHAIN_ID
    })
  });
})