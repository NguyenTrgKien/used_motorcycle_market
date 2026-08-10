import { useEffect } from "react";
import { faExternalLink, faStore } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export type ProfessionalSellerStatus = "pending" | "approved" | "rejected" | "suspended";

export interface ProfessionalSellerApplication {
  id: number;
  storeName: string;
  description?: string;
  taxCode: string;
  businessLicenseUrl: string;
  logoUrl?: string;
  coverUrl?: string;
  province: string;
  district: string;
  ward?: string;
  addressDetail: string;
  website?: string;
  status: ProfessionalSellerStatus;
  rejectedReason?: string;
  createdAt: string;
  user: {
    id: number;
    fullName?: string;
    email: string;
    phone?: string;
  };
}

interface Props {
  application: ProfessionalSellerApplication;
  onClose: () => void;
}

function ProfessionalSellerDetailModal({ application, onClose }: Props) {
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

  const address = [
    application.addressDetail,
    application.ward,
    application.district,
    application.province,
  ].filter(Boolean).join(", ");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="seller-detail-title"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-amber-50 text-amber-600">
              {application.logoUrl ? (
                <img src={application.logoUrl} alt={application.storeName} className="h-full w-full object-cover" />
              ) : (
                <FontAwesomeIcon icon={faStore} className="text-[2rem]" />
              )}
            </div>
            <div className="min-w-0">
              <h3 id="seller-detail-title" className="truncate text-[1.8rem] font-semibold text-gray-900">
                {application.storeName}
              </h3>
              <p className="text-[1.3rem] text-gray-500">Chi tiết hồ sơ người bán chuyên</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[2.4rem] text-gray-500 hover:bg-gray-100">
            ×
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <div className="grid gap-7 lg:grid-cols-2">
            <dl className="grid content-start gap-x-6 gap-y-5 sm:grid-cols-2">
              <div>
                <dt className="text-[1.2rem] text-gray-500">Mã số thuế</dt>
                <dd className="mt-1 font-medium text-gray-900">{application.taxCode}</dd>
              </div>
              <div>
                <dt className="text-[1.2rem] text-gray-500">Ngày gửi</dt>
                <dd className="mt-1 font-medium text-gray-900">{new Date(application.createdAt).toLocaleDateString("vi-VN")}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[1.2rem] text-gray-500">Chủ tài khoản</dt>
                <dd className="mt-1 font-medium text-gray-900">{application.user.fullName || application.user.email}</dd>
              </div>
              <div>
                <dt className="text-[1.2rem] text-gray-500">Email</dt>
                <dd className="mt-1 break-all font-medium text-gray-900">{application.user.email}</dd>
              </div>
              <div>
                <dt className="text-[1.2rem] text-gray-500">Số điện thoại</dt>
                <dd className="mt-1 font-medium text-gray-900">{application.user.phone || "Chưa cập nhật"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[1.2rem] text-gray-500">Địa chỉ cửa hàng</dt>
                <dd className="mt-1 font-medium text-gray-900">{address}</dd>
              </div>
              {application.website && (
                <div className="sm:col-span-2">
                  <dt className="text-[1.2rem] text-gray-500">Website</dt>
                  <dd className="mt-1"><a href={application.website} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline">{application.website}</a></dd>
                </div>
              )}
              {application.description && (
                <div className="sm:col-span-2">
                  <dt className="text-[1.2rem] text-gray-500">Giới thiệu cửa hàng</dt>
                  <dd className="mt-1 whitespace-pre-line text-gray-700">{application.description}</dd>
                </div>
              )}
              {application.rejectedReason && (
                <div className="rounded-lg bg-red-50 p-4 text-red-700 sm:col-span-2">
                  <dt className="font-medium">Lý do</dt>
                  <dd className="mt-1">{application.rejectedReason}</dd>
                </div>
              )}
            </dl>

            <div className="space-y-4">
              {application.coverUrl && (
                <a href={application.coverUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-gray-200">
                  <img src={application.coverUrl} alt="Ảnh bìa cửa hàng" className="h-56 w-full object-cover" />
                  <span className="block border-t border-gray-200 p-3 text-center font-medium">Ảnh bìa cửa hàng</span>
                </a>
              )}
              <a href={application.businessLicenseUrl} target="_blank" rel="noreferrer" className="flex h-14 items-center justify-center gap-2 rounded-xl border border-gray-300 font-medium text-gray-700 hover:bg-gray-50">
                <FontAwesomeIcon icon={faExternalLink} />
                Xem giấy phép kinh doanh
              </a>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-200 px-6 py-4">
          <button type="button" onClick={onClose} className="h-12 rounded-lg border border-gray-300 px-5 font-medium text-gray-700 hover:bg-gray-50">Đóng</button>
        </div>
      </div>
    </div>
  );
}

export default ProfessionalSellerDetailModal;
