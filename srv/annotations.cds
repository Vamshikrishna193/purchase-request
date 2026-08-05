using {purchaseRequestService as service} from './purchase_service';

annotate service.PurchaseRequests with @(

    UI.HeaderInfo         : {
        TypeName      : 'Purchase Request',
        TypeNamePlural: 'Purchase Requests',
        Title         : {Value: requestNo},
        Description   : {Value: requesterName}
    },

    UI.SelectionFields : [
        department,
        status,
        requesterName,
        totalAmount,
        requestDate,

    ],

    UI.LineItem           : [
        {
            Value: requestNo,
            Label: 'Request Number'
        },
        {
            Value: requesterName,
            Label: 'Requester Name'
        },
        {
            Value: department,
            Label: 'Department'
        },
        {
            Value: requestDate,
            Label: 'Request Date'
        },
        {
            Value: totalAmount,
            Label: 'Total Amount'
        },
        {
            Value: status,
            Label: 'Status'
        }
    ],

    UI.FieldGroup #General: {Data: [
        {
            Value: requestNo,
            Label: 'Request Number'
        },
        {
            Value: requesterName,
            Label: 'Requester Name'
        },
        {
            Value: department,
            Label: 'Department'
        },
        {
            Value: requestDate,
            Label: 'Request Date'
        },
        {
            Value: currency,
            Label: 'Currency'
        },
        {
            Value: totalAmount,
            Label: 'Total Amount'
        },
        {
            Value: status,
            Label: 'Status'
        },
        {
            Value: approver,
            Label: 'Approver'
        }
    ]},
    UI.FieldGroup #Audit  : {Data: [

        {
            Value: createdBy,
            Label: 'Created By'
        },

        {
            Value: createdAt,
            Label: 'Created At'
        },

        {
            Value: modifiedBy,
            Label: 'Modified By'
        },

        {
            Value: modifiedAt,
            Label: 'Modified At'
        },

        {
            Value: approvedBy,
            Label: 'Approved By'
        },

        {
            Value: approvedAt,
            Label: 'Approved At'
        },

        {
            Value: rejectedBy,
            Label: 'Rejected By'
        },

        {
            Value: rejectedAt,
            Label: 'Rejected At'
        }

    ]},

    UI.Identification     : [

        {
            $Type : 'UI.DataFieldForAction',
            Action: 'purchaseRequestService.submitRequest',
            Label : 'Submit'
        },

        {
            $Type : 'UI.DataFieldForAction',
            Action: 'purchaseRequestService.cancelRequest',
            Label : 'Cancel'
        },

        {
            $Type : 'UI.DataFieldForAction',
            Action: 'purchaseRequestService.approveRequest',
            Label : 'Approve'
        },

        {
            $Type : 'UI.DataFieldForAction',
            Action: 'purchaseRequestService.rejectRequest',
            Label : 'Reject'
        }

    ],

    UI.Facets             : [
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'Header details',
            Target: '@UI.FieldGroup#General'
        },
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'Items',
            Target: 'items/@UI.LineItem'
        },
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'Audit',
            Target: '@UI.FieldGroup#Audit'
        },

    // {
    //     $Type  : 'UI.ReferenceFacet',
    //     Label  : 'Notifications',
    //     Target : 'notifications/@UI.LineItem'
    // },
    // {
    //     $Type  : 'UI.ReferenceFacet',
    //     Label  : 'Status History',
    //     Target : 'history/@UI.LineItem'
    // },
    // {
    //      $Type : 'UI.ReferenceFacet',
    //      Label : 'Attachments',
    //      Target: 'attachments/@UI.LineItem'
    //  }

    ]
);


annotate service.PurchaseRequests with {

    department @Common.ValueList: {
        CollectionPath: 'Departments',
        Parameters    : [
            {
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: department,
                ValueListProperty: 'departmentId'
            },
            {
                $Type            : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'departmentName'
            }
        ]
    };

    currency   @Common.ValueList: {
        CollectionPath: 'Currencies',
        Parameters    : [
            {
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: currency,
                ValueListProperty: 'currencyCode'
            },
            {
                $Type            : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'currencyName'
            }
        ]
    };

};

annotate service.PurchaseRequestItems with @(

UI.LineItem: [

    {
        Value: materialNo,
        Label: 'Material Number'
    },

    {
        Value: description,
        Label: 'Description'
    },

    {
        Value: quantity,
        Label: 'Quantity'
    },

    {
        Value: unitPrice,
        Label: 'Unit Price'
    },

    {
        Value: totalPrice,
        Label: 'Total Price'
    },
    {
        Value: taxAmount,
        Label: 'GST (18%)'
    },

    {
        Value: grossAmount,
        Label: 'Gross Amount'
    }
]);

annotate service.PurchaseRequestItems with @UI.Facets: [{
    $Type : 'UI.ReferenceFacet',
    Label : 'Purchase Request Item Details',
    Target: '@UI.Identification#items'
}];

annotate service.PurchaseRequestItems with @UI.Identification #items: [
    {
        Value: materialNo,
        Label: 'Material Number'
    },

    {
        Value: description,
        Label: 'Description'
    },

    {
        Value: quantity,
        Label: 'Quantity'
    },

    {
        Value: unitPrice,
        Label: 'Unit Price'
    },

    {
        Value: totalPrice,
        Label: 'Total Price'
    },
    {
        Value: taxAmount,
        Label: 'GST (18%)'
    },

    {
        Value: grossAmount,
        Label: 'Gross Amount'
    }
];


annotate service.Notifications with @(

UI.LineItem: [

    {
        Value: message,
        Label: 'Message'
    },

    {
        Value: type,
        Label: 'Type'
    },

    {
        Value: createdAt,
        Label: 'Created At'
    }
]);


annotate service.StatusHistories with @(

UI.LineItem: [

    {
        Value: oldStatus,
        Label: 'Old Status'
    },

    {
        Value: newStatus,
        Label: 'New Status'
    },

    {
        Value: userName,
        Label: 'User'
    },

    {
        Value: changedAt,
        Label: 'Changed At'
    }
]);

annotate service.PurchaseRequests with {

    requestNo   @Common.FieldControl: #ReadOnly;
    totalAmount @Common.FieldControl: #ReadOnly;
    status      @Common.FieldControl: #ReadOnly;
    approver    @Common.FieldControl: #ReadOnly;

    // Automatically maintained by CAP managed aspect
    createdBy   @Common.FieldControl: #ReadOnly;
    createdAt   @Common.FieldControl: #ReadOnly;
    modifiedBy  @Common.FieldControl: #ReadOnly;
    modifiedAt  @Common.FieldControl: #ReadOnly;

    // Automatically maintained by approve/reject actions
    approvedBy  @Common.FieldControl: #ReadOnly;
    approvedAt  @Common.FieldControl: #ReadOnly;
    rejectedBy  @Common.FieldControl: #ReadOnly;
    rejectedAt  @Common.FieldControl: #ReadOnly;
};

annotate service.PurchaseRequestItems with {

    totalPrice  @Common.FieldControl: #ReadOnly;
    taxAmount   @Common.FieldControl: #ReadOnly;
    grossAmount @Common.FieldControl: #ReadOnly;

};


annotate service.PurchaseRequestAttachments with @(

UI.LineItem: [

    {
        Value: fileName,
        Label: 'File Name'
    },

    {
        Value: fileSize,
        Label: 'File Size'
    },

    {
        Value: mediaType,
        Label: 'Media Type'
    }
    
]);
