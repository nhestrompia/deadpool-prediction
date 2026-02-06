// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {DeadpoolArena} from "../src/DeadpoolArena.sol";
import {Test} from "forge-std/Test.sol";

contract DeadpoolArenaTest is Test {
    DeadpoolArena private arena;
    address private user = address(0xBEEF);
    address private user2 = address(0xCAFE);

    event MarketCreated(
        uint256 indexed marketId,
        string question,
        bytes32 asset,
        uint256 strike,
        bool above,
        uint64 resolveTime
    );
    event BetPlaced(address indexed user, uint256 indexed marketId, bool choice, uint256 amount);
    event BetResolved(
        address indexed user,
        uint256 indexed marketId,
        bool win,
        uint256 amount,
        uint256 newBalance,
        uint8 lossStreak
    );
    event PlayerDead(address indexed user, uint256 indexed marketId, uint256 balanceBefore);

    function setUp() public {
        arena = new DeadpoolArena();
        vm.deal(user, 50 ether);
        vm.deal(user2, 50 ether);
    }

    function testCreateMarketOnlyOwner() public {
        vm.prank(user);
        vm.expectRevert(bytes("Not owner"));
        arena.createMarket("ETH > 3000", bytes32("ETH"), 3000, true, uint64(block.timestamp + 1 hours));
    }

    function testMarketCreatedEmits() public {
        uint64 resolveTime = uint64(block.timestamp + 1 hours);
        vm.expectEmit(true, false, false, true);
        emit MarketCreated(0, "ETH > 3000", bytes32("ETH"), 3000, true, resolveTime);
        arena.createMarket("ETH > 3000", bytes32("ETH"), 3000, true, resolveTime);
    }

    function testBetPlacedEmits() public {
        uint64 resolveTime = uint64(block.timestamp + 1 hours);
        arena.createMarket("ETH > 3000", bytes32("ETH"), 3000, true, resolveTime);

        vm.prank(user);
        arena.deposit{value: 5 ether}();

        vm.prank(user);
        vm.expectEmit(true, true, false, true);
        emit BetPlaced(user, 0, true, 1 ether);
        arena.placeBet(0, true, 1 ether);
    }

    function testWinResolutionUpdatesBalanceAndStreak() public {
        uint64 resolveTime = uint64(block.timestamp + 1 hours);
        arena.createMarket("ETH > 3000", bytes32("ETH"), 3000, true, resolveTime);

        vm.prank(user);
        arena.deposit{value: 5 ether}();

        vm.prank(user);
        arena.placeBet(0, true, 1 ether);

        vm.warp(resolveTime + 1);
        arena.resolveMarketAndSettle(0, true);

        (uint256 balance, uint8 streak, bool banned) = arena.getWallet(user);
        assertEq(balance, 6 ether, "balance should reflect win");
        assertEq(streak, 0, "streak should reset");
        assertEq(banned, false, "user should be alive");
    }

    function testBetResolvedEmits() public {
        uint64 resolveTime = uint64(block.timestamp + 1 hours);
        arena.createMarket("ETH > 3000", bytes32("ETH"), 3000, true, resolveTime);

        vm.prank(user);
        arena.deposit{value: 5 ether}();

        vm.prank(user);
        arena.placeBet(0, true, 1 ether);

        vm.warp(resolveTime + 1);
        vm.expectEmit(true, true, false, true);
        emit BetResolved(user, 0, true, 1 ether, 6 ether, 0);
        arena.resolveMarketAndSettle(0, true);
    }

    function testLossIncrementsStreakAndClampsBalance() public {
        uint64 resolveTime = uint64(block.timestamp + 1 hours);
        arena.createMarket("ETH > 3000", bytes32("ETH"), 3000, true, resolveTime);

        vm.prank(user);
        arena.deposit{value: 5 ether}();

        vm.prank(user);
        arena.placeBet(0, true, 1 ether);

        vm.warp(resolveTime + 1);
        arena.resolveMarketAndSettle(0, false);

        (uint256 balance, uint8 streak, bool banned) = arena.getWallet(user);
        assertEq(balance, 2 ether, "balance should reflect loss");
        assertEq(streak, 1, "streak should increment");
        assertEq(banned, false, "user should be alive");
    }

    function testPlayerDeadEmitsOnThirdLoss() public {
        vm.prank(user);
        arena.deposit{value: 10 ether}();

        for (uint256 i = 0; i < 2; i++) {
            uint64 resolveTime = uint64(block.timestamp + 1 hours);
            arena.createMarket("ETH > 3000", bytes32("ETH"), 3000, true, resolveTime);
            vm.prank(user);
            arena.placeBet(i, true, 1 ether);
            vm.warp(resolveTime + 1);
            arena.resolveMarketAndSettle(i, false);
        }

        uint64 finalResolve = uint64(block.timestamp + 1 hours);
        arena.createMarket("ETH > 3000", bytes32("ETH"), 3000, true, finalResolve);
        vm.prank(user);
        arena.placeBet(2, true, 1 ether);
        vm.warp(finalResolve + 1);
        vm.expectEmit(true, true, false, true);
        emit PlayerDead(user, 2, 1 ether);
        arena.resolveMarketAndSettle(2, false);

        (uint256 balance, uint8 streak, bool banned) = arena.getWallet(user);
        assertEq(balance, 0, "balance should be wiped");
        assertEq(streak, 3, "streak should be 3");
        assertEq(banned, true, "user should be banned");
        assertEq(arena.deadWalletCount(), 1, "dead wallet count should be 1");
        assertEq(arena.deadWalletAt(0), user, "dead wallet should be tracked");
    }

    function testCannotBetWhenBanned() public {
        vm.prank(user);
        arena.deposit{value: 10 ether}();

        for (uint256 i = 0; i < 3; i++) {
            uint64 resolveTime = uint64(block.timestamp + 1 hours);
            arena.createMarket("ETH > 3000", bytes32("ETH"), 3000, true, resolveTime);
            vm.prank(user);
            arena.placeBet(i, true, 1 ether);
            vm.warp(resolveTime + 1);
            arena.resolveMarketAndSettle(i, false);
        }

        uint64 newResolve = uint64(block.timestamp + 1 hours);
        arena.createMarket("ETH > 3000", bytes32("ETH"), 3000, true, newResolve);
        vm.prank(user);
        vm.expectRevert(bytes("Banned"));
        arena.placeBet(3, true, 1 ether);
    }

    function testPlaceBetRules() public {
        uint64 resolveTime = uint64(block.timestamp + 1 hours);
        arena.createMarket("ETH > 3000", bytes32("ETH"), 3000, true, resolveTime);

        vm.prank(user);
        arena.deposit{value: 0.5 ether}();
        vm.prank(user);
        vm.expectRevert(bytes("Insufficient balance"));
        arena.placeBet(0, true, 1 ether);

        vm.prank(user);
        arena.deposit{value: 1 ether}();
        vm.prank(user);
        arena.placeBet(0, true, 1 ether);

        vm.prank(user);
        vm.expectRevert(bytes("Active bet"));
        arena.placeBet(0, true, 1 ether);

        vm.warp(resolveTime - 30);
        vm.prank(user2);
        arena.deposit{value: 2 ether}();
        vm.prank(user2);
        vm.expectRevert(bytes("Betting closed"));
        arena.placeBet(0, true, 1 ether);

        vm.warp(resolveTime + 1);
        arena.resolveMarketAndSettle(0, true);
        vm.prank(user2);
        vm.expectRevert(bytes("Market resolved"));
        arena.placeBet(0, true, 1 ether);
    }

    function testWithdraw() public {
        vm.prank(user);
        arena.deposit{value: 5 ether}();

        vm.prank(user);
        arena.withdraw(2 ether);

        (uint256 balance,,) = arena.getWallet(user);
        assertEq(balance, 3 ether, "withdraw should reduce balance");
    }

    function testWithdrawBlockedWithActiveBet() public {
        uint64 resolveTime = uint64(block.timestamp + 1 hours);
        arena.createMarket("ETH > 3000", bytes32("ETH"), 3000, true, resolveTime);

        vm.prank(user);
        arena.deposit{value: 5 ether}();
        vm.prank(user);
        arena.placeBet(0, true, 1 ether);

        vm.prank(user);
        vm.expectRevert(bytes("Active bet"));
        arena.withdraw(1 ether);

        vm.warp(resolveTime + 1);
        arena.resolveMarketAndSettle(0, true);
    }
}
