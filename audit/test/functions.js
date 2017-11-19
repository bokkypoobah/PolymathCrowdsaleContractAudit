// Nov 16 2017
var ethPriceUSD = 331.37;
var defaultGasPrice = web3.toWei(1, "gwei");

// -----------------------------------------------------------------------------
// Accounts
// -----------------------------------------------------------------------------
var accounts = [];
var accountNames = {};

addAccount(eth.accounts[0], "Account #0 - Miner");
addAccount(eth.accounts[1], "Account #1 - Contract Owner");
addAccount(eth.accounts[2], "Account #2 - Multisig");
addAccount(eth.accounts[3], "Account #3 - Whitelist(1)");
addAccount(eth.accounts[4], "Account #4 - Whitelist(1)");
addAccount(eth.accounts[5], "Account #5 - Whitelist(2)");
addAccount(eth.accounts[6], "Account #6");
addAccount(eth.accounts[7], "Account #7");
addAccount(eth.accounts[8], "Account #8");
addAccount(eth.accounts[9], "Account #9 - Presale Wallet");
addAccount(eth.accounts[10], "Account #9 - Vesting Wallet");

var minerAccount = eth.accounts[0];
var contractOwnerAccount = eth.accounts[1];
var multisig = eth.accounts[2];
var account3 = eth.accounts[3];
var account4 = eth.accounts[4];
var account5 = eth.accounts[5];
var account6 = eth.accounts[6];
var account7 = eth.accounts[7];
var account8 = eth.accounts[8];
var presaleWallet = eth.accounts[9];
var vestingWallet = eth.accounts[10];

var baseBlock = eth.blockNumber;

function unlockAccounts(password) {
  for (var i = 0; i < eth.accounts.length; i++) {
    personal.unlockAccount(eth.accounts[i], password, 100000);
  }
}

function addAccount(account, accountName) {
  accounts.push(account);
  accountNames[account] = accountName;
}


// -----------------------------------------------------------------------------
// Token Contract
// -----------------------------------------------------------------------------
var tokenContractAddress = null;
var tokenContractAbi = null;

function addTokenContractAddressAndAbi(address, tokenAbi) {
  tokenContractAddress = address;
  tokenContractAbi = tokenAbi;
}


// -----------------------------------------------------------------------------
// Account ETH and token balances
// -----------------------------------------------------------------------------
function printBalances() {
  var token = tokenContractAddress == null || tokenContractAbi == null ? null : web3.eth.contract(tokenContractAbi).at(tokenContractAddress);
  var decimals = token == null ? 18 : token.decimals();
  var i = 0;
  var totalTokenBalance = new BigNumber(0);
  console.log("RESULT:  # Account                                             EtherBalanceChange                          Token Name");
  console.log("RESULT: -- ------------------------------------------ --------------------------- ------------------------------ ---------------------------");
  accounts.forEach(function(e) {
    var etherBalanceBaseBlock = eth.getBalance(e, baseBlock);
    var etherBalance = web3.fromWei(eth.getBalance(e).minus(etherBalanceBaseBlock), "ether");
    var tokenBalance = token == null ? new BigNumber(0) : token.balanceOf(e).shift(-decimals);
    totalTokenBalance = totalTokenBalance.add(tokenBalance);
    console.log("RESULT: " + pad2(i) + " " + e  + " " + pad(etherBalance) + " " + padToken(tokenBalance, decimals) + " " + accountNames[e]);
    i++;
  });
  console.log("RESULT: -- ------------------------------------------ --------------------------- ------------------------------ ---------------------------");
  console.log("RESULT:                                                                           " + padToken(totalTokenBalance, decimals) + " Total Token Balances");
  console.log("RESULT: -- ------------------------------------------ --------------------------- ------------------------------ ---------------------------");
  console.log("RESULT: ");
}

function pad2(s) {
  var o = s.toFixed(0);
  while (o.length < 2) {
    o = " " + o;
  }
  return o;
}

