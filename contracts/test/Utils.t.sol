// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {SafeUtils, SafeSignature} from "./utils/SafeUtils.sol";

contract SafeUtilsTest is Test {
    // TODO: Generate test data with another sdk and assert correctness instead of pure log
    function testBuildSignaturesBytes() public pure {
        SafeSignature[] memory sigs = new SafeSignature[](3);
        sigs[0] = SafeSignature({
            signer: address(1),
            signature: SafeUtils.buildPreApprovedSignature(address(1)),
            isDynamic: false
        });
        sigs[1] = SafeSignature({signer: address(2), signature: hex"F00BAA", isDynamic: true});
        sigs[2] = SafeSignature({signer: address(3), signature: hex"BADDAD", isDynamic: true});
        console.logString("Signature Bytes");
        bytes memory signatures = SafeUtils.buildSignaturesBytes(sigs);
        console.logBytes(signatures);
    }
}
