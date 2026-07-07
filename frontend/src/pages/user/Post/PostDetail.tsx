import {
  faArrowLeft,
  faCalendarDays,
  faChevronLeft,
  faChevronRight,
  faCommentDots,
  faGaugeHigh,
  faLocationDot,
  faPenToSquare,
  faPhone,
  faShieldHalved,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import avatarDefault from "../../../assets/images/avatar_default.png";
import axiosInstance from "../../../configs/axiosInstance";
import { useUser } from "../../../hooks/useUser";
import type { ListingPost } from "./post.types";

function PostDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [post, setPost] = useState<ListingPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState("");
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
  const sellerName = seller?.fullName || "Người bán";
  const sellerAvatar = seller?.avatar || avatarDefault;
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
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Không thể tải tin đăng");
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) void fetchPost();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="px-[10rem] pt-[9rem] text-center text-gray-500">
        Đang tải tin đăng...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="px-[10rem] pt-[9rem] text-center">
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
    <div className="px-[10rem] pt-[9rem] pb-16">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 flex h-14 items-center gap-3 rounded-xl border border-gray-300 px-5 text-gray-700 transition-colors hover:bg-gray-50"
      >
        <FontAwesomeIcon icon={faArrowLeft} />
        Quay lại
      </button>

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
            <p className="mt-4 text-[2.8rem] font-semibold text-amber-600">
              {price} đ
            </p>

            {isOwner && (
              <Link
                to={`/posts/${post.slug}/edit`}
                className="mt-5 flex h-14 items-center justify-center gap-3 rounded-xl border border-amber-300 bg-amber-50 font-medium text-amber-700 transition-colors hover:bg-amber-100"
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
