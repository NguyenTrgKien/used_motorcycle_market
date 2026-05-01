"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityStatus = exports.IdType = exports.VerificationType = exports.UserGender = exports.UserStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["USER"] = "user";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["BANNED"] = "banned";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var UserGender;
(function (UserGender) {
    UserGender["MALE"] = "male";
    UserGender["FEMALE"] = "female";
    UserGender["OTHER"] = "other";
})(UserGender || (exports.UserGender = UserGender = {}));
var VerificationType;
(function (VerificationType) {
    VerificationType["EMAIL"] = "email";
    VerificationType["RESET_PASSWORD"] = "reset_password";
    VerificationType["PHONE_OTP"] = "phone_otp";
})(VerificationType || (exports.VerificationType = VerificationType = {}));
var IdType;
(function (IdType) {
    IdType["CCCD"] = "cccd";
    IdType["PASSPORT"] = "passport";
})(IdType || (exports.IdType = IdType = {}));
var IdentityStatus;
(function (IdentityStatus) {
    IdentityStatus["PENDING"] = "pending";
    IdentityStatus["PROCESSING"] = "processing";
    IdentityStatus["APPROVED"] = "approved";
    IdentityStatus["REJECTED"] = "rejected";
})(IdentityStatus || (exports.IdentityStatus = IdentityStatus = {}));
