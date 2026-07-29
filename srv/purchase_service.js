const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {

    const {
        PurchaseRequests,
        PurchaseRequestItems,
        Notifications,
        StatusHistories
    } = this.entities;
    //const { Attachments } = cds.entities('@cap-js/attachments');

    this.before('CREATE', PurchaseRequests, async (req) => {

        const year = new Date().getFullYear();

        const requests = await SELECT.from(PurchaseRequests);

        const sequence = requests.length + 1;

        req.data.requestNo =
            `PR-${year}-${String(sequence).padStart(6, '0')}`;
        req.data.status = 'Draft';
    });

    this.on('submitRequest', async (req) => {

        const requestId = req.params[0].ID;

        const purchaseRequest = await SELECT.one
            .from(PurchaseRequests)
            .where({ ID: requestId });

        if (!purchaseRequest) {
            return req.error(404, 'Purchase Request not found.');
        }

        if (purchaseRequest.status !== 'Draft') {
            return req.error(
                400,
                'Only Draft Purchase Requests can be submitted.'
            );
        }

        const items = await SELECT
            .from(PurchaseRequestItems)
            .where({ request_ID: requestId });

        // // Rule 1
        if (items.length === 0) {
            return req.error(
                400,
                'At least one item should exist before submitting a Purchase Request.'
            );
        }

        // Rule 11 - Duplicate Purchase Request within 7 days

        if (items.length > 0) {

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const oldRequests = await SELECT.from(PurchaseRequests)
                .where({
                    //requesterName: purchaseRequest.requesterName,
                    department: purchaseRequest.department
                });

            for (const oldRequest of oldRequests) {
                if (oldRequest.ID === requestId) continue;
                if (new Date(oldRequest.requestDate) >= sevenDaysAgo) {

                    const oldItems = await SELECT.from(PurchaseRequestItems)
                        .where({ request_ID: oldRequest.ID });

                    for (const newItem of items) {

                        const duplicate = oldItems.find(item =>
                            item.materialNo === newItem.materialNo &&
                            item.quantity === newItem.quantity
                        );

                        if (duplicate) {

                            req.error(
                                400,
                                'Duplicate Purchase Request exists within the last 7 days.'
                            );

                        }
                    }
                }
            }
        }


        // Rule 23 - Minimum Amount
        if (purchaseRequest.totalAmount <= 100) {
            return req.error(
                400,
                'Purchase Request Total Amount should be greater than ₹100.'
            );
        }

        // Rule 29 - Attachment Requirement
        if (Number(purchaseRequest.totalAmount) > 100000) {
 
            if (
                !purchaseRequest.attachments ||
                purchaseRequest.attachments.length === 0
            ) {
                return req.error(
                    400,
                    'Supporting document attachment is mandatory when Total Amount exceeds ₹1,00,000.'
                );
            }
 
            const allowedExtensions = [
                'pdf',
                'jpg',
                'jpeg',
                'png'
            ];
 
            for (const attachment of purchaseRequest.attachments) {
 
                const fileName =
                    attachment.fileName ||
                    attachment.filename ||
                    '';
 
                const extension = fileName.includes('.')
                    ? fileName.split('.').pop().toLowerCase()
                    : '';
 
                if (
                    !extension ||
                    !allowedExtensions.includes(extension)
                ) {
                    return req.error(
                        400,
                        `Invalid attachment type '${fileName || 'Unknown'}'. Only PDF, JPG, JPEG and PNG files are allowed.`
                    );
                }
 
                const fileSize = Number(
                    attachment.fileSize ||
                    attachment.size ||
                    0
                );
 
                if (fileSize > 10 * 1024 * 1024) {
                    return req.error(
                        400,
                        `Attachment '${fileName}' exceeds the maximum allowed size of 10 MB.`
                    );
                }
            }
        }

        // // Only after all validations pass
        // await UPDATE(PurchaseRequests)
        //     .set({
        //         status: 'Submitted',
        //         approver: approver
        //     })
        //     .where({ ID: requestId });

        // Rule 17 - Approval Matrix
        let approver;

        if (purchaseRequest.totalAmount <= 10000) {
            approver = 'Manager';
        }
        else if (purchaseRequest.totalAmount <= 50000) {
            approver = 'Senior Manager';
        }
        else {
            approver = 'Director';
        }
        await UPDATE(PurchaseRequests)
            .set({
                status: 'Submitted',
                approver: approver
            })
            .where({
                ID: requestId
            });
        // Rule 25 - Notification for Submit

        await INSERT.into(Notifications).entries({
            request_ID: requestId,
            message: 'Purchase Request Submitted',
            type: 'SUBMITTED'
        });
        // Rule 26 - Status History

        await INSERT.into(StatusHistories).entries({
            request_ID: requestId,
            oldStatus: 'Draft',
            newStatus: 'Submitted',
            userName: req.user.id,
            changedAt: new Date()
        });
    });

    // Rule 20 - Cancel Request

    this.on('cancelRequest', async (req) => {

        const requestId = req.params[0].ID;

        const purchaseRequest = await SELECT.one
            .from(PurchaseRequests)
            .where({ ID: requestId });

        if (!purchaseRequest) {
            req.error('Purchase Request not found.');
        }

        if (
            purchaseRequest.status !== 'Draft' &&
            purchaseRequest.status !== 'Submitted'
        ) {
            req.error(
                'Only Draft and Submitted requests can be cancelled.'
            );
        }

        await UPDATE(PurchaseRequests)
            .set({
                status: 'Cancelled'
            })
            .where({
                ID: requestId
            });
        // Rule 25 - Notification for Cancel

        await INSERT.into(Notifications).entries({
            request_ID: requestId,
            message: 'Purchase Request Cancelled',
            type: 'CANCELLED'
        });
        // Rule 26 - Status History

        await INSERT.into(StatusHistories).entries({
            request_ID: requestId,
            oldStatus: purchaseRequest.status,
            newStatus: 'Cancelled',
            userName: req.user.id,
            changedAt: new Date()
        });
        return 'Purchase Request Cancelled Successfully';

    });
    this.on('approveRequest', async (req) => {

        const requestId = req.params[0].ID;

        const purchaseRequest = await SELECT.one
            .from(PurchaseRequests)
            .where({ ID: requestId });

        if (!purchaseRequest) {
            req.error('Purchase Request not found.');
        }

        if (purchaseRequest.status !== 'Submitted') {
            req.error(
                'Only Submitted requests can be approved.'
            );
        }

        await UPDATE(PurchaseRequests)
            .set({
                status: 'Approved',
                approvedBy: req.user.id,
                approvedAt: new Date()
            })
            .where({
                ID: requestId
            });

        // Rule 25 - Notification

        await INSERT.into(Notifications).entries({
            request_ID: requestId,
            message: 'Purchase Request Approved',
            type: 'APPROVED'
        });

        // Rule 26 - Status History

        await INSERT.into(StatusHistories).entries({
            request_ID: requestId,
            oldStatus: 'Submitted',
            newStatus: 'Approved',
            userName: req.user.id,
            changedAt: new Date()
        });

        return 'Purchase Request Approved Successfully';

    });
    this.on('rejectRequest', async (req) => {

        const requestId = req.params[0].ID;

        const purchaseRequest = await SELECT.one
            .from(PurchaseRequests)
            .where({ ID: requestId });

        if (!purchaseRequest) {
            req.error('Purchase Request not found.');
        }

        // Rule 18
        if (
            !req.data.rejectionComments ||
            req.data.rejectionComments.trim().length < 20
        ) {
            req.error(
                'Rejection comments are mandatory and must contain at least 20 characters.'
            );
        }

        if (purchaseRequest.status !== 'Submitted') {
            req.error(
                'Only Submitted requests can be rejected.'
            );
        }

        await UPDATE(PurchaseRequests)
            .set({
                status: "Rejected",
                rejectionComments: req.data.rejectionComments,
                rejectedBy: req.user.id,
                rejectedAt: new Date()
            })
            .where({
                ID: requestId
            });

        return 'Purchase Request Rejected Successfully';

    });
    // Rule 24 - Delete Item Restriction

    this.before('DELETE', PurchaseRequestItems, async (req) => {

        const item = await SELECT.one
            .from(PurchaseRequestItems)
            .where({ ID: req.data.item[0].ID });

        if (!item) {
            req.error('Item not found.');
        }

        const request = await SELECT.one
            .from(PurchaseRequests)
            .where({ ID: req.data.ID });

        if (
            request &&
            request.status !== 'Draft'
        ) {

            req.error(
                'Items cannot be deleted after request submission.'
            );

        }

    });

    this.before(['CREATE', 'UPDATE'], PurchaseRequests, async (req) => {

        //  console.log("=======================------------------------========================attachments",req.data);


        // Rule 2
        if (req.data.items && req.data.items.length > 0) {

            for (const item of req.data.items) {

                if (item.quantity == null || item.quantity <= 0) {
                    req.error(
                        'Quantity should always be greater than zero.'
                    );
                }

            }

        }
        // Rule 3
        if (req.data.items && req.data.items.length > 0) {

            for (const item of req.data.items) {

                if (item.unitPrice == null || item.unitPrice <= 0) {
                    req.error(
                        'Unit Price should always be positive.'
                    );
                }

            }

        }
        // Rule 4 - Total Price = Quantity × Unit Price

        if (req.data.items && req.data.items.length > 0) {

            for (const item of req.data.items) {

                item.totalPrice = item.quantity * item.unitPrice;

            }

        }
        // Rule 5
        // let totalAmount = 0;

        // if (req.data.items && req.data.items.length > 0) {

        //     for (const item of req.data.items) {

        //         totalAmount += item.totalPrice;

        //     }

        // }

        // req.data.totalAmount = totalAmount;

        // Rule 6
        if (
            req.data.totalAmount > 50000 &&
            !req.data.approver
        ) {
            req.error(
                'Approver is mandatory when Total Amount exceeds ₹50,000.'
            );
        }

        // Rule 7 - Duplicate Material Number

        if (req.data.items && req.data.items.length > 0) {

            const materialNumbers = [];

            for (const item of req.data.items) {

                if (materialNumbers.includes(item.materialNo)) {
                    req.error(
                        'Duplicate Material Numbers are not allowed within the same Purchase Request.'
                    );
                }

                materialNumbers.push(item.materialNo);

            }

        }

        // Rule 10 - Maximum 20 Items

        if (req.data.items && req.data.items.length > 20) {

            req.error(
                'A Purchase Request can contain a maximum of 20 items.'
            );

        }


        // Rule 8 - Only Draft requests can be edited

        if (req.data.ID) {

            const request = await SELECT.one
                .from(PurchaseRequests)
                .where({ ID: req.data.ID });

            if (request && request.status !== 'Draft') {

                req.error(
                    'Only Draft Purchase Requests can be edited.'
                );

            }

        }


        // Rule 11 - Duplicate Purchase Request within 7 days

        // if (req.data.items && req.data.items.length > 0) {

        //     const sevenDaysAgo = new Date();
        //     sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        //     const oldRequests = await SELECT.from(PurchaseRequests)
        //         .where({
        //             requesterName: req.data.requesterName,
        //             department: req.data.department
        //         });

        //     for (const oldRequest of oldRequests) {

        //         if (new Date(oldRequest.requestDate) >= sevenDaysAgo) {

        //             const oldItems = await SELECT.from(PurchaseRequestItems)
        //                 .where({ request_ID: oldRequest.ID });

        //             for (const newItem of req.data.items) {

        //                 const duplicate = oldItems.find(item =>
        //                     item.materialNo === newItem.materialNo &&
        //                     item.quantity === newItem.quantity
        //                 );

        //                 if (duplicate) {

        //                     req.error(
        //                         'Duplicate Purchase Request exists within the last 7 days.'
        //                     );

        //                 }
        //             }
        //         }
        //     }
        // }


        // Rule 12 - Department Validation

        const validDepartments = [
            'Finance',
            'HR',
            'Procurement',
            'IT',
            'Manufacturing'
        ];

        if (
            req.data.department &&
            !validDepartments.includes(req.data.department)
        ) {
            req.error(
                'Invalid Department. Allowed values are Finance, HR, Procurement, IT and Manufacturing.'
            );
        }

        // Rule 13 - Material Description Mandatory

        if (req.data.items && req.data.items.length > 0) {

            for (const item of req.data.items) {

                if (
                    !item.description ||
                    item.description.trim().length < 10
                ) {

                    req.error(
                        'Material Description must contain at least 10 characters.'
                    );

                }

            }

        }


        if (req.data.items && req.data.items.length > 0) {

            for (const item of req.data.items) {

                // Rule 14
                if (item.quantity > 100) {
                    req.error(
                        'Quantity cannot exceed 100.'
                    );
                }

                // Rule 15
                if (item.unitPrice == null || item.unitPrice <= 0) {
                    req.error(
                        'Unit Price should be greater than zero.'
                    );
                }

                if (item.unitPrice >= 100000) {
                    req.error(
                        'Unit Price should be less than ₹100000.'
                    );
                }

            }

        }
        // Rule 16 - Automatic Tax Calculation

        if (req.data.items) {

            let totalAmount = 0;

            for (const item of req.data.items) {

                const netAmount =
                    item.quantity * item.unitPrice;

                const taxAmount =
                    netAmount * 0.18;

                const grossAmount =
                    netAmount + taxAmount;

                item.totalPrice = netAmount;
                item.taxAmount = taxAmount;
                item.grossAmount = grossAmount;

                totalAmount += grossAmount;
            }

            req.data.totalAmount = totalAmount;
            if (totalAmount <= 10000) {
                req.data.approver = "Manager";
            }
            else if (totalAmount <= 50000) {
                req.data.approver = "Senior Manager";
            }
            else {
                req.data.approver = "Director";
            }
        }

        // Rule 17 - Approval Matrix

        // if (req.data.totalAmount <= 10000) {

        //     req.data.approver = 'Manager';

        // }
        // else if (
        //     req.data.totalAmount > 10000 &&
        //     req.data.totalAmount <= 50000
        // ) {

        //     req.data.approver = 'Senior Manager';

        // }
        // else if (req.data.totalAmount > 50000) {

        //     req.data.approver = 'Director';

        // }

        // Rule 18 - Rejection Comments Mandatory

        if (req.data.status === 'Rejected') {

            if (
                !req.data.rejectionComments ||
                req.data.rejectionComments.trim().length < 20
            ) {

                req.error(
                    'Rejection comments are mandatory and must contain at least 20 characters.'
                );

            }

        }




        // Rule 22 - Date Validation

        if (req.data.requestDate) {

            const requestDate = new Date(req.data.requestDate);
            const today = new Date();

            // Future Date Validation
            if (requestDate > today) {

                req.error(
                    'Request Date cannot be a future date.'
                );

            }

            // 30 Days Old Validation
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            if (requestDate < thirtyDaysAgo) {

                req.error(
                    'Request Date cannot be older than 30 days.'
                );

            }

        }



    });


     // Rule 21 - Immutable Records

    this.before(['UPDATE', 'DELETE'], PurchaseRequests, async (req) => {

        const request = await SELECT.one
            .from(PurchaseRequests)
            .where({ ID: req.data.ID });

            const createdDate = new Date(request.createdAt);
    const today = new Date();

    const diffDays = Math.floor(
        (today - createdDate) / (1000 * 60 * 60 * 24)
    );

    if (request.status === 'Draft' && diffDays > 30) {

        await UPDATE(PurchaseRequests)
            .set({ status: 'Expired' })
            .where({ ID: request.ID });

        return req.error(
            400,
            'Draft Request has expired after 30 days.'
        );
    }

        if (
            request &&
            (
                request.status === 'Approved' ||
                request.status === 'Rejected' ||
                request.status === 'Cancelled'
            )
        ) {

            req.error(
                'Approved, Rejected and Cancelled requests are read-only.'
            );

        }
    });

});
   