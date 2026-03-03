"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportStatus = exports.ReasonType = exports.TargetType = void 0;
var TargetType;
(function (TargetType) {
    TargetType["POST"] = "post";
    TargetType["USER"] = "user";
})(TargetType || (exports.TargetType = TargetType = {}));
var ReasonType;
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
})(ReasonType || (exports.ReasonType = ReasonType = {}));
var ReportStatus;
(function (ReportStatus) {
    ReportStatus["PENDING"] = "pending";
    ReportStatus["RESOLVED"] = "resolved";
    ReportStatus["REJECTED"] = "rejected";
})(ReportStatus || (exports.ReportStatus = ReportStatus = {}));
