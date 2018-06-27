import React from "react";
import Icon from "components/augmint-ui/icon";
import store from "modules/store";

export default function HashURL(props) {
    const { hash, title } = props;
    const web3 = store.getState().web3Connect;
    const url = process.env["REACT_APP_TRANSACTION_LINK_NETWORK_" + web3.network.id];
    const _title = title !== undefined ? title : "View on Etherscan.";

    return (
        <a href={url + hash} target="_blank">
            {_title}
        </a>
    );
}
