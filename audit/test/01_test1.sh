#!/bin/bash
# ----------------------------------------------------------------------------------------------
# Testing the smart contract
#
# Enjoy. (c) BokkyPooBah / Bok Consulting Pty Ltd 2017. The MIT Licence.
# ----------------------------------------------------------------------------------------------

MODE=${1:-test}

GETHATTACHPOINT=`grep ^IPCFILE= settings.txt | sed "s/^.*=//"`
PASSWORD=`grep ^PASSWORD= settings.txt | sed "s/^.*=//"`

CONTRACTSDIR=`grep ^CONTRACTSDIR= settings.txt | sed "s/^.*=//"`
LIBSDIR=`grep ^LIBSDIR= settings.txt | sed "s/^.*=//"`

TOKENSOL=`grep ^TOKENSOL= settings.txt | sed "s/^.*=//"`
TOKENJS=`grep ^TOKENJS= settings.txt | sed "s/^.*=//"`

SALESOL=`grep ^SALESOL= settings.txt | sed "s/^.*=//"`
SALEJS=`grep ^SALEJS= settings.txt | sed "s/^.*=//"`

VESTINGSOL=`grep ^VESTINGSOL= settings.txt | sed "s/^.*=//"`
VESTINGJS=`grep ^VESTINGJS= settings.txt | sed "s/^.*=//"`

DEPLOYMENTDATA=`grep ^DEPLOYMENTDATA= settings.txt | sed "s/^.*=//"`

INCLUDEJS=`grep ^INCLUDEJS= settings.txt | sed "s/^.*=//"`
TEST1OUTPUT=`grep ^TEST1OUTPUT= settings.txt | sed "s/^.*=//"`
TEST1RESULTS=`grep ^TEST1RESULTS= settings.txt | sed "s/^.*=//"`

CURRENTTIME=`date +%s`
CURRENTTIMES=`date -r $CURRENTTIME -u`

# Setting time to be a block representing one day
BLOCKSINDAY=1

if [ "$MODE" == "dev" ]; then
  # Start time now
  STARTTIME=`echo "$CURRENTTIME" | bc`
else
  # Start time 1m 10s in the future
  STARTTIME=`echo "$CURRENTTIME+75" | bc`
fi
STARTTIME_S=`date -r $STARTTIME -u`
ENDTIME=`echo "$CURRENTTIME+60*2" | bc`
ENDTIME_S=`date -r $ENDTIME -u`
RELEASETIME=`echo "$CURRENTTIME+60*3" | bc`
RELEASETIME_S=`date -r $RELEASETIME -u`

printf "MODE            = '$MODE'\n" | tee $TEST1OUTPUT
printf "GETHATTACHPOINT = '$GETHATTACHPOINT'\n" | tee -a $TEST1OUTPUT
printf "PASSWORD        = '$PASSWORD'\n" | tee -a $TEST1OUTPUT

printf "CONTRACTSDIR    = '$CONTRACTSDIR'\n" | tee -a $TEST1OUTPUT
printf "LIBSDIR         = '$LIBSDIR'\n" | tee -a $TEST1OUTPUT

printf "TOKENSOL        = '$TOKENSOL'\n" | tee -a $TEST1OUTPUT
printf "TOKENJS         = '$TOKENJS'\n" | tee -a $TEST1OUTPUT

printf "SALESOL         = '$SALESOL'\n" | tee -a $TEST1OUTPUT
printf "SALEJS          = '$SALEJS'\n" | tee -a $TEST1OUTPUT

printf "VESTINGSOL      = '$VESTINGSOL'\n" | tee -a $TEST1OUTPUT
printf "VESTINGJS       = '$VESTINGJS'\n" | tee -a $TEST1OUTPUT

printf "DEPLOYMENTDATA  = '$DEPLOYMENTDATA'\n" | tee -a $TEST1OUTPUT
printf "INCLUDEJS       = '$INCLUDEJS'\n" | tee -a $TEST1OUTPUT
printf "TEST1OUTPUT     = '$TEST1OUTPUT'\n" | tee -a $TEST1OUTPUT
printf "TEST1RESULTS    = '$TEST1RESULTS'\n" | tee -a $TEST1OUTPUT
printf "CURRENTTIME     = '$CURRENTTIME' '$CURRENTTIMES'\n" | tee -a $TEST1OUTPUT
printf "STARTTIME       = '$STARTTIME' '$STARTTIME_S'\n" | tee -a $TEST1OUTPUT
printf "ENDTIME         = '$ENDTIME' '$ENDTIME_S'\n" | tee -a $TEST1OUTPUT
printf "RELEASETIME     = '$RELEASETIME' '$RELEASETIME_S'\n" | tee -a $TEST1OUTPUT

