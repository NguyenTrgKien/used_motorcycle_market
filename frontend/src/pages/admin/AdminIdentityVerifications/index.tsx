import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../../configs/axiosInstance";
import IdentityVerificationDetailModal, {
  type IdentityApplication,
  type IdentityStatus,
} from "./IdentityVerificationDetailModal";
import ApproveIdentityConfirmModal from "./ApproveIdentityConfirmModal";

const labels: Record<IdentityStatus, string> = {
  pending: "Chờ duyệt",
  processing: "Đang xử lý",
  approved: "Đã xác minh",
  rejected: "Từ chối",
};

const statusStyles: Record<IdentityStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  processing: "bg-blue-50 text-blue-700 ring-blue-600/20",
  approved: "bg-green-50 text-green-700 ring-green-600/20",
  rejected: "bg-red-50 text-red-700 ring-red-600/20",
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("vi-VN");

function AdminIdentityVerifications() {
  const [applications, setApplications] = useState<IdentityApplication[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [selectedApplication, setSelectedApplication] =
    useState<IdentityApplication | null>(null);
  const [approvalApplication, setApprovalApplication] =
    useState<IdentityApplication | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get<{
        data: IdentityApplication[];
        total: number;
      }>("/api/v1/user-identity/admin/applications", {
        params: { status: status || undefined, limit: 100 },
      });
      setApplications(response.data.data);
    } catch {
      toast.error("Không thể tải danh sách hồ sơ");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const action = async (
    application: IdentityApplication,
    type: "processing" | "approve" | "reject",
  ) => {
    let body: { reason?: string } | undefined;
    if (type === "reject") {
      const reason = window.prompt("Nhập lý do từ chối hồ sơ:");
      if (!reason?.trim()) return;
      body = { reason: reason.trim() };
    }
    try {
      setProcessingId(application.id);
      const response = await axiosInstance.patch<{ message: string }>(
        `/api/v1/user-identity/admin/${application.id}/${type}`,
        body,
      );
      toast.success(response.data.message);
      if (type === "reject") setSelectedApplication(null);
      if (type === "approve") setApprovalApplication(null);
      await load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể xử lý hồ sơ");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5">
        <div>
          <h2 className="text-[2rem] font-semibold">
            Hồ sơ xác minh danh tính
          </h2>
          <p className="text-[1.3rem] text-gray-500">
            Kiểm tra thông tin và ảnh giấy tờ trước khi phê duyệt.
          </p>
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-16 rounded-lg border border-gray-300 bg-white px-5"
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(labels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">
          Đang tải hồ sơ...
        </div>
      ) : applications.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">
          Không có hồ sơ phù hợp.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[minmax(220px,1.5fr)_minmax(170px,1fr)_140px_150px_260px] gap-5 border-b border-gray-200 bg-gray-50 px-6 py-4 text-[1.2rem] font-semibold uppercase tracking-wide text-gray-500 lg:grid">
            <span>Người đăng ký</span>
            <span>Giấy tờ</span>
            <span>Ngày gửi</span>
            <span>Trạng thái</span>
            <span className="text-center">Thao tác</span>
          </div>
          <div className="divide-y divide-gray-200">
            {applications.map((application) => {
              const reviewable =
                application.status === "pending" ||
                application.status === "processing";
              const busy = processingId === application.id;
              return (
                <article key={application.id}>
                  <div
                    className="grid cursor-pointer gap-4 px-5 py-5 transition-colors hover:bg-gray-50 lg:grid-cols-[minmax(220px,1.5fr)_minmax(170px,1fr)_140px_150px_260px] lg:items-center lg:gap-5 lg:px-6"
                    onClick={() => setSelectedApplication(application)}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">
                        {application.fullName}
                      </p>
                      <p className="truncate text-[1.4rem] text-gray-500">
                        {application.user?.email}
                      </p>
                      <p className="text-[1.2rem] text-gray-400">
                        Mã người dùng: #{application.user?.id}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {application.idType === "cccd" ? "CCCD" : "Hộ chiếu"}
                      </p>
                      <p className="text-gray-600">({application.idNumber})</p>
                    </div>
                    <div>
                      <span className="text-gray-700">
                        {formatDate(application.createdAt)}
                      </span>
                    </div>
                    <div>
                      <span
                        className={`inline-flex rounded-full px-5 py-3 text-[1.4rem] font-medium ring-1 ring-inset ${statusStyles[application.status]}`}
                      >
                        {labels[application.status]}
                      </span>
                    </div>
                    <div className="flex justify-center gap-2">
                      {application.status === "pending" && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={(event) => {
                            event.stopPropagation();
                            void action(application, "processing");
                          }}
                          className="h-16 rounded-lg bg-blue-600 px-4 text-[1.4rem] font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Bắt đầu xử lý
                        </button>
                      )}
                      {reviewable && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={(event) => {
                            event.stopPropagation();
                            setApprovalApplication(application);
                          }}
                          className="h-16 rounded-lg bg-green-600 px-4 text-[1.4rem] font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Phê duyệt
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
        <IdentityVerificationDetailModal
          application={selectedApplication}
          busy={processingId === selectedApplication.id}
          onClose={() => setSelectedApplication(null)}
          onReject={() => void action(selectedApplication, "reject")}
        />
      )}
      {approvalApplication && (
        <ApproveIdentityConfirmModal
          fullName={approvalApplication.fullName}
          busy={processingId === approvalApplication.id}
          onClose={() => setApprovalApplication(null)}
          onConfirm={() => void action(approvalApplication, "approve")}
        />
      )}
    </div>
  );
}

export default AdminIdentityVerifications;
