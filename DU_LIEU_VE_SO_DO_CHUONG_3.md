# Dữ liệu vẽ sơ đồ Chương 3

Nguồn đối chiếu: các TypeORM entity trong `backend/src/modules`, cấu hình ứng dụng và nội dung Chương 3 của `TL_KIEN_227060146.docx`.

## Hình 3.1 — Sơ đồ kiến trúc tổng thể

### Thành phần

- Tác nhân: Người dùng, Nhân viên CSKH, Kiểm duyệt viên, Quản trị viên.
- Tầng trình bày: React 19, TypeScript, React Router, TanStack Query, Axios, Socket.IO Client.
- Tầng nghiệp vụ: NestJS REST API, JWT/Passport/Guards, các business module, Socket.IO Gateway, TypeORM.
- Tầng dữ liệu: PostgreSQL, Redis.
- Dịch vụ ngoài: Cloudinary, Email/SendGrid, Google OAuth, Gemini API, cổng thanh toán.

### Các liên kết cần vẽ

1. Người dùng → React Client.
2. React Client → NestJS REST API bằng HTTPS/JSON.
3. Socket.IO Client ↔ Socket.IO Gateway bằng WebSocket.
4. REST API → Guards/JWT/Passport → Business Modules.
5. Business Modules → TypeORM → PostgreSQL.
6. Business Modules → Redis để lưu dữ liệu tạm và giới hạn tần suất.
7. Business Modules → Cloudinary để lưu ảnh.
8. Business Modules → Email/SendGrid để gửi OTP và thông báo.
9. Auth Module → Google OAuth.
10. Business Modules → Gemini API để phân tích ảnh và gợi ý dữ liệu xe.
11. Listing Payment/Monetization Module → cổng thanh toán hoặc quy trình chuyển khoản ngân hàng.

Lưu ý: code hiện tại thể hiện rõ luồng chuyển khoản ngân hàng; chỉ giữ VNPay/MoMo trong hình nếu phần tích hợp cổng trực tuyến đã được cài đặt thực tế hoặc được xác định là thành phần thiết kế tương lai.

## Hình 3.2 — Use Case tổng quát

### Tác nhân

- Khách.
- Thành viên.
- Người bán: vai trò nghiệp vụ của Thành viên.
- Người bán chuyên nghiệp: Thành viên có hồ sơ chuyên nghiệp được duyệt.
- CSKH.
- MODERATOR.
- ADMIN.
- Google OAuth, Email/OTP, Cloudinary, Gemini và dịch vụ thanh toán là tác nhân hệ thống ngoài khi cần thể hiện.

### Use Case theo tác nhân

| Tác nhân                | Use Case                                                                                                                                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Khách                   | Xem trang chủ; xem danh mục/hãng/dòng xe; tìm kiếm và lọc tin; xem chi tiết tin; xem hồ sơ/cửa hàng công khai; đăng ký; đăng nhập; đăng nhập Google; quên mật khẩu                             |
| Thành viên              | Quản lý hồ sơ; quản lý địa chỉ; đổi mật khẩu; bật/tắt 2FA; quản lý phiên; xác minh danh tính; lưu tin; xem lịch sử; nhắn tin; nhận thông báo; đánh giá; báo cáo vi phạm; xem lịch sử giao dịch |
| Người bán               | Tạo tin; sửa tin; tải và sắp xếp ảnh; quản lý tin; đánh dấu đã bán; ẩn/xóa/đăng lại tin; thanh toán phí đăng; mua dịch vụ đẩy tin; theo dõi trạng thái duyệt                                   |
| Người bán chuyên nghiệp | Đăng ký hồ sơ cửa hàng; cập nhật hồ sơ pháp lý; quản lý trang cửa hàng; đăng ký gói thuê bao                                                                                                   |
| CSKH                    | Xử lý báo cáo; hỗ trợ người dùng; xem thông tin cần thiết theo quyền                                                                                                                           |
| MODERATOR               | Duyệt/từ chối tin; ẩn/khôi phục tin; xử lý báo cáo; duyệt hồ sơ xác minh và hồ sơ chuyên nghiệp theo quyền                                                                                     |
| ADMIN                   | Toàn bộ nghiệp vụ quản trị; quản lý người dùng/nhân viên/role; danh mục/hãng/dòng xe; bảng giá; giao dịch; doanh thu; dashboard                                                                |

