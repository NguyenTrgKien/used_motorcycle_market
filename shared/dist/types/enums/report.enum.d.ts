export declare enum TargetType {
    POST = "post",
    USER = "user"
}
export declare enum ReasonType {
    FAKE_INFO = "fake_info",// Thông tin xe không trung thực (km, năm sản xuất...)
    WRONG_PRICE = "wrong_price",// Giá đăng không đúng thực tế
    DUPLICATE_POST = "duplicate_post",// Đăng tin trùng lặp
    ALREADY_SOLD = "already_sold",// Xe đã bán nhưng vẫn đăng tin
    STOLEN_VEHICLE = "stolen_vehicle",// Nghi ngờ xe gian / xe trộm
    FAKE_IMAGES = "fake_images",// Hình ảnh không phải xe thật
    FRAUD = "fraud",// Lừa đảo, chiếm đoạt tiền
    SPAM = "spam",// Spam tin nhắn
    ABUSIVE = "abusive",// Ngôn từ xúc phạm, thô tục
    SCAM = "scam",// Giả mạo người bán
    OTHER = "other"
}
export declare enum ReportStatus {
    PENDING = "pending",
    RESOLVED = "resolved",
    REJECTED = "rejected"
}
