using db as db from '../db/schema';
using {Attachments as ManagedAttachments} from '@cap-js/attachments';

service purchaseRequestService {

    @odata.draft.enabled
    entity PurchaseRequests     as projection on db.PurchaseRequest
        actions {
            action submitRequest();
            action cancelRequest();
            action approveRequest();
            action rejectRequest(rejectionComments: String(255));
        };

    entity PurchaseRequestItems as projection on db.PurchaseRequestItem;
    entity Notifications        as projection on db.Notification;
    entity StatusHistories      as projection on db.StatusHistory;
    //entity Attachments as projection on ManagedAttachments;
    entity Departments          as projection on db.Department;
    entity Currencies           as projection on db.Currency;
}



