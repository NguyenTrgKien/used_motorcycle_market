import {
  faCalendarDays,
  faChevronLeft,
  faChevronRight,
  faCommentDots,
  faGaugeHigh,
  faHeart as faHeartSolid,
  faLocationDot,
  faPenToSquare,
  faPhone,
  faFlag,
  faShieldHalved,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import avatarDefault from "../../../assets/images/avatar_default.png";
import axiosInstance from "../../../configs/axiosInstance";
import useAuthModal from "../../../hooks/useAuthModal";
import { useUser } from "../../../hooks/useUser";
import PostCard from "../HomePage/components/PostCard";
import type { ListingPost } from "./post.types";
import ReportModal from "../../../components/ReportModal";
import { TargetType } from "../../../shared";

function PostDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { openAuthModal } = useAuthModal();
  const [post, setPost] = useState<ListingPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [similarPosts, setSimilarPosts] = useState<ListingPost[]>([]);
  const [isLoadingSimilarPosts, setIsLoadingSimilarPosts] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isReported, setIsReported] = useState(false);
  const images = useMemo(
    () =>
      [...(post?.post_images || [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [post],
  );

  const address = useMemo(
    () =>
      [post?.addressDetail, post?.ward, post?.district, post?.province]
        .filter(Boolean)
        .join(", "),
    [post],
  );
  const price = post ? Number(post.price).toLocaleString("vi-VN") : "";
  const seller = post?.user;
  const isProfessionalSeller =
    seller?.sellerType === "professional" && Boolean(seller.store);
  const sellerName = isProfessionalSeller
    ? seller?.store?.storeName || "Cửa hàng"
    : seller?.fullName || "Người bán";
  const sellerAvatar =
    (isProfessionalSeller ? seller?.store?.logoUrl : seller?.avatar) ||
    avatarDefault;
  const sellerPhone = seller?.phone?.trim();
  const isOwner = Boolean(user?.id && seller?.id && user.id === seller.id);
  const postedAt = post?.createdAt
    ? new Date(post.createdAt).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";
  const averageRating = seller?.averageRating || 0;
  const reviewCount = seller?.reviewCount || 0;
  const chatPostImage =
    post?.post_images?.find((image) => image.isPrimary)?.imageUrl ||
    selectedImage ||
    [...(post?.post_images || [])].sort((a, b) => a.sortOrder - b.sortOrder)[0]
      ?.imageUrl ||
    "";
  const chatPostPrice = post ? Number(post.price) : undefined;
  const selectedImageIndex = images.findIndex(
    (image) => image.imageUrl === selectedImage,
  );

  useEffect(() => {
    if (!user?.id || !post?.id || isOwner) {
      setIsReported(false);
      return;
    }
    void axiosInstance
      .get("/api/v1/report/status", {
        params: { targetType: TargetType.POST, targetId: post.id },
      })
      .then((response) => setIsReported(Boolean(response.data.data?.reported)))
      .catch(() => setIsReported(false));
  }, [isOwner, post?.id, user?.id]);

  const handleChangeImage = (direction: "prev" | "next") => {
    if (images.length <= 1) return;

    const currentIndex = selectedImageIndex >= 0 ? selectedImageIndex : 0;
    const nextIndex =
      direction === "next"
        ? (currentIndex + 1) % images.length
        : (currentIndex - 1 + images.length) % images.length;

    setSelectedImage(images[nextIndex].imageUrl);
  };

  const handleOpenChat = () => {
    if (!seller?.id) {
      toast.error("Không tìm thấy thông tin người bán");
      return;
    }

    navigate("/messages", {
      state: {
        postId: post?.id,
        postSlug: post?.slug || slug,
        postTitle: post?.title,
        postPrice: chatPostPrice,
        postImage: chatPostImage,
        sellerId: seller.id,
        sellerName,
        sellerPhone,
      },
    });
  };

  const handleToggleSaved = async () => {
    if (!post) return;

    if (!user?.id) {
      openAuthModal();
      return;
    }

    if (isOwner) {
      toast.info("Bạn không thể lưu tin của chính mình");
      return;
    }

    const nextSaved = !isSaved;

    try {
      setIsSaving(true);
      setIsSaved(nextSaved);

      if (nextSaved) {
        await axiosInstance.post("/api/v1/saved-post", {
          postId: post.id,
        });
      } else {
        await axiosInstance.delete(`/api/v1/saved-post/${post.id}`);
      }
    } catch (error: any) {
      setIsSaved(!nextSaved);
      toast.error(
        error?.response?.data?.message || "Không thể cập nhật tin yêu thích",
      );
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsLoading(true);
        const res = await axiosInstance.get<{ data: ListingPost }>(
          `/api/v1/posts/${slug}`,
        );
        const postData = res.data.data;
        const primaryImage =
          postData.post_images?.find((image) => image.isPrimary)?.imageUrl ||
          [...(postData.post_images || [])].sort(
            (a, b) => a.sortOrder - b.sortOrder,
          )[0]?.imageUrl ||
          "";

        setPost(postData);
        setSelectedImage(primaryImage);
        setIsSaved(Boolean(postData.isSaved));

        if (user?.id && postData.user?.id !== user.id) {
          void axiosInstance
            .post("/api/v1/view-history", { postId: postData.id })
            .catch(() => undefined);

          try {
            const savedRes = await axiosInstance.get<{
              data: { isSaved: boolean };
            }>(`/api/v1/saved-post/status/${postData.id}`);
            setIsSaved(Boolean(savedRes.data.data.isSaved));
          } catch {
            setIsSaved(false);
          }
        }
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Không thể tải tin đăng");
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) void fetchPost();
  }, [slug, user?.id]);

  useEffect(() => {
    if (!post?.id) return;

    const timeoutId = window.setTimeout(() => {
      void axiosInstance
        .post<{
          data: { recorded: boolean; viewCount: number };
        }>(`/api/v1/posts/${post.id}/view`)
        .then((res) => {
          if (!res.data.data.recorded) return;
          setPost((current) =>
            current
              ? { ...current, viewCount: res.data.data.viewCount }
              : current,
          );
        })
        .catch(() => undefined);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [post?.id]);

  useEffect(() => {
    const fetchSimilarPosts = async () => {
      if (!slug) return;

      try {
        setIsLoadingSimilarPosts(true);
        const res = await axiosInstance.get<{ data: ListingPost[] }>(
          `/api/v1/posts/${slug}/similar`,
          { params: { limit: 4 } },
        );
        setSimilarPosts(res.data.data || []);
      } catch {
        setSimilarPosts([]);
      } finally {
        setIsLoadingSimilarPosts(false);
      }
    };

    void fetchSimilarPosts();
  }, [slug]);

  if (isLoading) {
    return <PostDetailSkeleton />;
  }

  if (!post) {
    return (
      <div className="px-[20rem] pt-[2rem] text-center">
        <p className="text-gray-500">Không tìm thấy tin đăng</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 rounded-xl border border-gray-300 px-5 py-3 text-gray-700"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="px-[20rem] pt-[2rem] pb-16">
      <div className="grid grid-cols-[minmax(0,1fr)_46rem] gap-8">
        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-gray-100">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={post.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  Không có ảnh
                </div>
              )}
              {images.length > 1 && selectedImage && (
                <>
                  <button
                    type="button"
                    onClick={() => handleChangeImage("prev")}
                    className="absolute left-4 top-1/2 flex h-20 w-20 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-gray-700 shadow-sm transition-colors hover:bg-white hover:text-amber-600"
                    title="Ảnh trước"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChangeImage("next")}
                    className="absolute right-4 top-1/2 flex h-20 w-20 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-gray-700 shadow-sm transition-colors hover:bg-white hover:text-amber-600"
                    title="Ảnh tiếp theo"
                  >
                    <FontAwesomeIcon icon={faChevronRight} />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-6 gap-3">
                {images.map((image) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setSelectedImage(image.imageUrl)}
                    className={`aspect-square overflow-hidden rounded-lg border ${
                      selectedImage === image.imageUrl
                        ? "border-amber-500"
                        : "border-gray-200"
                    }`}
                  >
                    <img
                      src={image.imageUrl}
                      alt={post.title}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex flex-wrap gap-4 text-gray-500">
              {post.category?.name && <span>{post.category.name}</span>}
              <span>
                <FontAwesomeIcon icon={faGaugeHigh} className="mr-2" />
                {post.viewCount} lượt xem
              </span>
            </div>
            <h3 className="text-[1.8rem] mt-6 font-medium">Mô tả chi tiết</h3>
            {post.description ? (
              <p className="mt-6 whitespace-pre-line leading-relaxed text-gray-700">
                {post.description}
              </p>
            ) : (
              <p className="mt-6 text-gray-500">
                Người bán chưa thêm mô tả chi tiết.
              </p>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-5 text-[1.8rem] font-medium text-gray-900">
              Thông số xe
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Spec label="Loại xe" value={post.vehicle?.bodyType} />
              <Spec label="Hãng xe" value={post.vehicle?.brandName} />
              <Spec label="Dòng xe" value={post.vehicle?.modelName} />
              <Spec
                label="Năm sản xuất"
                value={post.vehicle?.manufactureYear}
              />
              <Spec
                label="Số km"
                value={
                  post.vehicle?.mileage
                    ? `${post.vehicle.mileage.toLocaleString("vi-VN")} km`
                    : undefined
                }
              />
              <Spec label="Nhiên liệu" value={post.vehicle?.fuelType} />
              <Spec label="Hộp số" value={post.vehicle?.transmission} />
              <Spec label="Tình trạng" value={post.vehicle?.condition} />
              <Spec
                label="Dung tích động cơ"
                value={post.vehicle?.engineCapacity}
              />
              <Spec
                label="Dung lượng pin"
                value={post.vehicle?.batteryCapacity}
              />
              <Spec
                label="Tải trọng"
                value={
                  post.vehicle?.payloadKg
                    ? `${post.vehicle.payloadKg} kg`
                    : undefined
                }
              />
              <Spec label="Giấy tờ" value={post.vehicle?.documentsStatus} />
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="sticky top-[9rem] rounded-xl border border-gray-200 bg-white p-6">
            <h1 className="text-[2.6rem] font-semibold leading-tight text-gray-900">
              {post.title}
            </h1>
            <p className="mt-4 text-[2.8rem] font-semibold text-red-500">
              {price} đ
            </p>

            {!isOwner && (
              <button
                type="button"
                onClick={handleToggleSaved}
                disabled={isSaving}
                className={`mt-5 flex h-16 w-full items-center justify-center gap-3 rounded-xl border font-medium transition-colors ${
                  isSaved
                    ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                    : "border-gray-400 bg-white text-gray-600 hover:bg-gray-50"
                } disabled:cursor-not-allowed disabled:opacity-70`}
              >
                <FontAwesomeIcon
                  icon={isSaved ? faHeartSolid : faHeartRegular}
                />
                {isSaved ? "Đã lưu tin" : "Lưu tin yêu thích"}
              </button>
            )}

            {!isOwner && (
              <button
                type="button"
                onClick={() =>
                  user?.id ? setIsReportOpen(true) : openAuthModal()
                }
                disabled={isReported}
                className="mt-3 flex h-16 w-full items-center justify-center gap-2 rounded-xl border border-gray-400 text-[1.4rem] font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
              >
                <FontAwesomeIcon icon={faFlag} />
                {isReported ? "Đã báo cáo - đang chờ xử lý" : "Báo cáo tin đăng"}
              </button>
            )}

            {isOwner && (
              <Link
                to={`/posts/${post.slug}/edit`}
                className="mt-5 flex h-16 items-center justify-center gap-3 rounded-xl border border-amber-300 bg-amber-50 font-medium text-amber-700 transition-colors hover:bg-amber-100"
              >
                <FontAwesomeIcon icon={faPenToSquare} />
                Sửa tin
              </Link>
            )}

            {address && (
              <div className="mt-4 flex gap-3 text-[1.4rem] leading-relaxed text-gray-500">
                <FontAwesomeIcon
                  icon={faLocationDot}
                  className="mt-1 shrink-0"
                />
                <span>{address}</span>
              </div>
            )}

            {postedAt && (
              <div className="mt-4 flex gap-3 text-[1.4rem] leading-relaxed text-gray-500">
                <FontAwesomeIcon
                  icon={faCalendarDays}
                  className="mt-1 shrink-0"
                />
                <span>Đăng ngày {postedAt}</span>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-5 text-[1.8rem] font-medium text-gray-900">
              Người đăng tin
            </h2>
            <div>
              <div className="flex items-center gap-4">
                <img
                  src={sellerAvatar}
                  alt={sellerName}
                  referrerPolicy="no-referrer"
                  className="h-16 w-16 rounded-full border border-gray-200 object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">
                    {sellerName}
                  </p>
                  <p
                    className={`mt-1 text-[1.3rem] ${
                      seller?.isVerified ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    <FontAwesomeIcon icon={faShieldHalved} className="mr-2" />
                    {seller?.isVerified ? "Đã xác minh" : "Chưa xác minh"}
                  </p>
                  {isProfessionalSeller && (
                    <Link
                      to={`/stores/${seller?.store?.id}`}
                      className="mt-2 inline-flex rounded-full bg-amber-50 px-3 py-1 text-[1.2rem] font-medium text-amber-700 hover:bg-amber-100"
                    >
                      Người bán chuyên · Xem cửa hàng
                    </Link>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-[1.3rem] text-gray-500">
                    <FontAwesomeIcon icon={faStar} className="text-amber-400" />
                    <span>
                      {reviewCount > 0
                        ? `${averageRating.toFixed(1)} (${reviewCount} lượt đánh giá)`
                        : "Chưa có đánh giá"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3">
                {!isOwner && (
                  <button
                    type="button"
                    onClick={handleOpenChat}
                    className="flex h-16 items-center justify-center gap-3 rounded-xl bg-amber-500 font-medium text-white transition-colors hover:bg-amber-600"
                  >
                    <FontAwesomeIcon icon={faCommentDots} />
                    Chat với người bán
                  </button>
                )}
                {sellerPhone ? (
                  <a
                    href={`tel:${sellerPhone}`}
                    className="flex h-16 items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <FontAwesomeIcon icon={faPhone} />
                    {sellerPhone}
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="flex h-16 cursor-not-allowed items-center justify-center gap-3 rounded-xl border border-gray-200 bg-gray-100 font-medium text-gray-400"
                  >
                    <FontAwesomeIcon icon={faPhone} />
                    Chưa công khai số điện thoại
                  </button>
                )}
              </div>
            </div>
          </section>
        </aside>
      </div>
      {(isLoadingSimilarPosts || similarPosts.length > 0) && (
        <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-5">
            <h2 className="text-[2rem] font-semibold text-gray-900">
              Tin đăng tương tự
            </h2>
            <p className="mt-1 text-[1.4rem] text-gray-500">
              Gợi ý dựa trên dòng xe, hãng, loại xe, giá, năm sản xuất và khu
              vực
            </p>
          </div>
          {isLoadingSimilarPosts ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-2xl border border-gray-200"
                >
                  <div className="aspect-[4/3] animate-pulse bg-gray-200" />
                  <div className="space-y-3 p-4">
                    <div className="h-5 w-4/5 animate-pulse rounded bg-gray-200" />
                    <div className="h-6 w-1/2 animate-pulse rounded bg-amber-100" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {similarPosts.map((similarPost) => (
                <PostCard key={similarPost.id} post={similarPost} />
              ))}
            </div>
          )}
        </section>
      )}
      <ReportModal
        isOpen={isReportOpen}
        targetId={post.id}
        targetType={TargetType.POST}
        targetName={post.title}
        onClose={() => setIsReportOpen(false)}
        onSubmitted={() => setIsReported(true)}
      />
    </div>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

function PostDetailSkeleton() {
  return (
    <div className="px-[20rem] pt-[2rem] pb-16">
      <SkeletonBlock className="mb-6 h-14 w-36 rounded-xl" />

      <div className="grid grid-cols-[minmax(0,1fr)_46rem] gap-8">
        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <SkeletonBlock className="aspect-[16/10] w-full rounded-xl" />
            <div className="mt-4 grid grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonBlock
                  key={index}
                  className="aspect-square rounded-lg"
                />
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex flex-wrap gap-4">
              <SkeletonBlock className="h-5 w-24" />
              <SkeletonBlock className="h-5 w-32" />
            </div>
            <SkeletonBlock className="mt-6 h-7 w-40" />
            <div className="mt-6 space-y-3">
              <SkeletonBlock className="h-5 w-full bg-gray-100" />
              <SkeletonBlock className="h-5 w-11/12 bg-gray-100" />
              <SkeletonBlock className="h-5 w-4/5 bg-gray-100" />
              <SkeletonBlock className="h-5 w-2/3 bg-gray-100" />
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <SkeletonBlock className="mb-5 h-7 w-36" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="rounded-xl bg-gray-50 p-4">
                  <SkeletonBlock className="h-4 w-24 bg-gray-100" />
                  <SkeletonBlock className="mt-3 h-5 w-3/5" />
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="sticky top-[9rem] rounded-xl border border-gray-200 bg-white p-6">
            <SkeletonBlock className="h-8 w-5/6" />
            <SkeletonBlock className="mt-3 h-8 w-3/5" />
            <SkeletonBlock className="mt-5 h-10 w-44 bg-amber-100" />
            <div className="mt-5 space-y-4">
              <div className="flex gap-3">
                <SkeletonBlock className="h-5 w-5 shrink-0 rounded-full" />
                <SkeletonBlock className="h-5 flex-1 bg-gray-100" />
              </div>
              <div className="flex gap-3">
                <SkeletonBlock className="h-5 w-5 shrink-0 rounded-full" />
                <SkeletonBlock className="h-5 w-40 bg-gray-100" />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <SkeletonBlock className="mb-5 h-7 w-40" />
            <div className="flex items-center gap-4">
              <SkeletonBlock className="h-16 w-16 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <SkeletonBlock className="h-5 w-3/5" />
                <SkeletonBlock className="mt-3 h-4 w-28 bg-gray-100" />
                <SkeletonBlock className="mt-3 h-4 w-44 bg-gray-100" />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3">
              <SkeletonBlock className="h-16 rounded-xl bg-amber-100" />
              <SkeletonBlock className="h-16 rounded-xl bg-gray-100" />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="text-[1.3rem] text-gray-500">{label}</p>
      <p className="mt-1 font-medium text-gray-900">
        {value || "Chưa cập nhật"}
      </p>
    </div>
  );
}

export default PostDetail;
