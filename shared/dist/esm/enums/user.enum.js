export var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["USER"] = "user";
})(UserRole || (UserRole = {}));
export var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["BANNED"] = "banned";
})(UserStatus || (UserStatus = {}));
export var UserGender;
(function (UserGender) {
    UserGender["MALE"] = "male";
    UserGender["FEMALE"] = "female";
    UserGender["OTHER"] = "other";
})(UserGender || (UserGender = {}));
export var VerificationType;
(function (VerificationType) {
    VerificationType["EMAIL"] = "email";
    VerificationType["RESET_PASSWORD"] = "reset_password";
    VerificationType["PHONE_OTP"] = "phone_otp";
})(VerificationType || (VerificationType = {}));
export var IdType;
(function (IdType) {
    IdType["CCCD"] = "cccd";
    IdType["PASSPORT"] = "passport";
})(IdType || (IdType = {}));
export var IdentityStatus;
(function (IdentityStatus) {
    IdentityStatus["PENDING"] = "pending";
    IdentityStatus["PROCESSING"] = "processing";
    IdentityStatus["APPROVED"] = "approved";
    IdentityStatus["REJECTED"] = "rejected";
})(IdentityStatus || (IdentityStatus = {}));
