import styled from "styled-components";
import theme from "styles/theme";
import { media } from "styles/media";

export const StyledNotificationPanel = styled.div`
    background: transparent;
    z-index: 100;
    position: fixed;
    top: 65px;
    right: 11px;
    width: 310px;
    display: flex;
    flex-direction: column;
    max-height: calc(100% - 73px);
    padding-bottom: 3px;

    ${media.mobile`
        right: 0;
        left: 0;
        margin: auto;
    `} &.open {
        background: white;
        border: 1px solid ${theme.colors.primary};
        border-radius: 5px;
    }
`;

export const StyledHead = styled.div`
    display: none;
    background: ${theme.colors.primary};
    width: 100%;
    height: 40px;
    z-index: 1;
    flex: none;

    &.open {
        display: block;
    }
`;

export const StyledWrapper = styled.div`
    display: block;
    overflow: auto;
`;

export const StyledSpan = styled.span`
    color: ${theme.colors.white};
    display: block;
    position: absolute;
    top: 9px;
    left: 110px;
`;

export const CloseIcon = styled.img`
    height: 16px;
    width: 16px;
    display: inline-block;
    position: absolute;
    top: 12px;
    right: 10px;
    cursor: pointer;
`;