### Quan hệ Use Case

- Thành viên kế thừa Khách.
- Người bán là trạng thái nghiệp vụ của Thành viên, không phải một giá trị role quản trị độc lập.
- Người bán chuyên nghiệp mở rộng Người bán sau khi hồ sơ `professional_seller_profiles` được duyệt.
- Tạo tin `include` kiểm tra dữ liệu, tạo phương tiện và tải ảnh.
- Tạo tin `extend` thanh toán phí khi hết hạn mức miễn phí.
- Duyệt tin `include` gửi thông báo kết quả.
- Nhắn tin `include` tìm hoặc tạo hội thoại.

## Hình 3.3 — Use Case đăng tin và duyệt tin

### Tác nhân

- Người bán.
- MODERATOR hoặc ADMIN.
- Gemini API.
- Cloudinary.
- Dịch vụ thanh toán/chuyển khoản.

### Use Case và quan hệ

1. Chọn danh mục.
2. Lấy `listingFormSchema` của danh mục.
3. Chọn hãng và dòng xe.
4. Nhập thông tin tin đăng.
5. Nhập thông số phương tiện.
6. Tải/sắp xếp/chọn ảnh chính qua Cloudinary.
7. Phân tích ảnh và gợi ý bằng Gemini, là chức năng tùy chọn.
8. Kiểm tra dữ liệu.
9. Kiểm tra `listing_free_quotas`.
10. Xem trước phí theo `listing_pricing_plans`.
11. Tạo `listing_payment_orders` nếu phải trả phí.
12. Xác nhận thanh toán hoặc chờ duyệt biên lai chuyển khoản.
13. Tạo `posts` ở trạng thái chờ duyệt, đồng thời tạo `vehicles` và `post_images`.
14. MODERATOR/ADMIN xem chi tiết tin chờ.
15. Phê duyệt hoặc từ chối kèm lý do.
16. Cập nhật trạng thái, người duyệt và thời điểm duyệt.
17. Tạo `notifications` cho người bán.

### Trạng thái chính

- Tin đăng: `PENDING → ACTIVE` khi duyệt; `PENDING → REJECTED` khi từ chối.
- Đơn thanh toán: trạng thái được lấy từ `ListingPaymentStatus`; luồng nghiệp vụ chính gồm chờ thanh toán, chờ xác nhận chuyển khoản, đã thanh toán và bị từ chối/thất bại.

## Hình 3.4 — ERD tổng quan

### Nhóm người dùng và bảo mật

| Bảng thực tế                   | Trường nên đưa vào ERD                                                                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `users`                        | `id PK number`, `email UQ`, `password`, `phone UQ`, `fullName`, `role`, `sellerType`, `status`, `isVerified`, `googleId`, `two_factor_enabled`, `createdAt`, `updatedAt` |
| `user_addresses`               | `id PK`, `userId FK`, thông tin tỉnh/huyện/xã/địa chỉ, `isDefault`, `createdAt`                                                                                          |
| `user_session`                 | `id PK`, `userId FK`, `refreshTokenHash`, `deviceName`, `browser`, `os`, `ipAddress`, `expiredAt`, `revokedAt`, `lastActive`, `createdAt`                                |
| `user_verifications`           | `id PK`, `userId FK`, `type`, `token`, `failedAttempts`, thời hạn và thời điểm xác minh                                                                                  |
| `blacklist_tokens`             | `id PK`, `token`, `expiresAt`                                                                                                                                            |
| `user_identities`              | `id PK`, `user_id FK UQ`, `idNumber`, `idType`, `fullName`, `dateOfBirth`, `gender`, ảnh giấy tờ, `status`, `confidenceScore`, `verifiedAt`, `rejectionReason`           |
| `professional_seller_profiles` | `id PK`, `userId FK UQ`, `storeName`, `taxCode UQ`, giấy phép kinh doanh, địa chỉ, `status`, `verifiedAt`, `verifiedBy`, `rejectedReason`                                |

### Nhóm danh mục, phương tiện và tin đăng

