import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../../configs/axiosInstance";

type Status = "pending" | "processing" | "approved" | "rejected";

interface Application {
  id: number;
  idNumber: string;
  idType: "cccd" | "passport";
  fullName: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  issueDate: string;
  issuePlace: string;
  address: string;
  idFrontUrl: string;
  idBackUrl: string;
  selfieUrl: string;
  status: Status;
  rejectionReason?: string;
  createdAt: string;
  user: { id: number; fullName?: string; email: string; phone?: string };
}

const labels: Record<Status, string> = {
  pending: "Chờ duyệt",
  processing: "Đang xử lý",
  approved: "Đã xác minh",
  rejected: "Từ chối",
};

function AdminIdentityVerifications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get<{
        data: Application[];
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
  };

  useEffect(() => {
    void load();
  }, [status]);

  const action = async (
    application: Application,
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
          <h2 className="text-[2rem] font-semibold">Hồ sơ xác minh danh tính</h2>
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
        <div className="space-y-6">
          {applications.map((application) => {
            const reviewable =
              application.status === "pending" ||
              application.status === "processing";
            return (
              <article
                key={application.id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[1.8rem] font-semibold">
                      {application.fullName}
                    </h3>
                    <p className="text-gray-500">
                      Tài khoản: {application.user?.email} · ID #{application.user?.id}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-4 py-2 font-medium text-amber-700">
                    {labels[application.status]}
                  </span>
                </div>

                <dl className="mt-6 grid gap-4 rounded-xl bg-gray-50 p-5 md:grid-cols-3">
                  <div>
                    <dt className="text-gray-500">Giấy tờ</dt>
                    <dd className="font-medium">
                      {application.idType === "cccd" ? "CCCD" : "Hộ chiếu"} ·{" "}
                      {application.idNumber}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Ngày sinh</dt>
                    <dd>{new Date(application.dateOfBirth).toLocaleDateString("vi-VN")}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Ngày cấp</dt>
                    <dd>{new Date(application.issueDate).toLocaleDateString("vi-VN")}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Nơi cấp</dt>
                    <dd>{application.issuePlace}</dd>
                  </div>
                  <div className="md:col-span-2">
                    <dt className="text-gray-500">Địa chỉ</dt>
                    <dd>{application.address}</dd>
                  </div>
                </dl>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {[
                    ["Mặt trước", application.idFrontUrl],
                    ["Mặt sau", application.idBackUrl],
                    ["Ảnh chân dung", application.selfieUrl],
                  ].map(([label, url]) => (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="overflow-hidden rounded-xl border border-gray-200"
                    >
                      <img src={url} alt={label} className="h-[22rem] w-full object-contain" />
                      <span className="block border-t border-gray-200 p-3 text-center font-medium">
                        {label}
                      </span>
                    </a>
                  ))}
                </div>

                {application.rejectionReason && (
                  <p className="mt-5 rounded-lg bg-red-50 p-4 text-red-700">
                    Lý do từ chối: {application.rejectionReason}
                  </p>
                )}

                {reviewable && (
                  <div className="mt-6 flex flex-wrap justify-end gap-3">
                    {application.status === "pending" && (
                      <button
                        type="button"
                        disabled={processingId === application.id}
                        onClick={() => void action(application, "processing")}
                        className="h-16 rounded-lg border border-gray-300 px-6"
                      >
                        Tiếp nhận
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={processingId === application.id}
                      onClick={() => void action(application, "reject")}
                      className="h-16 rounded-lg bg-red-600 px-6 font-medium text-white"
                    >
                      Từ chối
                    </button>
                    <button
                      type="button"
                      disabled={processingId === application.id}
                      onClick={() => void action(application, "approve")}
                      className="h-16 rounded-lg bg-green-600 px-6 font-medium text-white"
                    >
                      Phê duyệt
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AdminIdentityVerifications;
