import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  reporterId: number;
  targetId: number;
  targetType: "post" | "user";
  reasonType: string;
  reasonDetail: string;
  status: ReportStatusValue;
  note?: string;
  createdAt: string;
  reporter?: { id: number; fullName?: string; email: string };
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

const statusLabels: Record<string, string> = {
  pending: "Chờ xử lý",
  resolved: "Đã xử lý",
  rejected: "Đã từ chối",
};
const statusClasses: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  resolved: "bg-green-100 text-green-700",
  rejected: "bg-gray-100 text-gray-600",
};

function AdminReports() {
  const [items, setItems] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [targetType, setTargetType] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<ReportItem | null>(null);
  const [decision, setDecision] = useState<ReportStatusValue>(
    ReportStatus.RESOLVED,
  );
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("/api/v1/report", {
        params: {
          page,
          limit: 15,
          status: status || undefined,
          targetType: targetType || undefined,
          search: search.trim() || undefined,
        },
      });
      setItems(response.data.data.items || []);
      setTotalPages(response.data.data.pagination?.totalPages || 1);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể tải danh sách báo cáo",
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, search, status, targetType]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void fetchReports(), 250);
    return () => window.clearTimeout(timeout);
  }, [fetchReports]);

  const openDecision = (item: ReportItem, value: ReportStatusValue) => {
    setSelected(item);
    setDecision(value);
    setNote(item.note || "");
  };

  const saveDecision = async () => {
    if (!selected || note.trim().length < 3) {
      toast.error("Vui lòng nhập ghi chú xử lý");
      return;
    }
    try {
      setIsSaving(true);
      const response = await axiosInstance.patch(
        `/api/v1/report/${selected.id}`,
        { status: decision, note: note.trim() },
      );
      toast.success(response.data.message || "Đã cập nhật báo cáo");
      setSelected(null);
      await fetchReports();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể cập nhật báo cáo",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="px-5 py-6 md:px-8">
      <div className="mx-auto max-w-[125rem]">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h1 className="text-[2.2rem] font-semibold text-gray-900">
            Báo cáo vi phạm
          </h1>
          <p className="mt-1 text-gray-500">
            Tiếp nhận và xử lý báo cáo từ người dùng
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_20rem_20rem]">
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Tìm người báo cáo hoặc nội dung..."
              className="h-16 rounded-lg border border-gray-300 px-4 outline-none focus:border-amber-500"
            />
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="h-16 rounded-lg border border-gray-300 bg-white px-4"
            >
              <option value="">Tất cả trạng thái</option>
              <option value={ReportStatus.PENDING}>Chờ xử lý</option>
              <option value={ReportStatus.RESOLVED}>Đã xử lý</option>
              <option value={ReportStatus.REJECTED}>Đã từ chối</option>
            </select>
            <select
              value={targetType}
              onChange={(event) => {
                setTargetType(event.target.value);
                setPage(1);
              }}
              className="h-16 rounded-lg border border-gray-300 bg-white px-4"
            >
              <option value="">Tất cả đối tượng</option>
              <option value={TargetType.POST}>Tin đăng</option>
              <option value={TargetType.USER}>Người dùng</option>
            </select>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">
              Đang tải báo cáo...
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              Không có báo cáo phù hợp.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[90rem] text-left">
                <thead className="bg-gray-50 text-[1.3rem] text-gray-500">
                  <tr>
                    <th className="p-4">Người báo cáo</th>
                    <th className="p-4">Đối tượng</th>
                    <th className="p-4">Lý do</th>
                    <th className="p-4">Thời gian</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 text-right">Xử lý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => {
                    const targetName =
                      item.target?.title ||
                      item.target?.fullName ||
                      item.target?.email ||
                      `#${item.targetId}`;
                    const targetPath =
                      item.targetType === TargetType.POST && item.target?.slug
                        ? `/admin/posts/view/${item.target.slug}`
                        : `/admin/users/${item.targetId}`;
                    return (
                      <tr
                        key={item.id}
                        className="align-middle hover:bg-gray-50"
                      >
                        <td className="p-4">
                          <div className="font-medium text-gray-900">
                            {item.reporter?.fullName || "Người dùng"}
                          </div>
                          <div className="text-[1.3rem] text-gray-500">
                            {item.reporter?.email}
                          </div>
                        </td>
                        <td className="p-4">
                          <Link
                            to={targetPath}
                            state={{
                              from: "/admin/reports",
                              report: {
                                id: item.id,
                                reasonType: item.reasonType,
                                reasonLabel:
                                  reasonLabels[item.reasonType] ||
                                  item.reasonType,
                                reasonDetail: item.reasonDetail,
                                status: item.status,
                              },
                            }}
                            className="font-medium text-amber-700 hover:underline"
                          >
                            {targetName}
                          </Link>
                          <div className="mt-1 text-[1.2rem] uppercase text-gray-400">
                            {item.targetType === "post"
                              ? "Tin đăng"
                              : "Người dùng"}
                          </div>
                        </td>
                        <td className="max-w-[32rem] p-4">
                          <div className="font-medium text-gray-800">
                            {reasonLabels[item.reasonType] || item.reasonType}
                          </div>
                          <div className="mt-1 line-clamp-2 text-[1.3rem] text-gray-500">
                            {item.reasonDetail}
                          </div>
                        </td>
                        <td className="p-4 text-[1.3rem] text-gray-500">
                          {new Date(item.createdAt).toLocaleString("vi-VN")}
                        </td>
                        <td className="p-4">
                          <span
                            className={`rounded-full px-6 py-3 text-[1.4rem] font-medium ${statusClasses[item.status]}`}
                          >
                            {statusLabels[item.status]}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {item.status === ReportStatus.PENDING ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() =>
                                  openDecision(item, ReportStatus.RESOLVED)
                                }
                                className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white"
                              >
                                Xác nhận
                              </button>
                              <button
                                onClick={() =>
                                  openDecision(item, ReportStatus.REJECTED)
                                }
                                className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700"
                              >
                                Từ chối
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setSelected(item);
                                setDecision(item.status);
                                setNote(item.note || "");
                              }}
                              className="font-medium text-amber-700 hover:cursor-pointer"
                            >
                              Xem chi tiết
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-5 flex justify-center gap-3">
            <button
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
              className="rounded-lg border px-4 py-2 disabled:opacity-40"
            >
              Trước
            </button>
            <span className="px-3 py-2">
              {page}/{totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((value) => value + 1)}
              className="rounded-lg border px-4 py-2 disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
          onMouseDown={() => setSelected(null)}
        >
          <div
            className="w-full max-w-[58rem] rounded-xl bg-white p-6"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 className="text-[2rem] font-semibold">
              Chi tiết báo cáo #{selected.id}
            </h2>
            <div className="mt-5 rounded-lg bg-gray-50 p-4">
              <div className="font-medium">
                {reasonLabels[selected.reasonType] || selected.reasonType}
              </div>
              <p className="mt-2 whitespace-pre-line text-gray-600">
                {selected.reasonDetail}
              </p>
            </div>
            <label className="mt-5 block font-medium">Ghi chú xử lý</label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              readOnly={selected.status !== ReportStatus.PENDING}
              rows={5}
              maxLength={1000}
              className="mt-2 w-full resize-none rounded-lg border border-gray-300 p-4 read-only:bg-gray-50"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setSelected(null)}
                className="h-16 rounded-lg border px-5"
              >
                Đóng
              </button>
              {selected.status === ReportStatus.PENDING && (
                <button
                  disabled={isSaving}
                  onClick={() => void saveDecision()}
                  className={`h-16 rounded-lg px-5 font-medium text-white ${decision === ReportStatus.RESOLVED ? "bg-green-600" : "bg-gray-700"}`}
                >
                  {isSaving
                    ? "Đang lưu..."
                    : decision === ReportStatus.RESOLVED
                      ? "Xác nhận vi phạm"
                      : "Từ chối báo cáo"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReports;
