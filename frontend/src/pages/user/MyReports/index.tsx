import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import axiosInstance from "../../../configs/axiosInstance";
import {
  ReasonType,
  ReportStatus,
  TargetType,
  type ReportStatus as ReportStatusValue,
} from "../../../shared";

interface ReportItem {
  id: number;
  targetId: number;
  targetType: "post" | "user";
  reasonType: string;
  reasonDetail: string;
  status: ReportStatusValue;
  note?: string;
  createdAt: string;
  target?: {
    id: number;
    title?: string;
    slug?: string;
    fullName?: string;
    email?: string;
  } | null;
}

const reasonLabels: Record<string, string> = {
  [ReasonType.FAKE_INFO]: "Thông tin không trung thực",
  [ReasonType.WRONG_PRICE]: "Giá không đúng",
  [ReasonType.DUPLICATE_POST]: "Tin trùng lặp",
  [ReasonType.ALREADY_SOLD]: "Xe đã bán",
  [ReasonType.STOLEN_VEHICLE]: "Nghi ngờ xe gian",
  [ReasonType.FAKE_IMAGES]: "Hình ảnh giả",
  [ReasonType.FRAUD]: "Lừa đảo",
  [ReasonType.SPAM]: "Spam",
  [ReasonType.ABUSIVE]: "Ngôn từ xúc phạm",
  [ReasonType.SCAM]: "Giả mạo",
  [ReasonType.OTHER]: "Lý do khác",
};

const statusMeta: Record<string, { label: string; className: string }> = {
  [ReportStatus.PENDING]: {
    label: "Chờ xử lý",
    className: "bg-amber-100 text-amber-700",
  },
  [ReportStatus.RESOLVED]: {
    label: "Đã xử lý",
    className: "bg-emerald-100 text-emerald-700",
  },
  [ReportStatus.REJECTED]: {
    label: "Đã từ chối",
    className: "bg-gray-100 text-gray-600",
  },
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function MyReports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<ReportItem[]>([]);
  const [selected, setSelected] = useState<ReportItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const reportId = Number(searchParams.get("reportId"));

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("/api/v1/report/my", {
        params: { page, limit: 10 },
      });
      setItems(response.data.data.items || []);
      setTotalPages(response.data.data.pagination?.totalPages || 1);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể tải báo cáo của bạn");
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    if (!Number.isInteger(reportId) || reportId < 1) return;
    if (isLoading) return;
    const current = items.find((item) => item.id === reportId);
    if (current) {
      setSelected(current);
      return;
    }
    const fetchSelected = async () => {
      try {
        const response = await axiosInstance.get(`/api/v1/report/my/${reportId}`);
        setSelected(response.data.data);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Không thể tải chi tiết báo cáo");
        setSearchParams({}, { replace: true });
      }
    };
    void fetchSelected();
  }, [isLoading, items, reportId, setSearchParams]);

  const openDetail = (item: ReportItem) => {
    setSelected(item);
    setSearchParams({ reportId: String(item.id) });
  };

  const closeDetail = () => {
    setSelected(null);
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-100 px-5 pb-14 pt-8 md:px-10 lg:px-32">
      <div className="mx-auto max-w-[110rem]">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h1 className="text-[2.2rem] font-semibold text-gray-900">Báo cáo của tôi</h1>
          <p className="mt-1 text-gray-500">Theo dõi trạng thái và kết quả các báo cáo vi phạm bạn đã gửi</p>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">Đang tải báo cáo...</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-gray-500">Bạn chưa gửi báo cáo vi phạm nào.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {items.map((item) => {
                const meta = statusMeta[item.status];
                const targetName = item.target?.title || item.target?.fullName || item.target?.email || `#${item.targetId}`;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openDetail(item)}
                    className="flex w-full flex-col gap-3 p-5 text-left transition-colors hover:bg-gray-50 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900">{targetName}</div>
                      <div className="mt-1 text-[1.3rem] text-gray-500">{reasonLabels[item.reasonType] || item.reasonType} · {formatDate(item.createdAt)}</div>
                      <p className="mt-2 line-clamp-1 text-[1.35rem] text-gray-600">{item.reasonDetail}</p>
                    </div>
                    <span className={`shrink-0 self-start rounded-full px-4 py-2 text-[1.3rem] font-medium md:self-auto ${meta?.className || "bg-gray-100 text-gray-600"}`}>
                      {meta?.label || item.status}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-5 flex items-center justify-center gap-4">
            <button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-gray-300 bg-white px-5 py-3 disabled:cursor-not-allowed disabled:opacity-50">Trang trước</button>
            <span className="text-gray-600">Trang {page}/{totalPages}</span>
            <button type="button" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-gray-300 bg-white px-5 py-3 disabled:cursor-not-allowed disabled:opacity-50">Trang sau</button>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-5" onClick={closeDetail}>
          <div className="w-full max-w-[58rem] rounded-2xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[2rem] font-semibold text-gray-900">Chi tiết báo cáo #{selected.id}</h2>
                <p className="mt-1 text-[1.3rem] text-gray-500">Gửi lúc {formatDate(selected.createdAt)}</p>
              </div>
              <span className={`shrink-0 rounded-full px-4 py-2 text-[1.3rem] font-medium ${statusMeta[selected.status]?.className || "bg-gray-100 text-gray-600"}`}>{statusMeta[selected.status]?.label || selected.status}</span>
            </div>
            <div className="mt-6 space-y-5">
              <div><div className="text-[1.25rem] font-medium uppercase text-gray-400">Đối tượng báo cáo</div><div className="mt-1 font-medium text-gray-900">{selected.target?.title || selected.target?.fullName || selected.target?.email || `#${selected.targetId}`}</div></div>
              <div><div className="text-[1.25rem] font-medium uppercase text-gray-400">Lý do</div><div className="mt-1 text-gray-800">{reasonLabels[selected.reasonType] || selected.reasonType}</div><p className="mt-2 whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-gray-600">{selected.reasonDetail}</p></div>
              <div><div className="text-[1.25rem] font-medium uppercase text-gray-400">Kết quả xử lý</div><p className="mt-2 whitespace-pre-wrap rounded-lg bg-blue-50 p-4 text-blue-900">{selected.note || (selected.status === ReportStatus.PENDING ? "Báo cáo đang được xem xét." : "Không có ghi chú xử lý.")}</p></div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              {selected.target && (selected.targetType === TargetType.POST ? selected.target.slug : selected.target.id) && (
                <Link to={selected.targetType === TargetType.POST ? `/posts/${selected.target.slug}` : `/users/${selected.target.id}`} className="rounded-lg border border-amber-500 px-5 py-3 font-medium text-amber-700">Xem đối tượng</Link>
              )}
              <button type="button" onClick={closeDetail} className="rounded-lg bg-gray-900 px-5 py-3 font-medium text-white">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyReports;
