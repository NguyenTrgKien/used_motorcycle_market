export var TargetType;
(function (TargetType) {
    TargetType["POST"] = "post";
    TargetType["USER"] = "user";
})(TargetType || (TargetType = {}));
export var ReasonType;
(function (ReasonType) {
    ReasonType["FAKE_INFO"] = "fake_info";
    ReasonType["WRONG_PRICE"] = "wrong_price";
    ReasonType["DUPLICATE_POST"] = "duplicate_post";
    ReasonType["ALREADY_SOLD"] = "already_sold";
    ReasonType["STOLEN_VEHICLE"] = "stolen_vehicle";
    ReasonType["FAKE_IMAGES"] = "fake_images";
    // Liên quan đến người dùng
    ReasonType["FRAUD"] = "fraud";
    ReasonType["SPAM"] = "spam";
    ReasonType["ABUSIVE"] = "abusive";
    ReasonType["SCAM"] = "scam";
    // Khác
    ReasonType["OTHER"] = "other";
})(ReasonType || (ReasonType = {}));
export var ReportStatus;
(function (ReportStatus) {
    ReportStatus["PENDING"] = "pending";
    ReportStatus["RESOLVED"] = "resolved";
    ReportStatus["REJECTED"] = "rejected";
})(ReportStatus || (ReportStatus = {}));