| Bảng thực tế     | Trường nên đưa vào ERD                                                                                                                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `category`       | `id PK`, `name`, `type`, `image`, `slug UQ`, `listingFormSchema JSONB`, `createdAt`                                                                                                                                                                     |
| `vehicle_brands` | `id PK`, `name`, `slug`, `logo`, `country`, `isActive`, `createdAt`, `updatedAt`                                                                                                                                                                        |
| `vehicle_models` | `id PK`, `brandId FK`, `categoryId FK nullable`, `name`, `slug`, `isActive`, `createdAt`, `updatedAt`                                                                                                                                                   |
| `posts`          | `id PK`, `userId FK`, `categoryId FK`, `title`, `description`, `price`, `status`, `viewCount`, `province`, `district`, `ward`, `addressDetail`, `slug UQ`, thông tin phí/khuyến mãi, trường duyệt/ẩn/bán, `createdAt`, `updatedAt`                      |
| `vehicles`       | `id PK`, `postId FK UQ`, `categoryId FK nullable`, `brandId FK nullable`, `modelId FK nullable`, `brandName`, `modelName`, `bodyType`, `manufactureYear`, `mileage`, `condition`, `fuelType`, `transmission`, các thông số kỹ thuật, `extraSpecs JSONB` |
| `post_images`    | `id PK`, `postId FK`, URL ảnh, `publicId`, `sortOrder`, `isPrimary`, `createdAt`                                                                                                                                                                        |

### Nhóm tương tác

| Bảng thực tế     | Trường nên đưa vào ERD                                                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `save_posts`     | `id PK`, `userId FK`, `postId FK`, thời điểm tạo; cặp người dùng–tin đăng là duy nhất về nghiệp vụ                                                               |
| `view_histories` | `id PK`, `userId FK`, `postId FK`, `viewedAt`; cặp `userId, postId` là duy nhất                                                                                  |
| `conversations`  | `id PK`, `buyerId FK`, `sellerId FK`, `postId FK`, `lastMessage`, `lastMessageAt`, `lastSenderId`, `createdAt`, `updatedAt`; bộ ba buyer–seller–post là duy nhất |
| `messages`       | `id PK`, `senderId FK`, `conversationId FK`, `content`, `messageType`, `publicId`, `isRead`, `createdAt`                                                         |
| `notifications`  | `id PK`, `userId FK`, `title`, nội dung, `isRead`, `type`, tham chiếu liên quan, thời điểm tạo                                                                   |
| `reviews`        | `id PK`, `reviewerId FK`, `revieweeId FK`, `postId FK`, `rating`, `comment`, thời điểm tạo/cập nhật                                                              |
| `reports`        | `id PK`, `reporterId FK`, `targetId`, `targetType`, `reason`, mô tả, `status`, dữ liệu xử lý                                                                     |

### Nhóm thương mại hóa

| Bảng thực tế                | Trường nên đưa vào ERD                                                                                                                                                                                                        |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `listing_payment_orders`    | `id PK UUID`, `code UQ`, `userId FK logic`, `postId FK logic nullable`, `orderType`, `pricingPlanId`, `metadata JSONB`, `amount`, `method`, `status`, dữ liệu gateway/biên lai/từ chối, `expiresAt`, `createdAt`, `updatedAt` |
| `listing_free_quotas`       | `id PK`, `userId`, `pricingGroup`, `usedCount`, `createdAt`, `updatedAt`; `userId + pricingGroup` duy nhất                                                                                                                    |
| `listing_pricing_plans`     | `id PK`, `name`, `productType`, `pricingGroup`, `categoryId`, `sellerAudience`, `price`, `durationDays`, `boostCredits`, `recommended`, `isActive`                                                                            |
| `seller_subscription_plans` | `id PK`, `name`, `price`, `durationDays`, `listingLimit`, `boostCredits`, `isActive`, `recommended`                                                                                                                           |
| `seller_subscriptions`      | `id PK`, `userId`, `planId`, `orderId`, `startsAt`, `expiresAt`, `listingsUsed`, `boostsUsed`, `isActive`                                                                                                                     |
| `post_boosts`               | `id PK`, `postId`, `userId`, `orderId`, `campaignId`, `price`, `boostedAt`, `createdAt`                                                                                                                                       |
| `boost_campaigns`           | `id PK`, `postId`, `userId`, `orderId UQ`, `pricingPlanId`, `totalBoosts`, `boostsCompleted`, `startedAt`, `nextBoostAt`, `status`                                                                                            |
| `monetization_audit_logs`   | `id PK`, `adminId`, `action`, `entityType`, `entityId`, `before JSONB`, `after JSONB`, `createdAt`                                                                                                                            |

