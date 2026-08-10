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
  idFrontUrl?: string | null;
  idBackUrl?: string | null;
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

type FormField = keyof typeof emptyForm | "idFront" | "idBack" | "demoConsent";
type FormErrors = Partial<Record<FormField, string>>;

const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageSize = 5 * 1024 * 1024;

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
  });
  const [demoConsent, setDemoConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const locked =
    identity?.status === "processing" ||
    identity?.status === "approved" ||
    (identity?.status === "pending" && !editing);
  const formLocked = locked || !user?.isPhoneVerified;

  const loadIdentity = async () => {
    try {
      const [identityResponse, imagesResponse] = await Promise.all([
        axiosInstance.get<{ data: Identity | null }>(
          "/api/v1/user-identity/me",
        ),
        axiosInstance.get<{
          data: Pick<Identity, "idFrontUrl" | "idBackUrl"> | null;
        }>("/api/v1/user-identity/me/images"),
      ]);
      const data = identityResponse.data.data
        ? { ...identityResponse.data.data, ...imagesResponse.data.data }
        : null;
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

  const clearError = (field: FormField) => {
    setErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateOfBirth = form.dateOfBirth ? new Date(form.dateOfBirth) : null;
    const issueDate = form.issueDate ? new Date(form.issueDate) : null;

    if (!form.idNumber.trim()) {
      nextErrors.idNumber = "Vui lòng nhập số giấy tờ.";
    } else if (form.idType === "cccd" && !/^000\d{9}$/.test(form.idNumber.trim())) {
      nextErrors.idNumber = "CCCD mẫu phải gồm 12 chữ số và bắt đầu bằng 000.";
    } else if (form.idType === "passport" && !/^DEMO[A-Z0-9]{2,16}$/i.test(form.idNumber.trim())) {
      nextErrors.idNumber = "Hộ chiếu mẫu phải bắt đầu bằng DEMO và có từ 6 đến 20 ký tự.";
    }

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Vui lòng nhập họ và tên.";
    } else if (form.fullName.trim().length < 2) {
      nextErrors.fullName = "Họ và tên phải có ít nhất 2 ký tự.";
    } else if (/\d/.test(form.fullName)) {
      nextErrors.fullName = "Họ và tên không được chứa chữ số.";
    }

    if (!dateOfBirth || Number.isNaN(dateOfBirth.getTime())) {
      nextErrors.dateOfBirth = "Vui lòng chọn ngày sinh.";
    } else if (dateOfBirth >= today) {
      nextErrors.dateOfBirth = "Ngày sinh phải trước ngày hiện tại.";
    }

    if (!issueDate || Number.isNaN(issueDate.getTime())) {
      nextErrors.issueDate = "Vui lòng chọn ngày cấp giấy tờ.";
    } else if (issueDate > today) {
      nextErrors.issueDate = "Ngày cấp không được sau ngày hiện tại.";
    } else if (dateOfBirth && issueDate <= dateOfBirth) {
      nextErrors.issueDate = "Ngày cấp phải sau ngày sinh.";
    }

    if (!form.issuePlace.trim()) {
      nextErrors.issuePlace = "Vui lòng nhập nơi cấp giấy tờ.";
    } else if (form.issuePlace.trim().length < 2) {
      nextErrors.issuePlace = "Nơi cấp phải có ít nhất 2 ký tự.";
    }

    if (!form.address.trim()) {
      nextErrors.address = "Vui lòng nhập địa chỉ trên giấy tờ.";
    } else if (form.address.trim().length < 5) {
      nextErrors.address = "Địa chỉ phải có ít nhất 5 ký tự.";
    }

    const requiresImages = !identity || identity.status === "rejected";
    (["idFront", "idBack"] as const).forEach((key) => {
      const file = files[key];
      if (requiresImages && !file) {
        nextErrors[key] = key === "idFront"
          ? "Vui lòng chọn ảnh mặt trước giấy tờ."
          : "Vui lòng chọn ảnh mặt sau giấy tờ.";
      } else if (file && !acceptedImageTypes.includes(file.type)) {
        nextErrors[key] = "Ảnh phải có định dạng JPG, PNG hoặc WEBP.";
      } else if (file && file.size > maxImageSize) {
        nextErrors[key] = "Dung lượng ảnh không được vượt quá 5MB.";
      }
    });

    if (!demoConsent) {
      nextErrors.demoConsent = "Bạn cần xác nhận chỉ sử dụng dữ liệu mô phỏng.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const fieldClass = (field: FormField) =>
    `w-full rounded-lg border px-5 outline-none transition-colors ${
      errors[field]
        ? "border-red-500 focus:border-red-500"
        : "border-gray-300 focus:border-amber-500"
    }`;

  const fieldError = (field: FormField) =>
    errors[field] ? (
      <span className="mt-2 block text-[1.25rem] text-red-600">
        {errors[field]}
      </span>
    ) : null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;
    const requiresImages = !identity || identity.status === "rejected";
    if (requiresImages && (!files.idFront || !files.idBack)) {
      toast.error("Vui lòng chọn đầy đủ ảnh giấy tờ mẫu");
      return;
    }
    if (!demoConsent) {
      toast.error("Vui lòng xác nhận chỉ sử dụng dữ liệu mô phỏng");
      return;
    }
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, value));
    if (files.idFront) body.append("idFront", files.idFront);
    if (files.idBack) body.append("idBack", files.idBack);
    body.append("demoConsent", String(demoConsent));
    try {
      setSubmitting(true);
      const response =
        identity?.status === "pending"
          ? await axiosInstance.patch<{
              message: string;
              data: Identity;
            }>("/api/v1/user-identity/application", body)
          : await axiosInstance.post<{
              message: string;
              data: Identity;
            }>("/api/v1/user-identity/application", body);
      toast.success(response.data.message);
      setFiles({ idFront: null, idBack: null });
      setDemoConsent(false);
      setErrors({});
      setEditing(false);
      await loadIdentity();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gửi hồ sơ thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const fileField = (
    key: "idFront" | "idBack",
    label: string,
    currentUrl?: string | null,
  ) => {
    const file = files[key];
    const preview = file ? URL.createObjectURL(file) : currentUrl;
    return (
      <label className="block">
        <span className="mb-2 text-gray-600 block font-medium text-gray-700">
          {label}
        </span>
        <span className={`flex min-h-[16rem] cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-gray-50 ${errors[key] ? "border-red-500" : "border-gray-300"}`}>
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
          disabled={formLocked}
          onChange={(event) => {
            setFiles((previous) => ({
              ...previous,
              [key]: event.target.files?.[0] || null,
            }));
            clearError(key);
          }}
        />
        {fieldError(key)}
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
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold">
              {statusLabels[identity.status]}
            </span>
            {identity.status === "pending" && !editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="h-14 rounded-lg border border-amber-500 px-5 font-medium text-amber-600 hover:bg-amber-50"
              >
                Chỉnh sửa hồ sơ
              </button>
            )}
          </div>
          {identity.rejectionReason && (
            <p className="mt-2 text-red-600">
              Lý do: {identity.rejectionReason}
            </p>
          )}
        </div>
      )}

      <form onSubmit={submit} noValidate className="mt-8 space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <label>
            <span className="mb-2 text-gray-600 block font-medium">
              Loại giấy tờ *
            </span>
            <select
              value={form.idType}
              disabled={formLocked}
              onChange={(event) => {
                setForm({ ...form, idType: event.target.value });
                clearError("idNumber");
              }}
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
              disabled={formLocked}
              maxLength={30}
              placeholder={
                form.idType === "cccd" ? "VD: 000123456789" : "VD: DEMO01"
              }
              onChange={(event) => {
                setForm({ ...form, idNumber: event.target.value });
                clearError("idNumber");
              }}
              className={`h-18 ${fieldClass("idNumber")}`}
            />
            {fieldError("idNumber")}
          </label>
          <label>
            <span className="mb-2 text-gray-600 block font-medium">
              Họ và tên *
            </span>
            <input
              value={form.fullName}
              required
              disabled={formLocked}
              placeholder="Nguyễn Văn Demo"
              onChange={(event) => {
                setForm({ ...form, fullName: event.target.value });
                clearError("fullName");
              }}
              className={`h-18 ${fieldClass("fullName")}`}
            />
            {fieldError("fullName")}
          </label>
          <label>
            <span className="mb-2 text-gray-600 block font-medium">
              Giới tính *
            </span>
            <select
              value={form.gender}
              disabled={formLocked}
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
              disabled={formLocked}
              onChange={(event) => {
                setForm({ ...form, dateOfBirth: event.target.value });
                clearError("dateOfBirth");
                clearError("issueDate");
              }}
              className={`h-18 ${fieldClass("dateOfBirth")}`}
            />
            {fieldError("dateOfBirth")}
          </label>
          <label>
            <span className="mb-2 text-gray-600 block font-medium">
              Ngày cấp *
            </span>
            <input
              type="date"
              value={form.issueDate}
              required
              disabled={formLocked}
              onChange={(event) => {
                setForm({ ...form, issueDate: event.target.value });
                clearError("issueDate");
              }}
              className={`h-18 ${fieldClass("issueDate")}`}
            />
            {fieldError("issueDate")}
          </label>
          <label className="md:col-span-2">
            <span className="mb-2 text-gray-600 block font-medium">
              Nơi cấp *
            </span>
            <input
              value={form.issuePlace}
              required
              disabled={formLocked}
              onChange={(event) => {
                setForm({ ...form, issuePlace: event.target.value });
                clearError("issuePlace");
              }}
              className={`h-18 ${fieldClass("issuePlace")}`}
            />
            {fieldError("issuePlace")}
          </label>
          <label className="md:col-span-2">
            <span className="mb-2 text-gray-600 block font-medium">
              Địa chỉ trên giấy tờ *
            </span>
            <textarea
              value={form.address}
              required
              disabled={formLocked}
              onChange={(event) => {
                setForm({ ...form, address: event.target.value });
                clearError("address");
              }}
              className={`min-h-[10rem] p-5 ${fieldClass("address")}`}
            />
            {fieldError("address")}
          </label>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {fileField(
            "idFront",
            identity?.status === "pending"
              ? "Thay mặt trước giấy tờ (tùy chọn)"
              : "Mặt trước giấy tờ *",
            identity?.idFrontUrl,
          )}
          {fileField(
            "idBack",
            identity?.status === "pending"
              ? "Thay mặt sau giấy tờ (tùy chọn)"
              : "Mặt sau giấy tờ *",
            identity?.idBackUrl,
          )}
        </div>
        {!locked && (
          <div className="space-y-5">
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-5 transition-colors ${
                demoConsent
                  ? "border-green-300 bg-green-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <input
                type="checkbox"
                checked={demoConsent}
                disabled={formLocked}
                onChange={(event) => {
                  setDemoConsent(event.target.checked);
                  if (event.target.checked) clearError("demoConsent");
                }}
                className="mt-1 h-6 w-6 shrink-0 cursor-pointer accent-green-600 disabled:cursor-not-allowed"
              />
              <span className="leading-7 text-gray-700">
                Tôi hiểu đây là chức năng mô phỏng và cam kết chỉ sử dụng dữ
                liệu, giấy tờ và hình ảnh mẫu.
                {demoConsent && (
                  <span className="block font-semibold text-green-700">Đã xác nhận</span>
                )}
              </span>
            </label>
            {fieldError("demoConsent")}
            <button
              type="submit"
              disabled={!user?.isPhoneVerified || submitting}
              className={`h-18 rounded-lg ${!user?.isPhoneVerified ? "bg-gray-300 " : "bg-amber-500 hover:bg-amber-600 "} px-10 font-semibold text-white transition-colors disabled:opacity-60`}
            >
              {submitting
                ? "Đang gửi..."
                : identity?.status === "rejected"
                  ? "Gửi lại hồ sơ"
                  : identity?.status === "pending"
                    ? "Lưu cập nhật"
                    : "Gửi hồ sơ xét duyệt"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setDemoConsent(false);
                  setErrors({});
                  setFiles({ idFront: null, idBack: null });
                }}
                className="ml-3 h-18 rounded-lg border border-gray-300 px-8 text-gray-700 hover:bg-gray-50"
              >
                Hủy chỉnh sửa
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

export default IdentityVerification;
