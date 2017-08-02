/*  TODO: add gasLimit and gasPrice params
    TODO: check if all gas used when submitting tx
    TODO: cleare up states, eg. isLoading is not used
    TODO: split action creator and reducer
    TODO: change action creatators to get payload so won't need to maintain attributes at two places here when adding/changing
    TODO: use selectors. eg: https://github.com/reactjs/reselect */

import store from './../store'
import SolidityContract from './SolidityContract';
import loanManager_artifacts from '../contractsBuild/LoanManager.json' ;
import moment from 'moment';

const NEW_LOAN_GAS = 700000;  // on testRPC: first= 725514  additional = 665514
const NEW_FIRST_LOAN_GAS = 760000;
export const LOANMANAGER_CONNECT_REQUESTED = 'loanManager/LOANMANAGER_CONNECT_REQUESTED'
export const LOANMANAGER_CONNECTED= 'loanManager/LOANMANAGER_CONNECTED'

export const LOANMANAGER_REFRESH_REQUESTED = 'loanManager/LOANMANAGER_REFRESH_REQUESTED'
export const LOANMANAGER_REFRESHED= 'loanManager/LOANMANAGER_REFRESHED'

export const LOANMANAGER_NEWLOAN_REQUESTED = 'loanManager/LOANMANAGER_NEWLOAN_REQUESTED'
export const LOANMANAGER_NEWLOAN_CREATED = 'loanManager/LOANMANAGER_NEWLOAN_CREATED'
export const LOANMANAGER_NEWLOAN_ERROR = 'loanManager/LOANMANAGER_NEWLOAN_ERROR'

const initialState = {
    contract: null,
    balance: '?',
    owner: '?',
    ratesAddress: '?',
    tokenUcdAddress: '?',
    loanCount: '?',
    productCount: '?',
    products: null,
    isLoading: false,  // TODO: this is not in use - need to refactored (see ethBase.isLoading + isConnected)
    error: null,
    loanCreated: null
}

export default (state = initialState, action) => {
    switch (action.type) {
        case LOANMANAGER_CONNECT_REQUESTED:
        return {
            ...state,
            isLoading: true
        }

        case LOANMANAGER_CONNECTED:
        return {
            ...state,
            isLoading: false,
            contract: action.contract
        }

        case LOANMANAGER_REFRESH_REQUESTED:
        return {
            ...state,
            isLoading: true
        }

        case LOANMANAGER_REFRESHED:
        return {
            ...state,
            isLoading: false,
            owner: action.owner,
            balance: action.balance,
            loanCount: action.loanCount,
            productCount: action.productCount,
            products: action.products,
            ratesAddress: action.ratesAddress,
            tokenUcdAddress: action.tokenUcdAddress
        }

        case LOANMANAGER_NEWLOAN_REQUESTED:
        return {
            ...state,
            error: null,
            loanCreated: null
        }

        case LOANMANAGER_NEWLOAN_ERROR:
        return {
            ...state,
            error: action.error
        }

        case LOANMANAGER_NEWLOAN_CREATED:
        return {
            ...state,
            loanCreated: action.loanCreated
        }

        default:
            return state
    }
}

export const connectloanManager =  () => {
    return async dispatch => {
        dispatch({
            type: LOANMANAGER_CONNECT_REQUESTED
        })
        return dispatch({
            type: LOANMANAGER_CONNECTED,
            contract: await SolidityContract.connectNew(
                store.getState().ethBase.web3Instance.currentProvider, loanManager_artifacts)
        })
    }
}

export const refreshLoanManager =  () => {
    return async dispatch => {
        dispatch({
            type: LOANMANAGER_REFRESH_REQUESTED
        })
        let loanManager = store.getState().loanManager.contract.instance;
        let web3 = store.getState().ethBase.web3Instance;
        // TODO: make calls paralel
        let decimalsDiv = 10 ** (await store.getState().tokenUcd.contract.instance.decimals()).toNumber(); // TODO: get this from store.tokenUcd (timing issues on first load..)
        let loanCount = await loanManager.getLoanCount();
        let productCount = await loanManager.getProductCount();
        let products = [];
        for (let i=0; i < productCount; i++) {
            let p = await loanManager.products(i);
            let term = p[0].toNumber();
            // TODO: less precision for duration: https://github.com/jsmreese/moment-duration-format
            let termText = moment.duration(term, "seconds").humanize();
            let repayPeriod = p[4].toNumber();
            let prod = {
                id: i,
                term: term,
                termText: termText,
                discountRate: p[1].toNumber() / 1000000,
                loanCoverageRatio: p[2].toNumber() / 1000000,
                minDisbursedAmountInUcd: p[3].toNumber() / decimalsDiv,
                repayPeriod: repayPeriod,
                repayPeriodText: moment.duration(repayPeriod, "minutes").humanize(),
                isActive: p[5]
            }
            products.push(prod);
        }
        let tokenUcdAddress = await loanManager.tokenUcd();
        let ratesAddress = await loanManager.rates();
        let owner = await loanManager.owner();

        return web3.eth.getBalance(loanManager.address, function(error, balance) {
            dispatch({
                type: LOANMANAGER_REFRESHED,
                owner: owner,
                balance: web3.fromWei( balance.toNumber()),
                loanCount: loanCount.toNumber(),
                products: products,
                productCount: productCount.toNumber(),
                tokenUcdAddress: tokenUcdAddress,
                ratesAddress: ratesAddress
            });
        });
    }
}

export function newLoan(productId, ethAmount) {
    return async dispatch =>  {
        // TODO: shall we emmit error if already submitting or enough as it is (submit disabled on form)
        dispatch({
            type: LOANMANAGER_NEWLOAN_REQUESTED,
            ethAmount: ethAmount,
            productId: productId
        })
        let web3 = store.getState().ethBase.web3Instance;
        let loanManager = store.getState().loanManager.contract.instance;
        let gasEstimate;
        if( store.getState().loanManager.loanCount === 0 ) {
            gasEstimate = NEW_LOAN_GAS;
        } else {
            gasEstimate = NEW_FIRST_LOAN_GAS;
        }
        let userAccount = store.getState().ethBase.userAccount;
        // TODO: refresh loanCount
        return loanManager.newEthBackedLoan(productId,
                    {value: web3.toWei(ethAmount), from: userAccount, gas: gasEstimate } )
        .then( res => {
            // console.log(JSON.stringify(res, null, 4), res.logs[0].args.disbursedLoanInUcd.toNumber())
            let loanCreated = {
                address: res.logs[0].args.loanContract,
                disbursedLoanInUcd: res.logs[0].args.disbursedLoanInUcd.toNumber(),
                eth: { // TODO: add txhash etc.
                    gasUsed: res.receipt.gasUsed // TODO: could we make it more generic?
                }
            }
            return dispatch({
                type: LOANMANAGER_NEWLOAN_CREATED,
                loanCreated: loanCreated
            });
        }).catch( error => {
            return dispatch({
                type: LOANMANAGER_NEWLOAN_ERROR,
                error: error
            });
        });
    }
}