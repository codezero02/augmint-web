import React from "react";
import { connect } from "react-redux";
import { connectWeb3 } from "modules/web3Provider";
import { Pheader, Psegment, Pgrid } from "components/PageLayout";
import exchangeProvider from "modules/exchangeProvider";
import ratesProvider from "modules/ratesProvider";
import augmintTokenProvider from "modules/augmintTokenProvider";
import AccountInfo from "components/AccountInfo";
import FiatExchange from "./components/FiatExchange";
import OrderBook from "./components/OrderBook";
import MyOrders from "./components/MyOrders";
import TradeHistory from "./components/TradeHistory";
import ExchangeSummary from "./components/ExchangeSummary";
import PlaceOrderForm from "./components/PlaceOrderForm";
import { EthereumState } from "containers/app/EthereumState";
import MatchOrdersButton from "./components/MatchOrdersButton";

import TopNavTitlePortal from "components/portals/TopNavTitlePortal";
import { FeatureContext } from "modules/services/featureService";

class ExchangeHome extends React.Component {
    componentDidMount() {
        connectWeb3();
        augmintTokenProvider();
        exchangeProvider();
        ratesProvider();
    }
    render() {
        const { orders, exchange, rates, trades } = this.props;
        const { userAccount } = this.props.web3Connect;
        return (
            <EthereumState>
                <Psegment>
                    <TopNavTitlePortal>
                        <FeatureContext>
                            {features =>
                                features.dashboard ? (
                                    <Pheader className="secondaryColor" header="Buy & Sell A-EUR" />
                                ) : (
                                    <Pheader header="Buy & Sell A-EUR" />
                                )
                            }
                        </FeatureContext>
                    </TopNavTitlePortal>
                    <Pgrid>
                        <Pgrid.Row wrap={false}>
                            <Pgrid.Column size={1 / 2}>
                                <AccountInfo account={userAccount} />

                                <FiatExchange
                                    header="€ &harr; A€ on partner exchange"
                                    web3Connect={this.props.web3Connect}
                                />
                                <FeatureContext>
                                    {features =>
                                        features.dashboard ? (
                                            <PlaceOrderForm orders={orders} exchange={exchange} rates={rates} />
                                        ) : (
                                            <PlaceOrderForm
                                                orders={orders}
                                                exchange={exchange}
                                                rates={rates}
                                                header="A€ &harr; ETH on Augmint"
                                            />
                                        )
                                    }
                                </FeatureContext>

                                <MyOrders
                                    testid="myOrdersBlock"
                                    orders={orders}
                                    rates={rates}
                                    userAccountAddress={userAccount}
                                    header="My open orders"
                                />
                            </Pgrid.Column>

                            <Pgrid.Column size={1 / 2}>
                                <ExchangeSummary exchange={exchange} rates={rates} />
                                {orders.orders && (
                                    <MatchOrdersButton
                                        buyOrder={orders.orders.buyOrders[0]}
                                        sellOrder={orders.orders.sellOrders[0]}
                                        label="Match top sell and buy order"
                                    />
                                )}
                                <OrderBook
                                    testid="allOrdersBlock"
                                    orders={orders}
                                    rates={rates}
                                    userAccountAddress={userAccount}
                                    header="Order book"
                                />
                            </Pgrid.Column>
                        </Pgrid.Row>
                        <Pgrid.Row>
                            <TradeHistory trades={trades} userAccountAddress={userAccount} header="My trade history" />
                        </Pgrid.Row>
                    </Pgrid>
                </Psegment>
            </EthereumState>
        );
    }
}

const mapStateToProps = state => ({
    web3Connect: state.web3Connect,
    exchange: state.exchange,
    orders: state.orders,
    rates: state.rates,
    trades: state.trades
});

export default connect(mapStateToProps)(ExchangeHome);
