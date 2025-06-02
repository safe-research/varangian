// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.28;

import {Test, Vm} from "forge-std/Test.sol";
import {ISafe} from "safenet/contracts/src/interfaces/ISafe.sol";
import {SafenetGuard} from "safenet/contracts/src/SafenetGuard.sol";
import {SafenetGuardFactory} from "../src/SafenetGuardFactory.sol";
import {MockSafe, MockSafeEnv} from "./mocks/MockSafe.sol";
import {SafeUtils, SafeVmUtils, MultiSigSafeTx} from "./utils/SafeUtils.sol";
import {VarangianUtils} from "./utils/VarangianUtils.sol";

contract SafenetGuardFactoryTest is Test, MockSafeEnv {
    using SafeVmUtils for Vm;
    using SafeUtils for ISafe;
    using VarangianUtils for ISafe;

    SafenetGuardFactory public factory;
    address public signer;
    uint256 public signerPK;
    address[] public signers;
    MockSafe public mockSafe;
    ISafe public safe;

    // Function to set up the test environment
    function setUp() public override {
        MockSafeEnv.setUp();

        factory = new SafenetGuardFactory();

        (signer, signerPK) = makeAddrAndKey("signer");
        signers = [signer];

        mockSafe = createSafe(0, signers, 1);
        safe = ISafe(address(mockSafe));
    }

    function testRevertWithUnexpectedAddress() public {
        address expectedAddress = factory.calculateAddress(0, address(safe));
        vm.prank(address(safe));
        vm.expectRevert(abi.encodeWithSignature("UnexpectedGuardAddress(address)", expectedAddress));
        factory.deploy(0, address(1));
    }

    function testSettingUpGuard() public {
        // Checking if any guard is set in safe.
        assertEq(mockSafe.guard(), address(0));

        // Setting up the guard.
        (MultiSigSafeTx memory setupTx,) = safe.buildSetupCall(factory, multiSend);
        vm.executeSafeTxFromOwner(signer, safe, setupTx);

        // Checking if guard is set.
        address expectedAddress = factory.calculateAddress(0, address(safe));
        assertEq(mockSafe.guard(), expectedAddress);
    }

    function testSetGuarantorNotApproved() public {
        // Setting up the guard.
        (MultiSigSafeTx memory setupTx, address guard) = safe.buildSetupCall(factory, multiSend);
        vm.executeSafeTxFromOwner(signer, safe, setupTx);

        bytes memory setGuarantor = abi.encodeWithSelector(SafenetGuard.setGuarantor.selector, address(1));
        vm.executeSafeTxFromOwner(signer, safe, SafeUtils.buildContractCall(guard, setGuarantor));

        vm.expectRevert(abi.encodeWithSignature("NotApproved()"));
        vm.executeSafeTxFromOwner(signer, safe, SafeUtils.buildContractCall(address(safe), ""));
    }

    function testSetGuarantorApproved() public {
        // Setting up the guard.
        (MultiSigSafeTx memory setupTx, address guard) = safe.buildSetupCall(factory, multiSend);
        vm.executeSafeTxFromOwner(signer, safe, setupTx);

        (address guarantor, uint256 guarantorPK) = makeAddrAndKey("guarantor");
        bytes memory setGuarantor = abi.encodeWithSelector(SafenetGuard.setGuarantor.selector, guarantor);
        vm.executeSafeTxFromOwner(signer, safe, SafeUtils.buildContractCall(guard, setGuarantor));

        MultiSigSafeTx memory safeTx = SafeUtils.buildContractCall(address(safe), "");
        bytes32 safeTxHash = safe.txHash(safeTx);
        (uint8 sv, bytes32 sr, bytes32 ss) = vm.sign(signerPK, safeTxHash);
        (uint8 gv, bytes32 gr, bytes32 gs) = vm.sign(guarantorPK, safeTxHash);
        safe.executeSafeTx(safeTx, abi.encodePacked(sr, ss, sv, gr, gs, gv));
    }
}