# Make copy of SOL file and modify start and end times ---
`cp $CONTRACTSDIR/*.sol .`
`cp -rp $LIBSDIR .`

# --- Modify parameters ---
`perl -pi -e "s/zeppelin-solidity\/contracts/zeppelin-contracts/" $TOKENSOL`
`perl -pi -e "s/zeppelin-solidity\/contracts/zeppelin-contracts/" $SALESOL`
`perl -pi -e "s/zeppelin-solidity\/contracts/zeppelin-contracts/" $VESTINGSOL`
# `perl -pi -e "s/STAGE1_ENDTIME        \= 1512043200;.*$/STAGE1_ENDTIME        \= $ENDTIME; \/\/ $ENDTIME_S/" BluzelleTokenSaleConfig.sol`

DIFFS1=`diff $CONTRACTSDIR/$TOKENSOL $TOKENSOL`
echo "--- Differences $CONTRACTSDIR/$TOKENSOL $TOKENSOL ---" | tee -a $TEST1OUTPUT
echo "$DIFFS1" | tee -a $TEST1OUTPUT

DIFFS1=`diff $CONTRACTSDIR/$SALESOL $SALESOL`
echo "--- Differences $CONTRACTSDIR/$SALESOL $SALESOL ---" | tee -a $TEST1OUTPUT
echo "$DIFFS1" | tee -a $TEST1OUTPUT

DIFFS1=`diff $CONTRACTSDIR/$VESTINGSOL $VESTINGSOL`
echo "--- Differences $CONTRACTSDIR/$VESTINGSOL $VESTINGSOL ---" | tee -a $TEST1OUTPUT
echo "$DIFFS1" | tee -a $TEST1OUTPUT

solc_0.4.16 --version | tee -a $TEST1OUTPUT

echo "var tokenOutput=`solc_0.4.16 --optimize --combined-json abi,bin,interface $TOKENSOL`;" > $TOKENJS

echo "var saleOutput=`solc_0.4.16 --optimize --combined-json abi,bin,interface $SALESOL`;" > $SALEJS

echo "var vestingOutput=`solc_0.4.16 --optimize --combined-json abi,bin,interface $VESTINGSOL`;" > $VESTINGJS


geth --verbosity 3 attach $GETHATTACHPOINT << EOF | tee -a $TEST1OUTPUT
loadScript("$TOKENJS");
loadScript("$SALEJS");
loadScript("$VESTINGJS");
loadScript("functions.js");

var tokenAbi = JSON.parse(tokenOutput.contracts["$TOKENSOL:PolyMathToken"].abi);
var tokenBin = "0x" + tokenOutput.contracts["$TOKENSOL:PolyMathToken"].bin;

var saleAbi = JSON.parse(saleOutput.contracts["$SALESOL:PolyMathTokenOffering"].abi);
var saleBin = "0x" + saleOutput.contracts["$SALESOL:PolyMathTokenOffering"].bin;

var vestingAbi = JSON.parse(vestingOutput.contracts["$VESTINGSOL:PolyMathVesting"].abi);
var vestingBin = "0x" + vestingOutput.contracts["$VESTINGSOL:PolyMathVesting"].bin;

// console.log("DATA: tokenAbi=" + JSON.stringify(tokenAbi));
// console.log("DATA: tokenBin=" + tokenBin);
// console.log("DATA: saleAbi=" + JSON.stringify(saleAbi));
// console.log("DATA: saleBin=" + saleBin);
// console.log("DATA: vestingAbi=" + JSON.stringify(vestingAbi));
// console.log("DATA: vestingBin=" + vestingBin);


