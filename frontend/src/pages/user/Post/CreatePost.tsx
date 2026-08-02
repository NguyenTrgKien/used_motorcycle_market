import {
  faArrowLeft,
  faCalculator,
  faChevronDown,
  faCircleQuestion,
  faImage,
  faPaperPlane,
  faStar,
  faTrash,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
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
import { useLocationSelection } from "../../../contexts/LocationContext";
import type { UserAddressType } from "../../../types/address.type";
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
import ListingPaymentModal from "./components/ListingPaymentModal";
import {
  clearCreatePostDraft,
  readCreatePostDraft,
  readCreatePostDraftFiles,
  saveCreatePostDraft,
  saveCreatePostDraftFiles,
} from "./helpers/createPostDraft";
import {
  fallbackListingFormSchema,
  isUsedCondition,
  listingVehicleFields,
  type ListingVehicleField,
} from "./helpers/listingFormSchema";

function CreatePost() {
  const navigate = useNavigate();
  const { slug: editSlug } = useParams();
  const queryClient = useQueryClient();
  const { user, isLoading: isUserLoading } = useUser();
  const { location: savedLocation } = useLocationSelection();
  const isEditing = Boolean(editSlug);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [editingPost, setEditingPost] = useState<ListingPost | null>(null);
  const [isPostLoading, setIsPostLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [documentImages, setDocumentImages] = useState<File[]>([]);
  const [priceDisplay, setPriceDisplay] = useState("");
  const [showAdditionalVehicleInfo, setShowAdditionalVehicleInfo] =
    useState(false);
  const [showPostDetails, setShowPostDetails] = useState(isEditing);
  const [isPriceStep, setIsPriceStep] = useState(false);
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
  const [paymentPost, setPaymentPost] = useState<{
    id: number;
    amount: number;
  } | null>(null);
  const [draftReady, setDraftReady] = useState(isEditing);
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
  const categorySelected = useWatch({ control, name: "categoryId" });
  const conditionSelected = useWatch({ control, name: "condition" });
  const districtSelected = useWatch({ control, name: "district" });
  const manufactureYearSelected = useWatch({
    control,
    name: "manufactureYear",
  });
  const registrationYearSelected = useWatch({
    control,
    name: "registrationYear",
  });
  const formValues = useWatch({ control }) as CreatePostForm;
  const selectedCategory = useMemo(
    () =>
      categories.find(
        (category) => String(category.id) === String(categorySelected),
      ),
    [categories, categorySelected],
  );
  const listingFormSchema =
    selectedCategory?.listingFormSchema || fallbackListingFormSchema;
  const isVehicleFieldVisible = (field: ListingVehicleField) =>
    listingFormSchema.visibleFields.includes(field);
  const isVehicleFieldRequired = (field: ListingVehicleField) =>
    listingFormSchema.requiredFields.includes(field) ||
    (isUsedCondition(conditionSelected) &&
      listingFormSchema.requiredWhenUsedFields.includes(field));
  const { data: listingPricingResponse } = useQuery({
    queryKey: ["listing-payment-preview", categorySelected],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/api/v1/listing-payments/preview?categoryId=${categorySelected}`,
      );
      return response.data;
    },
    enabled: Boolean(categorySelected) && !isEditing,
  });
  const listingPricing = listingPricingResponse?.data;
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

  useEffect(() => {
    if (!categorySelected || !selectedCategory) return;
    listingVehicleFields.forEach((field) => {
      if (!listingFormSchema.visibleFields.includes(field)) {
        setValue(field, "", { shouldDirty: false, shouldValidate: false });
        clearErrors(field);
      }
    });
  }, [
    categorySelected,
    clearErrors,
    listingFormSchema,
    selectedCategory,
    setValue,
  ]);

  useEffect(() => {
    if (isEditing) return;
    const restoreDraft = async () => {
      const draft = readCreatePostDraft();
      if (!draft) {
        await clearCreatePostDraft().catch(() => undefined);
        setDraftReady(true);
        return;
      }
      reset(draft.form);
      setAiSuggestion(draft.aiSuggestion);
      setPriceSuggestion(draft.priceSuggestion);
      setShowAdditionalVehicleInfo(draft.showAdditionalVehicleInfo);
      setShowPostDetails(draft.showPostDetails);
      setIsPriceStep(draft.isPriceStep);
      setPriceDisplay(formatPriceInput(draft.form.price));
      const draftFiles = await readCreatePostDraftFiles().catch(() => ({
        images: [],
        documentImages: [],
      }));
      setImages(draftFiles.images);
      setDocumentImages(draftFiles.documentImages);
      setDraftReady(true);
    };
    void restoreDraft();
  }, [isEditing, reset]);

  useEffect(() => {
    if (isEditing || !draftReady) return;
    const timeout = window.setTimeout(() => {
      const hasFormContent = Object.keys(initialForm).some((key) => {
        const field = key as keyof CreatePostForm;
        return formValues[field] !== initialForm[field];
      });
      const hasContent =
        hasFormContent ||
        images.length > 0 ||
        documentImages.length > 0 ||
        aiSuggestion !== null ||
        priceSuggestion !== null;
      if (!hasContent) {
        void clearCreatePostDraft().catch(() => undefined);
        return;
      }
      saveCreatePostDraft({
        savedAt: Date.now(),
        form: formValues,
        aiSuggestion,
        priceSuggestion,
        showAdditionalVehicleInfo,
        showPostDetails,
        isPriceStep,
      });
      void saveCreatePostDraftFiles(images, documentImages).catch(
        () => undefined,
      );
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [
    aiSuggestion,
    documentImages,
    draftReady,
    formValues,
    images,
    isEditing,
    isPriceStep,
    priceSuggestion,
    showAdditionalVehicleInfo,
    showPostDetails,
  ]);

  useEffect(() => {
    if (isEditing || isUserLoading || getValues("province")) return;

    const defaultAddress = user?.addresses?.find(
      (address: UserAddressType) => address.isDefault,
    );
    const province = defaultAddress?.province || savedLocation?.province || "";
    const district = defaultAddress
      ? defaultAddress.district || ""
      : savedLocation?.district || "";

    if (!province) return;

    setValue("province", province, { shouldDirty: false });
    setValue("district", district, { shouldDirty: false });

    if (defaultAddress) {
      setValue("ward", defaultAddress.ward || "", { shouldDirty: false });
      setValue("addressDetail", defaultAddress.address || "", {
        shouldDirty: false,
      });
    }
  }, [getValues, isEditing, isUserLoading, savedLocation, setValue, user]);

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

  const requestImageAnalysis = async (type: "description" | "attributes") => {
    const formData = new FormData();
    images.forEach((image) => formData.append("images", image));

    const res = await axiosInstance.post(
      `/api/v1/posts/analyze-images/${type}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    const data = res.data.data || {};

    if (data.isVehicle !== true) {
      throw new Error(
        data.rejectReason ||
          "Hình ảnh không hợp lệ hoặc không liên quan đến xe",
      );
    }

    return { data, message: res.data.message };
  };

  const handleContinueToDetails = async () => {
    const hasImages = isEditing
      ? existingImages.length || images.length
      : images.length;
    const description = getValues("description").trim();

    if (!hasImages) {
      setError("root.images", {
        message: "Vui lòng chọn ít nhất một hình ảnh",
      });
      return;
    }

    if (!description && !aiSuggestion) {
      setError("description", {
        message: "Vui lòng nhập mô tả hoặc dùng AI gợi ý",
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      if (images.length) {
        const { data } = await requestImageAnalysis("attributes");
        Object.entries(data).forEach(([key, value]) => {
          if (
            key !== "description" &&
            key in initialForm &&
            value !== undefined &&
            value !== null &&
            value !== ""
          ) {
            setValue(key as keyof CreatePostForm, String(value), {
              shouldDirty: true,
              shouldValidate: true,
            });
          }
        });
        setAiSuggestion({
          confidence: data.confidence,
          notes: data.notes,
        });
      }
      clearErrors("description");
      clearErrors("root.images");
      setShowPostDetails(true);
      window.setTimeout(() => {
        document
          .querySelector("[data-post-details]")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Không thể phân tích ảnh",
      );
    } finally {
      setIsAnalyzing(false);
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

    try {
      setIsAnalyzing(true);
      const { data, message } = await requestImageAnalysis("description");
      if (typeof data.description !== "string" || !data.description.trim()) {
        throw new Error("AI không thể tạo mô tả từ hình ảnh đã chọn");
      }
      setValue("description", data.description.trim(), {
        shouldDirty: true,
        shouldValidate: true,
      });
      setAiSuggestion({
        confidence: data.confidence,
        notes: data.notes,
      });
      clearErrors("description");
      clearErrors("root.images");
      toast.success(message || "AI đã gợi ý mô tả");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Không thể phân tích ảnh",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const pricingFields: Array<keyof CreatePostForm> = [
    ...new Set([
      ...listingFormSchema.requiredFields,
      ...(isUsedCondition(conditionSelected)
        ? listingFormSchema.requiredWhenUsedFields
        : []),
    ]),
    "province",
  ];
  const prePriceFields: Array<keyof CreatePostForm> = [
    "categoryId",
    "title",
    ...pricingFields,
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

  const handleContinueToPrice = async () => {
    const isValid = await trigger(prePriceFields);
    if (!isValid) {
      const firstInvalidField = prePriceFields.find(
        (field) => getFieldState(field).invalid,
      );
      if (firstInvalidField) {
        scrollToField(firstInvalidField);
      }
      toast.error("Vui lòng cung cấp đầy đủ thông tin trước khi nhập giá");
      return;
    }

    setIsPriceStep(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackFromPrice = () => {
    setIsPriceStep(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

    suggestPriceFields
      .filter(
        (field) =>
          field === "province" ||
          field === "categoryId" ||
          listingFormSchema.visibleFields.includes(
            field as ListingVehicleField,
          ),
      )
      .forEach((field) => {
      const value = values[field];
      if (value !== "") {
        pricingPayload[field] = value;
      }
      });
    pricingPayload.categoryId = values.categoryId;

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

  const handleClearDraft = async () => {
    if (!window.confirm("Bạn có chắc muốn xóa toàn bộ bản nháp?")) return;
    await clearCreatePostDraft().catch(() => undefined);
    reset(initialForm);
    setImages([]);
    setDocumentImages([]);
    setAiSuggestion(null);
    setPriceSuggestion(null);
    setPriceDisplay("");
    setShowAdditionalVehicleInfo(false);
    setShowPostDetails(false);
    setIsPriceStep(false);
    toast.success("Đã xóa bản nháp");
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
          ? await axiosInstance.patch(
              `/api/v1/posts/${editingPost.id}`,
              formData,
              {
                headers: { "Content-Type": "multipart/form-data" },
              },
            )
          : await axiosInstance.post("/api/v1/posts", formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
      if (!isEditing) {
        setDraftReady(false);
        await clearCreatePostDraft().catch(() => undefined);
      }
      toast.success(
        res.data.message ||
          (isEditing ? "Cập nhật tin thành công" : "Đăng tin thành công"),
      );
      if (res.data.paymentRequired) {
        setPaymentPost({
          id: res.data.data.id,
          amount: Number(res.data.data.listingFee || 30000),
        });
        return;
      }
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
      <div className="px-[20rem] pt-[2rem] text-center text-gray-500">
        Đang tải tin đăng...
      </div>
    );
  }

  return (
    <div className="px-[30rem] pt-[2rem] pb-16">
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
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => void handleClearDraft()}
                  className="flex h-16 items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 text-[1.4rem] font-medium text-red-600 transition-colors hover:bg-red-100"
                >
                  <FontAwesomeIcon icon={faTrash} />
                  Xóa bản nháp
                </button>
                <button
                  type="button"
                  onClick={handleOpenCreatePostGuide}
                  className="flex h-16 items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 text-[1.4rem] font-medium text-amber-700 transition-colors hover:bg-amber-100"
                >
                  <FontAwesomeIcon icon={faCircleQuestion} />
                  Hướng dẫn
                </button>
              </div>
            )}
          </div>
        </div>

        <motion.form
          key={isPriceStep ? "price-step" : "information-step"}
          onSubmit={
            isPriceStep
              ? handleSubmit(onSubmit)
              : (event) => {
                  event.preventDefault();
                  void handleContinueToPrice();
                }
          }
          className="space-y-8"
          initial={{ opacity: 0, x: isPriceStep ? 120 : -120 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <div className="space-y-6">
            {!isPriceStep && (
              <section className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="mb-5 text-[1.8rem] font-medium text-gray-900">
                  {isEditing
                    ? "Hình ảnh và mô tả xe"
                    : "Hình ảnh và mô tả ban đầu"}
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
                            onClick={() =>
                              void handleDeleteExistingImage(image.id)
                            }
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
                <label className="flex h-[18rem] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-transparent text-gray-500 transition-colors hover:border-amber-300 bg-amber-100">
                  <FontAwesomeIcon icon={faImage} className="text-[2.6rem]" />
                  <span className="mt-3">
                    {isEditing
                      ? "Chọn thêm tối đa 12 ảnh"
                      : "Chọn tối đa 12 ảnh"}
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
                  <div className="mt-4 grid grid-cols-3 gap-3 md:grid-cols-6">
                    {previews.map((preview, index) => (
                      <img
                        key={preview}
                        src={preview}
                        alt={`preview-${index}`}
                        className="w-full aspect-square rounded-lg border border-gray-200 object-cover"
                      />
                    ))}
                  </div>
                )}
                <div className="mt-5">
                  <div
                    className={`relative h-[34rem] w-full rounded-2xl border-2 bg-white transition-colors focus-within:border-amber-500 ${
                      errors.description ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <label className="pointer-events-none absolute top-4 left-5 z-10 bg-white pr-2 text-[1.5rem] text-gray-700">
                      Mô tả tin đăng <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      {...register("description")}
                      className="absolute top-[5rem] right-5 bottom-[6.5rem] left-5 resize-none overflow-y-auto bg-transparent outline-none"
                      placeholder="Nhập tình trạng xe, lịch sử bảo dưỡng, giấy tờ, lý do bán..."
                    />
                    <button
                      type="button"
                      onClick={() => void handleAnalyzeImages()}
                      disabled={
                        !images.length ||
                        isAnalyzing ||
                        isSubmitting ||
                        isPricing
                      }
                      className="absolute bottom-4 left-4 flex h-[4rem] items-center justify-center gap-2 rounded-full bg-gray-100 px-5 text-[1.4rem] font-semibold text-gray-800 transition-colors hover:bg-amber-100 hover:text-amber-700 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <FontAwesomeIcon icon={faWandMagicSparkles} />
                      {isAnalyzing ? "Đang viết..." : "AI viết giúp"}
                    </button>
                  </div>
                  {errors.description?.message && (
                    <p className="mt-2 pl-4 text-[1.3rem] text-red-500">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                {!showPostDetails && (
                  <button
                    type="button"
                    onClick={() => void handleContinueToDetails()}
                    disabled={isAnalyzing || isSubmitting || isPricing}
                    className="mt-5 flex h-[5rem] w-full items-center justify-center gap-3 rounded-xl bg-amber-500 font-medium text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {isAnalyzing ? "Đang phân tích ảnh..." : "Đăng tin"}
                  </button>
                )}
              </section>
            )}

            {showPostDetails && !isPriceStep && (
              <section
                data-post-details
                className="rounded-xl border border-gray-200 bg-white p-6"
              >
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
                </div>
              </section>
            )}

            {showPostDetails && isPriceStep && (
              <section className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="mb-5 text-[1.8rem] font-medium text-gray-900">
                  Giá bán xe AI định giá
                </h2>
                <Field label="Giá bán" required error={errors.price?.message}>
                  <div className="flex flex-col gap-3 md:flex-row">
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
                        {priceSuggestion.suggestedPrice.toLocaleString("vi-VN")}{" "}
                        đ
                      </p>
                      <p className="mt-1">
                        Độ tin cậy:{" "}
                        {Math.round(priceSuggestion.confidence * 100)}%
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
                          Đã tham khảo {priceSuggestion.comparablesUsed} tin
                          tương tự
                        </p>
                      ) : null}
                    </div>
                  )}
                </Field>
                {listingPricing && !isEditing && (
                  <div
                    className={`mt-6 rounded-xl border p-5 ${
                      listingPricing.billingType === "free"
                        ? "border-green-200 bg-green-50"
                        : "border-amber-200 bg-amber-50"
                    }`}
                  >
                    <p className="font-medium text-gray-900">
                      {listingPricing.billingType === "free"
                        ? "Tin này được đăng miễn phí"
                        : "Phí đăng tin: 30.000đ"}
                    </p>
                    <p className="mt-1 text-[1.3rem] text-gray-600">
                      {listingPricing.sellerType === "professional"
                        ? "Người bán chuyên trả phí cho mỗi tin đăng."
                        : `Bạn còn ${listingPricing.freeRemaining} lượt miễn phí trong nhóm phương tiện này.`}
                    </p>
                  </div>
                )}
                <div className="mt-6 flex gap-4">
                  <button
                    type="button"
                    onClick={handleBackFromPrice}
                    disabled={isSubmitting}
                    className="flex h-[5rem] flex-1 items-center justify-center gap-3 rounded-xl border border-gray-300 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
                  >
                    <FontAwesomeIcon icon={faArrowLeft} />
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex h-[5rem] flex-1 items-center justify-center gap-3 rounded-xl bg-amber-500 font-medium text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-gray-300"
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
                </div>
              </section>
            )}

            {showPostDetails && !isPriceStep && (
              <section className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="mb-5 text-[1.8rem] font-medium text-gray-900">
                  Thông tin xe
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  <Field
                    label="Loại xe"
                    visible={isVehicleFieldVisible("bodyType")}
                    required={isVehicleFieldRequired("bodyType")}
                    error={errors.bodyType?.message}
                  >
                    <select
                      {...register("bodyType", {
                        required: isVehicleFieldRequired("bodyType")
                          ? "Vui lòng chọn loại xe"
                          : false,
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
                    visible={isVehicleFieldVisible("brandName")}
                    required={isVehicleFieldRequired("brandName")}
                    error={errors.brandName?.message}
                  >
                    <input
                      {...register("brandName", {
                        required: isVehicleFieldRequired("brandName")
                          ? "Vui lòng nhập hãng xe"
                          : false,
                        validate: (value) =>
                          !isVehicleFieldRequired("brandName") ||
                          value.trim().length > 0 ||
                          "Vui lòng nhập hãng xe",
                      })}
                      className="field-input"
                      placeholder="Honda, Toyota..."
                    />
                  </Field>
                  <Field
                    label="Dòng xe"
                    visible={isVehicleFieldVisible("modelName")}
                    required={isVehicleFieldRequired("modelName")}
                    error={errors.modelName?.message}
                  >
                    <input
                      {...register("modelName", {
                        required: isVehicleFieldRequired("modelName")
                          ? "Vui lòng nhập dòng xe"
                          : false,
                        validate: (value) =>
                          !isVehicleFieldRequired("modelName") ||
                          value.trim().length > 0 ||
                          "Vui lòng nhập dòng xe",
                      })}
                      className="field-input"
                      placeholder="SH, Vios, Fuso..."
                    />
                  </Field>
                  <Field
                    label="Năm sản xuất"
                    visible={isVehicleFieldVisible("manufactureYear")}
                    required={isVehicleFieldRequired("manufactureYear")}
                  >
                    <div data-form-field="manufactureYear">
                      <input
                        {...register("manufactureYear", {
                          required: isVehicleFieldRequired("manufactureYear")
                            ? "Vui lòng chọn năm sản xuất"
                            : false,
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
                  <Field
                    label="Năm đăng ký"
                    visible={isVehicleFieldVisible("registrationYear")}
                    required={isVehicleFieldRequired("registrationYear")}
                  >
                    <div data-form-field="registrationYear">
                      <input
                        {...register("registrationYear", {
                          required: isVehicleFieldRequired("registrationYear")
                            ? "Vui lòng chọn năm đăng ký"
                            : false,
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
                  <Field
                    label="Số km"
                    visible={isVehicleFieldVisible("mileage")}
                    required={isVehicleFieldRequired("mileage")}
                  >
                    <input
                      {...register("mileage", {
                        required: isVehicleFieldRequired("mileage")
                          ? "Vui lòng nhập số km"
                          : false,
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
                  <Field
                    label="Nhiên liệu"
                    visible={isVehicleFieldVisible("fuelType")}
                    required={isVehicleFieldRequired("fuelType")}
                  >
                    <select
                      {...register("fuelType", {
                        required: isVehicleFieldRequired("fuelType")
                          ? "Vui lòng chọn nhiên liệu"
                          : false,
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
                  <Field
                    label="Hộp số"
                    visible={isVehicleFieldVisible("transmission")}
                    required={isVehicleFieldRequired("transmission")}
                  >
                    <select
                      {...register("transmission", {
                        required: isVehicleFieldRequired("transmission")
                          ? "Vui lòng chọn hộp số"
                          : false,
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
                  <Field
                    label="Tình trạng"
                    visible={isVehicleFieldVisible("condition")}
                    required={isVehicleFieldRequired("condition")}
                  >
                    <select
                      {...register("condition", {
                        required: isVehicleFieldRequired("condition")
                          ? "Vui lòng chọn tình trạng xe"
                          : false,
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
                      <Field
                        label="Màu sắc"
                        visible={isVehicleFieldVisible("color")}
                        required={isVehicleFieldRequired("color")}
                      >
                        <input {...register("color")} className="field-input" />
                      </Field>
                      <Field
                        label="Dung tích động cơ"
                        visible={isVehicleFieldVisible("engineCapacity")}
                        required={isVehicleFieldRequired("engineCapacity")}
                      >
                        <input
                          {...register("engineCapacity")}
                          className="field-input"
                          placeholder="150cc, 2.0L..."
                        />
                      </Field>
                      <Field
                        label="Công suất"
                        visible={isVehicleFieldVisible("enginePower")}
                        required={isVehicleFieldRequired("enginePower")}
                      >
                        <input
                          {...register("enginePower")}
                          className="field-input"
                        />
                      </Field>
                      <Field
                        label="Dung lượng pin"
                        visible={isVehicleFieldVisible("batteryCapacity")}
                        required={isVehicleFieldRequired("batteryCapacity")}
                      >
                        <input
                          {...register("batteryCapacity")}
                          className="field-input"
                        />
                      </Field>
                      <Field
                        label="Quãng đường mỗi lần sạc"
                        visible={isVehicleFieldVisible("rangePerCharge")}
                        required={isVehicleFieldRequired("rangePerCharge")}
                      >
                        <input
                          {...register("rangePerCharge")}
                          className="field-input"
                        />
                      </Field>
                      <Field
                        label="Biển số"
                        visible={isVehicleFieldVisible("licensePlate")}
                        required={isVehicleFieldRequired("licensePlate")}
                      >
                        <input
                          {...register("licensePlate")}
                          className="field-input"
                        />
                      </Field>
                      <Field
                        label="Số ghế"
                        visible={isVehicleFieldVisible("seatCount")}
                        required={isVehicleFieldRequired("seatCount")}
                      >
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
                      <Field
                        label="Số cửa"
                        visible={isVehicleFieldVisible("doorCount")}
                        required={isVehicleFieldRequired("doorCount")}
                      >
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
                      <Field
                        label="Số bánh"
                        visible={isVehicleFieldVisible("wheelCount")}
                        required={isVehicleFieldRequired("wheelCount")}
                      >
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
                      <Field
                        label="Tải trọng kg"
                        visible={isVehicleFieldVisible("payloadKg")}
                        required={isVehicleFieldRequired("payloadKg")}
                      >
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
                      <Field
                        label="Trọng lượng toàn bộ kg"
                        visible={isVehicleFieldVisible("grossWeightKg")}
                        required={isVehicleFieldRequired("grossWeightKg")}
                      >
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
                      <Field
                        label="Xuất xứ"
                        visible={isVehicleFieldVisible("origin")}
                        required={isVehicleFieldRequired("origin")}
                      >
                        <input
                          {...register("origin")}
                          className="field-input"
                        />
                      </Field>
                    </>
                  )}
                </div>
              </section>
            )}

            {showPostDetails &&
              !isPriceStep &&
              isVehicleFieldVisible("documentsStatus") && (
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
            )}
          </div>

          {showPostDetails && !isPriceStep && (
            <aside className="space-y-6">
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
                type="button"
                onClick={() => void handleContinueToPrice()}
                disabled={isSubmitting || isAnalyzing || isPricing}
                className="flex h-[5rem] w-full items-center justify-center gap-3 rounded-xl bg-amber-500 font-medium text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Tiếp theo
              </button>
            </aside>
          )}
        </motion.form>
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

      {paymentPost && (
        <ListingPaymentModal
          postId={paymentPost.id}
          amount={paymentPost.amount}
          onClose={() => navigate("/posts/manage")}
        />
      )}

      {(isSubmitting || isAnalyzing || isPricing) && <FullscreenLoader />}
    </div>
  );
}

export default CreatePost;
