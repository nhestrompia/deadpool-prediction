// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {DeadpoolArena} from "../src/DeadpoolArena.sol";
import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";


contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        DeadpoolArena arena = new DeadpoolArena();
        vm.stopBroadcast();
        
        console.log("DeadpoolArena deployed at:", address(arena));
    }
}