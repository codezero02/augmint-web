import React from "react";
import { bindActionCreators } from "redux"; // TODO: do we really need this or shall we use the store directly?
import { connect } from "react-redux";
import { connectWeb3 } from "modules/web3Provider";
import BigNumber from "bignumber.js";
import augmintTokenProvider from "modules/augmintTokenProvider";
import ratesProvider from "modules/ratesProvider";
import loanManagerProvider from "modules/loanManagerProvider";
import lockManagerProvider from "modules/lockManagerProvider";
import metricsProvider from "modules/metricsProvider";
import { refreshAugmintToken } from "modules/reducers/augmintToken";
import { Pheader } from "components/PageLayout";
import { ReserveStats } from "./components/ReserveStats";
import { TotalSupply } from "./components/TotalSupply";
import { LtdStats } from "./components/LtdStats";
import { EarningStats } from "./components/EarningStats";
import { EthereumState } from "containers/app/EthereumState";
import Button from "components/augmint-ui/button";
import TopNavTitlePortal from "components/portals/TopNavTitlePortal";
import { MyListGroup, MyGridTable } from "components/MyListGroups";

import { StyledContainer, StyledHeader, StyledPheader, StyledMyListGroup, StyledRow, StyledCol } from "./styles";

class AugmintToken extends React.Component {
    componentDidMount() {
        connectWeb3();
        ratesProvider();
        augmintTokenProvider();
        loanManagerProvider();
        lockManagerProvider();
        metricsProvider();
    }

    handleAugmintTokenRefreshClick = e => {
        e.preventDefault();
        this.props.refreshAugmintToken();
    };