function pad(s) {
  var o = s.toFixed(18);
  while (o.length < 27) {
    o = " " + o;
  }
  return o;
}

function padToken(s, decimals) {
  var o = s.toFixed(decimals);
  var l = parseInt(decimals)+12;
  while (o.length < l) {
    o = " " + o;
  }
  return o;
}


// -----------------------------------------------------------------------------
// Transaction status
// -----------------------------------------------------------------------------
function printTxData(name, txId) {
  var tx = eth.getTransaction(txId);
  var txReceipt = eth.getTransactionReceipt(txId);
  var gasPrice = tx.gasPrice;
  var gasCostETH = tx.gasPrice.mul(txReceipt.gasUsed).div(1e18);
  var gasCostUSD = gasCostETH.mul(ethPriceUSD);
  var block = eth.getBlock(txReceipt.blockNumber);
  console.log("RESULT: " + name + " status=" + txReceipt.status + (txReceipt.status == 0 ? " Failure" : " Success") + " gas=" + tx.gas +
    " gasUsed=" + txReceipt.gasUsed + " costETH=" + gasCostETH + " costUSD=" + gasCostUSD +
    " @ ETH/USD=" + ethPriceUSD + " gasPrice=" + web3.fromWei(gasPrice, "gwei") + " gwei block=" + 
    txReceipt.blockNumber + " txIx=" + tx.transactionIndex + " txId=" + txId +
    " @ " + block.timestamp + " " + new Date(block.timestamp * 1000).toUTCString());
}

function assertEtherBalance(account, expectedBalance) {
  var etherBalance = web3.fromWei(eth.getBalance(account), "ether");
  if (etherBalance == expectedBalance) {
    console.log("RESULT: OK " + account + " has expected balance " + expectedBalance);
  } else {
    console.log("RESULT: FAILURE " + account + " has balance " + etherBalance + " <> expected " + expectedBalance);
  }
}

function failIfTxStatusError(tx, msg) {
  var status = eth.getTransactionReceipt(tx).status;
  if (status == 0) {
    console.log("RESULT: FAIL " + msg);
    return 0;
  } else {
    console.log("RESULT: PASS " + msg);
    return 1;
  }
}

function passIfTxStatusError(tx, msg) {
  var status = eth.getTransactionReceipt(tx).status;
  if (status == 1) {
    console.log("RESULT: FAIL " + msg);
    return 0;
  } else {
    console.log("RESULT: PASS " + msg);
    return 1;
  }
}

function gasEqualsGasUsed(tx) {
  var gas = eth.getTransaction(tx).gas;
  var gasUsed = eth.getTransactionReceipt(tx).gasUsed;
  return (gas == gasUsed);
}

function failIfGasEqualsGasUsed(tx, msg) {
  var gas = eth.getTransaction(tx).gas;
  var gasUsed = eth.getTransactionReceipt(tx).gasUsed;
  if (gas == gasUsed) {
    console.log("RESULT: FAIL " + msg);
    return 0;
  } else {
    console.log("RESULT: PASS " + msg);
    return 1;
  }
}

function passIfGasEqualsGasUsed(tx, msg) {
  var gas = eth.getTransaction(tx).gas;
  var gasUsed = eth.getTransactionReceipt(tx).gasUsed;
  if (gas == gasUsed) {
    console.log("RESULT: PASS " + msg);
    return 1;
  } else {
    console.log("RESULT: FAIL " + msg);
    return 0;
  }
}

function failIfGasEqualsGasUsedOrContractAddressNull(contractAddress, tx, msg) {
  if (contractAddress == null) {
    console.log("RESULT: FAIL " + msg);
    return 0;
  } else {
    var gas = eth.getTransaction(tx).gas;
    var gasUsed = eth.getTransactionReceipt(tx).gasUsed;
    if (gas == gasUsed) {
      console.log("RESULT: FAIL " + msg);
      return 0;
    } else {
      console.log("RESULT: PASS " + msg);
      return 1;
    }
  }
}


