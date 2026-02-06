// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {DeadpoolArena} from "../src/DeadpoolArena.sol";
import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

contract FundTreasury is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address arenaAddress = vm.envAddress("DEADPOOL_ARENA_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);
        DeadpoolArena arena = DeadpoolArena(payable(arenaAddress));
        arena.fundTreasury{value: 0.01 ether}();
        vm.stopBroadcast();

        console.log("Funded treasury with 0.01 ETH for:", arenaAddress);
    }
}