### Quan hệ và lực lượng số

```text
users 1 -- 0..* user_addresses
users 1 -- 0..* user_session
users 1 -- 0..* user_verifications
users 1 -- 0..1 user_identities
users 1 -- 0..1 professional_seller_profiles
users 1 -- 0..* posts
category 1 -- 0..* posts
posts 1 -- 1 vehicles
posts 1 -- 0..* post_images
category 1 -- 0..* vehicle_models
category 1 -- 0..* vehicles
vehicle_brands 1 -- 0..* vehicle_models
vehicle_brands 1 -- 0..* vehicles
vehicle_models 1 -- 0..* vehicles
users 1 -- 0..* save_posts
posts 1 -- 0..* save_posts
users 1 -- 0..* view_histories
posts 1 -- 0..* view_histories
users 1 -- 0..* conversations : buyer
users 1 -- 0..* conversations : seller
posts 1 -- 0..* conversations
conversations 1 -- 0..* messages
users 1 -- 0..* messages : sender
users 1 -- 0..* notifications
users 1 -- 0..* reviews : reviewer
users 1 -- 0..* reviews : reviewee
posts 1 -- 0..* reviews
users 1 -- 0..* reports : reporter
users 1 -- 0..* listing_payment_orders
posts 0..1 -- 0..* listing_payment_orders
users 1 -- 0..* listing_free_quotas
seller_subscription_plans 1 -- 0..* seller_subscriptions
users 1 -- 0..* seller_subscriptions
posts 1 -- 0..* post_boosts
posts 1 -- 0..* boost_campaigns
users 1 -- 0..* monetization_audit_logs : admin
```

Các cột ID trong code chủ yếu là `number`, không phải UUID. Chỉ `listing_payment_orders.id` dùng UUID. Một số bảng thương mại hóa lưu ID tham chiếu dưới dạng cột nhưng entity chưa khai báo quan hệ TypeORM; khi vẽ ERD có thể dùng đường nét đứt và ghi “logical reference”.

## Hình 3.5 — Activity đăng tin, thanh toán và duyệt tin

```text
Bắt đầu
→ Người bán chọn danh mục
→ Hệ thống tải biểu mẫu động
→ Nhập thông tin tin và phương tiện
→ Tải ảnh
→ [Tùy chọn] Gemini phân tích ảnh/gợi ý
→ Kiểm tra dữ liệu
→ Dữ liệu không hợp lệ? → Hiển thị lỗi → quay lại biểu mẫu
→ Kiểm tra hạn mức miễn phí
→ Còn hạn mức? → Trừ hạn mức → tạo tin chờ duyệt
→ Hết hạn mức? → Lấy bảng giá → tạo đơn thanh toán
→ Chọn phương thức thanh toán
→ Thanh toán thất bại/hủy? → cập nhật đơn → cho phép thử lại
→ Chuyển khoản? → tải biên lai → nhân viên xác nhận hoặc từ chối
→ Thanh toán thành công → kích hoạt quyền đăng đúng một lần
→ Tạo posts + vehicles + post_images ở trạng thái PENDING
→ MODERATOR/ADMIN mở tin chờ
→ Tin hợp lệ? → ACTIVE + approvedBy + approvedAt
→ Tin không hợp lệ? → REJECTED + rejectedReason
→ Tạo thông báo kết quả
→ Kết thúc
```

Nên chia swimlane thành: Người bán | React Client | NestJS API | Dịch vụ ngoài | MODERATOR/ADMIN | PostgreSQL.

## Hình 3.6 — Sequence nhắn tin thời gian thực

### Lifeline

- Người mua.
- React Client người mua.
- Conversation REST API.
- Socket.IO Gateway.
- PostgreSQL.
- React Client người bán.
- Người bán.

### Thứ tự thông điệp