    render() {
        let loansCollected = "?",
            amountOwnedByUsers = "?",
            amountOwnedByUsersLiquid = "?",
            loanCollateralCoverageRatio = "?",
            collateralInEscrow = "?",
            availableForMarketIntervention = "?",
            bn_collateralInEscrowEth = 1,
            bn_outstandingLoansAmount = 1;

        if (Object.keys(this.props.metrics.loansData).length) {
            loansCollected = new BigNumber(this.props.metrics.loansData.collectedLoansAmount.toFixed(15))
                .plus(this.props.metrics.loansData.defaultedLoansAmount)
                .toNumber();
        }

        if (
            this.props.augmintToken.info.totalSupply !== "?" &&
            this.props.monetarySupervisor.info.reserveTokenBalance !== "?" &&
            this.props.augmintToken.info.feeAccountTokenBalance !== "?" &&
            this.props.monetarySupervisor.info.interestEarnedAccountTokenBalance !== "?"
        ) {
            const bn_amountOwnedByUsers = new BigNumber(this.props.augmintToken.info.totalSupply.toFixed(15))
                .minus(this.props.monetarySupervisor.info.reserveTokenBalance)
                .minus(this.props.augmintToken.info.feeAccountTokenBalance)
                .minus(this.props.monetarySupervisor.info.interestEarnedAccountTokenBalance);

            amountOwnedByUsers = bn_amountOwnedByUsers.toNumber();
            amountOwnedByUsersLiquid = bn_amountOwnedByUsers
                .minus(this.props.monetarySupervisor.info.totalLockedAmount)
                .toNumber();
        }

        if (
            this.props.metrics.loansData.collateralInEscrowEth &&
            this.props.metrics.loansData.outstandingLoansAmount &&
            this.props.rates.info.bn_ethFiatRate
        ) {
            bn_collateralInEscrowEth = new BigNumber(this.props.metrics.loansData.collateralInEscrowEth.toFixed(15));
            bn_outstandingLoansAmount = new BigNumber(this.props.metrics.loansData.outstandingLoansAmount.toFixed(15));
            let bn_collateralInEscrow = this.props.rates.info.bn_ethFiatRate.mul(bn_collateralInEscrowEth);
            collateralInEscrow = bn_collateralInEscrow.toFixed(2);

            loanCollateralCoverageRatio = bn_collateralInEscrow
                .div(bn_outstandingLoansAmount)
                .mul(100)
                .toFixed(2);
        }

        if (
            this.props.monetarySupervisor.info.reserveEthBalance !== "?" &&
            this.props.augmintToken.info.feeAccountEthBalance !== "?"
        ) {
            availableForMarketIntervention = new BigNumber(
                this.props.monetarySupervisor.info.reserveEthBalance.toFixed(15)
            )
                .plus(this.props.augmintToken.info.feeAccountEthBalance)
                .toNumber();
        }
        let loanLimit = 0;
        const loanProductsList =
            this.props.loanManager &&
            this.props.loanManager.products &&
            this.props.loanManager.products.map((product, index) => {
                if (index === 0) {
                    loanLimit = product.maxLoanAmount;
                }
                if (product.maxLoanAmount < loanLimit) {
                    loanLimit = product.maxLoanAmount;
                }
                return (
                    <div>
                        {product.isActive && (
                            <StyledRow halign="justify" key={"reserv-page-loan-" + index}>
                                <StyledCol width={1 / 2}>{product.termText}</StyledCol>
                                <StyledCol width={1 / 2}>{(product.interestRatePa * 100).toFixed(2) + "%"}</StyledCol>
                            </StyledRow>
                        )}
                    </div>
                );
            });
        let lockLimit = 0;
        const lockProductsList =
            this.props.lockManager &&
            this.props.lockManager.products &&
            this.props.lockManager.products.map((product, index) => {
                if (index === 0) {
                    lockLimit = product.maxLockAmount;
                }
                if (product.maxLockAmount < loanLimit) {
                    lockLimit = product.maxLockAmount;
                }
                return (
                    <div>
                        {product.isActive && (
                            <StyledRow halign="justify" key={"reserv-page-lock-" + index}>
                                <StyledCol width={1 / 2} className="alignLeft">
                                    {product.durationText}
                                </StyledCol>
                                <StyledCol width={1 / 2}>{(product.interestRatePa * 100).toFixed(2) + "%"}</StyledCol>
                            </StyledRow>
                        )}
                    </div>
                );
            });
        return (
            <EthereumState>
                <StyledContainer>
                    <TopNavTitlePortal>
                        <Pheader className="secondaryColor" header="Reserves" />
                    </TopNavTitlePortal>
                    <StyledPheader header="Stability Dashboard" className="stabilityDashboard" style={{ margin: 0 }} />
                    <StyledHeader as="h3" content="A-EUR Market Supply" />
                    <StyledMyListGroup>
                        <StyledRow>
                            <StyledCol width={1 / 2}>
                                <MyListGroup>
                                    <StyledRow halign="justify">
                                        <StyledCol width={2 / 3}>+ Loans Outstanding</StyledCol>
                                        <StyledCol width={1 / 3}>
                                            {this.props.metrics.loansData.outstandingLoansAmount + " A€"}
                                        </StyledCol>
                                    </StyledRow>
                                </MyListGroup>
                            </StyledCol>
                        </StyledRow>
                        <StyledRow>
                            <StyledCol width={1 / 2}>
                                <MyListGroup>
                                    <StyledRow halign="justify">
                                        <StyledCol width={2 / 3}>+ Loans Collected</StyledCol>
                                        <StyledCol width={1 / 3}>{loansCollected + " A€"}</StyledCol>
                                    </StyledRow>
                                </MyListGroup>
                            </StyledCol>
                        </StyledRow>
                        <StyledRow>
                            <StyledCol width={1 / 2}>
                                <MyListGroup>
                                    <StyledRow halign="justify">
                                        <StyledCol width={2 / 3}>+ Issued by Stability Board (Net)</StyledCol>
                                        <StyledCol width={1 / 3}>
                                            {this.props.monetarySupervisor.info.issuedByStabilityBoard + " A€"}
                                        </StyledCol>
                                    </StyledRow>
                                </MyListGroup>
                            </StyledCol>
                        </StyledRow>
                        <StyledRow>
                            <StyledCol width={1 / 2}>
                                <MyListGroup>
                                    <StyledRow halign="justify" className="borderTop result">
                                        <StyledCol width={2 / 3}>Total</StyledCol>
                                        <StyledCol width={1 / 3}>
                                            {this.props.augmintToken.info.totalSupply + " A€"}
                                        </StyledCol>
                                    </StyledRow>
                                </MyListGroup>
                            </StyledCol>
                        </StyledRow>
                        <StyledRow className="borderTop">
                            <StyledCol width={1 / 2}>
                                <MyListGroup>
                                    <StyledRow halign="justify">
                                        <StyledCol width={2 / 3}>- Market Intervention Reserve</StyledCol>
                                        <StyledCol width={1 / 3}>
                                            {this.props.monetarySupervisor.info.reserveTokenBalance + " A€"}
                                        </StyledCol>
                                    </StyledRow>
                                </MyListGroup>
                            </StyledCol>
                        </StyledRow>
                        <StyledRow>
                            <StyledCol width={1 / 2}>
                                <MyListGroup>
                                    <StyledRow halign="justify">
                                        <StyledCol width={2 / 3}>- Fees</StyledCol>
                                        <StyledCol width={1 / 3}>
                                            {this.props.augmintToken.info.feeAccountTokenBalance + " A€"}
                                        </StyledCol>
                                    </StyledRow>
                                </MyListGroup>
                            </StyledCol>
                        </StyledRow>
                        <StyledRow>
                            <StyledCol width={1 / 2}>
                                <MyListGroup>
                                    <StyledRow halign="justify">
                                        <StyledCol width={2 / 3}>- Earned Interest</StyledCol>
                                        <StyledCol width={1 / 3}>
                                            {this.props.monetarySupervisor.info.interestEarnedAccountTokenBalance +
                                                " A€"}
                                        </StyledCol>
                                    </StyledRow>
                                </MyListGroup>
                            </StyledCol>
                        </StyledRow>
                        <StyledRow>
                            <StyledCol width={1 / 2}>
                                <MyListGroup>
                                    <StyledRow halign="justify" className="borderTop result">
                                        <StyledCol width={2 / 3}>Amount Owned by Users</StyledCol>
                                        <StyledCol width={1 / 3}>{amountOwnedByUsers + " A€"}</StyledCol>
                                    </StyledRow>
                                </MyListGroup>
                            </StyledCol>
                        </StyledRow>
                        <StyledRow>
                            <StyledCol width={1 / 2}>
                                <MyListGroup>
                                    <StyledRow halign="justify">
                                        <StyledCol width={2 / 3}>- Locked in Aamount</StyledCol>
                                        <StyledCol width={1 / 3}>
                                            {this.props.monetarySupervisor.info.totalLockedAmount + " A€"}
                                        </StyledCol>
                                    </StyledRow>
                                </MyListGroup>
                            </StyledCol>
                        </StyledRow>
                        <StyledRow>
                            <StyledCol width={1 / 2}>
                                <MyListGroup>
                                    <StyledRow halign="justify" className="borderTop result">
                                        <StyledCol width={2 / 3}>Amount Owned by Users (Liquid)</StyledCol>
                                        <StyledCol width={1 / 3}>{amountOwnedByUsersLiquid + " A€"}</StyledCol>
                                    </StyledRow>
                                </MyListGroup>
                            </StyledCol>
                        </StyledRow>
                    </StyledMyListGroup>
                    <StyledHeader as="h3" content="Market Intervention" />
                    <StyledMyListGroup>
                        <StyledRow>
                            <StyledCol width={1 / 2}>
                                <MyListGroup>
                                    <StyledRow halign="justify">
                                        <StyledCol width={2 / 3}>ETH Market Intervention Reserve</StyledCol>
                                        <StyledCol width={1 / 3}>
                                            {Number(this.props.monetarySupervisor.info.reserveEthBalance).toFixed(4) +
                                                " ETH"}
                                        </StyledCol>
                                    </StyledRow>
                                </MyListGroup>
                            </StyledCol>
                        </StyledRow>
                        <StyledRow>
                            <StyledCol width={1 / 2}>
                                <MyListGroup>
                                    <StyledRow halign="justify">
                                        <StyledCol width={2 / 3}>ETH Fees</StyledCol>
                                        <StyledCol width={1 / 3}>
                                            {Number(this.props.augmintToken.info.feeAccountEthBalance).toFixed(4) +
                                                " ETH"}
                                        </StyledCol>
                                    </StyledRow>
                                </MyListGroup>
                            </StyledCol>
                        </StyledRow>
                        <StyledRow>
                            <StyledCol width={1 / 2}>
                                <MyListGroup>
                                    <StyledRow halign="justify" className="borderTop result">
                                        <StyledCol width={2 / 3}>Total</StyledCol>
                                        <StyledCol width={1 / 3}>
                                            {Number(availableForMarketIntervention).toFixed(4) + " ETH"}
                                        </StyledCol>
                                    </StyledRow>
                                </MyListGroup>
                            </StyledCol>
                        </StyledRow>
                    </StyledMyListGroup>
                    <StyledHeader as="h3" content="Loans and Lockins" />
                    <StyledMyListGroup>
                        <StyledRow>
                            <StyledCol width={1 / 2}>
                                <MyListGroup>
                                    <StyledRow halign="justify">
                                        <StyledCol width={2 / 3}>Collateral Coverage Ratio</StyledCol>
                                        <StyledCol width={1 / 3}>{loanCollateralCoverageRatio + "%"}</StyledCol>
                                    </StyledRow>
                                </MyListGroup>
                            </StyledCol>
                        </StyledRow>
                        <StyledRow>
                            <StyledCol width={1 / 2}>
                                <MyListGroup>
                                    <StyledRow halign="justify">
                                        <StyledCol width={2 / 3}>Loans Outstanding</StyledCol>
                                        <StyledCol width={1 / 3}>
                                            {this.props.metrics.loansData.outstandingLoansAmount + " A€"}
                                        </StyledCol>
                                    </StyledRow>
                                </MyListGroup>
                            </StyledCol>
                        </StyledRow>
                        <StyledRow>
                            <StyledCol width={1 / 2}>
                                <MyListGroup>
                                    <StyledRow halign="justify">
                                        <StyledCol width={2 / 3}>Collateral in escrow</StyledCol>
                                        <StyledCol width={1 / 3}>
                                            {Number(this.props.metrics.loansData.collateralInEscrowEth).toFixed(4) +
                                                " ETH, "}
                                            <span>({collateralInEscrow + " A€"})</span>
                                        </StyledCol>
                                    </StyledRow>
                                </MyListGroup>
                            </StyledCol>
                        </StyledRow>
                        <StyledRow>
                            <StyledCol width={1 / 2}>
                                <MyListGroup>
                                    <StyledRow halign="justify">
                                        <StyledCol width={2 / 3}>Loan To Lockin Ratio</StyledCol>
                                        <StyledCol width={1 / 3}>
                                            {((this.props.monetarySupervisor.info.ltdPercent * 10000) / 100).toFixed(
                                                2
                                            ) + "%"}
                                        </StyledCol>
                                    </StyledRow>
                                </MyListGroup>
                            </StyledCol>
                        </StyledRow>
                        <StyledRow>
                            <StyledCol width={1 / 2}>
                                <MyListGroup>
                                    <StyledRow halign="justify" valign="stretch" className="borderTop">
                                        <StyledCol
                                            width={1 / 2}
                                            className="border"
                                            style={{ padding: 0, paddingRight: 10, marginTop: 10 }}
                                        >
                                            <MyListGroup>
                                                <StyledRow halign="justify" className="result">
                                                    <StyledCol>Loans</StyledCol>
                                                </StyledRow>
                                                <StyledRow halign="justify">
                                                    <StyledCol width={3 / 5}>Active Loans</StyledCol>
                                                    <StyledCol width={2 / 5}>
                                                        {this.props.monetarySupervisor.info.totalLoanAmount + " A€"}
                                                    </StyledCol>
                                                </StyledRow>
                                                <StyledRow halign="justify">
                                                    <StyledCol width={3 / 5}>Loan Limit</StyledCol>
                                                    <StyledCol width={2 / 5}>{loanLimit + " A€"}</StyledCol>
                                                </StyledRow>
                                                <br />
                                                <StyledRow halign="justify" className="result">
                                                    <StyledCol width={1 / 2}>Term</StyledCol>
                                                    <StyledCol width={1 / 2}>P.a. Interest</StyledCol>
                                                </StyledRow>
                                                {loanProductsList}
                                            </MyListGroup>
                                        </StyledCol>
                                        <StyledCol width={1 / 2} style={{ padding: 0, paddingLeft: 10, marginTop: 10 }}>
                                            <MyListGroup>
                                                <StyledRow halign="justify" className="result">
                                                    <StyledCol className="alignLeft">Lockins</StyledCol>
                                                </StyledRow>
                                                <StyledRow halign="justify">
                                                    <StyledCol width={3 / 5} className="alignLeft">
                                                        Active Lockins
                                                    </StyledCol>
                                                    <StyledCol width={2 / 5}>
                                                        {this.props.monetarySupervisor.info.totalLockedAmount + " A€"}
                                                    </StyledCol>
                                                </StyledRow>
                                                <StyledRow halign="justify">
                                                    <StyledCol width={3 / 5} className="alignLeft">
                                                        Lockin Limit
                                                    </StyledCol>
                                                    <StyledCol width={2 / 5}>{lockLimit + " A€"}</StyledCol>
                                                </StyledRow>
                                                <br />
                                                <StyledRow halign="justify" className="result">
                                                    <StyledCol width={1 / 2} className="alignLeft">
                                                        Term
                                                    </StyledCol>
                                                    <StyledCol width={1 / 2}>P.a. Interest</StyledCol>
                                                </StyledRow>
                                                {lockProductsList}
                                            </MyListGroup>
                                        </StyledCol>
                                    </StyledRow>
                                </MyListGroup>
                            </StyledCol>
                        </StyledRow>
                    </StyledMyListGroup>
                </StyledContainer>
            </EthereumState>
        );
    }
}

const mapStateToProps = state => ({
    augmintToken: state.augmintToken,
    loanManager: state.loanManager,
    lockManager: state.lockManager,
    monetarySupervisor: state.monetarySupervisor,
    metrics: state.metrics,
    rates: state.rates
});

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            refreshAugmintToken
        },
        dispatch
    );

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(AugmintToken);