unlockAccounts("$PASSWORD");
printBalances();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var tokenMessage = "Deploy Token Contract";
// -----------------------------------------------------------------------------
console.log("RESULT: " + tokenMessage);
var tokenContract = web3.eth.contract(tokenAbi);
var tokenTx = null;
var tokenAddress = null;
var token = tokenContract.new(presaleWallet, {from: contractOwnerAccount, data: tokenBin, gas: 4000000, gasPrice: defaultGasPrice},
  function(e, contract) {
    if (!e) {
      if (!contract.address) {
        tokenTx = contract.transactionHash;
      } else {
        tokenAddress = contract.address;
        addAccount(tokenAddress, "PolyMathToken");
        addTokenContractAddressAndAbi(tokenAddress, tokenAbi);
        printTxData("tokenAddress=" + tokenAddress, tokenTx);
      }
    }
  }
);
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(tokenTx, tokenMessage);
printTokenContractDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var saleMessage = "Deploy Sale Contract";
var cap = web3.toWei(1000, "ether");
// -----------------------------------------------------------------------------
console.log("RESULT: " + saleMessage);
var saleContract = web3.eth.contract(saleAbi);
var saleTx = null;
var saleAddress = null;
var sale = saleContract.new(tokenAddress, $STARTTIME, $ENDTIME, cap, multisig, {from: contractOwnerAccount, data: saleBin, gas: 4000000, gasPrice: defaultGasPrice},
  function(e, contract) {
    if (!e) {
      if (!contract.address) {
        saleTx = contract.transactionHash;
      } else {
        saleAddress = contract.address;
        addAccount(saleAddress, "PolyMathTokenOffering");
        addSaleContractAddressAndAbi(saleAddress, saleAbi);
        printTxData("saleAddress=" + saleAddress, saleTx);
      }
    }
  }
);
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(saleTx, saleMessage);
printSaleContractDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var vestingMessage = "Deploy Vesting Contract";
// function PolyMathVesting(address _token, uint64 _releaseTime, address _vestingAddress)
// -----------------------------------------------------------------------------
console.log("RESULT: " + vestingMessage);
var vestingContract = web3.eth.contract(vestingAbi);
var vestingTx = null;
var vestingAddress = null;
var vesting = vestingContract.new(tokenAddress, $RELEASETIME, vestingWallet, {from: contractOwnerAccount, data: vestingBin, gas: 4000000, gasPrice: defaultGasPrice},
  function(e, contract) {
    if (!e) {
      if (!contract.address) {
        vestingTx = contract.transactionHash;
      } else {
        vestingAddress = contract.address;
        addAccount(vestingAddress, "PolyMathVesting");
        addVestingContractAddressAndAbi(vestingAddress, vestingAbi);
        printTxData("vestingAddress=" + vestingAddress, vestingTx);
      }
    }
  }
);
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(vestingTx, vestingMessage);
printVestingContractDetails();
console.log("RESULT: ");


exit;


// -----------------------------------------------------------------------------
var initialiseSaleMessage = "Initialise Sale";
// -----------------------------------------------------------------------------
console.log("RESULT: " + initialiseSaleMessage);
var initialiseSale_1Tx = sale.initialize(tokenAddress, {from: contractOwnerAccount, gas: 2000000, gasPrice: defaultGasPrice});
var initialiseSale_2Tx = token.transfer(saleAddress, sale.TOKENS_SALE(), {from: contractOwnerAccount, gas: 2000000, gasPrice: defaultGasPrice});
var initialiseSale_3Tx = token.setOpsAddress(saleAddress, {from: contractOwnerAccount, gas: 2000000, gasPrice: defaultGasPrice});
while (txpool.status.pending > 0) {
}
printTxData("initialiseSale_1Tx", initialiseSale_1Tx);
printTxData("initialiseSale_2Tx", initialiseSale_2Tx);
printTxData("initialiseSale_3Tx", initialiseSale_3Tx);
printBalances();
failIfTxStatusError(initialiseSale_1Tx, initialiseSaleMessage + " - sale.initialize(token)");
failIfTxStatusError(initialiseSale_2Tx, initialiseSaleMessage + " - token.transfer(sale, sale.TOKENS_SALE())");
failIfTxStatusError(initialiseSale_3Tx, initialiseSaleMessage + " - token.setOpsAddress(sale)");
printSaleContractDetails();
printTokenContractDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var whitelistMessage = "Whitelist";
// -----------------------------------------------------------------------------
console.log("RESULT: " + whitelistMessage);
var whitelist_1Tx = sale.setWhitelistedStatus(account3, 1, {from: contractOwnerAccount, gas: 2000000, gasPrice: defaultGasPrice});
var whitelist_2Tx = sale.setWhitelistedBatch([account4, account5], [1, 2], {from: contractOwnerAccount, gas: 2000000, gasPrice: defaultGasPrice});
while (txpool.status.pending > 0) {
}
printTxData("whitelist_1Tx", whitelist_1Tx);
printTxData("whitelist_2Tx", whitelist_2Tx);
printBalances();
failIfTxStatusError(whitelist_1Tx, whitelistMessage + " - ac3 stage 1");
failIfTxStatusError(whitelist_2Tx, whitelistMessage + " - [ac4, ac5] stage [1, 2]");
printSaleContractDetails();
printTokenContractDetails();
console.log("RESULT: ");


waitUntil("startTime", startTime, 0);


