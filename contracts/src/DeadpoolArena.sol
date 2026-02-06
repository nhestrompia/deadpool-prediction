// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract DeadpoolArena {
    struct Wallet {
        uint256 balance;
        uint8 lossStreak;
        bool banned;
        bool initialized;
    }

    struct Market {
        string question;
        bytes32 asset;
        uint256 strike;
        bool above; //why?
        uint64 resolveTime;
        bool resolved;
        bool outcome;
    }

    struct Bet {
        uint256 marketId;
        uint256 amount;
        bool choice;
        uint64 placedAt;
        bool active;
    }

    uint256 public constant BETTING_CLOSE_WINDOW = 60;

    mapping(address => Wallet) private wallets;
    mapping(uint256 => Market) private markets;
    mapping(address => Bet) private activeBets;
    mapping(uint256 => address[]) private marketBettors;
    mapping(uint256 => mapping(address => bool)) private marketHasBettor;
    address[] private deadWallets;
    mapping(address => uint256) private deadIndex;

    uint256 public nextMarketId;
    address public owner;
    address public oracle;

    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status = _NOT_ENTERED;

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
    event Deposit(address indexed user, uint256 amount, uint256 newBalance);
    event Withdraw(address indexed user, uint256 amount, uint256 newBalance);
    event OracleUpdated(address indexed newOracle);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyOracle() {
        require(msg.sender == owner || msg.sender == oracle, "Not oracle");
        _;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "Reentrancy");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    constructor() {
        owner = msg.sender;
        oracle = msg.sender;
    }

    receive() external payable {
        _deposit(msg.sender, msg.value);
    }

    function setOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Zero address");
        oracle = newOracle;
        emit OracleUpdated(newOracle);
    }

    function deposit() external payable nonReentrant {
        _deposit(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount zero");
        Bet storage bet = activeBets[msg.sender];
        require(!bet.active, "Active bet");
        Wallet storage wallet = wallets[msg.sender];
        require(wallet.balance >= amount, "Insufficient balance");

        wallet.balance -= amount;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Withdraw failed");
        emit Withdraw(msg.sender, amount, wallet.balance);
    }

    function createMarket(
        string calldata question,
        bytes32 asset,
        uint256 strike,
        bool above,
        uint64 resolveTime
    ) external onlyOwner returns (uint256 marketId) {
        require(bytes(question).length != 0, "Empty question");
        require(resolveTime > block.timestamp, "Resolve time in past");

        marketId = nextMarketId++;
        markets[marketId] = Market({
            question: question,
            asset: asset,
            strike: strike,
            above: above,
            resolveTime: resolveTime,
            resolved: false,
            outcome: false
        });

        emit MarketCreated(marketId, question, asset, strike, above, resolveTime);
    }

    function resolveMarket(uint256 marketId, bool outcome) external onlyOracle {
        require(marketId < nextMarketId, "Market not found");
        Market storage market = markets[marketId];
        require(!market.resolved, "Market resolved");
        require(block.timestamp >= market.resolveTime, "Too early");

        market.resolved = true;
        market.outcome = outcome;
    }

    function resolveMarketAndSettle(uint256 marketId, bool outcome) external onlyOracle {
        require(marketId < nextMarketId, "Market not found");
        Market storage market = markets[marketId];
        require(!market.resolved, "Market resolved");
        require(block.timestamp >= market.resolveTime, "Too early");

        market.resolved = true;
        market.outcome = outcome;

        _settleMarketBets(marketId, market);
    }

    function settleMarketBets(uint256 marketId) external onlyOracle {
        require(marketId < nextMarketId, "Market not found");
        Market storage market = markets[marketId];
        require(market.resolved, "Market not resolved");

        _settleMarketBets(marketId, market);
    }

    function placeBet(uint256 marketId, bool choice, uint256 amount) external {
        require(amount > 0, "Amount zero");
        require(marketId < nextMarketId, "Market not found");
        Market storage market = markets[marketId];
        require(!market.resolved, "Market resolved");
        require(block.timestamp + BETTING_CLOSE_WINDOW < market.resolveTime, "Betting closed");

        Wallet storage wallet = wallets[msg.sender];
        _initWallet(wallet);
        require(!wallet.banned, "Banned");

        Bet storage bet = activeBets[msg.sender];
        require(!bet.active, "Active bet");
        require(wallet.balance >= amount, "Insufficient balance");

        wallet.balance -= amount;
        activeBets[msg.sender] = Bet({
            marketId: marketId,
            amount: amount,
            choice: choice,
            placedAt: uint64(block.timestamp),
            active: true
        });

        if (!marketHasBettor[marketId][msg.sender]) {
            marketHasBettor[marketId][msg.sender] = true;
            marketBettors[marketId].push(msg.sender);
        }

        emit BetPlaced(msg.sender, marketId, choice, amount);
    }

    function resolveMyBet() external {
        Bet storage bet = activeBets[msg.sender];
        require(bet.active, "No active bet");
        Market storage market = markets[bet.marketId];
        require(market.resolved, "Market not resolved");

        Wallet storage wallet = wallets[msg.sender];
        _settleBet(msg.sender, bet, market, wallet);

        delete activeBets[msg.sender];
    }

    function getWallet(address user)
        external
        view
        returns (uint256 balance, uint8 lossStreak, bool banned)
    {
        Wallet storage wallet = wallets[user];
        return (wallet.balance, wallet.lossStreak, wallet.banned);
    }

    function deadWalletCount() external view returns (uint256) {
        return deadWallets.length;
    }

    function deadWalletAt(uint256 index) external view returns (address) {
        require(index < deadWallets.length, "Index out of bounds");
        return deadWallets[index];
    }

    function getDeadWallets(uint256 start, uint256 count) external view returns (address[] memory) {
        uint256 total = deadWallets.length;
        if (start >= total) {
            return new address[](0);
        }
        uint256 end = start + count;
        if (end > total) {
            end = total;
        }
        address[] memory slice = new address[](end - start);
        for (uint256 i = start; i < end; i++) {
            slice[i - start] = deadWallets[i];
        }
        return slice;
    }

    function getMarket(uint256 marketId)
        external
        view
        returns (
            string memory question,
            bytes32 asset,
            uint256 strike,
            bool above,
            uint64 resolveTime,
            bool resolved,
            bool outcome
        )
    {
        require(marketId < nextMarketId, "Market not found");
        Market storage market = markets[marketId];
        return (
            market.question,
            market.asset,
            market.strike,
            market.above,
            market.resolveTime,
            market.resolved,
            market.outcome
        );
    }

    function getActiveBet(address user)
        external
        view
        returns (uint256 marketId, uint256 amount, bool choice, uint64 placedAt)
    {
        Bet storage bet = activeBets[user];
        return (bet.marketId, bet.amount, bet.choice, bet.placedAt);
    }

    function _initWallet(Wallet storage wallet) internal {
        if (!wallet.initialized) {
            wallet.initialized = true;
        }
    }

    function _deposit(address user, uint256 amount) internal {
        require(amount > 0, "Amount zero");
        Wallet storage wallet = wallets[user];
        _initWallet(wallet);
        wallet.balance += amount;
        emit Deposit(user, amount, wallet.balance);
    }

    function _settleMarketBets(uint256 marketId, Market storage market) internal {
        address[] storage bettors = marketBettors[marketId];
        for (uint256 i = 0; i < bettors.length; i++) {
            address user = bettors[i];
            Bet storage bet = activeBets[user];
            if (!bet.active || bet.marketId != marketId) {
                continue;
            }
            Wallet storage wallet = wallets[user];
            _settleBet(user, bet, market, wallet);
            delete activeBets[user];
        }
    }

    function _settleBet(
        address user,
        Bet storage bet,
        Market storage market,
        Wallet storage wallet
    ) internal {
        bool win = bet.choice == market.outcome;
        if (win) {
            wallet.balance += bet.amount * 2;
            wallet.lossStreak = 0;
        } else {
            uint256 penalty = bet.amount * 2;
            if (wallet.balance >= penalty) {
                wallet.balance -= penalty;
            } else {
                wallet.balance = 0;
            }
            wallet.lossStreak += 1;
            if (wallet.lossStreak == 3) {
                uint256 balanceBefore = wallet.balance;
                wallet.banned = true;
                wallet.balance = 0;
                if (deadIndex[user] == 0) {
                    deadWallets.push(user);
                    deadIndex[user] = deadWallets.length;
                }
                emit PlayerDead(user, bet.marketId, balanceBefore);
            }
        }

        emit BetResolved(user, bet.marketId, win, bet.amount, wallet.balance, wallet.lossStreak);
    }
}
