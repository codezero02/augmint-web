/*
 A-EUR transfer ethereum functions
Use only from reducers.

    TODO: tune default gasPrice
    TODO: clean up thrown errors
    TODO: set gasEstimates when it gas consumption has settled.
 */
import store from "modules/store";
import moment from "moment";
import { cost } from "./gas";
import ethers from "ethers";
import { EthereumTransactionError } from "modules/ethereum/ethHelper";

export function getTransferFee(amount) {
    const decimalsDiv = store.getState().augmintToken.info.decimalsDiv;
    const feePt = store.getState().augmintToken.info.feePt;
    const feeMin = store.getState().augmintToken.info.feeMin;
    const feeMax = store.getState().augmintToken.info.feeMax;

    let fee = Math.round(amount * feePt * decimalsDiv) / decimalsDiv;
    if (fee < feeMin) {
        fee = feeMin;
    } else if (fee > feeMax) {
        fee = feeMax;
    }
    return fee;
}

export function getMaxTransfer(amount) {
    const decimalsDiv = store.getState().augmintToken.info.decimalsDiv;
    const feePt = store.getState().augmintToken.info.feePt;
    const feeMin = store.getState().augmintToken.info.feeMin;
    const feeMax = store.getState().augmintToken.info.feeMax;

    const minLimit = Math.floor(feeMin / feePt);
    const maxLimit = Math.floor(feeMax / feePt);

    let maxAmount;
    if (amount < minLimit) {
        maxAmount = amount - feeMin;
    } else if (amount >= maxLimit) {
        // TODO: fix this on edge cases, https://github.com/Augmint/augmint-web/issues/60
        maxAmount = amount - feeMax;
    } else {
        maxAmount = Math.round(amount / (feePt + 1) * decimalsDiv) / decimalsDiv;
        console.debug(amount, feePt, decimalsDiv, maxAmount);
    }

    return maxAmount;
}

export async function transferTokenTx(payload) {
    const { payee, tokenAmount, narrative } = payload;

    const gasEstimate = cost.TRANSFER_AUGMINT_TOKEN_GAS;
    const userAccount = store.getState().web3Connect.userAccount;
    const augmintToken = store.getState().augmintToken.contract.web3ContractInstance;
    const decimalsDiv = store.getState().augmintToken.info.decimalsDiv;

    const _narrative = narrative == null || payload.narrative.trim() === "" ? null : payload.narrative.trim();

    let tx;
    if (_narrative) {
        tx = augmintToken.methods.transferWithNarrative(payee, tokenAmount * decimalsDiv, _narrative).send({
            from: userAccount,
            gas: gasEstimate
        });
    } else {
        tx = await augmintToken.methods.transfer(payee, tokenAmount * decimalsDiv).send({
            from: userAccount,
            gas: gasEstimate
        });
    }

    tx
        .on("confirmation", (confirmationNumber, receipt) => {
            console.debug(
                `  transferTokenTx() Confirmation #${confirmationNumber} received. txhash: ${receipt.transactionHash}`
            );
        })
        .then(receipt => {
            console.debug("  mined: ", receipt.transactionHash);
        });

    const receipt = await tx
        .once("transactionHash", hash => {
            console.debug("  tx hash received: " + hash);
        })
        .on("error", error => {
            throw new EthereumTransactionError("Token transfer failed", error, null, gasEstimate);
        })
        .once("receipt", receipt => {
            console.debug(
                `  receipt received.  gasUsed: ${receipt.gasUsed} txhash: ${receipt.transactionHash}`,
                receipt
            );
            return receipt;
        });

    if (receipt.status !== "0x1" && receipt.status !== "0x01") {
        // ganache returns 0x01, Rinkeby 0x1
        throw new EthereumTransactionError(
            "Token transfer failed",
            "Ethereum transaction returned status: " + receipt.status,
            receipt,
            gasEstimate
        );
    }

    const bn_amount = receipt.events.AugmintTransfer.returnValues.amount;
    return {
        to: receipt.events.AugmintTransfer.returnValues.to,
        from: receipt.events.AugmintTransfer.returnValues.from,
        bn_amount: bn_amount,
        amount: bn_amount / decimalsDiv,
        narrative: receipt.events.AugmintTransfer.returnValues.narrative,
        eth: {
            gasEstimate,
            receipt
        }
    };
}

export async function fetchTransfersTx(account, fromBlock, toBlock) {
    try {
        const augmintTokenInstance = store.getState().augmintToken.contract.ethersInstance;
        const AugmintTransfer = augmintTokenInstance.interface.events.AugmintTransfer;
        const provider = store.getState().web3Connect.ethers.provider;

        const paddedAccount = ethers.utils.hexlify(ethers.utils.padZeros(account, 32));
        const [logsFrom, logsTo] = await Promise.all([
            provider.getLogs({
                fromBlock: fromBlock,
                toBlock: toBlock,
                address: augmintTokenInstance.address,
                topics: [AugmintTransfer.topics[0], paddedAccount]
            }),
            provider.getLogs({
                fromBlock: fromBlock,
                toBlock: toBlock,
                address: augmintTokenInstance.address,
                topics: [AugmintTransfer.topics[0], null, paddedAccount]
            })
        ]);
        const logs = [...logsFrom, ...logsTo];
        const transfers = await Promise.all(
            logs.map(eventLog => _formatTransferLog(AugmintTransfer, account, eventLog))
        );

        return transfers;
    } catch (error) {
        throw new Error("fetchTransferList failed.\n" + error);
    }
}

export async function processNewTransferTx(account, eventLog) {
    const augmintTokenInstance = store.getState().augmintToken.contract.ethersInstance;
    const AugmintTransfer = augmintTokenInstance.interface.events.AugmintTransfer;
    return _formatTransferLog(AugmintTransfer, account, eventLog);
}

async function _formatTransferLog(AugmintTransfer, account, eventLog) {
    const decimalsDiv = store.getState().augmintToken.info.decimalsDiv;

    let blockData;
    if (typeof eventLog.getBlock === "function") {
        // called from event - need to use this.getBlock b/c block is available on Infura later than than tx receipt (Infura  node syncing)
        blockData = await eventLog.getBlock();
    } else {
        // not from event, provider.getBlock should work
        const provider = store.getState().web3Connect.ethers.provider;
        blockData = await provider.getBlock(eventLog.blockNumber);
    }

    const parsedData = AugmintTransfer.parse(eventLog.topics, eventLog.data);

    const direction = account.toLowerCase() === parsedData.from.toLowerCase() ? -1 : 1;
    const senderFee = direction === -1 ? parsedData.fee / decimalsDiv : 0;
    const blockTimeStampText = blockData ? moment.unix(await blockData.timestamp).format("D MMM YYYY HH:mm") : "?";

    const logData = Object.assign({ args: parsedData }, eventLog, {
        blockData: blockData,
        direction: direction,
        directionText: direction === -1 ? "sent" : "received",
        senderFee: senderFee,
        blockTimeStampText: blockTimeStampText,
        signedAmount: parsedData.amount / decimalsDiv * direction
    });

    return logData;
}
