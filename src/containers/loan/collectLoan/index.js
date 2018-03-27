import React from "react";
import { connect } from "react-redux";
import store from "modules/store";
import LoansToCollectList from "containers/loan/components/LoansToCollectList";
import { Psegment, Pheader, Pgrid } from "components/PageLayout";
import { Message } from "semantic-ui-react";

import { fetchLoansToCollect } from "modules/reducers/loanManager";
import CollectLoanButton from "./CollectLoanButton";

class CollectLoanMain extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loansToCollect: null
        };
    }

    componentDidMount() {
        // needed when landing from Link within App
        if (this.props.loanManager.contract) {
            store.dispatch(fetchLoansToCollect());
        }
    }

    componentDidUpdate(prevProps, prevState) {
        // when landing directly on this page - augmintToken loads later than loanManager
        if (
            (this.props.loanManager.contract && prevProps.loanManager.contract !== this.props.loanManager.contract) ||
            (this.props.augmintToken.contract !== prevProps.augmintToken.contract &&
                this.props.augmintToken.isConnected)
        ) {
            // loanManager mounted
            store.dispatch(fetchLoansToCollect());
        }
    }

    render() {
        const { loanManager } = this.props;
        return (
            <Psegment>
                <Pheader header="Collect loans" />
                <Pgrid>
                    <Pgrid.Column width={6}>
                        <Message info>
                            <p>
                                When collecting a defaulted (not paid on time) loan the ETH held in contract escrow
                                (collateral) will be transfered to system reserves.
                            </p>
                            <p>
                                If the value of the ETH collateral (at the moment of collection) is higher than the
                                A-EUR repayment amount less the fees for the collection then the leftover ETH will be
                                transfered back to the borrower's ETH account.
                            </p>
                        </Message>
                    </Pgrid.Column>
                    <Pgrid.Column width={10}>
                        <CollectLoanButton loanManager={loanManager} loansToCollect={loanManager.loansToCollect} />
                        <LoansToCollectList
                            header="Loans to collect"
                            noItemMessage={<p>No defaulted and uncollected loan.</p>}
                            loanManager={loanManager}
                        />
                    </Pgrid.Column>
                </Pgrid>
            </Psegment>
        );
    }
}

const mapStateToProps = state => ({
    loanManager: state.loanManager,
    augmintToken: state.augmintToken
});

export default (CollectLoanMain = connect(mapStateToProps)(CollectLoanMain));
