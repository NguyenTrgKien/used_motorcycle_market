import { faStore, faUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Select from "react-select";
import { toast } from "react-toastify";
import { getAddresses } from "../../../../apis/address.api";
import axiosInstance from "../../../../configs/axiosInstance";
import { selectStyles } from "../../Post/constants/createPost.constants";

interface AddressWard {
  name: string;
}

interface AddressDistrict {
  name: string;
  wards: AddressWard[];
}

interface AddressProvince {
  name: string;
  districts: AddressDistrict[];
}

interface AddressOption {
  value: string;
  label: string;
}

interface SellerProfile {
  id: number;
  storeName: string;
  description?: string;
  taxCode: string;
  province: string;
  district: string;
  ward?: string;
  addressDetail: string;
  website?: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  rejectedReason?: string;
  businessLicenseUrl: string;
  logoUrl?: string;
  coverUrl?: string;
}

const statusLabels = {
  pending: "Đang chờ xét duyệt",
  approved: "Đã được xác minh",
  rejected: "Đã bị từ chối",
  suspended: "Đã bị đình chỉ",
};

const emptyForm = {
  storeName: "",
  description: "",
  taxCode: "",
  province: "",
  district: "",
  ward: "",
  addressDetail: "",
  website: "",
};

function ProfessionalSeller() {
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [businessLicense, setBusinessLicense] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLocked =
    profile?.status === "pending" || profile?.status === "suspended";
  const isApproved = profile?.status === "approved";
  const isBusinessInformationLocked = isLocked || isApproved;
  const { data: addresses = [], isLoading: isAddressLoading } = useQuery<
    AddressProvince[]
  >({
    queryKey: ["addresses"],
    queryFn: getAddresses,
    staleTime: 24 * 60 * 60 * 1000,
  });
  const districts = useMemo(
    () =>
      addresses.find((province) => province.name === form.province)
        ?.districts || [],
    [addresses, form.province],
  );
  const wards = useMemo(
    () =>
      districts.find((district) => district.name === form.district)?.wards ||
      [],
    [districts, form.district],
  );
  const provinceOptions = useMemo(
    () =>
      addresses.map((province) => ({
        value: province.name,
        label: province.name,
      })),
    [addresses],
  );
  const districtOptions = useMemo(
    () =>
      districts.map((district) => ({
        value: district.name,
        label: district.name,
      })),
    [districts],
  );
  const wardOptions = useMemo(
    () =>
      wards.map((ward) => ({
        value: ward.name,
        label: ward.name,
      })),
    [wards],
  );

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosInstance.get<{ data: SellerProfile | null }>(
          "/api/v1/professional-sellers/me",
        );
        const data = res.data.data;
        setProfile(data);
        if (data) {
          setForm({
            storeName: data.storeName,
            description: data.description || "",
            taxCode: data.taxCode,
            province: data.province,
            district: data.district,
            ward: data.ward || "",
            addressDetail: data.addressDetail,
            website: data.website || "",
          });
        }
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "Không thể tải hồ sơ cửa hàng",
        );
      } finally {
        setIsLoading(false);
      }
    };
    void fetchProfile();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if ((!profile || profile.status === "rejected") && !businessLicense) {
      toast.error("Vui lòng tải giấy phép kinh doanh");
      return;
    }

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (isApproved && !["description", "website"].includes(key)) return;
      if (value) payload.append(key, value);
    });
    if (businessLicense && !isApproved) {
      payload.append("businessLicense", businessLicense);
    }
    if (logo) payload.append("logo", logo);
    if (cover) payload.append("cover", cover);

    try {
      setIsSubmitting(true);
      const res = isApproved
        ? await axiosInstance.patch(
            "/api/v1/professional-sellers/me",
            payload,
            {
              headers: { "Content-Type": "multipart/form-data" },
            },
          )
        : await axiosInstance.post(
            "/api/v1/professional-sellers/application",
            payload,
            {
              headers: { "Content-Type": "multipart/form-data" },
            },
          );
      setProfile(res.data.data);
      toast.success(res.data.message);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể gửi hồ sơ xét duyệt",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-gray-500">Đang tải hồ sơ...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-start gap-4 border-b border-gray-100 pb-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <FontAwesomeIcon icon={faStore} className="text-[2rem]" />
        </div>
        <div>
          <h1 className="text-[2.2rem] font-medium text-gray-900">
            Hồ sơ người bán chuyên
          </h1>
          <p className="mt-1 text-[1.4rem] text-gray-500">
            Đăng ký cửa hàng và xác minh thông tin kinh doanh
          </p>
        </div>
      </div>

      {profile && (
        <div
          className={`mt-6 rounded-xl border p-5 text-[1.4rem] ${
            profile.status === "approved"
              ? "border-green-200 bg-green-50 text-green-700"
              : profile.status === "pending"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <p className="font-semibold">{statusLabels[profile.status]}</p>
          {profile.rejectedReason && (
            <p className="mt-2">Lý do: {profile.rejectedReason}</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-7 space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            label="Tên cửa hàng"
            value={form.storeName}
            disabled={isBusinessInformationLocked}
            required
            onChange={(value) => setForm({ ...form, storeName: value })}
          />
          <TextField
            label="Mã số thuế"
            value={form.taxCode}
            disabled={isLocked || isApproved}
            required
            onChange={(value) => setForm({ ...form, taxCode: value })}
          />
          <AddressSelect
            label="Tỉnh/Thành phố"
            value={form.province}
            options={provinceOptions}
            disabled={isBusinessInformationLocked}
            isLoading={isAddressLoading}
            required
            placeholder="Chọn tỉnh/thành phố"
            onChange={(value) =>
              setForm({
                ...form,
                province: value,
                district: "",
                ward: "",
              })
            }
          />
          <AddressSelect
            label="Quận/Huyện"
            value={form.district}
            options={districtOptions}
            disabled={isBusinessInformationLocked || !form.province}
            required
            placeholder="Chọn quận/huyện"
            onChange={(value) =>
              setForm({ ...form, district: value, ward: "" })
            }
          />
          <AddressSelect
            label="Phường/Xã"
            value={form.ward}
            options={wardOptions}
            disabled={isBusinessInformationLocked || !form.district}
            placeholder="Chọn phường/xã"
            onChange={(value) => setForm({ ...form, ward: value })}
          />
          <TextField
            label="Địa chỉ chi tiết"
            value={form.addressDetail}
            disabled={isBusinessInformationLocked}
            required
            onChange={(value) => setForm({ ...form, addressDetail: value })}
          />
          <TextField
            label="Website"
            type="url"
            value={form.website}
            disabled={isLocked}
            onChange={(value) => setForm({ ...form, website: value })}
          />
        </div>

        <label className="block">
          <span className="mb-2 block text-[1.4rem] font-medium text-gray-700">
            Giới thiệu cửa hàng
          </span>
          <textarea
            value={form.description}
            disabled={isLocked}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
            rows={4}
            className="w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-amber-400 disabled:bg-gray-50"
          />
        </label>

        {!isLocked && (
          <div className="grid gap-5 md:grid-cols-3">
            {!isApproved && (
              <FileField
                label="Giấy phép kinh doanh"
                required={!profile || profile.status === "rejected"}
                file={businessLicense}
                existingUrl={profile?.businessLicenseUrl}
                onChange={setBusinessLicense}
              />
            )}
            <FileField
              label="Logo cửa hàng"
              file={logo}
              existingUrl={profile?.logoUrl}
              onChange={setLogo}
            />
            <FileField
              label="Ảnh bìa cửa hàng"
              file={cover}
              existingUrl={profile?.coverUrl}
              onChange={setCover}
            />
          </div>
        )}

        {!isLocked && (
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-18 items-center rounded-xl bg-amber-500 px-7 font-medium text-white hover:bg-amber-600 disabled:opacity-60"
          >
            {isSubmitting
              ? "Đang lưu..."
              : isApproved
                ? "Cập nhật cửa hàng"
                : "Gửi hồ sơ xét duyệt"}
          </button>
        )}
      </form>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  required,
  disabled,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <label>
      <span className="mb-2 block text-[1.4rem] font-medium text-gray-700">
        {label}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-18 w-full rounded-xl border border-gray-300 px-4 outline-none focus:border-amber-400 disabled:bg-gray-50"
      />
    </label>
  );
}

function AddressSelect({
  label,
  value,
  options,
  onChange,
  required,
  disabled,
  isLoading,
  placeholder,
}: {
  label: string;
  value: string;
  options: AddressOption[];
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder: string;
}) {
  const selectedOption =
    options.find((option) => option.value === value) ||
    (value ? { value, label: value } : null);

  return (
    <label>
      <span className="mb-2 block text-[1.4rem] font-medium text-gray-700">
        {label}
        {required ? " *" : ""}
      </span>
      <Select<AddressOption>
        options={options}
        value={selectedOption}
        onChange={(option) => onChange(option?.value || "")}
        isDisabled={disabled}
        isLoading={isLoading}
        isSearchable
        isClearable={!required}
        placeholder={placeholder}
        styles={selectStyles}
      />
      {required && (
        <input value={value} required readOnly className="sr-only" />
      )}
    </label>
  );
}

function FileField({
  label,
  onChange,
  required,
  file,
  existingUrl,
}: {
  label: string;
  onChange: (file: File | null) => void;
  required?: boolean;
  file: File | null;
  existingUrl?: string;
}) {
  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : existingUrl),
    [file, existingUrl],
  );

  useEffect(() => {
    return () => {
      if (file && previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [file, previewUrl]);

  return (
    <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 p-4 text-center hover:border-amber-400">
      {previewUrl ? (
        <img
          src={previewUrl}
          alt={label}
          className="h-32 w-full rounded-lg object-cover"
        />
      ) : (
        <FontAwesomeIcon icon={faUpload} className="text-amber-500" />
      )}
      <span className="mt-2 text-[1.3rem] text-gray-600">
        {label}
        {required ? " *" : ""}
      </span>
      <span className="mt-1 max-w-full truncate text-[1.2rem] text-gray-400">
        {file?.name || (existingUrl ? "Ảnh hiện tại" : "Chọn ảnh để tải lên")}
      </span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
      />
    </label>
  );
}

export default ProfessionalSeller;
