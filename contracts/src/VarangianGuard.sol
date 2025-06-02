// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity =0.8.30;

import {ITransactionGuard, IERC165, GuardManager} from "safe-smart-account/contracts/base/GuardManager.sol";
import {IModuleGuard} from "safe-smart-account/contracts/base/ModuleManager.sol";
import {Enum} from "safe-smart-account/contracts/libraries/Enum.sol";
import {SafeInterface} from "./interfaces/SafeInterface.sol";
import {RemovableGuard} from "./RemovableGuard.sol";

contract VarangianGuard is RemovableGuard, ITransactionGuard, IModuleGuard {
    /**
     * @param delay The delay for the guard removal and delegate allowance
     */
    constructor(uint256 delay) RemovableGuard(delay) {}

    /**
     * @inheritdoc ITransactionGuard
     * @dev This is not a view function because of one time delegate transactions and guard removal updates
     */
    function checkTransaction(
        address to,
        uint256,
        bytes calldata data,
        Enum.Operation operation,
        uint256,
        uint256,
        uint256,
        address,
        address payable,
        bytes calldata,
        address
    ) external override {
        if (isRemovalInteraction(to, data, operation)) {
            // Reset removal schedule:
            // - If the process is started this value will be set when scheduling the removal
            // - If the process is being finished the value should be reset in any case
            resetRemovalSchedule();
            // Skip guard when related to guard removal process, to always make it possible to remove the guard
            return;
        }
    }

    /**
     * @inheritdoc ITransactionGuard
     */
    function checkAfterExecution(bytes32, bool) external {}

    /**
     * @inheritdoc IModuleGuard
     */
    function checkModuleTransaction(address to, uint256, bytes calldata data, Enum.Operation operation, address)
        external
        override
        returns (bytes32)
    {
        return bytes32(0);
    }

    /**
     * @inheritdoc IModuleGuard
     */
    function checkAfterModuleExecution(bytes32, bool) external {}

    /**
     * @inheritdoc IERC165
     */
    function supportsInterface(bytes4 interfaceId) external pure returns (bool supported) {
        supported = interfaceId == type(IERC165).interfaceId || interfaceId == type(IModuleGuard).interfaceId
            || interfaceId == type(ITransactionGuard).interfaceId;
    }
}
