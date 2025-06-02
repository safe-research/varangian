// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity =0.8.30;

import {GuardManager} from "safe-smart-account/contracts/base/GuardManager.sol";
import {Enum} from "safe-smart-account/contracts/libraries/Enum.sol";

contract RemovableGuard {
    /**
     * @notice The delay for the guard removal and delegate allowance
     */
    uint256 public immutable DELAY;

    /**
     * @notice The schedule for the guard removal
     * @dev safe The address of the safe
     *      timestamp The timestamp of the schedule
     */
    mapping(address safe => uint256 timestamp) private removalSchedule;

    /**
     * @notice Event emitted when the guard removal is scheduled
     * @param safe The address of the safe
     * @param timestamp The timestamp of the schedule
     */
    event GuardRemovalScheduled(address indexed safe, uint256 timestamp);

    /**
     * @param delay The delay for the guard removal and delegate allowance
     */
    constructor(uint256 delay) {
        DELAY = delay;
    }

    /**
     * @notice Function to schedule the guard removal
     */
    function scheduleGuardRemoval() public {
        removalSchedule[msg.sender] = block.timestamp + DELAY;

        emit GuardRemovalScheduled(msg.sender, block.timestamp + DELAY);
    }

    /**
     * @notice Internal function to check if the interaction is related to Guard removal
     */
    function isRemovalInteraction(address to, bytes calldata data, Enum.Operation operation) internal returns (bool) {
        bytes4 selector = bytes4(data);
        if (operation == Enum.Operation.Call && to == address(this) && selector == this.scheduleGuardRemoval.selector) {
            return true;
        }
        // TODO: provide method that can be used with delegatecall to reset guards
        if (operation == Enum.Operation.Call && to == msg.sender && selector == GuardManager.setGuard.selector) {
            return validRemovalSchedule();
        }
        return false;
    }

    /**
     * @notice Internal function to check if the guard removal is scheduled
     */
    function validRemovalSchedule() internal view returns (bool) {
        uint256 removalTimestamp = removalSchedule[msg.sender];
        return removalTimestamp > 0 && removalTimestamp < block.timestamp;
    }

    /**
     * @notice Internal function to reset the removal schedule
     */
    function resetRemovalSchedule() internal {
        removalSchedule[msg.sender] = 0;
    }
}
