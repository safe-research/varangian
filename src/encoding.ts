import { ethers } from "ethers";

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