1. Người mua chọn liên hệ người bán tại một tin đăng.
2. Client gọi API bắt đầu/tạo hội thoại và gửi `postId`.
3. API xác thực JWT, xác định buyer và seller.
4. API tìm `conversations` theo bộ ba `buyerId + sellerId + postId`.
5. Nếu chưa có, API tạo hội thoại; nếu có, trả hội thoại hiện tại.
6. API trả `conversationId` cho client.
7. Client kết nối Socket.IO và tham gia phòng hội thoại.
8. Người mua nhập và gửi tin nhắn.
9. Gateway xác thực JWT và quyền tham gia hội thoại.
10. Gateway lưu bản ghi `messages`.
11. Gateway cập nhật `lastMessage`, `lastMessageAt`, `lastSenderId` của `conversations`.
12. Gateway phát sự kiện tin nhắn mới tới client người mua và người bán.
13. Người bán mở hội thoại.
14. Client gửi yêu cầu đánh dấu đã đọc.
15. Backend cập nhật `messages.isRead = true` cho các tin phù hợp.
16. Gateway phát sự kiện đã đọc cho phía người mua.

Luồng thay thế cần thể hiện: JWT không hợp lệ; người gửi không thuộc hội thoại; nội dung/loại file không hợp lệ; lưu DB thất bại; người nhận offline thì dữ liệu vẫn được lưu và hiển thị khi tải lại.

## Hình 3.7 — Sitemap

```text
Website mua bán xe cũ
├── Khu vực công khai
│   ├── Trang chủ
│   ├── Tìm kiếm/lọc xe
│   ├── Chi tiết tin đăng
│   ├── Hồ sơ người dùng công khai
│   ├── Trang cửa hàng chuyên nghiệp
│   ├── Giới thiệu
│   └── Liên hệ
├── Xác thực
│   ├── Đăng ký/đăng nhập
│   ├── Xác minh OTP
│   ├── Quên mật khẩu
│   └── Đặt lại mật khẩu
├── Khu vực thành viên
│   ├── Tin nhắn
│   ├── Thông báo
│   ├── Tin đã lưu
│   ├── Lịch sử xem
│   ├── Báo cáo của tôi
│   └── Lịch sử giao dịch
├── Khu vực người bán
│   ├── Tạo tin
│   ├── Quản lý tin
│   ├── Sửa tin
│   ├── Thanh toán đăng tin
│   ├── Gói quảng bá/đẩy tin
│   └── Gói người bán
├── Cài đặt tài khoản
│   ├── Hồ sơ
│   ├── Địa chỉ
│   ├── Bảo mật
│   ├── 2FA
│   ├── Phiên đăng nhập
│   ├── Xác minh danh tính
│   └── Người bán chuyên nghiệp
└── Khu vực quản trị
    ├── Dashboard
    ├── Người dùng
    ├── Nhân viên và phân quyền
    ├── Tin chờ duyệt
    ├── Toàn bộ tin đăng
    ├── Danh mục/hãng/dòng xe
    ├── Báo cáo
    ├── Tin nhắn quản trị
    ├── Hồ sơ xác minh danh tính
    ├── Người bán chuyên nghiệp
    ├── Giao dịch
    ├── Doanh thu
    └── Cấu hình thương mại hóa
```

## Các điểm cần sửa trong nội dung Chương 3 trước khi nộp

1. Đổi mô tả ID từ UUID sang số nguyên cho các bảng dùng `@PrimaryGeneratedColumn()`; chỉ giữ UUID cho `listing_payment_orders.id`.
2. Đổi `categories` thành `category` nếu báo cáo cần phản ánh đúng tên bảng vật lý.
3. Đổi `saved_posts` thành `save_posts`.
4. Đổi `user_sessions` thành `user_session`.
5. Đổi `user_identity` thành `user_identities`.
6. Đổi `professional_sellers` thành `professional_seller_profiles`.
7. Trong `posts`, bỏ `address_id`; thay bằng `province`, `district`, `ward`, `addressDetail`.
8. Trong `users`, dùng `password` thay cho `password_hash`, `avatar` thay cho `avatar_url`, `status` thay cho mô tả riêng `is_banned`.
9. Trong `vehicles`, dùng `manufactureYear`, `mileage`, `extraSpecs`; code không dùng đúng các tên `year`, `mileage_km`, `attributes` như báo cáo.
10. Trong `listing_payment_orders`, dùng `method`, `gatewayTransactionId`, `pricingPlanId`; không dùng các tên `payment_method`, `transaction_ref`, `plan_id` nếu trình bày theo entity hiện tại.
11. Quan hệ Category–VehicleBrand là nhiều–nhiều; VehicleModel thuộc một Brand và có thể thuộc một Category.
12. `BlacklistToken` hiện không có `userId`, vì vậy không vẽ quan hệ vật lý trực tiếp từ `users` đến `blacklist_tokens`.