//-----------------------------------------------------------------------------
// Wait until some unixTime + additional seconds
//-----------------------------------------------------------------------------
function waitUntil(message, unixTime, addSeconds) {
  var t = parseInt(unixTime) + parseInt(addSeconds) + parseInt(1);
  var time = new Date(t * 1000);
  console.log("RESULT: Waiting until '" + message + "' at " + unixTime + "+" + addSeconds + "s =" + time + " now=" + new Date());
  while ((new Date()).getTime() <= time.getTime()) {
  }
  console.log("RESULT: Waited until '" + message + "' at at " + unixTime + "+" + addSeconds + "s =" + time + " now=" + new Date());
  console.log("RESULT: ");
}


//-----------------------------------------------------------------------------
// Wait until some block
//-----------------------------------------------------------------------------
function waitUntilBlock(message, block, addBlocks) {
  var b = parseInt(block) + parseInt(addBlocks);
  console.log("RESULT: Waiting until '" + message + "' #" + block + "+" + addBlocks + " = #" + b + " currentBlock=" + eth.blockNumber);
  while (eth.blockNumber <= b) {
  }
  console.log("RESULT: Waited until '" + message + "' #" + block + "+" + addBlocks + " = #" + b + " currentBlock=" + eth.blockNumber);
  console.log("RESULT: ");
}


//-----------------------------------------------------------------------------
// Sale Contract
//-----------------------------------------------------------------------------
var saleContractAddress = null;
var saleContractAbi = null;

function addSaleContractAddressAndAbi(address, abi) {
  saleContractAddress = address;
  saleContractAbi = abi;
}

