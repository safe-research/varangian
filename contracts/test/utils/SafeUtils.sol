// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.28;

import {Vm} from "forge-std/Vm.sol";
// TODO: refactor to use 1.5.1, currently not possible as it is not compatible with safenet
import {Enum, ISafe} from "safenet/contracts/src/interfaces/ISafe.sol";

struct SafeSignature {
    address signer;
    bytes signature;
    bool isDynamic;
}

struct SafeTx {
    address to;
    uint256 value;
    bytes data;
    Enum.Operation operation;
}

struct MultiSigSafeTx {
    SafeTx details;
    uint256 safeTxGas;
    uint256 baseGas;
    uint256 gasPrice;
    address gasToken;
    address payable refundReceiver;
}

library SafeUtils {
    error InvalidSignatureLength(bytes signature);

    function executeSafeTx(ISafe safe, MultiSigSafeTx memory safeTx, bytes memory signatures)
        internal
        returns (bool success)
    {
        return safe.execTransaction(
            safeTx.details.to,
            safeTx.details.value,
            safeTx.details.data,
            safeTx.details.operation,
            safeTx.safeTxGas,
            safeTx.baseGas,
            safeTx.gasPrice,
            safeTx.gasToken,
            safeTx.refundReceiver,
            signatures
        );
    }

    function executeSafeTx(ISafe safe, MultiSigSafeTx memory safeTx, SafeSignature[] memory signatures)
        internal
        returns (bool success)
    {
        return executeSafeTx(safe, safeTx, buildSignaturesBytes(signatures));
    }

    function txHash(ISafe safe, MultiSigSafeTx memory safeTx)
        internal
        returns (bytes32 safeTxHash)
    {
        return safe.getTransactionHash(
            safeTx.details.to,
            safeTx.details.value,
            safeTx.details.data,
            safeTx.details.operation,
            safeTx.safeTxGas,
            safeTx.baseGas,
            safeTx.gasPrice,
            safeTx.gasToken,
            safeTx.refundReceiver,
            safe.nonce()
        );
    }

    // Note: it is expected that signatures are sorted here
    function buildSignaturesBytes(SafeSignature[] memory signatures)
        internal
        pure
        returns (bytes memory signaturesBytes)
    {
        bytes memory staticBytes;
        uint256 dynamicPartStart = signatures.length * 65;
        uint256 dynamicBytesLength = 0;
        bytes memory dynamicBytes;
        for (uint256 i = 0; i < signatures.length; ++i) {
            SafeSignature memory sig = signatures[i];
            if (sig.isDynamic) {
                staticBytes = abi.encodePacked(
                    staticBytes,
                    abi.encodePacked(abi.encode(sig.signer), dynamicPartStart + dynamicBytesLength, uint8(0))
                );
                // Adding 32 bytes to attribute for the length
                dynamicBytesLength += sig.signature.length + 32;
                dynamicBytes = abi.encodePacked(dynamicBytes, sig.signature.length, sig.signature);
            } else {
                require(sig.signature.length == 65, InvalidSignatureLength(sig.signature));
                staticBytes = abi.encodePacked(staticBytes, sig.signature);
            }
        }
        return abi.encodePacked(staticBytes, dynamicBytes);
    }

    // Helper function to get the executor signature
    function buildPreApprovedSignature(address ownerAddress) internal pure returns (bytes memory) {
        return abi.encodePacked(abi.encode(ownerAddress), bytes32(0), uint8(1));
    }

    function encodeMultiSend(SafeTx[] memory txs) internal pure returns (bytes memory multiSendData) {
        bytes memory transactions;
        for (uint256 i = 0; i < txs.length; i++) {
            SafeTx memory safeTx = txs[i];
            bytes memory encodedTx = abi.encodePacked(
                uint8(safeTx.operation), // Operation: Call
                safeTx.to, // Address to interact with
                uint256(safeTx.value), // Value to send
                safeTx.data.length,
                safeTx.data // Data
            );
            transactions = abi.encodePacked(transactions, encodedTx);
        }
        multiSendData = abi.encodeWithSignature("multiSend(bytes)", transactions);
    }

    function buildContractCall(address to, bytes memory data) internal pure returns (MultiSigSafeTx memory) {
        SafeTx memory details = SafeTx({to: to, value: 0, data: data, operation: Enum.Operation.Call});
        return MultiSigSafeTx({
            details: details,
            safeTxGas: 0,
            baseGas: 0,
            gasPrice: 0,
            gasToken: address(0),
            refundReceiver: payable(address(0))
        });
    }
}

library SafeTxUtils {
    function asMultiSigTx(SafeTx memory details) internal pure returns (MultiSigSafeTx memory) {
        return MultiSigSafeTx({
            details: details,
            safeTxGas: 0,
            baseGas: 0,
            gasPrice: 0,
            gasToken: address(0),
            refundReceiver: payable(address(0))
        });
    }
}

library SafeVmUtils {
    using SafeUtils for ISafe;

    function executeSafeTxFromOwner(Vm vm, address signer, ISafe safe, MultiSigSafeTx memory safeTx)
        public
        returns (bool success)
    {
        vm.startPrank(signer);
        success = safe.executeSafeTx(safeTx, SafeUtils.buildPreApprovedSignature(signer));
        vm.stopPrank();
    }
}
