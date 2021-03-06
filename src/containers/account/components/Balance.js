import React from "react";
import styled from "styled-components";
import { default as theme, remCalc } from "styles/theme";
import { Pgrid, Pblock } from "components/PageLayout";
import { DECIMALS } from "utils/constants";
import { AEUR, ETH } from "components/augmint-ui/currencies";
import { Tokens } from "@augmint/js";
import AccountAddress from "components/accountAddress";
import Button from "components/augmint-ui/button";
import WatchAssetButton from "components/watchAssetButton";
import { media } from "styles/media";

const Label = styled.div`
    font-size: ${remCalc(14)};
    color: ${theme.colors.mediumGrey};
    &.balance {
        text-align: center;
    }
`;

const TokenBalance = styled.div`
    font-family: ${theme.typography.fontFamilies.currency};
    font-size: ${remCalc(32)};
    ${media.tabletMin`
            font-size: ${remCalc(48)};
        `};
    .currency > span {
        font-size: ${remCalc(24)};
    }
`;

const TokenAmount = styled.div`
    font-family: ${theme.typography.fontFamilies.currency};
    font-size: ${remCalc(24)};
`;

const EthAmount = styled.div`
    margin-top: 0.5em;
    padding: 0.5em 0;
    border-top: 1px solid ${theme.colors.grey};
    font-family: ${theme.typography.fontFamilies.currency};
`;

const Container = styled.div`
    width: 100%;
    min-width: 250px;
    padding-top: 10px;
    margin: auto;
    display: flex;
    text-align: center;
    justify-content: space-between;

    a {
        flex: 1;
        margin: 0 0.2rem;
        padding: 0 0 10px;
        ${media.tabletMin`
            font-size: 1rem;
        `};
    }
`;

const pick = (arr, key) => arr && arr.map(item => item[key]);
const sumTokens = arr => arr && arr.reduce((acc, item) => acc.add(item), Tokens.of(0));
const sumNumbers = arr => arr && arr.reduce((acc, item) => acc + item, 0).toFixed(DECIMALS);

export default class Balance extends React.Component {
    render() {
        const { userAccount, loans, locks, children } = this.props;
        const activeLoans = loans.loans && loans.loans.filter(loan => loan.isRepayable);
        const activeLocks = locks.locks && locks.locks.filter(lock => lock.isReleasebale || lock.isActive);
        const loansAmount = sumTokens(pick(activeLoans, "loanAmount"));
        const locksAmount = sumNumbers(pick(activeLocks, "amountLocked"));
        const releaseBtn = locks.locks && locks.locks.filter(lock => lock.isReleasebale).length > 0;
        const repayBtn = loans.loans && loans.loans.filter(loan => loan.isDue && loan.isRepayable).length > 0;

        const LoansUIBlock = () => {
            return (
                <Pgrid.Column
                    size={1 / 2}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        textAlign: "-webkit-center",
                        padding: ".5rem 0 0"
                    }}
                >
                    {parseFloat(loansAmount) !== 0 ? (
                        <>
                            <Label>My total loans</Label>
                            <TokenAmount>
                                <AEUR amount={loansAmount} />
                            </TokenAmount>
                            {repayBtn && (
                                <Button to="/loan" className="balanceBtn danger" style={{ marginTop: "5px" }}>
                                    Repay due loans
                                </Button>
                            )}
                            <Button className="naked" to="/loan" style={{ padding: "10px" }}>
                                View all loans
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button to="/loan/new" className="balanceBtn">
                                Get a new loan
                            </Button>
                            <Button className="naked" to="/loan/archive" style={{ padding: "10px" }}>
                                View old loans
                            </Button>
                        </>
                    )}
                </Pgrid.Column>
            );
        };

        const NoLoansUIBlock = () => {
            return (
                <Pgrid.Column
                    size={1 / 2}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        textAlign: "-webkit-center",
                        padding: ".5rem 0 .5rem"
                    }}
                >
                    <Button to="/loan/new" className="balanceBtn">
                        Get a new loan
                    </Button>
                </Pgrid.Column>
            );
        };

        const LocksUIBlock = () => {
            return (
                <Pgrid.Column
                    size={1 / 2}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        textAlign: "-webkit-center",
                        padding: ".5rem 0 0"
                    }}
                >
                    {parseFloat(locksAmount) !== 0 ? (
                        <>
                            <Label>My total locks</Label>
                            <TokenAmount>
                                <AEUR amount={locksAmount} />
                            </TokenAmount>
                            {releaseBtn && (
                                <Button to="/lock" className="balanceBtn" style={{ marginTop: "5px" }}>
                                    Release funds
                                </Button>
                            )}
                            <Button className="naked" to="/lock" style={{ padding: "10px" }}>
                                View all locks
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button to="/lock/new" className="balanceBtn">
                                Lock A-EUR
                            </Button>
                            <Button className="naked" to="/lock/archive" style={{ padding: "10px" }}>
                                View old locks
                            </Button>
                        </>
                    )}
                </Pgrid.Column>
            );
        };

        const NoLocksUIBlock = () => {
            return (
                <Pgrid.Column
                    size={1 / 2}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        textAlign: "-webkit-center",
                        padding: ".5rem 0 .5rem"
                    }}
                >
                    <Button to="/lock/new" className="balanceBtn">
                        Lock A-EUR
                    </Button>
                </Pgrid.Column>
            );
        };

        return (
            <Pblock
                className="balance"
                style={{ justifyContent: "center", maxWidth: "500px", margin: "auto", marginBottom: 0 }}
                balanceBlock
            >
                <div style={{ textAlign: "center" }}>
                    <Label className="balance">Current balance</Label>
                    <TokenBalance>
                        <AEUR amount={userAccount.tokenBalance} className="currency" />
                    </TokenBalance>
                </div>
                {/* <ButtonGroup buttons={buttons} /> */}
                <Container>
                    <Button
                        to="/exchangeFiat"
                        icon="reserves"
                        circleicon="true"
                        className="naked circle icon top"
                        labelposition="top"
                    >
                        Exchange fiat
                    </Button>
                    <Button
                        to="/exchange"
                        icon="exchange"
                        circleicon="true"
                        className="naked circle icon top"
                        labelposition="top"
                    >
                        Exchange crypto
                    </Button>
                    {userAccount.tokenBalance > 0 && (
                        <Button
                            to="/transfer"
                            className="naked circle icon top"
                            icon="send"
                            circleicon="true"
                            data-testid="transferButton"
                            labelposition="top"
                        >
                            Send
                        </Button>
                    )}
                    <WatchAssetButton
                        className="naked icon top"
                        icon="wallet"
                        circleicon="true"
                        labelposition="top"
                        btn
                    />
                </Container>
                <Pgrid.Row style={{ textAlign: "center" }}>
                    {loans && loans.isLoaded && loans.loans.length > 0 ? <LoansUIBlock /> : <NoLoansUIBlock />}
                    {locks && locks.locks.length > 0 ? <LocksUIBlock /> : <NoLocksUIBlock />}
                </Pgrid.Row>
                <EthAmount style={{ textAlign: "center" }}>
                    <Label>ETH balance</Label>
                    <ETH amount={userAccount.ethBalance} />
                </EthAmount>
                <div
                    style={{
                        textAlign: "center",
                        margin: ".5rem auto 0",
                        overflowWrap: "break-word"
                    }}
                >
                    <Label className="balance">Account address</Label>
                    <AccountAddress
                        address={userAccount.address}
                        title=""
                        className={"breakToLines always noClick font"}
                        showCopyLink
                    />
                </div>
                {children}
            </Pblock>
        );
    }
}
