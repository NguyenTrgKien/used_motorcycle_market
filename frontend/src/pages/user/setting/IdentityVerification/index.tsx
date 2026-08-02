import { faIdCard, faUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../../../configs/axiosInstance";
import { useUser } from "../../../../hooks/useUser";

type IdentityStatus = "pending" | "processing" | "approved" | "rejected";

interface Identity {
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
  status: IdentityStatus;
  rejectionReason?: string;
  verifiedAt?: string;
}

const emptyForm = {
  idNumber: "",
  idType: "cccd",
  fullName: "",
  dateOfBirth: "",
  gender: "male",
  issueDate: "",
  issuePlace: "",
  address: "",
};

const statusLabels: Record<IdentityStatus, string> = {
  pending: "Đang chờ xét duyệt",
  processing: "Đang được xử lý",
  approved: "Đã xác minh",
  rejected: "Đã bị từ chối",
};

function dateValue(value?: string) {
  return value ? value.slice(0, 10) : "";
}

function IdentityVerification() {
  const { user } = useUser();
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState<Record<string, File | null>>({
    idFront: null,
    idBack: null,
    selfie: null,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const locked =
    identity?.status === "pending" ||
    identity?.status === "processing" ||
    identity?.status === "approved";

  const loadIdentity = async () => {
    try {
      const response = await axiosInstance.get<{ data: Identity | null }>(
        "/api/v1/user-identity/me",
      );
      const data = response.data.data;
      setIdentity(data);
      if (data) {
        setForm({
          idNumber: data.idNumber,
          idType: data.idType,
          fullName: data.fullName,
          dateOfBirth: dateValue(data.dateOfBirth),
          gender: data.gender,
          issueDate: dateValue(data.issueDate),
          issuePlace: data.issuePlace,
          address: data.address,
        });
      }
    } catch {
      toast.error("Không thể tải thông tin xác minh");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadIdentity();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!files.idFront || !files.idBack || !files.selfie) {
      toast.error("Vui lòng chọn đầy đủ ảnh giấy tờ và ảnh chân dung");
      return;
    }
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, value));
    body.append("idFront", files.idFront);
    body.append("idBack", files.idBack);
    body.append("selfie", files.selfie);
    try {
      setSubmitting(true);
      const response = await axiosInstance.post<{
        message: string;
        data: Identity;
      }>("/api/v1/user-identity/application", body);
      toast.success(response.data.message);
      setFiles({ idFront: null, idBack: null, selfie: null });
      await loadIdentity();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gửi hồ sơ thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const fileField = (
    key: "idFront" | "idBack" | "selfie",
    label: string,
    currentUrl?: string,
  ) => {
    const file = files[key];
    const preview = file ? URL.createObjectURL(file) : currentUrl;
    return (
      <label className="block">
        <span className="mb-2 text-gray-600 block font-medium text-gray-700">
          {label}
        </span>
        <span className="flex min-h-[16rem] cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
          {preview ? (
            <img
              src={preview}
              alt={label}
              className="h-[18rem] w-full object-contain"
            />
          ) : (
            <span className="text-center text-gray-500">
              <FontAwesomeIcon icon={faUpload} className="mb-3 text-[2.4rem]" />
              <span className="block">Chọn ảnh JPG, PNG hoặc WEBP</span>
            </span>
          )}
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={locked}
          onChange={(event) =>
            setFiles((previous) => ({
              ...previous,
              [key]: event.target.files?.[0] || null,
            }))
          }
        />
      </label>
    );
  };

  if (loading) {
    return <div className="p-10 text-gray-500">Đang tải hồ sơ...</div>;
  }

  return (
    <div className="p-10">
      <div className="flex items-center gap-4 border-b border-gray-200 pb-6">
        <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <FontAwesomeIcon icon={faIdCard} className="text-[2.2rem]" />
        </span>
        <div>
          <h1 className="text-[2.2rem] font-medium">Xác minh danh tính</h1>
          <p className="text-gray-500">
            Thông tin chỉ được dùng để xét duyệt tài khoản.
          </p>
        </div>
      </div>

      {!user?.isPhoneVerified && (
        <div className="mt-6 rounded-xl bg-amber-50 p-5 text-amber-800">
          Vui lòng thêm và xác minh số điện thoại trong phần Bảo mật trước khi
          gửi hồ sơ xác minh danh tính.
        </div>
      )}

      {identity && (
        <div className="mt-6 rounded-xl bg-gray-50 p-5">
          <span className="font-semibold">{statusLabels[identity.status]}</span>
          {identity.rejectionReason && (
            <p className="mt-2 text-red-600">
              Lý do: {identity.rejectionReason}
            </p>
          )}
        </div>
      )}

      <form onSubmit={submit} className="mt-8 space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <label>
            <span className="mb-2 text-gray-600 block font-medium">
              Loại giấy tờ *
            </span>
            <select
              value={form.idType}
              disabled={locked}
              onChange={(event) =>
                setForm({ ...form, idType: event.target.value })
              }
              className="h-18 w-full rounded-lg border border-gray-300 px-5 outline-none"
            >
              <option value="cccd">Căn cước công dân</option>
              <option value="passport">Hộ chiếu</option>
            </select>
          </label>
          <label>
            <span className="mb-2 text-gray-600 block font-medium">
              Số giấy tờ *
            </span>
            <input
              value={form.idNumber}
              required
              disabled={locked}
              maxLength={30}
              onChange={(event) =>
                setForm({ ...form, idNumber: event.target.value })
              }
              className="h-18 w-full rounded-lg border border-gray-300 px-5 outline-none"
            />
          </label>
          <label>
            <span className="mb-2 text-gray-600 block font-medium">
              Họ và tên *
            </span>
            <input
              value={form.fullName}
              required
              disabled={locked}
              onChange={(event) =>
                setForm({ ...form, fullName: event.target.value })
              }
              className="h-18 w-full rounded-lg border border-gray-300 px-5 outline-none"
            />
          </label>
          <label>
            <span className="mb-2 text-gray-600 block font-medium">
              Giới tính *
            </span>
            <select
              value={form.gender}
              disabled={locked}
              onChange={(event) =>
                setForm({ ...form, gender: event.target.value })
              }
              className="h-18 w-full rounded-lg border border-gray-300 px-5 outline-none"
            >
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </label>
          <label>
            <span className="mb-2 text-gray-600 block font-medium">
              Ngày sinh *
            </span>
            <input
              type="date"
              value={form.dateOfBirth}
              required
              disabled={locked}
              onChange={(event) =>
                setForm({ ...form, dateOfBirth: event.target.value })
              }
              className="h-18 w-full rounded-lg border border-gray-300 px-5 outline-none"
            />
          </label>
          <label>
            <span className="mb-2 text-gray-600 block font-medium">
              Ngày cấp *
            </span>
            <input
              type="date"
              value={form.issueDate}
              required
              disabled={locked}
              onChange={(event) =>
                setForm({ ...form, issueDate: event.target.value })
              }
              className="h-18 w-full rounded-lg border border-gray-300 px-5 outline-none"
            />
          </label>
          <label className="md:col-span-2">
            <span className="mb-2 text-gray-600 block font-medium">
              Nơi cấp *
            </span>
            <input
              value={form.issuePlace}
              required
              disabled={locked}
              onChange={(event) =>
                setForm({ ...form, issuePlace: event.target.value })
              }
              className="h-18 w-full rounded-lg border border-gray-300 px-5 outline-none"
            />
          </label>
          <label className="md:col-span-2">
            <span className="mb-2 text-gray-600 block font-medium">
              Địa chỉ trên giấy tờ *
            </span>
            <textarea
              value={form.address}
              required
              disabled={locked}
              onChange={(event) =>
                setForm({ ...form, address: event.target.value })
              }
              className="min-h-[10rem] w-full rounded-lg border border-gray-300 p-5 outline-none"
            />
          </label>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {fileField("idFront", "Mặt trước giấy tờ *", identity?.idFrontUrl)}
          {fileField("idBack", "Mặt sau giấy tờ *", identity?.idBackUrl)}
          {fileField(
            "selfie",
            "Ảnh chân dung cầm giấy tờ *",
            identity?.selfieUrl,
          )}
        </div>
        {!locked && (
          <button
            type="submit"
            disabled={user?.isPhoneVerified || submitting}
            className={`h-18 rounded-lg ${!user?.isPhoneVerified ? "bg-gray-300 " : "bg-amber-500"}  px-10 font-semibold text-white disabled:opacity-60`}
          >
            {submitting
              ? "Đang gửi..."
              : identity?.status === "rejected"
                ? "Gửi lại hồ sơ"
                : "Gửi hồ sơ xét duyệt"}
          </button>
        )}
      </form>
    </div>
  );
}

export default IdentityVerification;
