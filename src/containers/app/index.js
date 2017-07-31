import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/css/bootstrap-theme.css';

import React from 'react';
import store from '../../store'
import watch from 'redux-watch'
import { setupWeb3, refreshBalance } from '../../modules/ethBase'
import { connectRates } from '../../modules/rates'
import { Navbar, Nav, NavItem } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { Route, Link } from 'react-router-dom';
import Home from '../home';
import Counter from '../counter';
import About from '../about';
import UnderTheHood from '../underthehood';

class App extends React.Component {

    constructor(props) {
        super(props);
        this.handleLoad = this.handleLoad.bind(this);
        window.addEventListener('load', this.handleLoad);
    }

    handleLoad() {
        store.dispatch(setupWeb3()); // we do it on load event to avoid timing issues with injected web3

        let w = watch(store.getState, 'ethBase.web3ConnectionId')
        store.subscribe(w((newVal, oldVal, objectPath) => {
            store.dispatch(connectRates());
        }))
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.isConnected && nextProps.userAccount !== this.props.userAccount ) {
            // TODO: this doesn't work yet: we need a timer to watch defaultAccount change
            // TODO handle this more generically (ie. watch all contract balances in ethBase, maybe cached? )
            refreshBalance(nextProps.userAccount)
        }
    }

    render() {
        return(
            <div>
                <header>
                    <Navbar inverse collapseOnSelect>
                        <Navbar.Header>
                            <Navbar.Brand>
                                <LinkContainer to="/">
                                    <Link to="/">UCD PoC</Link>
                                </LinkContainer>
                            </Navbar.Brand>
                            <Navbar.Toggle />
                        </Navbar.Header>
                        <Navbar.Collapse>
                            <Nav>
                                <LinkContainer to="/counter">
                                    <NavItem eventKey={1} href="/counter">Counter</NavItem>
                                </LinkContainer>
                                <LinkContainer to="/counter">
                                    <NavItem eventKey={2} href="/counter">TokenUcd</NavItem>
                                </LinkContainer>
                            </Nav>
                            <Nav pullRight>
                                <LinkContainer to="/about-us">
                                    <NavItem eventKey={1} href="/about-us">About</NavItem>
                                </LinkContainer>
                                <LinkContainer to="/under-the-hood">
                                    <NavItem eventKey={2} href="/under-the-hood">Under the hood</NavItem>
                                </LinkContainer>
                            </Nav>
                        </Navbar.Collapse>
                    </Navbar>

                </header>

                <main>
                    <Route exact path="/" component={Home} />
                    <Route exact path="/counter" component={Counter} />
                    <Route exact path="/about-us" component={About} />
                    <Route exact path="/under-the-hood" component={UnderTheHood} />
                </main>

            </div>
        )
    }
}

// const mapStateToProps = state => ({
//     address: state.ethBase.address,
//     balance: state.ethBase.balance,
//     isLoading: state.ethBase.isLoading,
//     isConnected: state.ethBase.isConnected
// })

// TODO: move web3 connect here but this causing navigation to break:
// export default connect(
//     mapStateToProps
// )(App)
export default App