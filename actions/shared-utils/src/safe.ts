import { ethers } from 'ethers'
import { EthTransaction, ExtendedSafeTransaction, SafeSignature, SafeTransaction } from './types'

export const AddressOne = "0x0000000000000000000000000000000000000001";

export const safeInterface = new ethers.Interface([
    "function nonce() view returns (uint256)",
    "function getChainId() view returns (uint256)",
    "function getOwners() view returns (address[])",
    "function getModules() view returns (address[])",
    "function getModulesPaginated(address,uint256) view returns (address[],address)",
    "function approveHash(bytes32) returns (bytes32)",
    "function enableModule(address module)",
    "function execTransactionFromModule(address to, uint256 value, bytes calldata data, uint8 operation) returns (bool)",
    "function execTransaction(address to, uint256 value, bytes calldata data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes calldata signatures) returns (bool)",
    "function getTransactionHash(address to, uint256 value, bytes calldata data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, uint256 _nonce) returns (bytes32)"
])

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

const buildSafeTxSignatures = (signatures: SafeSignature[]): string => {
    return "0x" + signatures
        .slice()
        .sort((left, right) => left.owner.toLowerCase().localeCompare(right.owner.toLowerCase()))
        .map((s) => s.signature.slice(2))
        .join("")
}

export const buildEthTransaction = (tx: SafeTransaction, coSignerSig: string): EthTransaction => {
    const signatures = buildSafeTxSignatures(tx.confirmations) + coSignerSig.slice(2)
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