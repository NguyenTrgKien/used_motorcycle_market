import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

export interface TransactionDetailOrder {
  id: string;
  code: string;
  amount: number;
  method?: "vnpay" | "momo" | "bank_transfer";
  status: "pending" | "paid" | "failed" | "cancelled" | "rejected" | "expired";
  orderType: "listing" | "featured" | "vip" | "boost" | "subscription";
  receiptUrl?: string;
  transferSubmittedAt?: string;
  paidAt?: string;
  createdAt?: string;
  expiresAt?: string;
  rejectedReason?: string;
  post?: { id: number; title: string; slug: string };
  user?: { id: number; fullName?: string; email: string };
}

interface Props {
  order: TransactionDetailOrder;
  typeLabel: string;
  onClose: () => void;
  onViewPost?: () => void;
}

const methodLabels = {
  vnpay: "VNPay",
  momo: "Ví MoMo",
  bank_transfer: "Chuyển khoản ngân hàng",
};

const statusLabels = {
  pending: "Chờ xử lý",
  paid: "Đã xác nhận",
  failed: "Thất bại",
  cancelled: "Đã hủy",
  rejected: "Bị từ chối",
  expired: "Hết hạn",
};

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString("vi-VN") : "—";
}

function TransactionDetailModal({
  order,
  typeLabel,
  onClose,
  onViewPost,
}: Props) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-5">
      <div className="relative max-h-[92vh] w-full max-w-[68rem] overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng chi tiết giao dịch"
          className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
        <h3 className="pr-12 text-[2rem] font-semibold text-gray-900">
          Chi tiết giao dịch
        </h3>
        <div className="mt-6 grid gap-x-8 gap-y-4 rounded-xl bg-gray-50 p-5 md:grid-cols-2">
          <Detail label="Mã giao dịch" value={order.code} />
          <Detail label="Loại giao dịch" value={typeLabel} />
          <Detail
            label="Số tiền"
            value={`${Number(order.amount).toLocaleString("vi-VN")}đ`}
            highlight
          />
          <Detail
            label="Phương thức"
            value={order.method ? methodLabels[order.method] : "—"}
          />
          <Detail label="Trạng thái" value={statusLabels[order.status]} />
          <Detail label="Ngày tạo" value={formatDate(order.createdAt)} />
          <Detail
            label="Ngày gửi biên lai"
            value={formatDate(order.transferSubmittedAt)}
          />
          <Detail label="Ngày xác nhận" value={formatDate(order.paidAt)} />
        </div>
        <div className="mt-5 rounded-xl border border-gray-200 p-5">
          <p className="text-[1.3rem] text-gray-500">Người thanh toán</p>
          <p className="mt-1 font-medium text-gray-900">
            {order.user?.fullName || "Người dùng"}
          </p>
          <p className="mt-1 text-[1.3rem] text-gray-500">
            {order.user?.email || "—"}
          </p>
        </div>
        {order.post && (
          <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-5">
            <div className="min-w-0">
              <p className="text-[1.3rem] text-gray-500">Tin đăng áp dụng</p>
              <p className="mt-1 truncate font-medium text-gray-900">
                {order.post.title}
              </p>
              <p className="mt-1 text-[1.2rem] text-gray-400">
                ID: {order.post.id}
              </p>
            </div>
            {onViewPost && (
              <button
                type="button"
                onClick={onViewPost}
                className="shrink-0 rounded-xl border border-blue-500 px-4 py-3 font-medium text-blue-600 hover:bg-blue-50"
              >
                Xem tin
              </button>
            )}
          </div>
        )}
        {order.rejectedReason && (
          <div className="mt-5 rounded-xl bg-red-50 p-5">
            <p className="text-[1.3rem] text-red-500">Lý do từ chối</p>
            <p className="mt-1 text-red-700">{order.rejectedReason}</p>
          </div>
        )}
        {order.receiptUrl && (
          <div className="mt-5">
            <p className="font-medium text-gray-900">Biên lai chuyển khoản</p>
            <a href={order.receiptUrl} target="_blank" rel="noreferrer">
              <img
                src={order.receiptUrl}
                alt={`Biên lai ${order.code}`}
                className="mt-3 max-h-[38rem] w-full rounded-xl border border-gray-200 object-contain"
              />
            </a>
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 h-[4.8rem] w-full rounded-xl border border-gray-300 font-medium text-gray-700 hover:bg-gray-50"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[1.3rem] text-gray-500">{label}</p>
      <p
        className={`mt-1 font-medium ${highlight ? "text-green-600" : "text-gray-900"}`}
      >
        {value}
      </p>
    </div>
  );
}

export default TransactionDetailModal;
