import { faCheck, faStore, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../../configs/axiosInstance";
import ProfessionalSellerDetailModal, {
  type ProfessionalSellerApplication,
  type ProfessionalSellerStatus,
} from "./ProfessionalSellerDetailModal";

const filters = [
  { value: "", label: "Tất cả" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Từ chối" },
  { value: "suspended", label: "Đình chỉ" },
];

const statusStyles: Record<ProfessionalSellerStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  approved: "bg-green-50 text-green-700 ring-green-600/20",
  rejected: "bg-red-50 text-red-700 ring-red-600/20",
  suspended: "bg-gray-100 text-gray-700 ring-gray-600/20",
};

const statusLabel = (status: ProfessionalSellerStatus) =>
  filters.find((filter) => filter.value === status)?.label || status;

function AdminProfessionalSellers() {
  const [items, setItems] = useState<ProfessionalSellerApplication[]>([]);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [selectedApplication, setSelectedApplication] =
    useState<ProfessionalSellerApplication | null>(null);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get<{
        data: { items: ProfessionalSellerApplication[] };
      }>("/api/v1/professional-sellers/admin/applications", {
        params: status ? { status } : undefined,
      });
      setItems(res.data.data.items || []);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể tải danh sách hồ sơ",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchApplications();
  }, [status]);

  const approve = async (id: number) => {
    try {
      setProcessingId(id);
      const res = await axiosInstance.patch(
        `/api/v1/professional-sellers/admin/${id}/approve`,
      );
      toast.success(res.data.message);
      await fetchApplications();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể duyệt hồ sơ");
    } finally {
      setProcessingId(null);
    }
  };

  const reviewWithReason = async (
    item: ProfessionalSellerApplication,
    action: "reject" | "suspend",
  ) => {
    const reason = window.prompt(
      action === "reject" ? "Nhập lý do từ chối:" : "Nhập lý do đình chỉ:",
    );
    if (!reason?.trim()) return;
    try {
      setProcessingId(item.id);
      const res = await axiosInstance.patch(
        `/api/v1/professional-sellers/admin/${item.id}/${action}`,
        { reason: reason.trim() },
      );
      toast.success(res.data.message);
      await fetchApplications();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể xử lý hồ sơ");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <section className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5">
        <div>
          <h2 className="text-[2rem] font-semibold text-gray-900">
            Hồ sơ người bán chuyên
          </h2>
          <p className="mt-1 text-[1.4rem] text-gray-500">
            Xác minh cửa hàng và thông tin kinh doanh
          </p>
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-14 rounded-xl border border-gray-300 bg-white px-4 outline-none"
        >
          {filters.map((filter) => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">
          Đang tải...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-24 text-center text-gray-500">
          Không có hồ sơ phù hợp.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[minmax(240px,1.5fr)_minmax(190px,1fr)_150px_140px_260px] gap-5 border-b border-gray-200 bg-gray-50 px-6 py-4 text-[1.2rem] font-semibold uppercase tracking-wide text-gray-500 lg:grid">
            <span>Cửa hàng</span>
            <span>Chủ tài khoản</span>
            <span>Ngày gửi</span>
            <span>Trạng thái</span>
            <span className="text-center">Thao tác</span>
          </div>
          <div className="divide-y divide-gray-200">
            {items.map((item) => {
              const busy = processingId === item.id;
              return (
                <article key={item.id}>
                  <div
                    className="grid cursor-pointer gap-4 px-5 py-5 transition-colors hover:bg-gray-50 lg:grid-cols-[minmax(240px,1.5fr)_minmax(190px,1fr)_150px_140px_260px] lg:items-center lg:gap-5 lg:px-6"
                    onClick={() => setSelectedApplication(item)}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-amber-50 text-amber-600">
                        {item.logoUrl ? (
                          <img
                            src={item.logoUrl}
                            alt={item.storeName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <FontAwesomeIcon
                            icon={faStore}
                            className="text-[1.8rem]"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">
                          {item.storeName}
                        </p>
                        <p className="truncate text-[1.3rem] text-gray-500">
                          MST: {item.taxCode}
                        </p>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-800">
                        {item.user.fullName || "Chưa cập nhật"}
                      </p>
                      <p className="truncate text-[1.3rem] text-gray-500">
                        {item.user.email}
                      </p>
                    </div>
                    <div className="text-gray-700">
                      {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                    </div>
                    <div>
                      <span
                        className={`inline-flex rounded-full px-5 py-3 text-[1.3rem] font-medium ring-1 ring-inset ${statusStyles[item.status]}`}
                      >
                        {statusLabel(item.status)}
                      </span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {item.status === "pending" && (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={(event) => {
                              event.stopPropagation();
                              void approve(item.id);
                            }}
                            className="flex h-16 items-center gap-2 rounded-lg bg-green-600 px-4 text-[1.3rem] font-medium text-white hover:bg-green-700 disabled:opacity-60"
                          >
                            <FontAwesomeIcon icon={faCheck} /> Phê duyệt
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={(event) => {
                              event.stopPropagation();
                              void reviewWithReason(item, "reject");
                            }}
                            className="flex h-16 items-center gap-2 rounded-lg bg-red-600 px-4 text-[1.3rem] font-medium text-white hover:bg-red-700 disabled:opacity-60"
                          >
                            <FontAwesomeIcon icon={faXmark} /> Từ chối
                          </button>
                        </>
                      )}
                      {item.status === "approved" && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={(event) => {
                            event.stopPropagation();
                            void reviewWithReason(item, "suspend");
                          }}
                          className="h-16 rounded-lg border border-red-200 px-4 text-[1.3rem] font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                        >
                          Đình chỉ
                        </button>
                      )}
                      {!(
                        ["pending", "approved"] as ProfessionalSellerStatus[]
                      ).includes(item.status) && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedApplication(item);
                          }}
                          className="h-16 rounded-lg border border-gray-300 px-4 text-[1.3rem] font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Xem chi tiết
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {selectedApplication && (
        <ProfessionalSellerDetailModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
        />
      )}
    </section>
  );
}

export default AdminProfessionalSellers;