// -----------------------------------------------------------------------------
var sendContribution1Message = "Send Contribution";
// -----------------------------------------------------------------------------
console.log("RESULT: " + sendContribution1Message);
var sendContribution1_1Tx = eth.sendTransaction({from: account3, to: saleAddress, value: web3.toWei("1000", "ether"), gas: 400000, gasPrice: defaultGasPrice});
var sendContribution1_2Tx = eth.sendTransaction({from: account4, to: saleAddress, value: web3.toWei("2000", "ether"), gas: 400000, gasPrice: defaultGasPrice});
var sendContribution1_3Tx = eth.sendTransaction({from: account5, to: saleAddress, value: web3.toWei("3000", "ether"), gas: 400000, gasPrice: defaultGasPrice});
var sendContribution1_4Tx = eth.sendTransaction({from: account6, to: saleAddress, value: web3.toWei("4000", "ether"), gas: 400000, gasPrice: defaultGasPrice});
while (txpool.status.pending > 0) {
}
printTxData("sendContribution1_1Tx", sendContribution1_1Tx);
printTxData("sendContribution1_2Tx", sendContribution1_2Tx);
printTxData("sendContribution1_3Tx", sendContribution1_3Tx);
printTxData("sendContribution1_4Tx", sendContribution1_4Tx);
printBalances();
failIfTxStatusError(sendContribution1_1Tx, sendContribution1Message + " ac3 1000 ETH");
failIfTxStatusError(sendContribution1_2Tx, sendContribution1Message + " ac4 2000 ETH");
passIfTxStatusError(sendContribution1_3Tx, sendContribution1Message + " ac5 3000 ETH - Expecting failure, whitelisted 2");
passIfTxStatusError(sendContribution1_4Tx, sendContribution1Message + " ac6 4000 ETH - Expecting failure, not whitelisted");
printSaleContractDetails();
printTokenContractDetails();
console.log("RESULT: ");


// waitUntil("endTime", endTime, 0);


// -----------------------------------------------------------------------------
var finaliseMessage = "Finalise Crowdsale";
// -----------------------------------------------------------------------------
console.log("RESULT: " + finaliseMessage);
var finalise_1Tx = sale.reclaimTokens({from: contractOwnerAccount, gas: 2000000, gasPrice: defaultGasPrice});
var finalise_2Tx = sale.finalize({from: contractOwnerAccount, gas: 2000000, gasPrice: defaultGasPrice});
var finalise_3Tx = token.finalize({from: contractOwnerAccount, gas: 2000000, gasPrice: defaultGasPrice});
while (txpool.status.pending > 0) {
}
printTxData("finalise_1Tx", finalise_1Tx);
printTxData("finalise_2Tx", finalise_2Tx);
printTxData("finalise_3Tx", finalise_3Tx);
printBalances();
failIfTxStatusError(finalise_1Tx, finaliseMessage + " - sale.reclaimTokens()");
failIfTxStatusError(finalise_2Tx, finaliseMessage + " - sale.finalize()");
failIfTxStatusError(finalise_3Tx, finaliseMessage + " - token.finalize()");
printSaleContractDetails();
printTokenContractDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var transfersMessage = "Move Tokens";
// -----------------------------------------------------------------------------
console.log("RESULT: " + transfersMessage);
var transfers1Tx = token.transfer(account6, "1000000000000", {from: account3, gas: 100000, gasPrice: defaultGasPrice});
var transfers2Tx = token.approve(account7,  "30000000000000000", {from: account4, gas: 100000, gasPrice: defaultGasPrice});
while (txpool.status.pending > 0) {
}
var transfers3Tx = token.transferFrom(account4, account8, "30000000000000000", {from: account7, gas: 100000, gasPrice: defaultGasPrice});
while (txpool.status.pending > 0) {
}
printTxData("transfers1Tx", transfers1Tx);
printTxData("transfers2Tx", transfers2Tx);
printTxData("transfers3Tx", transfers3Tx);
printBalances();
failIfTxStatusError(transfers1Tx, transfersMessage + " - transfer 0.000001 tokens ac3 -> ac6. CHECK for movement");
failIfTxStatusError(transfers2Tx, transfersMessage + " - approve 0.03 tokens ac4 -> ac7");
failIfTxStatusError(transfers3Tx, transfersMessage + " - transferFrom 0.03 tokens ac4 -> ac8 by ac7. CHECK for movement");
printSaleContractDetails();
printTokenContractDetails();
console.log("RESULT: ");


EOF
grep "DATA: " $TEST1OUTPUT | sed "s/DATA: //" > $DEPLOYMENTDATA
cat $DEPLOYMENTDATA
grep "RESULT: " $TEST1OUTPUT | sed "s/RESULT: //" > $TEST1RESULTS
cat $TEST1RESULTS
