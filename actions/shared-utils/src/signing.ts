import { ethers } from "ethers";
import { ExtendedSafeTransaction } from "./types";

export const EIP712_SAFE_TX_TYPE = {
    // "SafeTx(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,uint256 nonce)"
    SafeTx: [
        { type: "address", name: "to" },
        { type: "uint256", name: "value" },
        { type: "bytes", name: "data" },
        { type: "uint8", name: "operation" },
        { type: "uint256", name: "safeTxGas" },
        { type: "uint256", name: "baseGas" },
        { type: "uint256", name: "gasPrice" },
        { type: "address", name: "gasToken" },
        { type: "address", name: "refundReceiver" },
        { type: "uint256", name: "nonce" },
    ],
};

export const getSafeTxHash = (safeTx: ExtendedSafeTransaction): string => {
    return ethers.TypedDataEncoder.hash({ verifyingContract: safeTx.safe, chainId: safeTx.chainId }, EIP712_SAFE_TX_TYPE, safeTx);
}

export const signSafeTx = async (wallet: ethers.Wallet, safeTx: ExtendedSafeTransaction): Promise<string> => {
    return await wallet.signTypedData({ verifyingContract: safeTx.safe, chainId: safeTx.chainId }, EIP712_SAFE_TX_TYPE, safeTx);
}