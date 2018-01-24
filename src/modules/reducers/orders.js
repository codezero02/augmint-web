import { fetchOrders, placeOrderTx, matchOrdersTx } from "modules/ethereum/exchangeTransactions";

export const TOKEN_BUY = 0;
export const TOKEN_SELL = 1;

export const ORDERS_REFRESH_REQUESTED = "orders/ORDERS_REFRESH_REQUESTED";
export const ORDERS_REFRESH_ERROR = "orders/ORDERS_REFRESH_ERROR";
export const ORDERS_REFRESH_SUCCESS = "orders/ORDERS_REFRESH_SUCCESS";

export const PLACE_ORDER_REQUESTED = "orders/PLACE_ORDER_REQUESTED";
export const PLACE_ORDER_ERROR = "orders/PLACE_ORDER_ERROR";
export const PLACE_ORDER_SUCCESS = "orders/PLACE_ORDER_SUCCESS";

export const MATCH_ORDERS_REQUESTED = "orders/MATCH_ORDERS__REQUESTED";
export const MATCH_ORDERS_ERROR = "orders/MATCH_ORDERS__ERROR";
export const MATCH_ORDERS_SUCCESS = "orders/MATCH_ORDERS__SUCCESS";

const initialState = {
    refreshError: null,
    error: null,
    isLoading: true,
    orders: null
};

export default (state = initialState, action) => {
    switch (action.type) {
        case ORDERS_REFRESH_REQUESTED:
            return {
                ...state,
                isLoading: true,
                refreshError: null
            };

        case ORDERS_REFRESH_SUCCESS:
            return {
                ...state,
                orders: action.result,
                isLoading: false,
                refreshError: null
            };

        case ORDERS_REFRESH_ERROR:
            return {
                ...state,
                isLoading: false,
                refreshError: action.error
            };

        case PLACE_ORDER_REQUESTED:
            return {
                ...state,
                error: null,
                amount: action.amount,
                price: action.price,
                orderType: action.orderType
            };

        case PLACE_ORDER_SUCCESS:
            return {
                ...state,
                result: action.result
            };

        case PLACE_ORDER_ERROR:
            return {
                ...state,
                error: action.error
            };

        case MATCH_ORDERS_REQUESTED:
            return {
                ...state,
                error: null,
                buyOrder: action.buyOrder,
                sellOrder: action.sellOrder
            };

        case MATCH_ORDERS_SUCCESS:
            return {
                ...state,
                result: action.result
            };

        case MATCH_ORDERS_ERROR:
            return {
                ...state,
                error: action.error
            };

        default:
            return state;
    }
};

export const refreshOrders = () => {
    return async dispatch => {
        dispatch({
            type: ORDERS_REFRESH_REQUESTED
        });
        try {
            const orders = await fetchOrders();
            return dispatch({
                type: ORDERS_REFRESH_SUCCESS,
                result: orders
            });
        } catch (error) {
            return dispatch({
                type: ORDERS_REFRESH_ERROR,
                error: error
            });
        }
    };
};

export function placeOrder(orderType, amount, price) {
    return async dispatch => {
        dispatch({
            type: PLACE_ORDER_REQUESTED,
            orderType: orderType,
            price: price,
            amount: amount
        });

        try {
            let result = await placeOrderTx(orderType, amount, price);
            return dispatch({
                type: PLACE_ORDER_SUCCESS,
                result: result
            });
        } catch (error) {
            return dispatch({
                type: PLACE_ORDER_ERROR,
                error: error
            });
        }
    };
}

export function matchOrders(buyOrder, sellOrder) {
    return async dispatch => {
        dispatch({
            type: MATCH_ORDERS_REQUESTED,
            buyOrder: buyOrder,
            sellOrder: sellOrder
        });

        try {
            const result = await matchOrdersTx(buyOrder.index, buyOrder.id, sellOrder.index, sellOrder.id);
            return dispatch({
                type: MATCH_ORDERS_SUCCESS,
                result: result
            });
        } catch (error) {
            return dispatch({
                type: MATCH_ORDERS_ERROR,
                error: error
            });
        }
    };
}
