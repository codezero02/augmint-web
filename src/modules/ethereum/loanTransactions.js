/* Loan ethereum functions
    Use only from reducers.  */
import store from "modules/store";
import BigNumber from "bignumber.js";
import moment from "moment";
import { cost } from "./gas";
import { EthereumTransactionError } from "modules/ethereum/ethHelper";

const ONE_ETH = 1000000000000000000;

export async function newEthBackedLoanTx(productId, ethAmount) {
    const loanManager = store.getState().loanManager.contract.web3ContractInstance;
    const decimalsDiv = store.getState().augmintToken.info.decimalsDiv;

    let gasEstimate;
    if (store.getState().loanManager.info.loanCount === 0) {
        gasEstimate = cost.NEW_FIRST_LOAN_GAS;
    } else {
        gasEstimate = cost.NEW_LOAN_GAS;
    }

    const userAccount = store.getState().web3Connect.userAccount;
    const weiAmount = new BigNumber(ethAmount).mul(ONE_ETH);

    const tx = loanManager.methods
        .newEthBackedLoan(productId)
        .send({ value: weiAmount, from: userAccount, gas: gasEstimate });

    tx
        .on("confirmation", (confirmationNumber, receipt) => {
            console.debug(
                `  newEthBackedLoanTx() Confirmation #${confirmationNumber} received. txhash: ${
                    receipt.transactionHash
                }`
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
            throw new EthereumTransactionError("New loan failed", error, null, gasEstimate);
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
            "New loan failed",
            "Ethereum transaction returned status: " + receipt.status,
            receipt,
            gasEstimate
        );
    }

    return {
        loanId: receipt.events.NewLoan.returnValues.loanId,
        productId: parseInt(receipt.events.NewLoan.returnValues.productId, 10),
        borrower: receipt.events.NewLoan.returnValues.borrower,
        loanAmount: parseInt(receipt.events.NewLoan.returnValues.loanAmount, 10) / decimalsDiv,
        repaymentAmount: parseInt(receipt.events.NewLoan.returnValues.repaymentAmount, 10) / decimalsDiv,
        collateralEth: new BigNumber(receipt.events.NewLoan.returnValues.collateralAmount).div(ONE_ETH).toString(),
        eth: {
            gasEstimate,
            result: { receipt } // TODO: refactor this and include just receipt
        }
    };
}

export async function fetchProductsTx() {
    const loanManager = store.getState().loanManager.contract.instance;

    // TODO: resolve timing of loanManager refresh in order to get chunkSize & productCount from loanManager:
    const [chunkSize, productCount] = await Promise.all([
        loanManager.CHUNK_SIZE().then(res => res.toNumber()),
        loanManager.getProductCount().then(res => res.toNumber())
    ]);
    // const chunkSize = store.getState().loanManager.info.chunkSize;
    // const productCount = store.getState().loanManager.info.productCount;

    let products = [];

    const queryCount = Math.ceil(productCount / chunkSize);

    for (let i = 0; i < queryCount; i++) {
        const productsArray = await loanManager.getProducts(i * chunkSize);
        const parsedProducts = parseProducts(productsArray);
        products = products.concat(parsedProducts);
    }

    return products;
}

function parseProducts(productsArray) {
    const ppmDiv = 1000000;
    const decimalsDiv = store.getState().augmintToken.info.decimalsDiv;

    const products = productsArray.reduce((parsed, product) => {
        const [
            bn_id,
            bn_minDisbursedAmount,
            bn_term,
            bn_discountRate,
            bn_collateralRatio,
            bn_defaultingFeePt,
            bn_isActive
        ] = product;

        if (bn_term.gt(0)) {
            const term = bn_term.toNumber();
            parsed.push({
                id: bn_id.toNumber(),
                term,
                termText: moment.duration(term, "seconds").humanize(), // TODO: less precision for duration: https://github.com/jsmreese/moment-duration-format
                bn_discountRate,
                discountRate: bn_discountRate / ppmDiv,
                bn_collateralRatio,
                collateralRatio: bn_collateralRatio / ppmDiv,
                minDisbursedAmountInToken: bn_minDisbursedAmount / decimalsDiv,
                bn_defaultingFeePt,
                defaultingFeePt: bn_defaultingFeePt / ppmDiv,
                isActive: bn_isActive.eq(1) ? true : false
            });
        }
        return parsed;
    }, []);

    return products;
}

export async function repayLoanTx(repaymentAmount, loanId) {
    const gasEstimate = cost.REPAY_GAS;

    const userAccount = store.getState().web3Connect.userAccount;
    const loanManager = store.getState().loanManager.contract.web3ContractInstance;

    const augmintToken = store.getState().augmintToken;
    const augmintTokenInstance = augmintToken.contract.web3ContractInstance;
    const decimalsDiv = augmintToken.info.decimalsDiv;

    const tx = augmintTokenInstance.methods
        .transferAndNotify(loanManager._address, new BigNumber(repaymentAmount).mul(decimalsDiv).toString(), loanId)
        .send({ from: userAccount, gas: gasEstimate });

    tx
        .on("confirmation", (confirmationNumber, receipt) => {
            console.debug(
                `  repayLoanTx() Confirmation #${confirmationNumber} received. txhash: ${receipt.transactionHash}`
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
            throw new EthereumTransactionError("Repay loan failed", error, null, gasEstimate);
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
            "Repay loan failed",
            "Ethereum transaction returned status: " + receipt.status,
            receipt,
            gasEstimate
        );
    }

    // repay is called via AugmintToken and event emmitted from loanManager is not parsed by web3
    receipt.events.LoanRepayed = (await loanManager.getPastEvents("LoanRepayed", {
        transactionHash: receipt.transactionHash,
        fromBlock: receipt.blockNumber, // txhash should be enough but unsure how well getPastEvents optimised
        toBlock: receipt.blockNumber
    }))[0];

    return {
        eth: {
            gasEstimate,
            result: { receipt } // TODO: refactor this and include just receipt
        }
    };
}

export async function fetchLoansToCollectTx() {
    try {
        const loanManager = store.getState().loanManager.contract.instance;
        // TODO: resolve timing of loanManager refresh in order to get chunkSize & loanCount from loanManager:
        const [chunkSize, loanCount] = await Promise.all([
            loanManager.CHUNK_SIZE().then(res => res.toNumber()),
            loanManager.getLoanCount().then(res => res.toNumber())
        ]);
        // const chunkSize = store.getState().loanManager.info.chunkSize;
        // const loanCount = await loanManager.getLoanCount();

        let loansToCollect = [];

        const queryCount = Math.ceil(loanCount / chunkSize);
        for (let i = 0; i < queryCount; i++) {
            const loansArray = await loanManager.getLoans(i * chunkSize);
            const defaultedLoans = parseLoans(loansArray).filter(loan => loan.isCollectable);
            loansToCollect = loansToCollect.concat(defaultedLoans);
        }

        return loansToCollect;
    } catch (error) {
        throw new Error("fetchLoansToCollectTx failed.\n" + error);
    }
}

// loansToCollect is an array : [{loanId: <loanId>}]
export async function collectLoansTx(loansToCollect) {
    const userAccount = store.getState().web3Connect.userAccount;
    const loanManager = store.getState().loanManager.contract.web3ContractInstance;
    const gasEstimate = cost.COLLECT_BASE_GAS + cost.COLLECT_ONE_GAS * loansToCollect.length;

    const loanIdsToCollect = loansToCollect.map(loan => loan.id);

    const tx = loanManager.methods.collect(loanIdsToCollect).send({ from: userAccount, gas: gasEstimate });

    tx
        .on("confirmation", (confirmationNumber, receipt) => {
            console.debug(
                `  collectLoansTx() Confirmation #${confirmationNumber} received. txhash: ${receipt.transactionHash}`
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
            throw new EthereumTransactionError("New loan failed", error, null, gasEstimate);
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
            "Collect loans failed",
            "Ethereum transaction returned status: " + receipt.status,
            { receipt }, // TODO: refactor EthereumTransactionError to expect only receipt (or tx too?)
            gasEstimate
        );
    }

    const loanCollectedEventsCount =
        typeof receipt.events.LoanCollected === "undefined"
            ? 0
            : Array.isArray(receipt.events.LoanCollected) ? receipt.events.LoanCollected.length : 1;

    if (loanCollectedEventsCount !== loansToCollect.length) {
        throw new EthereumTransactionError(
            "Likely not all loans has been collected.",
            "Number of LoanCollected events != loansToCollect passed. Check tx.\n" +
                `Received: ${loanCollectedEventsCount} LoanCollected events. Expected: ${loansToCollect.length}`,
            { receipt }, // TODO: refactor EthereumTransactionError to expect only receipt (or tx too?)
            gasEstimate
        );
    }

    return {
        loansCollected: loansToCollect.length,
        eth: {
            gasEstimate,
            result: { receipt } // TODO: refactor this and include just receipt
        }
    };
}

export async function fetchLoansForAddressTx(account) {
    const loanManager = store.getState().loanManager.contract.instance;

    // TODO: resolve timing of loanManager refresh in order to get chunkSize & loanCount from loanManager:
    const [chunkSize, loanCount] = await Promise.all([
        loanManager.CHUNK_SIZE().then(res => res.toNumber()),
        loanManager.getLoanCountForAddress(account).then(res => res.toNumber())
    ]);
    // const chunkSize = store.getState().loanManager.info.chunkSize;
    // const loanCount = await loanManager.getLoanCountForAddress(account);

    let loans = [];

    const queryCount = Math.ceil(loanCount / chunkSize);

    for (let i = 0; i < queryCount; i++) {
        const loansArray = await loanManager.getLoansForAddress(account, i * chunkSize);
        loans = loans.concat(parseLoans(loansArray));
    }

    return loans;
}

function parseLoans(loansArray) {
    const decimalsDiv = store.getState().augmintToken.info.decimalsDiv;

    const loans = loansArray.reduce((parsed, loan) => {
        const [
            bn_id,
            bn_collateralAmount,
            bn_repaymentAmount,
            borrower,
            bn_productId,
            bn_state,
            bn_maturity,
            bn_disbursementTime,
            bn_loanAmount,
            bn_interestAmount
        ] = loan;

        if (bn_maturity.gt(0)) {
            const currentTime = moment()
                .utc()
                .unix();
            const disbursementTime = bn_disbursementTime.toNumber();
            const term = bn_maturity.sub(bn_disbursementTime).toNumber();
            const maturity = bn_maturity.toNumber();
            let loanStateText = null;
            let isDue = false;
            let isRepayable = false;
            let isCollectable = false;

            const state = bn_state.toNumber();
            switch (state) {
                case 0:
                    if (maturity - currentTime < 24 * 60 * 60 * 2) {
                        /* consider it due 2 days before */
                        isDue = true;
                        isRepayable = true;
                        loanStateText = "Payment Due";
                    } else {
                        isRepayable = true;
                        loanStateText = "Open";
                    }
                    break;
                case 1:
                    loanStateText = "Repaid";
                    break;
                case 2:
                    isCollectable = true;
                    loanStateText = "Defaulted (not yet collected)";
                    break;
                case 3:
                    loanStateText = "Defaulted and collected";
                    break;
                default:
                    loanStateText = "Invalid state";
            }

            parsed.push({
                id: bn_id.toNumber(),
                borrower: "0x" + borrower.toString(16),
                productId: bn_productId.toNumber(),
                state,
                loanStateText,
                collateralEth: bn_collateralAmount / ONE_ETH,
                repaymentAmount: bn_repaymentAmount / decimalsDiv,
                loanAmount: bn_loanAmount / decimalsDiv,
                interestAmount: bn_interestAmount / decimalsDiv,
                term,
                termText: moment.duration(term, "seconds").humanize(),
                disbursementTime,
                disbursementTimeText: moment.unix(disbursementTime).format("D MMM YYYY HH:mm:ss"),
                maturity,
                maturityText: moment.unix(maturity).format("D MMM YYYY HH:mm"),
                isDue,
                isRepayable,
                isCollectable
            });
        }

        return parsed;
    }, []);

    return loans;
}
