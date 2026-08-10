import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../configs/axiosInstance";
import {
  ReasonType,
  TargetType,
  type ReasonType as ReasonTypeValue,
  type TargetType as TargetTypeValue,
} from "../shared";

interface ReportModalProps {
  isOpen: boolean;
  targetId: number;
  targetType: TargetTypeValue;
  targetName: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

const postReasons = [
  [ReasonType.FAKE_INFO, "Thông tin không trung thực"],
  [ReasonType.WRONG_PRICE, "Giá đăng không đúng"],
  [ReasonType.DUPLICATE_POST, "Tin đăng trùng lặp"],
  [ReasonType.ALREADY_SOLD, "Xe đã bán"],
  [ReasonType.STOLEN_VEHICLE, "Nghi ngờ xe gian"],
  [ReasonType.FAKE_IMAGES, "Hình ảnh giả"],
  [ReasonType.FRAUD, "Có dấu hiệu lừa đảo"],
  [ReasonType.OTHER, "Lý do khác"],
] as const;
const userReasons = [
  [ReasonType.FRAUD, "Lừa đảo, chiếm đoạt tiền"],
  [ReasonType.SPAM, "Spam tin nhắn hoặc tin đăng"],
  [ReasonType.ABUSIVE, "Ngôn từ xúc phạm"],
  [ReasonType.SCAM, "Giả mạo người bán"],
  [ReasonType.OTHER, "Lý do khác"],
] as const;

function ReportModal({
  isOpen,
  targetId,
  targetType,
  targetName,
  onClose,
  onSubmitted,
}: ReportModalProps) {
  const reasons = targetType === TargetType.POST ? postReasons : userReasons;
  const [reasonType, setReasonType] = useState<ReasonTypeValue>(reasons[0][0]);
  const [reasonDetail, setReasonDetail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setReasonType(reasons[0][0]);
    setReasonDetail("");
  }, [isOpen, targetType]);

  if (!isOpen) return null;

  const submit = async () => {
    const detail = reasonDetail.trim();
    if (detail.length < 10) {
      toast.error("Vui lòng mô tả ít nhất 10 ký tự");
      return;
    }
    try {
      setIsSubmitting(true);
      const response = await axiosInstance.post("/api/v1/report", {
        targetId,
        targetType,
        reasonType,
        reasonDetail: detail,
      });
      toast.success(response.data.message || "Đã gửi báo cáo");
      onSubmitted?.();
      onClose();
    } catch (error: any) {
      if (error?.response?.status === 409) {
        onSubmitted?.();
        onClose();
        toast.info("Báo cáo của bạn đang chờ xử lý");
        return;
      }
      toast.error(error?.response?.data?.message || "Không thể gửi báo cáo");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-[52rem] rounded-2xl bg-white p-6 shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 className="text-[2rem] font-semibold text-gray-900">
          Báo cáo vi phạm
        </h2>
        <p className="mt-2 text-red-500 bg-red-50 p-5 rounded-xl">
          Bạn đang báo cáo: {targetName}
        </p>
        <label className="mt-6 block font-medium text-gray-700">Lý do</label>
        <select
          value={reasonType}
          onChange={(event) =>
            setReasonType(event.target.value as ReasonTypeValue)
          }
          className="mt-2 h-16 w-full rounded-xl border border-gray-300 bg-white px-4 outline-none focus:border-amber-500"
        >
          {reasons.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <label className="mt-5 block font-medium text-gray-700">
          Mô tả chi tiết
        </label>
        <textarea
          value={reasonDetail}
          onChange={(event) => setReasonDetail(event.target.value)}
          maxLength={1000}
          rows={5}
          placeholder="Mô tả dấu hiệu vi phạm và thông tin giúp quản trị viên xác minh..."
          className="mt-2 w-full resize-none rounded-xl border border-gray-300 p-4 outline-none focus:border-amber-500"
        />
        <div className="mt-1 text-right text-[1.2rem] text-gray-400">
          {reasonDetail.length}/1000
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-16 rounded-xl border border-gray-300 px-5 font-medium text-gray-700"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={isSubmitting}
            className="h-16 rounded-xl bg-red-600 px-5 font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {isSubmitting ? "Đang gửi..." : "Gửi báo cáo"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReportModal;