var saleFromBlock = 0;
function printSaleContractDetails() {
  console.log("RESULT: saleContractAddress=" + saleContractAddress);
  // console.log("RESULT: saleContractAbi=" + JSON.stringify(saleContractAbi));
  if (saleContractAddress != null && saleContractAbi != null) {
    var contract = eth.contract(saleContractAbi).at(saleContractAddress);
    console.log("RESULT: sale.owner=" + contract.owner());
    console.log("RESULT: sale.owner=" + contract.owner());
    console.log("RESULT: sale.proposedOwner=" + contract.proposedOwner());
    console.log("RESULT: sale.opsAddress=" + contract.opsAddress());
    console.log("RESULT: sale.finalized=" + contract.finalized());
    console.log("RESULT: sale.STAGE1_STARTTIME=" + contract.STAGE1_STARTTIME() + " " + new Date(contract.STAGE1_STARTTIME() * 1000).toUTCString());
    console.log("RESULT: sale.STAGE1_ENDTIME=" + contract.STAGE1_ENDTIME() + " " + new Date(contract.STAGE1_ENDTIME() * 1000).toUTCString());
    console.log("RESULT: sale.DECIMALSFACTOR=" + contract.DECIMALSFACTOR() + " " + contract.DECIMALSFACTOR().shift(-18));
    console.log("RESULT: sale.TOKENS_TOTAL=" + contract.TOKENS_TOTAL() + " " + contract.TOKENS_TOTAL().shift(-18));
    console.log("RESULT: sale.TOKENS_SALE=" + contract.TOKENS_SALE() + " " + contract.TOKENS_SALE().shift(-18));
    console.log("RESULT: sale.TOKENS_FOUNDERS=" + contract.TOKENS_FOUNDERS() + " " + contract.TOKENS_FOUNDERS().shift(-18));
    console.log("RESULT: sale.TOKENS_PARTNERS=" + contract.TOKENS_PARTNERS() + " " + contract.TOKENS_PARTNERS().shift(-18));
    console.log("RESULT: sale.TOKENS_FUTURE=" + contract.TOKENS_FUTURE() + " " + contract.TOKENS_FUTURE().shift(-18));
    console.log("RESULT: sale.CONTRIBUTION_MIN=" + contract.CONTRIBUTION_MIN() + " " + contract.CONTRIBUTION_MIN().shift(-18));
    console.log("RESULT: sale.TOKENS_PER_KETHER=" + contract.TOKENS_PER_KETHER());
    console.log("RESULT: sale.BONUS=" + contract.BONUS());
    console.log("RESULT: sale.TOKENS_ACCOUNT_MAX=" + contract.TOKENS_ACCOUNT_MAX() + " " + contract.TOKENS_ACCOUNT_MAX().shift(-18));
    console.log("RESULT: sale.finalized=" + contract.finalized());
    console.log("RESULT: sale.startTime=" + contract.startTime() + " " + new Date(contract.startTime() * 1000).toUTCString());
    console.log("RESULT: sale.endTime=" + contract.endTime() + " " + new Date(contract.endTime() * 1000).toUTCString());
    console.log("RESULT: sale.suspended=" + contract.suspended());
    console.log("RESULT: sale.tokensPerKEther=" + contract.tokensPerKEther());
    console.log("RESULT: sale.bonus=" + contract.bonus());
    console.log("RESULT: sale.maxTokensPerAccount=" + contract.maxTokensPerAccount() + " " + contract.maxTokensPerAccount().shift(-18));
    console.log("RESULT: sale.contributionMin=" + contract.contributionMin() + " " + contract.contributionMin().shift(-18));
    console.log("RESULT: sale.tokenConversionFactor=" + contract.tokenConversionFactor());
    console.log("RESULT: sale.walletAddress=" + contract.walletAddress());
    console.log("RESULT: sale.token=" + contract.token());
    console.log("RESULT: sale.totalTokensSold=" + contract.totalTokensSold() + " " + contract.totalTokensSold().shift(-18));
    console.log("RESULT: sale.totalEtherCollected=" + contract.totalEtherCollected() + " " + contract.totalEtherCollected().shift(-18));
    console.log("RESULT: sale.currentStage=" + contract.currentStage());

    var latestBlock = eth.blockNumber;
    var i;

    var ownershipTransferInitiatedEvents = contract.OwnershipTransferInitiated({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    ownershipTransferInitiatedEvents.watch(function (error, result) {
      console.log("RESULT: OwnershipTransferInitiated " + i++ + " #" + result.blockNumber + ": " + JSON.stringify(result.args));
    });
    ownershipTransferInitiatedEvents.stopWatching();

    var ownershipTransferCompletedEvents = contract.OwnershipTransferCompleted({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    ownershipTransferCompletedEvents.watch(function (error, result) {
      console.log("RESULT: OwnershipTransferCompleted " + i++ + " #" + result.blockNumber + ": " + JSON.stringify(result.args));
    });
    ownershipTransferCompletedEvents.stopWatching();

    var opsAddressUpdatedEvents = contract.OpsAddressUpdated({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    opsAddressUpdatedEvents.watch(function (error, result) {
      console.log("RESULT: OpsAddressUpdated " + i++ + " #" + result.blockNumber + ": " + JSON.stringify(result.args));
    });
    opsAddressUpdatedEvents.stopWatching();

    var finalizedEvents = contract.Finalized({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    finalizedEvents.watch(function (error, result) {
      console.log("RESULT: Finalized " + i++ + " #" + result.blockNumber + ": " + JSON.stringify(result.args));
    });
    finalizedEvents.stopWatching();

    var initializedEvents = contract.Initialized({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    initializedEvents.watch(function (error, result) {
      console.log("RESULT: Initialized " + i++ + " #" + result.blockNumber + ": " + JSON.stringify(result.args));
    });
    initializedEvents.stopWatching();

    var tokensPerKEtherUpdatedEvents = contract.TokensPerKEtherUpdated({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    tokensPerKEtherUpdatedEvents.watch(function (error, result) {
      console.log("RESULT: TokensPerKEtherUpdated " + i++ + " #" + result.blockNumber + ": " + JSON.stringify(result.args));
    });
    tokensPerKEtherUpdatedEvents.stopWatching();

    var maxTokensPerAccountUpdatedEvents = contract.MaxTokensPerAccountUpdated({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    maxTokensPerAccountUpdatedEvents.watch(function (error, result) {
      console.log("RESULT: MaxTokensPerAccountUpdated " + i++ + " #" + result.blockNumber + ": " + JSON.stringify(result.args));
    });
    maxTokensPerAccountUpdatedEvents.stopWatching();

    var bonusUpdatedEvents = contract.BonusUpdated({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    bonusUpdatedEvents.watch(function (error, result) {
      console.log("RESULT: BonusUpdated " + i++ + " #" + result.blockNumber + ": " + JSON.stringify(result.args));
    });
    bonusUpdatedEvents.stopWatching();

    var saleWindowUpdatedEvents = contract.SaleWindowUpdated({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    saleWindowUpdatedEvents.watch(function (error, result) {
      console.log("RESULT: SaleWindowUpdated " + i++ + " #" + result.blockNumber + ": " + JSON.stringify(result.args));
    });
    saleWindowUpdatedEvents.stopWatching();

    var walletAddressUpdatedEvents = contract.WalletAddressUpdated({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    walletAddressUpdatedEvents.watch(function (error, result) {
      console.log("RESULT: WalletAddressUpdated " + i++ + " #" + result.blockNumber + ": " + JSON.stringify(result.args));
    });
    walletAddressUpdatedEvents.stopWatching();

    var saleSuspendedEvents = contract.SaleSuspended({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    saleSuspendedEvents.watch(function (error, result) {
      console.log("RESULT: SaleSuspended " + i++ + " #" + result.blockNumber + ": " + JSON.stringify(result.args));
    });
    saleSuspendedEvents.stopWatching();

    var saleResumedEvents = contract.SaleResumed({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    saleResumedEvents.watch(function (error, result) {
      console.log("RESULT: SaleResumed " + i++ + " #" + result.blockNumber + ": " + JSON.stringify(result.args));
    });
    saleResumedEvents.stopWatching();

    var tokensPurchasedEvents = contract.TokensPurchased({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    tokensPurchasedEvents.watch(function (error, result) {
      console.log("RESULT: TokensPurchased " + i++ + " #" + result.blockNumber + ": " + JSON.stringify(result.args));
    });
    tokensPurchasedEvents.stopWatching();

    var tokensReclaimedEvents = contract.TokensReclaimed({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    tokensReclaimedEvents.watch(function (error, result) {
      console.log("RESULT: TokensReclaimed " + i++ + " #" + result.blockNumber + ": " + JSON.stringify(result.args));
    });
    tokensReclaimedEvents.stopWatching();

    var currentStageUpdatedEvents = contract.CurrentStageUpdated({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    currentStageUpdatedEvents.watch(function (error, result) {
      console.log("RESULT: CurrentStageUpdated " + i++ + " #" + result.blockNumber + ": " + JSON.stringify(result.args));
    });
    currentStageUpdatedEvents.stopWatching();

    var whitelistedStatusUpdatedEvents = contract.WhitelistedStatusUpdated({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    whitelistedStatusUpdatedEvents.watch(function (error, result) {
      console.log("RESULT: WhitelistedStatusUpdated " + i++ + " #" + result.blockNumber + ": " + JSON.stringify(result.args));
    });
    whitelistedStatusUpdatedEvents.stopWatching();

    saleFromBlock = parseInt(latestBlock) + 1;
  }
}


//-----------------------------------------------------------------------------
// Token Contract
//-----------------------------------------------------------------------------
var tokenFromBlock = 0;
function printTokenContractDetails() {
  console.log("RESULT: tokenContractAddress=" + tokenContractAddress);
  // console.log("RESULT: tokenContractAbi=" + JSON.stringify(tokenContractAbi));
  if (tokenContractAddress != null && tokenContractAbi != null) {
    var contract = eth.contract(tokenContractAbi).at(tokenContractAddress);
    var decimals = contract.decimals();
    console.log("RESULT: token.owner=" + contract.owner());
    console.log("RESULT: token.proposedOwner=" + contract.proposedOwner());
    console.log("RESULT: token.opsAddress=" + contract.opsAddress());
    console.log("RESULT: token.symbol=" + contract.symbol());
    console.log("RESULT: token.name=" + contract.name());
    console.log("RESULT: token.decimals=" + decimals);
    console.log("RESULT: token.totalSupply=" + contract.totalSupply().shift(-decimals));
    console.log("RESULT: token.DECIMALSFACTOR=" + contract.DECIMALSFACTOR() + " " + contract.DECIMALSFACTOR().shift(-18));
    console.log("RESULT: token.finalized=" + contract.finalized());

    var latestBlock = eth.blockNumber;
    var i;

    var ownershipTransferInitiatedEvents = contract.OwnershipTransferInitiated({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    ownershipTransferInitiatedEvents.watch(function (error, result) {
      console.log("RESULT: OwnershipTransferInitiated " + i++ + " #" + result.blockNumber + ": " + JSON.stringify(result.args));
    });
    ownershipTransferInitiatedEvents.stopWatching();

    var ownershipTransferCompletedEvents = contract.OwnershipTransferCompleted({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    ownershipTransferCompletedEvents.watch(function (error, result) {
      console.log("RESULT: OwnershipTransferCompleted " + i++ + " #" + result.blockNumber + ": " + JSON.stringify(result.args));
    });
    ownershipTransferCompletedEvents.stopWatching();

    var opsAddressUpdatedEvents = contract.OpsAddressUpdated({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    opsAddressUpdatedEvents.watch(function (error, result) {
      console.log("RESULT: OpsAddressUpdated " + i++ + " #" + result.blockNumber + ": " + JSON.stringify(result.args));
    });
    opsAddressUpdatedEvents.stopWatching();

    var finalizedEvents = contract.Finalized({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    finalizedEvents.watch(function (error, result) {
      console.log("RESULT: Finalized " + i++ + " #" + result.blockNumber + ": " + JSON.stringify(result.args));
    });
    finalizedEvents.stopWatching();

    var approvalEvents = contract.Approval({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    approvalEvents.watch(function (error, result) {
      console.log("RESULT: Approval " + i++ + " #" + result.blockNumber + " _owner=" + result.args._owner + " _spender=" + result.args._spender +
        " _value=" + result.args._value.shift(-decimals));
    });
    approvalEvents.stopWatching();

    var transferEvents = contract.Transfer({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    transferEvents.watch(function (error, result) {
      console.log("RESULT: Transfer " + i++ + " #" + result.blockNumber + ": _from=" + result.args._from + " _to=" + result.args._to +
        " _value=" + result.args._value.shift(-decimals));
    });
    transferEvents.stopWatching();

    tokenFromBlock = parseInt(latestBlock) + 1;
  }
}


//-----------------------------------------------------------------------------
// Vesting Contract
//-----------------------------------------------------------------------------
var vestingContractAddress = null;
var vestingContractAbi = null;

function addVestingContractAddressAndAbi(address, abi) {
  vestingContractAddress = address;
  vestingContractAbi = abi;
}

function printVestingContractDetails() {
  console.log("RESULT: vestingContractAddress=" + vestingContractAddress);
  // console.log("RESULT: vestingContractAbi=" + JSON.stringify(vestingContractAbi));
  if (vestingContractAddress != null && vestingContractAbi != null) {
    var contract = eth.contract(vestingContractAbi).at(vestingContractAddress);
    console.log("RESULT: vesting.token=" + contract.token());
    console.log("RESULT: vesting.releaseTime=" + contract.releaseTime() + " " + new Date(contract.releaseTime() * 1000).toUTCString());
    console.log("RESULT: vesting.vestingAmount=" + contract.vestingAmount() + " " + contract.vestingAmount().shift(-18));
  }
}
