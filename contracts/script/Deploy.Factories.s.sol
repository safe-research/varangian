// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {SafenetGuardFactory} from "../src/SafenetGuardFactory.sol";

contract DeployScript is Script {
    SafenetGuardFactory public factory;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        // TODO: use deterministic deployment
        factory = new SafenetGuardFactory{salt: 0}();

        vm.stopBroadcast();
    }
}
