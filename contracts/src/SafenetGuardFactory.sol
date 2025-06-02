// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.28;

import {SafenetGuard} from "safenet/contracts/src/SafenetGuard.sol";

contract SafenetGuardFactory {
    error UnexpectedGuardAddress(address guard);

    /// @dev Allows to retrieve the creation code used for the Guard deployment.
    function creationCode() public pure returns (bytes memory) {
        return type(SafenetGuard).creationCode;
    }

    function calculateAddress(bytes32 salt, address manager) public view returns (address predictedAddress) {
        // Concatenate the creation bytecode with the ABI-encoded constructor arguments
        bytes memory initCode = abi.encodePacked(creationCode(), abi.encode(manager, 7 days));

        // Calculate the keccak256 hash of the full initialization code
        bytes32 initCodeHash = keccak256(initCode);

        // Compute the CREATE2 address as per EIP-1014
        predictedAddress = address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            bytes1(0xff), // Prefix byte to distinguish from CREATE1
                            address(this), // Address of the deployer
                            salt, // The salt
                            initCodeHash // Hash of the contract's initialization code
                        )
                    )
                )
            )
        );

        return predictedAddress;
    }

    function deploy(bytes32 salt, address expectedAddress) public returns (SafenetGuard guard) {
        guard = new SafenetGuard{salt: salt}(msg.sender, 7 days);
        require(
            expectedAddress == address(0) || address(guard) == expectedAddress, UnexpectedGuardAddress(address(guard))
        );
    }
}
