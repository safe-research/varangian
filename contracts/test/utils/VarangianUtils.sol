// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.28;

import {Vm} from "forge-std/Vm.sol";
import {MultiSendCallOnly} from "safe-smart-account/contracts/libraries/MultiSendCallOnly.sol";
import {SafenetGuardFactory} from "../../src/SafenetGuardFactory.sol";
import {SafeUtils, SafeTxUtils, MultiSigSafeTx, SafeTx, Enum, ISafe} from "./SafeUtils.sol";

library VarangianUtils {
    using SafeTxUtils for SafeTx;

    function buildSetupCall(ISafe safe, SafenetGuardFactory factory, MultiSendCallOnly multiSend)
        internal
        view
        returns (MultiSigSafeTx memory safeTx, address expectedGuard)
    {
        expectedGuard = factory.calculateAddress(0, address(safe));
        SafeTx[] memory txs = new SafeTx[](2);
        txs[0] = SafeTx({
            to: address(factory),
            value: 0,
            data: abi.encodeWithSelector(factory.deploy.selector, 0, address(expectedGuard)),
            operation: Enum.Operation.Call
        });
        txs[1] = SafeTx({
            to: address(safe),
            value: 0,
            data: abi.encodeWithSelector(safe.setGuard.selector, address(expectedGuard)),
            operation: Enum.Operation.Call
        });
        safeTx = SafeTx({
            to: address(multiSend),
            value: 0,
            data: SafeUtils.encodeMultiSend(txs),
            operation: Enum.Operation.DelegateCall
        }).asMultiSigTx();
    }
}
