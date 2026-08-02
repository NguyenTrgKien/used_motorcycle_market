import type { AdminPostFilters } from "./types";

export const emptyFilters: AdminPostFilters = {
  displayStatus: "all",
  bodyType: "",
  brandName: "",
  modelName: "",
  minPrice: "",
  maxPrice: "",
  dateField: "createdAt",
  dateFrom: "",
  dateTo: "",
  province: "",
  district: "",
  hasReports: "all",
  sort: "newest",
};

export const statusFilters = [
  { label: "Tất cả", value: "all" },
  { label: "Chờ duyệt", value: "pending" },
  { label: "Đã duyệt", value: "active" },
  { label: "Bị từ chối", value: "rejected" },
  { label: "Đã ẩn", value: "hidden" },
  { label: "Đã bán", value: "sold" },
];

export const statusLabels: Record<string, string> = {
  pending: "Chờ duyệt",
  active: "Đã duyệt",
  rejected: "Bị từ chối",
  sold: "Đã bán",
  expired: "Hết hạn",
  hidden: "Đã ẩn",
  draft: "Bản nháp",
};

export const statusClasses: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  active: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  sold: "bg-blue-100 text-blue-700",
  expired: "bg-gray-100 text-gray-600",
  hidden: "bg-gray-100 text-gray-600",
  draft: "bg-gray-100 text-gray-600",
};

export const displayStatusOptions = [
  { label: "Tất cả", value: "all" },
  { label: "Đang hiển thị", value: "active" },
  { label: "Đã ẩn", value: "hidden" },
  { label: "Hết hạn", value: "expired" },
];

export const bodyTypeOptions = [
  { label: "Tất cả loại xe", value: "" },
  { label: "Xe máy", value: "motorbike" },
  { label: "Mô tô", value: "motorcycle" },
  { label: "Xe tay ga", value: "scooter" },
  { label: "Ô tô", value: "car" },
  { label: "Xe tải", value: "truck" },
  { label: "Xe van", value: "van" },
  { label: "Xe bus", value: "bus" },
  { label: "Khác", value: "other" },
];

export const dateFieldOptions = [
  { label: "Ngày đăng", value: "createdAt" },
  { label: "Ngày duyệt", value: "approvedAt" },
  { label: "Ngày xóa", value: "hiddenAt" },
  { label: "Ngày bán", value: "soldAt" },
  { label: "Ngày hết hạn", value: "expiredAt" },
];

export const reportOptions = [
  { label: "Tất cả", value: "all" },
  { label: "Có báo cáo", value: "true" },
  { label: "Không có báo cáo", value: "false" },
];

export const sortOptions = [
  { label: "Mới nhất", value: "newest" },
  { label: "Cũ nhất", value: "oldest" },
  { label: "Nhiều lượt xem nhất", value: "most_views" },
  { label: "Bị report nhiều nhất", value: "most_reports" },
  { label: "Sắp hết hạn", value: "expiring_soon" },
];

export const defaultDeleteReasons = [
  "Tin đăng có dấu hiệu lừa đảo hoặc cung cấp thông tin không trung thực.",
  "Nội dung tin đăng vi phạm quy định cộng đồng hoặc chính sách đăng tin.",
  "Hình ảnh hoặc thông tin xe không khớp với nội dung đã đăng.",
  "Tin đăng trùng lặp hoặc có dấu hiệu spam.",
  "Người bán đã bán xe nhưng chưa cập nhật trạng thái tin đăng.",
];
