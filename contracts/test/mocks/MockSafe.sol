// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.28;

import {SafeProxyFactory} from "safe-smart-account/contracts/proxies/SafeProxyFactory.sol";
import {ISignatureValidator} from "safe-smart-account/contracts/interfaces/ISignatureValidator.sol";
import {MultiSendCallOnly} from "safe-smart-account/contracts/libraries/MultiSendCallOnly.sol";
import {Guard} from "safe-smart-account/contracts/base/GuardManager.sol";
import {Enum} from "safenet/contracts/src/interfaces/ISafe.sol";

abstract contract MockSafeEnv {
    address public safeSingleton;
    MultiSendCallOnly public multiSend;
    SafeProxyFactory public safeProxyFactory;

    // Function to set up the test environment
    function setUp() public virtual {
        safeSingleton = address(new MockSafe());
        safeProxyFactory = new SafeProxyFactory();
        multiSend = new MultiSendCallOnly();
    }

    function createSafe(uint256 salt, address[] memory signers, uint256 threshold) public returns (MockSafe safe) {
        bytes memory setupData = abi.encodeWithSelector(MockSafe.setup.selector, signers, threshold);
        safe = MockSafe(payable(safeProxyFactory.createProxyWithNonce(safeSingleton, setupData, salt)));
    }
}

