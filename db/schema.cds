namespace db;

using {cuid,managed} from '@sap/cds/common';

using {Attachments} from '@cap-js/attachments';


entity PurchaseRequest : cuid, managed {

    requestNo         : String(20);
    requesterName     : String(100)@mandatory;
    department        : String(100)@mandatory;
    requestDate       : Date @mandatory;
    currency          : String(3) @mandatory;
    totalAmount       : Decimal(15, 2);
    status            : String(20) default 'Draft';
    approver          : String(100);
    rejectionComments : String(500);
    approvalComments  : String(500);
    approvedBy        : String(100);
    approvedAt        : Timestamp;
    rejectedBy        : String(100);
    rejectedAt        : Timestamp;
    // createdByUser : String(100);

    items             : Composition of many PurchaseRequestItem
                            on items.request = $self;

    notifications     : Composition of many Notification
                            on notifications.request = $self;

    history           : Composition of many StatusHistory
                            on history.request = $self;

    attachments       : Composition of many Attachments;

// auditLogs  : Composition of many Audit
//           on auditLogs.request = $self;

}

entity PurchaseRequestItem : cuid {

    request     : Association to PurchaseRequest;
    materialNo  : String(50);
    description : String(255);
    quantity    : Integer;
    unitPrice   : Decimal(15, 2);
    totalPrice  : Decimal(15, 2);
    taxAmount   : Decimal(15, 2);
    grossAmount : Decimal(15, 2);
}

entity Notification : cuid, managed {

    request : Association to PurchaseRequest;
    message : String(500);
    type    : String(50);

}

entity StatusHistory : cuid, managed {

    request   : Association to PurchaseRequest;
    oldStatus : String(30);
    newStatus : String(30);
    userName  : String(100);
    changedAt : Timestamp;

}

entity Audit : cuid, managed {

    createdBy  : String(100);
    createdAt  : Timestamp;

    modifiedBy : String(100);
    modifiedAt : Timestamp;

    approvedBy : String(100);
    approvedAt : Timestamp;

    rejectedBy : String(100);
    rejectedAt : Timestamp;
}


entity Department {

    key departmentId   : String(10);
        departmentName : String(100);

}

entity Currency {

    key currencyCode : String(3);
        currencyName : String(50);

}
