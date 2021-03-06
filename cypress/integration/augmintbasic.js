describe("Augmint base", function() {
    it("Under the hood", function() {
        cy.get("[data-testid=reservesMenuLink]").click();
        cy.get("[data-testid=underTheHoodLink]").click();

        cy.get("[data-testid=baseInfoLink]").click();
        cy.get("[data-testid=web3ConnectionInfo]").contains("connected");
        cy.get("[data-testid=userAccountTokenBalance]").should("not.contain", "?");

        cy.screenshot("underthehood_baseinfo");

        const expectedLoadStatus = "Loaded | not loading | No load error";
        cy.get("[data-testid=augmintInfoLink]").click();
        cy.get("[data-testid=MonetarySupervisor-dataStatus]").should("contain", expectedLoadStatus);
        cy.get("[data-testid=TokenAEur-dataStatus]").should("contain", "Loaded | not loading | No load error");

        const loanManagerAddress = "0x213135c85437C23bC529A2eE9c2980646c332fCB";
        const legacyLoanManagerAddress = "0xF7B8384c392fc333d3858a506c4F1506af44D53c";
        cy.get("[data-testid=loansInfoLink]").click();
        cy.get("[data-testid=loanmanagers]").should("contain", loanManagerAddress);
        cy.get("[data-testid=loanmanagers]").should("contain", legacyLoanManagerAddress);

        cy.get("[data-testid=locksInfoLink]").click();
        cy.get("[data-testid=Locker-dataStatus]").should("contain", expectedLoadStatus);

        cy.get("[data-testid=exchangeInfoLink]").click();
        cy.get("[data-testid=Exchange-dataStatus]").should("contain", expectedLoadStatus);
    });

    it("Should display reserves", function() {
        cy.get("[data-testid=reservesMenuLink").click();

        cy.get("[data-testid=totalSupply]").should("not.contain", "?");
        cy.get("[data-testid=issuedByStabilityBoard]").should("not.contain", "?");
        cy.get("[data-testid=reserveEthBalanceInFiat]").should("not.contain", "?");
        cy.get("[data-testid=reserveTokenBalance]").should("not.contain", "?");

        cy.get("[data-testid=feeAccountTokenBalance]").should("not.contain", "?");
        cy.get("[data-testid=interestEarnedAccountTokenBalance]").should("not.contain", "?");

        cy.get("[data-testid=loansToCollectButton]").click();
        cy.get("[data-testid=loansToCollectBlock]").should("contain", "Loans to collect");
        cy.get("[data-testid=loansToCollectBlock]").should("contain", "98.79 A€ loan for a few seconds");
    });
});
