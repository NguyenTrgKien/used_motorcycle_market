import { useEffect } from "react";

export type IdentityStatus = "pending" | "processing" | "approved" | "rejected";

export interface IdentityApplication {
  id: number;
  idNumber: string;
  idType: "cccd" | "passport";
  fullName: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  issueDate: string;
  issuePlace: string;
  address: string;
  idFrontUrl?: string | null;
  idBackUrl?: string | null;
  status: IdentityStatus;
  rejectionReason?: string;
  createdAt: string;
  user: { id: number; fullName?: string; email: string; phone?: string };
}

interface Props {
  application: IdentityApplication;
  busy: boolean;
  onClose: () => void;
  onReject: () => void;
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("vi-VN");

function IdentityVerificationDetailModal({
  application,
  busy,
  onClose,
  onReject,
}: Props) {
  const reviewable =
    application.status === "pending" || application.status === "processing";

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="identity-detail-title"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5">
          <div>
            <h3
              id="identity-detail-title"
              className="text-[1.8rem] font-semibold text-gray-900"
            >
              Chi tiết hồ sơ xác minh
            </h3>
            <p className="mt-1 text-[1.3rem] text-gray-500">
              {application.fullName} · {application.user.email}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[2.4rem] leading-none text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-6">
          <div className="grid gap-7 xl:grid-cols-[0.9fr_1.2fr]">
            <dl className="grid content-start gap-x-6 gap-y-5 sm:grid-cols-2">
              <div>
                <dt className="text-[1.2rem] text-gray-500">Loại giấy tờ</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {application.idType === "cccd" ? "CCCD" : "Hộ chiếu"}
                </dd>
              </div>
              <div>
                <dt className="text-[1.2rem] text-gray-500">Số giấy tờ</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {application.idNumber}
                </dd>
              </div>
              <div>
                <dt className="text-[1.2rem] text-gray-500">Ngày sinh</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {formatDate(application.dateOfBirth)}
                </dd>
              </div>
              <div>
                <dt className="text-[1.2rem] text-gray-500">Ngày cấp</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {formatDate(application.issueDate)}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[1.2rem] text-gray-500">Nơi cấp</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {application.issuePlace}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[1.2rem] text-gray-500">Địa chỉ</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {application.address}
                </dd>
              </div>
              {application.user.phone && (
                <div className="sm:col-span-2">
                  <dt className="text-[1.2rem] text-gray-500">Số điện thoại</dt>
                  <dd className="mt-1 font-medium text-gray-900">
                    {application.user.phone}
                  </dd>
                </div>
              )}
              {application.rejectionReason && (
                <div className="rounded-lg bg-red-50 p-4 text-red-700 sm:col-span-2">
                  <dt className="font-medium">Lý do từ chối</dt>
                  <dd className="mt-1">{application.rejectionReason}</dd>
                </div>
              )}
            </dl>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: "Mặt trước", url: application.idFrontUrl },
                { label: "Mặt sau", url: application.idBackUrl },
              ].map(({ label, url }) =>
                url ? (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                  >
                    <img
                      src={url}
                      alt={label}
                      className="h-72 w-full object-contain"
                    />
                    <span className="block border-t border-gray-200 p-3 text-center font-medium">
                      {label}
                    </span>
                  </a>
                ) : (
                  <div
                    key={label}
                    className="flex h-72 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-400"
                  >
                    {label}: ảnh đã được xóa
                  </div>
                ),
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-16 rounded-lg border border-gray-300 px-5 font-medium text-gray-700 hover:bg-gray-50"
          >
            Đóng
          </button>
          {reviewable && (
            <button
              type="button"
              disabled={busy}
              onClick={onReject}
              className="h-16 rounded-lg bg-red-600 px-5 font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Từ chối hồ sơ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default IdentityVerificationDetailModal;
