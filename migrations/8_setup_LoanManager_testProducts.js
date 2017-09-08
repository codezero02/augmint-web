var LoanManager = artifacts.require("./LoanManager.sol");

module.exports = async function(deployer, network) {
    var onTest =
        web3.version.network == 999 ||
        web3.version.network == 4 ||
        web3.version.network == 3 ||
        web3.version.network == 1976
            ? true
            : false;
    if (onTest) {
        console.log(
            "   On a test network. Adding test loanProducts. Network id: ",
            web3.version.network
        );
        let lm = await LoanManager.deployed();
        // term (in sec), discountRate, loanCoverageRatio, minDisbursedAmountInUcd (w/ 4 decimals), gracePerdio, isActive
        await lm.addProduct(31536000, 800000, 800000, 300000, 864000, true); // due in 365d
        await lm.addProduct(15552000, 850000, 800000, 300000, 259200, true); // due in 180d
        await lm.addProduct(7776000, 910000, 800000, 300000, 172800, true); // due in 90d
        await lm.addProduct(2592000, 950000, 800000, 300000, 86400, true); // due in 30d
        await lm.addProduct(86400, 970000, 850000, 300000, 3600, true); // due in 1 day
        // due in 1 sec, repay in 1hr for testing repayments
        await lm.addProduct(1, 985000, 900000, 200000, 3600, true);
        // due in 1 sec, repay in 1sec for testing defaults
        await lm.addProduct(1, 990000, 950000, 100000, 1, true); // defaults in 2 secs for testing
    } else {
        console.log(
            "   Not on a known test network. NOT adding test loanProducts. Network id: ",
            web3.version.network
        );
    }
};