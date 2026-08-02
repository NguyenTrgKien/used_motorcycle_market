import { useState } from "react";
import type { ListingPost } from "../../user/Post/post.types";
import ReceiptPreviewModal from "./ReceiptPreviewModal";

interface PaymentInformationCardProps {
  post: ListingPost;
}

const methodLabels: Record<string, string> = {
  bank_transfer: "Chuyển khoản ngân hàng",
  vnpay: "VNPay",
  momo: "MoMo",
};

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Chưa cập nhật";

function PaymentInformationCard({ post }: PaymentInformationCardProps) {
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(
    null,
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const order = post.paymentOrder;
  const isFree = post.listingBillingType === "free";
  const status = isFree
    ? {
        label: "Không yêu cầu thanh toán",
        className: "bg-blue-100 text-blue-700",
      }
    : !order
      ? { label: "Chưa tạo giao dịch", className: "bg-gray-100 text-gray-600" }
      : order.status === "paid"
        ? {
            label: "Đã thanh toán",
            className: "bg-emerald-100 text-emerald-700",
          }
        : order.status === "rejected"
          ? { label: "Bị từ chối", className: "bg-red-100 text-red-700" }
          : order.status === "pending" && order.transferSubmittedAt
            ? {
                label: "Chờ xác nhận",
                className: "bg-amber-100 text-amber-700",
              }
            : order.status === "pending"
              ? {
                  label: "Chờ thanh toán",
                  className: "bg-amber-100 text-amber-700",
                }
              : {
                  label: "Thanh toán không thành công",
                  className: "bg-red-100 text-red-700",
                };

  return (
    <>
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[2rem] font-bold">Thông tin thanh toán</h2>
          <span
            className={`rounded-full px-4 py-2 text-[1.4rem] font-medium ${status.className}`}
          >
            {status.label}
          </span>
        </div>

        <button
          type="button"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((value) => !value)}
          className="mt-4 w-full rounded-lg border border-gray-200 px-4 py-3 font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          {isExpanded ? "Thu gọn" : "Xem thêm"}
        </button>

        {isExpanded &&
          (isFree ? (
            <p className="mt-4 rounded-lg bg-blue-50 p-4 text-[1.3rem] text-blue-700">
              Tin đăng sử dụng lượt đăng miễn phí của người bán.
            </p>
          ) : order ? (
            <div className="mt-5 space-y-3">
              <PaymentRow label="Mã giao dịch" value={order.code} />
              <PaymentRow
                label="Phương thức"
                value={methodLabels[order.method] || order.method}
              />
              <PaymentRow
                label="Số tiền"
                value={
                  Number(order.amount || post.listingFee || 0).toLocaleString(
                    "vi-VN",
                  ) + "đ"
                }
              />
              <PaymentRow
                label="Tạo giao dịch"
                value={formatDate(order.createdAt)}
              />
              {order.transferSubmittedAt && (
                <PaymentRow
                  label="Gửi biên lai"
                  value={formatDate(order.transferSubmittedAt)}
                />
              )}
              {order.paidAt && (
                <PaymentRow
                  label="Xác nhận thanh toán"
                  value={formatDate(order.paidAt)}
                />
              )}
              {order.gatewayTransactionId && (
                <PaymentRow
                  label="Mã đối soát"
                  value={order.gatewayTransactionId}
                />
              )}
              {order.receiptUrl && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedReceiptUrl(order.receiptUrl || null)
                  }
                  className="flex items-center justify-center rounded-lg border border-gray-200 px-4 py-3 font-medium text-blue-600 transition-colors hover:bg-blue-50"
                >
                  Xem biên lai giao dịch
                </button>
              )}
              {order.rejectedReason && (
                <div className="rounded-lg bg-red-50 p-4 text-red-700">
                  <p className="font-medium">Lý do từ chối</p>
                  <p className="mt-1">{order.rejectedReason}</p>
                  <p className="mt-2 text-[1.2rem] text-red-500">
                    {formatDate(order.rejectedAt)}
                  </p>
                </div>
              )}
              {!!order.rejectionHistory?.length && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="font-semibold text-gray-800">Lịch sử từ chối</p>
                  <div className="mt-3 space-y-3">
                    {order.rejectionHistory.map((item, index) => (
                      <div
                        key={`${item.rejectedAt}-${index}`}
                        className="rounded-lg bg-gray-50 p-3"
                      >
                        <p className="text-gray-700">{item.reason}</p>
                        <p className="mt-1 text-[1.15rem] text-gray-500">
                          {formatDate(item.rejectedAt)} · Admin #
                          {item.rejectedBy}
                        </p>
                        {item.receiptUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedReceiptUrl(item.receiptUrl || null)
                            }
                            className="mt-2 inline-block font-medium text-blue-600 hover:underline"
                          >
                            Xem biên lai
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-4 rounded-lg bg-gray-50 p-4 text-[1.3rem] text-gray-600">
              Tin đăng trả phí nhưng người bán chưa tạo giao dịch thanh toán.
            </p>
          ))}
      </section>
      {selectedReceiptUrl && (
        <ReceiptPreviewModal
          imageUrl={selectedReceiptUrl}
          onClose={() => setSelectedReceiptUrl(null)}
        />
      )}
    </>
  );
}

function PaymentRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 pb-3">
      <span className="text-gray-500">{label}</span>
      <span className="break-all text-right font-medium text-gray-900">
        {value || "Chưa cập nhật"}
      </span>
    </div>
  );
}

export default PaymentInformationCard;
