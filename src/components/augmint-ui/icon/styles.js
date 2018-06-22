import styled from "styled-components";
import theme from "styles/theme";

const BaseIcon = `
    text-align: center;

    &.disabled {
        opacity: .45;
    }

    &.close {
        cursor: pointer;
        position: absolute;
        margin: 0;
        top: 10px;
        right: 10px;
        opacity: .7;
        transition: opacity ${theme.transitions.fast};
    }

    &.close:hover {
        opacity: 1;
    }

    &.loading {
        animation: icon-loading 2s linear infinite;
    }

    &[color="grey"] {
      color: ${theme.colors.mediumGrey};
    }

    &.accountIcon {
        color: ${theme.colors.white};
        font-size: 1.5rem;
        height: 1.5rem;
        width: 1.5rem;
        padding-left: 20px;
    }
`;

export const StyledIcon = styled.i`
    ${BaseIcon};
`;
