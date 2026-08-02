import {
  faCheck,
  faExternalLink,
  faStore,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../../configs/axiosInstance";

interface Application {
  id: number;
  storeName: string;
  taxCode: string;
  businessLicenseUrl: string;
  logoUrl?: string;
  province: string;
  district: string;
  addressDetail: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  rejectedReason?: string;
  createdAt: string;
  user: {
    id: number;
    fullName?: string;
    email: string;
    phone?: string;
  };
}

const filters = [
  { value: "", label: "Tất cả" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Từ chối" },
  { value: "suspended", label: "Đình chỉ" },
];

function AdminProfessionalSellers() {
  const [items, setItems] = useState<Application[]>([]);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get<{
        data: { items: Application[] };
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
    item: Application,
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
        { reason },
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
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
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
        <div className="rounded-xl bg-white p-8 text-gray-500">Đang tải...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl bg-white py-24 text-center text-gray-500">
          Không có hồ sơ phù hợp.
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-gray-200 bg-white p-6"
            >
              <div className="flex gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-amber-50 text-amber-600">
                  {item.logoUrl ? (
                    <img
                      src={item.logoUrl}
                      alt={item.storeName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FontAwesomeIcon icon={faStore} className="text-[2rem]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[1.8rem] font-semibold text-gray-900">
                    {item.storeName}
                  </h3>
                  <p className="mt-1 text-[1.3rem] text-gray-500">
                    MST: {item.taxCode}
                  </p>
                  <span className="mt-2 inline-flex rounded-full bg-gray-100 px-3 py-1 text-[1.2rem] text-gray-600">
                    {filters.find((filter) => filter.value === item.status)
                      ?.label || item.status}
                  </span>
                </div>
              </div>

              <div className="mt-5 space-y-2 text-[1.4rem] text-gray-600">
                <p>
                  Chủ tài khoản: {item.user.fullName || item.user.email}
                </p>
                <p>Email: {item.user.email}</p>
                {item.user.phone && <p>Điện thoại: {item.user.phone}</p>}
                <p>
                  Địa chỉ: {item.addressDetail}, {item.district}, {item.province}
                </p>
                {item.rejectedReason && (
                  <p className="text-red-600">Lý do: {item.rejectedReason}</p>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-3 border-t border-gray-100 pt-5">
                <a
                  href={item.businessLicenseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-11 items-center gap-2 rounded-xl border border-gray-300 px-4 text-[1.3rem] text-gray-700"
                >
                  <FontAwesomeIcon icon={faExternalLink} />
                  Giấy phép
                </a>
                {item.status === "pending" && (
                  <>
                    <button
                      type="button"
                      disabled={processingId === item.id}
                      onClick={() => void approve(item.id)}
                      className="flex h-11 items-center gap-2 rounded-xl bg-green-600 px-4 text-[1.3rem] text-white disabled:opacity-60"
                    >
                      <FontAwesomeIcon icon={faCheck} />
                      Duyệt
                    </button>
                    <button
                      type="button"
                      disabled={processingId === item.id}
                      onClick={() => void reviewWithReason(item, "reject")}
                      className="flex h-11 items-center gap-2 rounded-xl bg-red-600 px-4 text-[1.3rem] text-white disabled:opacity-60"
                    >
                      <FontAwesomeIcon icon={faXmark} />
                      Từ chối
                    </button>
                  </>
                )}
                {item.status === "approved" && (
                  <button
                    type="button"
                    disabled={processingId === item.id}
                    onClick={() => void reviewWithReason(item, "suspend")}
                    className="flex h-11 items-center rounded-xl border border-red-200 px-4 text-[1.3rem] text-red-600 disabled:opacity-60"
                  >
                    Đình chỉ
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminProfessionalSellers;
