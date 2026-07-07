import {
  faArrowLeft,
  faCalculator,
  faChevronDown,
  faCircleQuestion,
  faImage,
  faPaperPlane,
  faRobot,
  faStar,
  faTrash,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import { toast } from "react-toastify";
import { getAddresses } from "../../../apis/address.api";
import { updateCreatePostGuideSeen } from "../../../apis/user.api";
import axiosInstance from "../../../configs/axiosInstance";
import type { CategoryOption, ListingPost } from "./post.types";
import FullscreenLoader from "../../../components/FullscreenLoader";
import { useUser } from "../../../hooks/useUser";
import {
  YearPickerButton,
  YearPickerPopup,
} from "../../../components/YearPicker";
import CreatePostGuideModal from "./components/CreatePostGuideModal";
import Field from "./components/Field";
import {
  bodyTypeOptions,
  conditionOptions,
  fuelTypeOptions,
  initialForm,
  selectStyles,
  transmissionOptions,
} from "./constants/createPost.constants";
import { formatPriceInput, getPriceDigits } from "./helpers/price";
import type {
  AddressOption,
  AiSuggestion,
  CreatePostForm,
  PriceSuggestion,
  SelectOption,
  YearFieldName,
} from "./types/createPost.types";

function CreatePost() {
  const navigate = useNavigate();
  const { slug: editSlug } = useParams();
  const queryClient = useQueryClient();
  const { user, isLoading: isUserLoading } = useUser();
  const isEditing = Boolean(editSlug);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [editingPost, setEditingPost] = useState<ListingPost | null>(null);
  const [isPostLoading, setIsPostLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [documentImages, setDocumentImages] = useState<File[]>([]);
  const [priceDisplay, setPriceDisplay] = useState("");
  const [showAdditionalVehicleInfo, setShowAdditionalVehicleInfo] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imageActionId, setImageActionId] = useState<number | null>(null);
  const [showCreatePostGuide, setShowCreatePostGuide] = useState(false);
  const [dontShowGuideAgain, setDontShowGuideAgain] = useState(true);
  const [guideDismissedThisSession, setGuideDismissedThisSession] =
    useState(false);
  const [activeYearPicker, setActiveYearPicker] =
    useState<YearFieldName | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
  const [isPricing, setIsPricing] = useState(false);
  const [priceSuggestion, setPriceSuggestion] =
    useState<PriceSuggestion | null>(null);
  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    setError,
    clearErrors,
    trigger,
    setFocus,
    getFieldState,
    reset,
    formState: { errors },
  } = useForm<CreatePostForm>({
    defaultValues: initialForm,
    mode: "onChange",
    reValidateMode: "onChange",
  });
  const previews = useMemo(
    () => images.map((image) => URL.createObjectURL(image)),
    [images],
  );
  const documentPreviews = useMemo(
    () => documentImages.map((image) => URL.createObjectURL(image)),
    [documentImages],
  );
  const existingImages = useMemo(
    () =>
      [...(editingPost?.post_images || [])].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      ),
    [editingPost],
  );
  const existingDocumentImages = editingPost?.vehicle?.documentImages || [];
  const provinceSelected = useWatch({ control, name: "province" });
  const districtSelected = useWatch({ control, name: "district" });
  const manufactureYearSelected = useWatch({
    control,
    name: "manufactureYear",
  });
  const registrationYearSelected = useWatch({
    control,
    name: "registrationYear",
  });
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - 1969 }, (_, index) =>
      String(currentYear - index),
    );
  }, []);
  const { data: addresses = [] } = useQuery<AddressOption[]>({
    queryKey: ["addresses"],
    queryFn: getAddresses,
  });
  const selectedProvince = addresses.find(
    (province) => province.name === provinceSelected,
  );
  const districts = selectedProvince?.districts || [];
  const selectedDistrict = districts.find(
    (district) => district.name === districtSelected,
  );
  const wards = selectedDistrict?.wards || [];
  const provinceOptions = addresses.map((province) => ({
    value: province.name,
    label: province.name,
  }));
  const districtOptions = districts.map((district) => ({
    value: district.name,
    label: district.name,
  }));
  const wardOptions = wards.map((ward) => ({
    value: ward.name,
    label: ward.name,
  }));

  const buildFormFromPost = (post: ListingPost): CreatePostForm => ({
    categoryId: post.category?.id ? String(post.category.id) : "",
    title: post.title || "",
    description: post.description || "",
    price: post.price ? String(post.price) : "",
    province: post.province || "",
    district: post.district || "",
    ward: post.ward || "",
    addressDetail: post.addressDetail || "",
    brandName: post.vehicle?.brandName || "",
    modelName: post.vehicle?.modelName || "",
    bodyType: post.vehicle?.bodyType || "",
    manufactureYear: post.vehicle?.manufactureYear
      ? String(post.vehicle.manufactureYear)
      : "",
    registrationYear: post.vehicle?.registrationYear
      ? String(post.vehicle.registrationYear)
      : "",
    mileage: post.vehicle?.mileage ? String(post.vehicle.mileage) : "",
    color: post.vehicle?.color || "",
    condition: post.vehicle?.condition || "used",
    engineCapacity: post.vehicle?.engineCapacity || "",
    enginePower: post.vehicle?.enginePower || "",
    batteryCapacity: post.vehicle?.batteryCapacity || "",
    rangePerCharge: post.vehicle?.rangePerCharge || "",
    licensePlate: post.vehicle?.licensePlate || "",
    fuelType: post.vehicle?.fuelType || "gasoline",
    transmission: post.vehicle?.transmission || "automatic",
    origin: post.vehicle?.origin || "",
    documentsStatus: post.vehicle?.documentsStatus || "",
    seatCount: post.vehicle?.seatCount ? String(post.vehicle.seatCount) : "",
    doorCount: post.vehicle?.doorCount ? String(post.vehicle.doorCount) : "",
    payloadKg: post.vehicle?.payloadKg ? String(post.vehicle.payloadKg) : "",
    grossWeightKg: post.vehicle?.grossWeightKg
      ? String(post.vehicle.grossWeightKg)
      : "",
    wheelCount: post.vehicle?.wheelCount ? String(post.vehicle.wheelCount) : "",
  });

  const applyPrice = (digits: string) => {
    setValue("price", digits, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setPriceDisplay(formatPriceInput(digits));
  };

  const handlePriceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    applyPrice(getPriceDigits(event.target.value));
  };

  const handleApplySuggestedPrice = () => {
    if (!priceSuggestion) return;

    applyPrice(String(priceSuggestion.suggestedPrice));
  };

  const handleSelectYear = (field: YearFieldName, year: string) => {
    setValue(field, year, {
      shouldDirty: true,
      shouldValidate: true,
    });
    void trigger(
      field === "manufactureYear" ? "registrationYear" : "manufactureYear",
    );
    setActiveYearPicker(null);
  };

  const handleClearYear = (field: YearFieldName) => {
    setValue(field, "", {
      shouldDirty: true,
      shouldValidate: true,
    });
    void trigger(
      field === "manufactureYear" ? "registrationYear" : "manufactureYear",
    );
  };

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [previews]);

  useEffect(() => {
    return () => {
      documentPreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [documentPreviews]);

  useEffect(() => {
    if (
      !isEditing &&
      !isUserLoading &&
      user &&
      !user.hasSeenCreatePostGuide &&
      !guideDismissedThisSession
    ) {
      setShowCreatePostGuide(true);
      setDontShowGuideAgain(true);
    }
  }, [guideDismissedThisSession, isEditing, isUserLoading, user]);

  useEffect(() => {
    if (!isEditing || !editSlug) return;

    const fetchPostForEdit = async () => {
      try {
        setIsPostLoading(true);
        const res = await axiosInstance.get<{ data: ListingPost }>(
          `/api/v1/posts/${editSlug}`,
        );
        const postData = res.data.data;

        if (!isUserLoading && user && postData.user?.id !== user.id) {
          toast.error("Bạn không có quyền sửa tin này");
          navigate(`/posts/${postData.slug}`, { replace: true });
          return;
        }

        setEditingPost(postData);
        reset(buildFormFromPost(postData));
        setPriceDisplay(formatPriceInput(String(postData.price || "")));
        setShowAdditionalVehicleInfo(true);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Không thể tải tin đăng");
        navigate("/posts/manage", { replace: true });
      } finally {
        setIsPostLoading(false);
      }
    };

    if (!isUserLoading) void fetchPostForEdit();
  }, [editSlug, isEditing, isUserLoading, navigate, reset, user]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosInstance.get<{ data: CategoryOption[] }>(
          "/api/v1/categories",
        );

        const items = res.data.data || [];
        setCategories(items);
        if (items[0] && !getValues("categoryId")) {
          setValue("categoryId", String(items[0].id), {
            shouldValidate: false,
          });
          clearErrors("categoryId");
        }
      } catch {
        toast.error("Không thể tải danh mục");
      }
    };

    void fetchCategories();
  }, [clearErrors, getValues, setValue]);

  const handleImages = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []).slice(0, 12);
    const files = selectedFiles.filter((file) => file.size <= 10 * 1024 * 1024);

    if (files.length < selectedFiles.length) {
      toast.warning("Một số ảnh vượt quá 10MB và đã bị bỏ qua");
    }

    setImages(files);
    setAiSuggestion(null);
    if (files.length) {
      clearErrors("root.images");
    }
  };

  const handleDocumentImages = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const files = selectedFiles.slice(0, 4);

    if (selectedFiles.length > 4) {
      toast.warning("Chỉ nên tải tối đa 4 ảnh giấy tờ xe");
    }

    setDocumentImages(files);
    setValue("documentsStatus", files.length ? "Đã tải ảnh giấy tờ xe" : "", {
      shouldDirty: true,
      shouldValidate: true,
    });
    event.target.value = "";
  };

  const handleAnalyzeImages = async () => {
    if (!images.length) {
      toast.error("Vui lòng chọn hình ảnh xe trước");
      return;
    }

    const formData = new FormData();
    images.forEach((image) => formData.append("images", image));

    try {
      setIsAnalyzing(true);
      const res = await axiosInstance.post(
        "/api/v1/posts/analyze-images",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      console.log(res);

      const data = res.data.data || {};
      Object.entries(data).forEach(([key, value]) => {
        if (
          key in initialForm &&
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          setValue(key as keyof CreatePostForm, String(value), {
            shouldDirty: true,
            shouldValidate: true,
          });
          if (key === "price") {
            setPriceDisplay(formatPriceInput(String(value)));
          }
        }
      });
      setAiSuggestion({
        confidence: data.confidence,
        notes: data.notes,
      });
      toast.success(res.data.message || "AI đã phân tích ảnh xe");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể phân tích ảnh");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const pricingFields: Array<keyof CreatePostForm> = [
    "brandName",
    "modelName",
    "bodyType",
    "manufactureYear",
    "registrationYear",
    "mileage",
    "condition",
    "fuelType",
    "transmission",
    "province",
  ];

  const scrollToField = (field: keyof CreatePostForm) => {
    setFocus(field);
    window.setTimeout(() => {
      const fieldElement = document.querySelector(
        `[data-form-field="${field}"]`,
      );
      const target =
        fieldElement instanceof HTMLElement
          ? fieldElement
          : document.activeElement;

      if (target instanceof HTMLElement) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 0);
  };

  const handleOpenCreatePostGuide = () => {
    setDontShowGuideAgain(false);
    setShowCreatePostGuide(true);
  };

  const handleCloseCreatePostGuide = async () => {
    if (dontShowGuideAgain) {
      setGuideDismissedThisSession(true);
      queryClient.setQueryData(["user"], (currentUser: typeof user) =>
        currentUser
          ? { ...currentUser, hasSeenCreatePostGuide: true }
          : currentUser,
      );

      try {
        await updateCreatePostGuideSeen(true);
      } catch {
        toast.error("Không thể lưu trạng thái hướng dẫn");
        queryClient.invalidateQueries({ queryKey: ["user"] });
      }
    }

    setShowCreatePostGuide(false);
  };

  const handleSuggestPrice = async () => {
    const isValid = await trigger(pricingFields);
    if (!isValid) {
      const firstInvalidField = pricingFields.find(
        (field) => getFieldState(field).invalid,
      );
      if (firstInvalidField) {
        scrollToField(firstInvalidField);
      }
      toast.error("Vui lòng bổ sung thông tin xe trước khi định giá");
      return;
    }

    const values = getValues();
    if (!values.manufactureYear && !values.registrationYear) {
      scrollToField("manufactureYear");
      toast.error("Vui lòng nhập năm sản xuất hoặc năm đăng ký");
      return;
    }

    const pricingPayload: Partial<CreatePostForm> = {};
    const suggestPriceFields: Array<keyof CreatePostForm> = [
      "brandName",
      "modelName",
      "bodyType",
      "manufactureYear",
      "registrationYear",
      "mileage",
      "color",
      "condition",
      "engineCapacity",
      "enginePower",
      "batteryCapacity",
      "rangePerCharge",
      "fuelType",
      "transmission",
      "origin",
      "documentsStatus",
      "seatCount",
      "doorCount",
      "wheelCount",
      "payloadKg",
      "grossWeightKg",
      "province",
    ];

    suggestPriceFields.forEach((field) => {
      const value = values[field];
      if (value !== "") {
        pricingPayload[field] = value;
      }
    });

    try {
      setIsPricing(true);
      const res = await axiosInstance.post(
        "/api/v1/posts/suggest-price",
        pricingPayload,
      );
      console.log(res);

      const data = res.data.data;
      setPriceSuggestion(data);
      toast.success(res.data.message || "AI đã gợi ý giá xe");
      if (!getValues("color")) {
        toast.info("Bổ sung màu sắc xe giúp AI định giá chính xác hơn");
      }
    } catch (error: any) {
      console.log(error.response);
      toast.error(error?.response?.data?.message || "Không thể gợi ý giá xe");
    } finally {
      setIsPricing(false);
    }
  };

  const handleSetPrimaryImage = async (imageId: number) => {
    if (!editingPost) return;

    try {
      setImageActionId(imageId);
      const res = await axiosInstance.patch(
        `/api/v1/posts/${editingPost.id}/images/${imageId}/primary`,
      );
      setEditingPost((currentPost) =>
        currentPost
          ? {
              ...currentPost,
              status: "pending",
              post_images: currentPost.post_images?.map((image) => ({
                ...image,
                isPrimary: image.id === imageId,
              })),
            }
          : currentPost,
      );
      toast.success(res.data.message || "Đã cập nhật ảnh đại diện");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể cập nhật ảnh đại diện",
      );
    } finally {
      setImageActionId(null);
    }
  };

  const handleDeleteExistingImage = async (imageId: number) => {
    if (!editingPost) return;
    if (existingImages.length <= 1) {
      toast.error("Tin đăng cần tối thiểu một hình ảnh");
      return;
    }
    if (!window.confirm("Bạn có chắc muốn xóa ảnh này?")) return;

    try {
      setImageActionId(imageId);
      const deletedImage = existingImages.find((image) => image.id === imageId);
      const res = await axiosInstance.delete(
        `/api/v1/posts/${editingPost.id}/images/${imageId}`,
      );
      setEditingPost((currentPost) => {
        if (!currentPost) return currentPost;

        const remainingImages = [...(currentPost.post_images || [])]
          .filter((image) => image.id !== imageId)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((image, index) => ({
            ...image,
            sortOrder: index,
            isPrimary:
              deletedImage?.isPrimary && index === 0 ? true : image.isPrimary,
          }));

        return {
          ...currentPost,
          status: "pending",
          post_images: remainingImages,
        };
      });
      toast.success(res.data.message || "Đã xóa hình ảnh");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể xóa hình ảnh");
    } finally {
      setImageActionId(null);
    }
  };

  const onSubmit = async (values: CreatePostForm) => {
    if (isEditing && !editingPost) {
      toast.error("Không tìm thấy tin cần cập nhật");
      return;
    }

    if (!isEditing && !images.length) {
      setError("root.images", {
        message: "Vui lòng chọn ít nhất một hình ảnh",
      });
      return;
    }

    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== "") formData.append(key, value);
    });
    images.forEach((image) => formData.append("images", image));
    documentImages.forEach((image) => formData.append("documentImages", image));

    try {
      setIsSubmitting(true);
      const res =
        isEditing && editingPost
          ? await axiosInstance.patch(`/api/v1/posts/${editingPost.id}`, formData, {
              headers: { "Content-Type": "multipart/form-data" },
            })
          : await axiosInstance.post("/api/v1/posts", formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
      toast.success(
        res.data.message ||
          (isEditing ? "Cập nhật tin thành công" : "Đăng tin thành công"),
      );
      navigate("/posts/manage");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          (isEditing ? "Không thể cập nhật tin" : "Không thể đăng tin"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing && (isPostLoading || !editingPost)) {
    return (
      <div className="px-[10rem] pt-[9rem] text-center text-gray-500">
        Đang tải tin đăng...
      </div>
    );
  }

  return (
    <div className="px-[10rem] pt-[9rem] pb-16">
      <div className="bg-white rounded-xl p-10">
        <div className="mb-6 flex items-center gap-6">
          <button
            type="button"
            onClick={() => navigate("/posts/manage")}
            className="flex h-16 items-center gap-3 rounded-xl border border-gray-300 px-5 text-gray-700 transition-colors hover:bg-gray-50"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div className="flex flex-1 items-center justify-between gap-4">
            <h1 className="text-[2.2rem] font-semibold text-gray-900 uppercase">
              {isEditing ? "Sửa tin xe" : "Đăng tin xe"}
            </h1>
            {!isEditing && (
              <button
                type="button"
                onClick={handleOpenCreatePostGuide}
                className="flex h-16 items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 text-[1.4rem] font-medium text-amber-700 transition-colors hover:bg-amber-100"
              >
                <FontAwesomeIcon icon={faCircleQuestion} />
                Hướng dẫn
              </button>
            )}
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
        >
          <div className="space-y-6">
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-5 text-[1.8rem] font-medium text-gray-900">
                {isEditing ? "Hình ảnh xe" : "Hình ảnh AI phân tích"}
              </h2>
              {existingImages.length > 0 && (
                <div className="mb-4 grid grid-cols-3 gap-3 md:grid-cols-4">
                  {existingImages.map((image) => (
                    <div
                      key={image.id}
                      className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                    >
                      <img
                        src={image.imageUrl}
                        alt={editingPost?.title || "Ảnh xe"}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute left-2 top-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => void handleSetPrimaryImage(image.id)}
                          disabled={image.isPrimary || imageActionId !== null}
                          className={`flex h-9 w-9 items-center justify-center rounded-lg border text-[1.2rem] transition-colors ${
                            image.isPrimary
                              ? "border-amber-400 bg-amber-500 text-white"
                              : "border-white/70 bg-white/90 text-gray-600 hover:bg-amber-50 hover:text-amber-600"
                          } disabled:cursor-not-allowed`}
                          title={
                            image.isPrimary
                              ? "Ảnh đại diện"
                              : "Đặt làm ảnh đại diện"
                          }
                        >
                          <FontAwesomeIcon icon={faStar} />
                        </button>
                      </div>
                      {existingImages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => void handleDeleteExistingImage(image.id)}
                          disabled={imageActionId !== null}
                          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-lg border border-white/70 bg-white/90 text-[1.2rem] text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed"
                          title="Xóa ảnh"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <label className="flex h-[18rem] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 text-gray-500 transition-colors hover:border-amber-400 hover:bg-amber-50">
                <FontAwesomeIcon icon={faImage} className="text-[2.6rem]" />
                <span className="mt-3">
                  {isEditing ? "Chọn thêm tối đa 12 ảnh" : "Chọn tối đa 12 ảnh"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImages}
                  className="hidden"
                />
              </label>
              {errors.root?.images?.message && (
                <p className="mt-2 text-[1.3rem] text-red-500">
                  {errors.root.images.message}
                </p>
              )}
              {previews.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-3 md:grid-cols-4">
                  {previews.map((preview, index) => (
                    <img
                      key={preview}
                      src={preview}
                      alt={`preview-${index}`}
                      className="aspect-square rounded-lg border border-gray-200 object-cover"
                    />
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => void handleAnalyzeImages()}
                disabled={
                  !images.length || isAnalyzing || isSubmitting || isPricing
                }
                className="mt-4 flex h-[4.6rem] w-full items-center justify-center gap-3 rounded-xl border border-amber-300 bg-amber-50 font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <FontAwesomeIcon icon={faWandMagicSparkles} />
                {isAnalyzing ? "AI đang phân tích..." : "Phân tích ảnh bằng AI"}
              </button>
              {aiSuggestion && (
                <div className="mt-4 rounded-xl border border-green-100 bg-green-50 p-4 text-[1.4rem] text-green-700">
                  <div className="flex items-center gap-2 font-medium">
                    <FontAwesomeIcon icon={faRobot} />
                    AI đã tự điền thông tin vào form
                  </div>
                  {typeof aiSuggestion.confidence === "number" && (
                    <p className="mt-2">
                      Độ tin cậy: {Math.round(aiSuggestion.confidence * 100)}%
                    </p>
                  )}
                  {aiSuggestion.notes?.length ? (
                    <div className="mt-2 space-y-1">
                      {aiSuggestion.notes.map((note) => (
                        <p key={note}>{note}</p>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-5 text-[1.8rem] font-medium text-gray-900">
                Thông tin tin đăng
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Danh mục"
                  required
                  className="col-span-2"
                  error={errors.categoryId?.message}
                >
                  <select
                    {...register("categoryId", {
                      required: "Vui lòng chọn danh mục",
                    })}
                    className="field-input"
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="Tiêu đề"
                  required
                  className="col-span-2"
                  error={errors.title?.message}
                >
                  <input
                    {...register("title", {
                      required: "Vui lòng nhập tiêu đề",
                      validate: (value) =>
                        value.trim().length > 0 || "Vui lòng nhập tiêu đề",
                    })}
                    className="field-input"
                    placeholder="Ví dụ: Honda SH 150i 2022 chính chủ"
                  />
                </Field>
                <Field label="Mô tả" className="col-span-2">
                  <textarea
                    {...register("description")}
                    className="field-input min-h-[14rem] py-4"
                    placeholder="Tình trạng xe, lịch sử bảo dưỡng, giấy tờ, lý do bán..."
                  />
                </Field>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-5 text-[1.8rem] font-medium text-gray-900">
                Thông tin xe
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <Field
                  label="Loại xe"
                  required
                  error={errors.bodyType?.message}
                >
                  <select
                    {...register("bodyType", {
                      required: "Vui lòng chọn loại xe",
                    })}
                    className="field-input"
                  >
                    <option value="">Chọn loại xe</option>
                    {bodyTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="Hãng xe"
                  required
                  error={errors.brandName?.message}
                >
                  <input
                    {...register("brandName", {
                      required: "Vui lòng nhập hãng xe",
                      validate: (value) =>
                        value.trim().length > 0 || "Vui lòng nhập hãng xe",
                    })}
                    className="field-input"
                    placeholder="Honda, Toyota..."
                  />
                </Field>
                <Field
                  label="Dòng xe"
                  required
                  error={errors.modelName?.message}
                >
                  <input
                    {...register("modelName", {
                      required: "Vui lòng nhập dòng xe",
                      validate: (value) =>
                        value.trim().length > 0 || "Vui lòng nhập dòng xe",
                    })}
                    className="field-input"
                    placeholder="SH, Vios, Fuso..."
                  />
                </Field>
                <Field label="Năm sản xuất">
                  <div data-form-field="manufactureYear">
                    <input
                      {...register("manufactureYear", {
                        validate: (value) =>
                          value || getValues("registrationYear")
                            ? true
                            : "Vui lòng nhập năm sản xuất hoặc năm đăng ký",
                      })}
                      type="hidden"
                    />
                    <YearPickerButton
                      value={manufactureYearSelected}
                      placeholder="Chọn năm sản xuất"
                      onOpen={() => setActiveYearPicker("manufactureYear")}
                      onClear={() => handleClearYear("manufactureYear")}
                    />
                  </div>
                  {errors.manufactureYear?.message && (
                    <p className="mt-2 text-[1.3rem] text-red-500">
                      {errors.manufactureYear.message}
                    </p>
                  )}
                </Field>
                <Field label="Năm đăng ký">
                  <div data-form-field="registrationYear">
                    <input
                      {...register("registrationYear", {
                        validate: (value) =>
                          value || getValues("manufactureYear")
                            ? true
                            : "Vui lòng nhập năm sản xuất hoặc năm đăng ký",
                      })}
                      type="hidden"
                    />
                    <YearPickerButton
                      value={registrationYearSelected}
                      placeholder="Chọn năm đăng ký"
                      onOpen={() => setActiveYearPicker("registrationYear")}
                      onClear={() => handleClearYear("registrationYear")}
                    />
                  </div>
                  {errors.registrationYear?.message && (
                    <p className="mt-2 text-[1.3rem] text-red-500">
                      {errors.registrationYear.message}
                    </p>
                  )}
                </Field>
                <Field label="Số km">
                  <input
                    {...register("mileage", {
                      required: "Vui lòng nhập số km",
                      validate: (value) =>
                        Number(value) >= 0 || "Số km không hợp lệ",
                    })}
                    type="number"
                    className="field-input"
                  />
                  {errors.mileage?.message && (
                    <p className="mt-2 text-[1.3rem] text-red-500">
                      {errors.mileage.message}
                    </p>
                  )}
                </Field>
                <Field label="Nhiên liệu">
                  <select
                    {...register("fuelType", {
                      required: "Vui lòng chọn nhiên liệu",
                    })}
                    className="field-input"
                  >
                    {fuelTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.fuelType?.message && (
                    <p className="mt-2 text-[1.3rem] text-red-500">
                      {errors.fuelType.message}
                    </p>
                  )}
                </Field>
                <Field label="Hộp số">
                  <select
                    {...register("transmission", {
                      required: "Vui lòng chọn hộp số",
                    })}
                    className="field-input"
                  >
                    {transmissionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.transmission?.message && (
                    <p className="mt-2 text-[1.3rem] text-red-500">
                      {errors.transmission.message}
                    </p>
                  )}
                </Field>
                <Field label="Tình trạng">
                  <select
                    {...register("condition", {
                      required: "Vui lòng chọn tình trạng xe",
                    })}
                    className="field-input"
                  >
                    {conditionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.condition?.message && (
                    <p className="mt-2 text-[1.3rem] text-red-500">
                      {errors.condition.message}
                    </p>
                  )}
                </Field>
                <button
                  type="button"
                  onClick={() =>
                    setShowAdditionalVehicleInfo(
                      (currentValue) => !currentValue,
                    )
                  }
                  aria-expanded={showAdditionalVehicleInfo}
                  className="col-span-3 flex h-[4.6rem] items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 text-[1.4rem] font-medium text-gray-700 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                >
                  <span>Thông tin khác</span>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`transition-transform ${
                      showAdditionalVehicleInfo ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {showAdditionalVehicleInfo && (
                  <>
                    <Field label="Màu sắc">
                      <input {...register("color")} className="field-input" />
                    </Field>
                    <Field label="Dung tích động cơ">
                      <input
                        {...register("engineCapacity")}
                        className="field-input"
                        placeholder="150cc, 2.0L..."
                      />
                    </Field>
                    <Field label="Công suất">
                      <input
                        {...register("enginePower")}
                        className="field-input"
                      />
                    </Field>
                    <Field label="Dung lượng pin">
                      <input
                        {...register("batteryCapacity")}
                        className="field-input"
                      />
                    </Field>
                    <Field label="Quãng đường mỗi lần sạc">
                      <input
                        {...register("rangePerCharge")}
                        className="field-input"
                      />
                    </Field>
                    <Field label="Biển số">
                      <input
                        {...register("licensePlate")}
                        className="field-input"
                      />
                    </Field>
                    <Field label="Số ghế">
                      <input
                        {...register("seatCount", {
                          validate: (value) =>
                            !value ||
                            Number(value) >= 0 ||
                            "Giá trị không hợp lệ",
                        })}
                        type="number"
                        min={0}
                        className="field-input"
                      />
                    </Field>
                    <Field label="Số cửa">
                      <input
                        {...register("doorCount", {
                          validate: (value) =>
                            !value ||
                            Number(value) >= 0 ||
                            "Giá trị không hợp lệ",
                        })}
                        type="number"
                        min={0}
                        className="field-input"
                      />
                    </Field>
                    <Field label="Số bánh">
                      <input
                        {...register("wheelCount", {
                          validate: (value) =>
                            !value ||
                            Number(value) >= 0 ||
                            "Giá trị không hợp lệ",
                        })}
                        type="number"
                        min={0}
                        className="field-input"
                      />
                    </Field>
                    <Field label="Tải trọng kg">
                      <input
                        {...register("payloadKg", {
                          validate: (value) =>
                            !value ||
                            Number(value) >= 0 ||
                            "Giá trị không hợp lệ",
                        })}
                        type="number"
                        min={0}
                        className="field-input"
                      />
                    </Field>
                    <Field label="Trọng lượng toàn bộ kg">
                      <input
                        {...register("grossWeightKg", {
                          validate: (value) =>
                            !value ||
                            Number(value) >= 0 ||
                            "Giá trị không hợp lệ",
                        })}
                        type="number"
                        min={0}
                        className="field-input"
                      />
                    </Field>
                    <Field label="Xuất xứ">
                      <input {...register("origin")} className="field-input" />
                    </Field>
                  </>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-5 text-[1.8rem] font-medium text-gray-900">
                Giấy tờ xe
              </h2>
              <input {...register("documentsStatus")} type="hidden" />
              {existingDocumentImages.length > 0 && (
                <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {existingDocumentImages.map((image) => (
                    <img
                      key={image.publicId || image.url}
                      src={image.url}
                      alt="Ảnh giấy tờ xe"
                      className="aspect-square rounded-lg border border-gray-200 object-cover"
                    />
                  ))}
                </div>
              )}
              <label className="flex h-[12rem] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 text-gray-500 transition-colors hover:border-amber-400 hover:bg-amber-50">
                <FontAwesomeIcon icon={faImage} className="text-[2.2rem]" />
                <span className="mt-3">
                  {isEditing
                    ? "Chọn ảnh giấy tờ mới"
                    : "Chọn tối đa 4 ảnh giấy tờ xe"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleDocumentImages}
                  className="hidden"
                />
              </label>
              {documentPreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {documentPreviews.map((preview, index) => (
                    <img
                      key={preview}
                      src={preview}
                      alt={`document-preview-${index}`}
                      className="aspect-square rounded-lg border border-gray-200 object-cover"
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-5 text-[1.8rem] font-medium text-gray-900">
                Giá bán xe AI định giá
              </h2>
              <Field label="Giá bán" required error={errors.price?.message}>
                <div className="flex flex-col gap-3 2xl:flex-row">
                  <input
                    {...register("price", {
                      required: "Vui lòng nhập giá bán",
                      validate: (value) =>
                        Number(value) > 0 || "Giá bán phải lớn hơn 0",
                    })}
                    type="text"
                    inputMode="numeric"
                    value={priceDisplay}
                    onChange={handlePriceChange}
                    className="field-input"
                    placeholder="Ví dụ: 45000000"
                  />
                  <button
                    type="button"
                    onClick={() => void handleSuggestPrice()}
                    disabled={isPricing || isSubmitting || isAnalyzing}
                    className="flex h-[4.6rem] shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 text-[1.4rem] font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <FontAwesomeIcon icon={faCalculator} />
                    {isPricing ? "Đang định giá..." : "AI gợi ý"}
                  </button>
                </div>
                {priceSuggestion && (
                  <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 p-4 text-[1.3rem] text-amber-800">
                    <p className="font-medium">
                      Khoảng giá:{" "}
                      {priceSuggestion.minPrice.toLocaleString("vi-VN")} -{" "}
                      {priceSuggestion.maxPrice.toLocaleString("vi-VN")} đ
                    </p>
                    <p className="mt-1">
                      Giá đề xuất:{" "}
                      {priceSuggestion.suggestedPrice.toLocaleString("vi-VN")} đ
                    </p>
                    <p className="mt-1">
                      Độ tin cậy: {Math.round(priceSuggestion.confidence * 100)}
                      %
                    </p>
                    <button
                      type="button"
                      onClick={handleApplySuggestedPrice}
                      className="mt-3 h-[3.8rem] rounded-xl bg-amber-500 px-4 text-[1.3rem] font-medium text-white transition-colors hover:bg-amber-600"
                    >
                      Áp dụng giá đề xuất
                    </button>
                    <p className="mt-2 text-amber-700">
                      {priceSuggestion.reason}
                    </p>
                    <p className="mt-2 text-[1.3rem] text-amber-700">
                      {priceSuggestion.missingFields?.length
                        ? `Hãy bổ sung ${priceSuggestion.missingFields.join(
                            ", ",
                          )} để AI có thể định giá chính xác hơn.`
                        : "Hãy cung cấp đầy đủ thông tin để AI có thể định giá chính xác hơn."}
                    </p>
                    {priceSuggestion.comparablesUsed ? (
                      <p className="mt-1">
                        Đã tham khảo {priceSuggestion.comparablesUsed} tin tương
                        tự
                      </p>
                    ) : null}
                  </div>
                )}
              </Field>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-5 text-[1.8rem] font-medium text-gray-900">
                Địa điểm xem xe
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <Field
                  label="Tỉnh/Thành phố"
                  required
                  error={errors.province?.message}
                >
                  <Controller
                    control={control}
                    name="province"
                    rules={{ required: "Vui lòng chọn tỉnh/thành phố" }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={provinceOptions}
                        placeholder="Chọn tỉnh/thành phố"
                        isSearchable
                        value={
                          provinceOptions.find(
                            (option: SelectOption) =>
                              option.value === field.value,
                          ) || null
                        }
                        onChange={(option) => {
                          field.onChange(option?.value || "");
                          setValue("district", "", {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                          setValue("ward", "", {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }}
                        styles={selectStyles}
                      />
                    )}
                  />
                </Field>
                <Field label="Quận/Huyện">
                  <Controller
                    control={control}
                    name="district"
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={districtOptions}
                        placeholder="Chọn quận/huyện"
                        isSearchable
                        isDisabled={!provinceSelected}
                        value={
                          districtOptions.find(
                            (option: SelectOption) =>
                              option.value === field.value,
                          ) || null
                        }
                        onChange={(option) => {
                          field.onChange(option?.value || "");
                          setValue("ward", "", {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }}
                        styles={selectStyles}
                      />
                    )}
                  />
                </Field>
                <Field label="Phường/Xã">
                  <Controller
                    control={control}
                    name="ward"
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={wardOptions}
                        placeholder="Chọn phường/xã"
                        isSearchable
                        isDisabled={!districtSelected}
                        value={
                          wardOptions.find(
                            (option: SelectOption) =>
                              option.value === field.value,
                          ) || null
                        }
                        onChange={(option) =>
                          field.onChange(option?.value || "")
                        }
                        styles={selectStyles}
                      />
                    )}
                  />
                </Field>
                <Field label="Địa chỉ chi tiết">
                  <input
                    {...register("addressDetail")}
                    className="field-input"
                  />
                </Field>
              </div>
            </section>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-[5rem] w-full items-center justify-center gap-3 rounded-xl bg-amber-500 font-medium text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              <FontAwesomeIcon icon={faPaperPlane} />
              {isSubmitting
                ? isEditing
                  ? "Đang cập nhật..."
                  : "Đang đăng tin..."
                : isEditing
                  ? "Cập nhật tin"
                  : "Đăng tin"}
            </button>
          </aside>
        </form>
      </div>

      <AnimatePresence>
        {showCreatePostGuide && (
          <CreatePostGuideModal
            dontShowAgain={dontShowGuideAgain}
            onDontShowAgainChange={setDontShowGuideAgain}
            onClose={handleCloseCreatePostGuide}
          />
        )}
      </AnimatePresence>

      {activeYearPicker && (
        <YearPickerPopup
          title={
            activeYearPicker === "manufactureYear"
              ? "Chọn năm sản xuất"
              : "Chọn năm đăng ký"
          }
          years={yearOptions}
          selectedYear={
            activeYearPicker === "manufactureYear"
              ? manufactureYearSelected
              : registrationYearSelected
          }
          onSelect={(year) => handleSelectYear(activeYearPicker, year)}
          onClose={() => setActiveYearPicker(null)}
        />
      )}

      {(isSubmitting || isAnalyzing || isPricing) && <FullscreenLoader />}
    </div>
  );
}

export default CreatePost;
