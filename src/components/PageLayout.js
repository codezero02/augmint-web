import React from "react";
import Grid from "styled-components-grid";
import Container from "components/augmint-ui/container";
import Header from "components/augmint-ui/header";
import Divider from "components/augmint-ui/divider";
import Segment from "components/augmint-ui/segment";

import theme from "styles/theme";

export function Pheader(props) {
    const { children, header, ...other } = props;
    return (
        <Container {...other}>
            {header && <Header as="h1">{header}</Header>}
            {children}
            <Divider />
        </Container>
    );
}

Pheader.defaultProps = {
    style: { margin: "1em 0" }
};

export function Pcontainer(props) {
    const { children, ...other } = props;
    return <Container {...other}>{children}</Container>;
}

Pcontainer.defaultProps = {
    style: { margin: "2em 0" }
};

export class Psegment extends React.Component {
    render() {
        const { children, ...other } = this.props;
        return <Segment {...other}>{children}</Segment>;
    }
}

Psegment.defaultProps = {
    style: { margin: "0 auto", padding: "2em 2em", maxWidth: theme.pageSize.maxSize },
    vertical: true
};

export class Pgrid extends React.Component {
    render() {
        const { children, ...other } = this.props;
        return <div {...other}>{children}</div>;
    }
}

export class Pcolumn extends React.Component {
    render() {
        const { children, ...other } = this.props;
        return <Grid.Unit {...other}>{children}</Grid.Unit>;
    }
}

Pcolumn.defaultProps = {
    style: {
        padding: "1rem"
    }
};

Pgrid.Column = Pcolumn;
Pgrid.Row = Grid;

export function Pblock(props) {
    const { children, header, ...other } = props;
    return (
        <Segment {...other}>
            <Header as="h2" content={header} />
            {children}
        </Segment>
    );
}
