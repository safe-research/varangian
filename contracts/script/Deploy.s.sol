// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity =0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {VarangianGuard} from "../src/VarangianGuard.sol";

contract DeployScript is Script {
    VarangianGuard public guard;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        uint256 delay = 0;
        // TODO: use deterministic deployment
        guard = new VarangianGuard(delay);

        vm.stopBroadcast();
    }
}
