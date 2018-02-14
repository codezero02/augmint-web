import React from "react";
import { connect } from "react-redux";
import augmintTokenProvider from "modules/augmintTokenProvider";
import Web3ConnectionInfo from "./components/Web3ConnectionInfo";
import { UserAccountInfo } from "./components/UserAccountInfo";
import { ArrayDump } from "./components/ArrayDump";
import { SignTest } from "./components/SignTest";
import { Pgrid } from "components/PageLayout";

class BaseInfoGroup extends React.Component {
    componentDidMount() {
        augmintTokenProvider();
    }

    render() {
        return (
            <Pgrid columns={3}>
                <Pgrid.Column>
                    <Web3ConnectionInfo web3Connect={this.props.web3Connect} />

                    <SignTest web3Connect={this.props.web3Connect} />
                </Pgrid.Column>
                <Pgrid.Column>
                    <UserAccountInfo userBalances={this.props.userBalances} />
                </Pgrid.Column>
                <Pgrid.Column>
                    <ArrayDump header="Accounts" items={this.props.accounts} />
                </Pgrid.Column>
            </Pgrid>
        );
    }
}

const mapStateToProps = state => ({
    web3Connect: state.web3Connect,
    augmintToken: state.augmintToken,
    monetarySupervisor: state.monetarySupervisor,
    userBalances: state.userBalances,
    accounts: state.web3Connect.accounts
});

export default connect(mapStateToProps)(BaseInfoGroup);
