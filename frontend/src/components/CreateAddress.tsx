import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getAddresses } from "../apis/address";
import { Controller, useForm, useWatch } from "react-hook-form";
import Select from "react-select";
import { toast } from "react-toastify";
import axiosInstance from "../configs/axiosInstance";

interface AddressForm {
  province: string;
  district: string;
  ward: string;
  address?: string;
}

function CreateAddress({ onClose }: { onClose: () => void }) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<AddressForm>({
    defaultValues: {
      province: "",
      district: "",
      ward: "",
      address: "",
    },
  });
  const provinceSelected = useWatch({ control, name: "province" });
  const districtSelected = useWatch({ control, name: "district" });
  const { data: dataAddresses } = useQuery({
    queryKey: ["addresses"],
    queryFn: getAddresses,
  });
  const province = dataAddresses?.find((p: any) => p.name === provinceSelected);
  const districts = province?.districts || [];
  const district = districts.find((p: any) => p.name === districtSelected);
  const wards = district?.wards || [];

  const provinceOptions = dataAddresses?.map((a: any) => ({
    value: a.name,
    label: a.name,
  }));
  const districtOptions = districts?.map((a: any) => ({
    value: a.name,
    label: a.name,
  }));
  const wardOptions = wards?.map((a: any) => ({
    value: a.name,
    label: a.name,
  }));

  const createMutation = useMutation({
    mutationFn: (data: AddressForm) =>
      axiosInstance.post("/api/v1/user-addresses", data),
    onSuccess: (res: any) => {
      toast.success(res.data.message);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra! Vui lòng thử lại.",
      );
    },
  });

  const onSubmit = (data: AddressForm) => {
    createMutation.mutateAsync(data);
  };

  return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-[#38383873] z-[100]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        exit={{ opacity: 0, y: 20 }}
        className="w-[90%] md:w-[50rem] lg:w-[50rem] h-auto bg-white shadow-xl rounded-2xl"
      >
        <div className="w-full flex relative border-b border-b-gray-200 pb-5 rounded-tl-2xl rounded-tr-2xl p-5">
          <h4 className="text-[2rem] font-medium w-full text-center">
            Địa chỉ
          </h4>
          <button
            className="ml-auto w-12 h-12  rounded-sm flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors duration-300 text-gray-500 hover:cursor-pointer"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faClose} />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-10 space-y-10">
            <div>
              <Controller
                control={control}
                name="province"
                rules={{ required: "Vui lòng chọn tỉnh, Thành phố" }}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={provinceOptions}
                    placeholder="Tỉnh, Thành phố *"
                    isSearchable
                    value={
                      provinceOptions?.find(
                        (opt: { value: string; label: string }) =>
                          opt.value === field.value,
                      ) || null
                    }
                    onChange={(option) => {
                      field.onChange(option?.value);
                      setValue("district", "");
                      setValue("ward", "");
                    }}
                    styles={{
                      control: (base) => ({
                        ...base,
                        height: "4.6rem",
                        borderRadius: ".8rem",
                      }),
                    }}
                  />
                )}
              />
              {errors.province && (
                <span className="text-red-500 text-[1.4rem]">
                  {errors.province.message}
                </span>
              )}
            </div>
            <div>
              <Controller
                control={control}
                name="district"
                rules={{ required: "Vui lòng chọn Quận, Huyện, Thị xã" }}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={districtOptions}
                    placeholder="Quận, Huyện, Thị xã *"
                    isSearchable
                    value={
                      districtOptions?.find(
                        (opt: { value: string; label: string }) =>
                          opt.value === field.value,
                      ) || null
                    }
                    onChange={(option) => {
                      field.onChange(option?.value);
                      setValue("ward", "");
                    }}
                    styles={{
                      control: (base) => ({
                        ...base,
                        height: "4.6rem",
                        borderRadius: ".8rem",
                      }),
                    }}
                  />
                )}
              />
              {errors.district && (
                <span className="text-red-500 text-[1.4rem]">
                  {errors.district.message}
                </span>
              )}
            </div>
            <div>
              <Controller
                control={control}
                name="ward"
                rules={{ required: "Vui lòng chọn Phường, Xã, Thị trấn" }}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={wardOptions}
                    placeholder="Phường, Xã, Thị trấn *"
                    isSearchable
                    value={
                      wardOptions?.find(
                        (opt: { value: string; label: string }) =>
                          opt.value === field.value,
                      ) || null
                    }
                    onChange={(option) => {
                      field.onChange(option?.value);
                    }}
                    styles={{
                      control: (base) => ({
                        ...base,
                        height: "4.6rem",
                        borderRadius: ".8rem",
                      }),
                    }}
                  />
                )}
              />
              {errors.ward && (
                <span className="text-red-500 text-[1.4rem]">
                  {errors.ward.message}
                </span>
              )}
            </div>
            <input
              type="text"
              id="address"
              placeholder="Địa chỉ cụ thể"
              disabled={
                watch("province") === "" ||
                watch("district") === "" ||
                watch("ward") === ""
              }
              className="w-full h-[4.6rem] rounded-xl border border-gray-300 px-6 outline-none"
              {...register("address")}
            />
          </div>
          <div className="w-full flex border-t border-t-gray-200 p-10">
            <button
              type="submit"
              disabled={isSubmitting || createMutation.isPending}
              className="w-full h-[4.6rem] rounded-xl bg-yellow-500 text-white outline-none hover:bg-yellow-600 hover:cursor-pointer transition-colors duration-300"
            >
              {isSubmitting || createMutation.isPending
                ? "Đang xử lý..."
                : "Thêm"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default CreateAddress;
