sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"project1/test/integration/pages/PurchaseRequestsList.gen",
	"project1/test/integration/pages/PurchaseRequestsObjectPage.gen"
], function (JourneyRunner, PurchaseRequestsListGenerated, PurchaseRequestsObjectPageGenerated) {
    'use strict';

    const runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('project1') + '/test/flp.html#app-preview',
        pages: {
			onThePurchaseRequestsListGenerated: PurchaseRequestsListGenerated,
			onThePurchaseRequestsObjectPageGenerated: PurchaseRequestsObjectPageGenerated
        },
        async: true
    });

    return runner;
});