contract MockSafe {
    // keccak256(
    //     "EIP712Domain(uint256 chainId,address verifyingContract)"
    // );
    bytes32 private constant _DOMAIN_SEPARATOR_TYPEHASH =
        0x47e79534a245952e8b16893a336b85a3d9ea9fa8c573f3d803afb92a79469218;

    // keccak256(
    //     "SafeTx(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,uint256 nonce)"
    // );
    bytes32 private constant _SAFE_TX_TYPEHASH = 0xbb8310d486368db6bd6f849402fdd73ad53d316b5a4b2644ad6efe0f941286d8;

    error ExecutionFailed(bytes errorData);

    uint256 _spacer;
    uint256 public nonce;
    mapping(address => bool) public signers;
    uint256 public threshold;
    address public guard;

    function setup(address[] calldata _signers, uint256 _threshold) public {
        require(_threshold <= _signers.length);
        threshold = _threshold;
        for (uint256 i = 0; i < _signers.length; ++i) {
            signers[_signers[i]] = true;
        }
    }

    function execTransaction(
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation,
        uint256 safeTxGas,
        uint256 baseGas,
        uint256 gasPrice,
        address gasToken,
        address payable refundReceiver,
        bytes memory signatures
    ) external payable returns (bool success) {
        bytes32 safeTxHash = getTransactionHash(
            to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, nonce
        );
        nonce++;
        Guard txGuard = Guard(guard);
        checkSignatures(safeTxHash, signatures);
        if (address(txGuard) != address(0)) {
            txGuard.checkTransaction(
                to,
                value,
                data,
                operation,
                safeTxGas,
                baseGas,
                gasPrice,
                gasToken,
                refundReceiver,
                signatures,
                msg.sender
            );
        }
        bytes memory response;
        uint256 gasToUse = safeTxGas == 0 ? gasleft() : safeTxGas;
        if (operation == Enum.Operation.Call) {
            (success, response) = to.call{gas: gasToUse, value: value}(data);
        } else {
            (success, response) = to.delegatecall{gas: gasToUse}(data);
        }
        require(safeTxGas == 0 || success, ExecutionFailed(response));

        if (address(txGuard) != address(0)) {
            txGuard.checkAfterExecution(safeTxHash, success);
        }
    }

    function checkSignatures(bytes32 dataHash, bytes memory signatures) public view {
        checkNSignatures(msg.sender, dataHash, signatures, threshold);
    }

    function setGuard(address _guard) external {
        guard = _guard;
    }

    function domainSeparator() public view returns (bytes32) {
        uint256 chainId;
        /* solhint-disable no-inline-assembly */
        /// @solidity memory-safe-assembly
        assembly {
            chainId := chainid()
        }
        /* solhint-enable no-inline-assembly */

        return keccak256(abi.encode(_DOMAIN_SEPARATOR_TYPEHASH, chainId, this));
    }

    function getTransactionHash(
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation,
        uint256 safeTxGas,
        uint256 baseGas,
        uint256 gasPrice,
        address gasToken,
        address refundReceiver,
        uint256 _nonce
    ) public view returns (bytes32 safeTxHash) {
        bytes32 domainHash = domainSeparator();

        // We opted for using assembly code here, because the way Solidity compiler we use (0.7.6) allocates memory is
        // inefficient. We do not need to allocate memory for temporary variables to be used in the keccak256 call.
        //
        // WARNING: We do not clean potential dirty bits in types that are less than 256 bits (addresses and Enum.Operation)
        // The solidity assembly types that are smaller than 256 bit can have dirty high bits according to the spec (see the Warning in https://docs.soliditylang.org/en/latest/assembly.html#access-to-external-variables-functions-and-libraries).
        // However, we read most of the data from calldata, where the variables are not packed, and the only variable we read from storage is uint256 nonce.
        // This is not a problem, however, we must consider this for potential future changes.
        /* solhint-disable no-inline-assembly */
        /// @solidity memory-safe-assembly
        assembly {
            // Get the free memory pointer
            let ptr := mload(0x40)

            // Step 1: Hash the transaction data
            // Copy transaction data to memory and hash it
            calldatacopy(ptr, data.offset, data.length)
            let calldataHash := keccak256(ptr, data.length)

            // Step 2: Prepare the SafeTX struct for hashing
            // Layout in memory:
            // ptr +   0: SAFE_TX_TYPEHASH (constant defining the struct hash)
            // ptr +  32: to address
            // ptr +  64: value
            // ptr +  96: calldataHash
            // ptr + 128: operation
            // ptr + 160: safeTxGas
            // ptr + 192: baseGas
            // ptr + 224: gasPrice
            // ptr + 256: gasToken
            // ptr + 288: refundReceiver
            // ptr + 320: nonce
            mstore(ptr, _SAFE_TX_TYPEHASH)
            mstore(add(ptr, 32), to)
            mstore(add(ptr, 64), value)
            mstore(add(ptr, 96), calldataHash)
            mstore(add(ptr, 128), operation)
            mstore(add(ptr, 160), safeTxGas)
            mstore(add(ptr, 192), baseGas)
            mstore(add(ptr, 224), gasPrice)
            mstore(add(ptr, 256), gasToken)
            mstore(add(ptr, 288), refundReceiver)
            mstore(add(ptr, 320), _nonce)

            // Step 3: Calculate the final EIP-712 hash
            // First, hash the SafeTX struct (352 bytes total length)
            mstore(add(ptr, 64), keccak256(ptr, 352))
            // Store the EIP-712 prefix (0x1901), note that integers are left-padded
            // so the EIP-712 encoded data starts at add(ptr, 30)
            mstore(ptr, 0x1901)
            // Store the domain separator
            mstore(add(ptr, 32), domainHash)
            // Calculate the hash
            safeTxHash := keccak256(add(ptr, 30), 66)
        }
        /* solhint-enable no-inline-assembly */
    }

    /**
     * @notice Checks whether the contract signature is valid. Reverts otherwise.
     * @dev This is extracted to a separate function for better compatibility with Certora's prover.
     *      More info here: https://github.com/safe-global/safe-smart-account/pull/661
     * @param signer Address of the signer used to sign the message
     * @param dataHash Hash of the data (could be either a message hash or transaction hash)
     * @param signatures Signature data that should be verified.
     * @param offset Offset to the start of the contract signature in the signatures byte array
     */
    function _checkContractSignature(address signer, bytes32 dataHash, bytes memory signatures, uint256 offset)
        internal
        view
    {
        // Check that signature data pointer (s) is in bounds (points to the length of data -> 32 bytes)
        if (offset + 32 > signatures.length) _revertWithError("GS022");

        // Check if the contract signature is in bounds: start of data is s + 32 and end is start + signature length
        uint256 contractSignatureLen;
        /* solhint-disable no-inline-assembly */
        /// @solidity memory-safe-assembly
        assembly {
            contractSignatureLen := mload(add(add(signatures, offset), 0x20))
        }
        /* solhint-enable no-inline-assembly */
        if (offset + 32 + contractSignatureLen > signatures.length) _revertWithError("GS023");

        // Check signature
        bytes memory contractSignature;
        /* solhint-disable no-inline-assembly */
        /// @solidity memory-safe-assembly
        assembly {
            // The signature data for contract signatures is appended to the concatenated signatures and the offset is stored in s
            contractSignature := add(add(signatures, offset), 0x20)
        }
        /* solhint-enable no-inline-assembly */
        if (ISignatureValidator(signer).isValidSignature(abi.encode(dataHash), contractSignature) != 0x1626ba7e) {
            _revertWithError("GS024");
        }
    }

    function checkNSignatures(address executor, bytes32 dataHash, bytes memory signatures, uint256 requiredSignatures)
        public
        view
    {
        // Check that the provided signature data is not too short
        if (signatures.length < requiredSignatures * 65) _revertWithError("GS020");
        // There cannot be an owner with address 0.
        address lastSigner = address(0);
        address currentSigner;
        uint256 v; // Implicit conversion from uint8 to uint256 will be done for v received from signatureSplit(...).
        bytes32 r;
        // NOTE: We do not enforce the `s` to be from the lower half of the curve
        // This essentially means that for every signature, there's another valid signature (known as ECDSA malleability)
        // Since we have other mechanisms to prevent duplicated signatures (ordered owners array) and replay protection (nonce),
        // we can safely ignore this malleability.
        bytes32 s;
        uint256 i;
        for (i = 0; i < requiredSignatures; ++i) {
            (v, r, s) = _signatureSplit(signatures, i);
            if (v == 0) {
                // If v is 0 then it is a contract signature
                // When handling contract signatures the address of the contract is encoded into r
                currentSigner = address(uint160(uint256(r)));

                // Check that signature data pointer (s) is not pointing inside the static part of the signatures bytes
                // This check is not completely accurate, since it is possible that more signatures than the threshold are sent.
                // Here we only check that the pointer is not pointing inside the part that is being processed
                if (uint256(s) < requiredSignatures * 65) _revertWithError("GS021");

                // The contract signature check is extracted to a separate function for better compatibility with formal verification
                // A quote from the Certora team:
                // "The assembly code broke the pointer analysis, which switched the prover in failsafe mode, where it is (a) much slower and (b) computes different hashes than in the normal mode."
                // More info here: https://github.com/safe-global/safe-smart-account/pull/661
                _checkContractSignature(currentSigner, dataHash, signatures, uint256(s));
            } else if (v == 1) {
                // If v is 1 then it is an approved hash
                // When handling approved hashes the address of the approver is encoded into r
                currentSigner = address(uint160(uint256(r)));
                // Hashes are automatically approved by the sender of the message or when they have been pre-approved via a separate transaction
                if (executor != currentSigner) _revertWithError("GS025");
            } else if (v > 30) {
                // If v > 30 then default va (27,28) has been adjusted for eth_sign flow
                // To support eth_sign and similar we adjust v and hash the messageHash with the Ethereum message prefix before applying ecrecover
                currentSigner = ecrecover(
                    keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", dataHash)), uint8(v - 4), r, s
                );
            } else {
                // Default is the ecrecover flow with the provided data hash
                // Use ecrecover with the messageHash for EOA signatures
                currentSigner = ecrecover(dataHash, uint8(v), r, s);
            }
            if (currentSigner <= lastSigner || !signers[currentSigner] || currentSigner == address(1)) {
                _revertWithError("GS026");
            }
            lastSigner = currentSigner;
        }
    }

    /**
     * @notice Splits signature bytes into `uint8 v, bytes32 r, bytes32 s`.
     * @dev Make sure to perform a bounds check for @param pos, to avoid out of bounds access on @param signatures
     *      The signature format is a compact form of {bytes32 r}{bytes32 s}{uint8 v}
     *      Compact means uint8 is not padded to 32 bytes.
     * @param pos Which signature to read.
     *            A prior bounds check of this parameter should be performed, to avoid out of bounds access.
     * @param signatures Concatenated {r, s, v} signatures.
     * @return v Recovery ID or Safe signature type.
     * @return r Output value r of the signature.
     * @return s Output value s of the signature.
     */
    function _signatureSplit(bytes memory signatures, uint256 pos)
        internal
        pure
        returns (uint8 v, bytes32 r, bytes32 s)
    {
        /* solhint-disable no-inline-assembly */
        /// @solidity memory-safe-assembly
        assembly {
            let signaturePos := mul(0x41, pos)
            r := mload(add(signatures, add(signaturePos, 0x20)))
            s := mload(add(signatures, add(signaturePos, 0x40)))
            v := byte(0, mload(add(signatures, add(signaturePos, 0x60))))
        }
        /* solhint-enable no-inline-assembly */
    }

    function _revertWithError(bytes5 error) internal pure {
        /* solhint-disable no-inline-assembly */
        /// @solidity memory-safe-assembly
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0x08c379a000000000000000000000000000000000000000000000000000000000) // Selector for method "Error(string)"
            mstore(add(ptr, 0x04), 0x20) // String offset
            mstore(add(ptr, 0x24), 0x05) // Revert reason length (5 bytes for bytes5)
            mstore(add(ptr, 0x44), error) // Revert reason
            revert(ptr, 0x64) // Revert data length is 4 bytes for selector + offset + error length + error.
        }
        /* solhint-enable no-inline-assembly */
    }
}
