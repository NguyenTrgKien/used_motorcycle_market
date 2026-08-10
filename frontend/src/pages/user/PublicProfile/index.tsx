import {
  faCalendarDays,
  faCircle,
  faLocationDot,
  faPlus,
  faRotateRight,
  faShareNodes,
  faShieldHalved,
  faStar,
  faFlag,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axiosInstance from "../../../configs/axiosInstance";
import type { UserType } from "../../../types/user.type";
import PostCard from "../HomePage/components/PostCard";
import type { PostsResponse } from "../HomePage/types";
import type { ListingPost } from "../Post/post.types";
import ReportModal from "../../../components/ReportModal";
import { TargetType } from "../../../shared";
import { useUser } from "../../../hooks/useUser";
import useAuthModal from "../../../hooks/useAuthModal";

interface PublicUserResponse {
  message: string;
  data: UserType;
}

function usePublicUser(userId?: string) {
  return useQuery<UserType>({
    queryKey: ["public-user", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const res = await axiosInstance.get<PublicUserResponse>(
        `/api/v1/users/${userId}`,
      );
      return res.data.data;
    },
  });
}

function usePublicPosts(userId: string | undefined, status: "active" | "sold") {
  return useQuery<ListingPost[]>({
    queryKey: ["public-user-posts", userId, status],
    enabled: Boolean(userId),
    queryFn: async () => {
      const res = await axiosInstance.get<PostsResponse>("/api/v1/posts", {
        params: { userId, status, limit: 50 },
      });
      return res.data.data.items;
    },
  });
}

function PublicProfile() {
  const { id } = useParams();
  const { user: currentUser } = useUser();
  const { openAuthModal } = useAuthModal();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isReported, setIsReported] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<"active" | "sold">(
    "active",
  );
  const {
    data: user,
    isLoading: userLoading,
    isError: userError,
    refetch: refetchUser,
  } = usePublicUser(id);
  const {
    data: activePosts = [],
    isLoading: activePostsLoading,
    refetch: refetchActivePosts,
  } = usePublicPosts(id, "active");
  const {
    data: soldPosts = [],
    isLoading: soldPostsLoading,
    refetch: refetchSoldPosts,
  } = usePublicPosts(id, "sold");
  const posts = selectedStatus === "active" ? activePosts : soldPosts;
  const postsLoading =
    selectedStatus === "active" ? activePostsLoading : soldPostsLoading;
  const refetchPosts =
    selectedStatus === "active" ? refetchActivePosts : refetchSoldPosts;

  const joinedAt = user?.createdAt
    ? new Intl.DateTimeFormat("vi-VN", {
        month: "2-digit",
        year: "numeric",
      }).format(new Date(user.createdAt))
    : "Chưa ghi nhận";
  const coverImage = useMemo(() => {
    for (const post of [...activePosts, ...soldPosts]) {
      const image =
        post.post_images?.find((item) => item.isPrimary)?.imageUrl ||
        post.post_images?.[0]?.imageUrl;
      if (image) return image;
    }
    return "";
  }, [activePosts, soldPosts]);
  const address = user?.addresses?.[0]
    ? [user.addresses[0].district, user.addresses[0].province]
        .filter(Boolean)
        .join(", ")
    : "Chưa công khai địa chỉ";

  useEffect(() => {
    if (!currentUser?.id || !user?.id || currentUser.id === user.id) {
      setIsReported(false);
      return;
    }
    void axiosInstance
      .get("/api/v1/report/status", {
        params: { targetType: TargetType.USER, targetId: user.id },
      })
      .then((response) => setIsReported(Boolean(response.data.data?.reported)))
      .catch(() => setIsReported(false));
  }, [currentUser?.id, user?.id]);

  const handleShare = async () => {
    const shareData = {
      title: `Hồ sơ của ${user?.fullName || "người bán"}`,
      url: window.location.href,
    };

    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }

    await navigator.clipboard.writeText(window.location.href);
  };

  if (userLoading) {
    return (
      <main className="min-h-screen bg-gray-100 px-4 py-6 sm:px-8 lg:px-[20rem]">
        <div className="mx-auto max-w-[150rem] overflow-hidden rounded-2xl bg-white">
          <div className="h-[22rem] animate-pulse bg-gray-200" />
          <div className="flex gap-6 p-8">
            <div className="h-36 w-36 animate-pulse rounded-full bg-gray-200" />
            <div className="flex-1 space-y-4 pt-4">
              <div className="h-8 w-1/3 animate-pulse rounded bg-gray-200" />
              <div className="h-5 w-1/2 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (userError || !user) {
    return (
      <main className="min-h-screen bg-gray-100 px-4 py-10 sm:px-8 lg:px-[20rem]">
        <div className="mx-auto max-w-[150rem] rounded-2xl border border-red-100 bg-white p-8 text-center">
          <p className="text-[1.6rem] text-red-600">
            Không thể tải hồ sơ người dùng
          </p>
          <button
            type="button"
            onClick={() => void refetchUser()}
            className="mt-5 inline-flex h-[4rem] items-center gap-2 rounded-full border border-red-200 px-5 text-[1.4rem] font-medium text-red-600 hover:bg-red-50"
          >
            <FontAwesomeIcon icon={faRotateRight} />
            Tải lại
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f4f4] px-4 py-5 sm:px-8 lg:px-[20rem]">
      <div className="mx-auto max-w-[150rem] space-y-7">
        <section className="overflow-hidden rounded-2xl bg-white">
          <div className="relative h-[16rem] overflow-hidden bg-gradient-to-r from-slate-800 via-slate-600 to-amber-500 sm:h-[22rem]">
            {coverImage && (
              <>
                <img
                  src={coverImage}
                  alt=""
                  className="absolute inset-0 h-full w-full scale-105 object-cover blur-2xl opacity-55"
                />
                <img
                  src={coverImage}
                  alt={`Ảnh bìa của ${user.fullName}`}
                  className="relative mx-auto h-full w-full object-cover sm:w-[90%]"
                />
              </>
            )}
          </div>

          <div className="px-6 pb-8 sm:px-10">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="shrink-0 mt-12">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.fullName}
                    referrerPolicy="no-referrer"
                    className="h-32 w-32 rounded-full border-4 border-white bg-white object-cover sm:h-40 sm:w-40"
                  />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-amber-100 text-[3rem] font-bold text-amber-700 sm:h-40 sm:w-40">
                    {user.fullName?.slice(0, 2).toUpperCase() || "ND"}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 pt-1 sm:pt-6">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-[2.4rem] font-bold text-gray-950 sm:text-[2.8rem]">
                    {user.fullName || "Người dùng"}
                  </h1>
                  {user.isVerified && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-[1.2rem] font-medium text-green-700">
                      <FontAwesomeIcon icon={faShieldHalved} />
                      Đã xác minh
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 text-[1.4rem] text-gray-600">
                  <span className="inline-flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faCircle}
                      className="text-[0.8rem] text-green-500"
                    />
                    Đang hoạt động
                  </span>
                  <span className="hidden text-gray-400 sm:inline">•</span>
                  <span className="inline-flex items-center gap-2">
                    <strong className="text-[1.7rem] text-gray-950">5</strong>
                    <FontAwesomeIcon icon={faStar} className="text-amber-400" />
                    <span className="underline underline-offset-2">
                      Chưa có đánh giá
                    </span>
                  </span>
                  <span className="hidden text-gray-400 sm:inline">•</span>
                  <span className="inline-flex items-center gap-2">
                    <FontAwesomeIcon icon={faCalendarDays} />
                    Đã tham gia: {joinedAt}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="mr-2 inline-flex items-center gap-2 text-[1.5rem] text-gray-700">
                    <FontAwesomeIcon
                      icon={faLocationDot}
                      className="text-[1.8rem]"
                    />
                    {address}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleShare()}
                    className="inline-flex h-[4.2rem] items-center gap-2 rounded-full border border-gray-300 px-5 text-[1.4rem] font-semibold text-gray-900 transition-colors hover:bg-gray-50"
                  >
                    <FontAwesomeIcon
                      icon={faShareNodes}
                      className="text-[1.7rem]"
                    />
                    Chia sẻ
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-[4.2rem] items-center gap-2 rounded-full border border-gray-300 px-5 text-[1.4rem] font-semibold text-gray-900 transition-colors hover:bg-gray-50"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    Theo dõi
                  </button>
                  {currentUser?.id !== user.id && (
                    <button
                      type="button"
                      onClick={() => currentUser?.id ? setIsReportOpen(true) : openAuthModal()}
                      disabled={isReported}
                      className="inline-flex h-[4.2rem] items-center gap-2 rounded-full px-5 text-[1.4rem] font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <FontAwesomeIcon icon={faFlag} />
                      {isReported ? "Đã báo cáo - đang chờ xử lý" : "Báo cáo"}
                    </button>
                  )}
                </div>

                {user.personalInfo && (
                  <p className="mt-5 max-w-[90rem] text-[1.4rem] leading-7 text-gray-600">
                    {user.personalInfo}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white px-6 py-7 sm:px-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-[2rem] text-gray-950">
              Tất cả tin đăng ({activePosts.length + soldPosts.length})
            </h2>
            {(user.phone || user.email) && (
              <a
                href={user.phone ? `tel:${user.phone}` : `mailto:${user.email}`}
                className="inline-flex h-[4.2rem] items-center rounded-full bg-amber-400 px-6 text-[1.4rem] font-semibold text-gray-950 transition-colors hover:bg-amber-500"
              >
                Liên hệ người bán
              </a>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedStatus("active")}
              className={`inline-flex h-[4rem] items-center rounded-full px-5 text-[1.4rem] transition-colors ${
                selectedStatus === "active"
                  ? "bg-gray-950 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Tin đang hoạt động ({activePosts.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus("sold")}
              className={`inline-flex h-[4rem] items-center rounded-full px-5 text-[1.4rem] transition-colors ${
                selectedStatus === "sold"
                  ? "bg-gray-950 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Đã bán ({soldPosts.length})
            </button>
          </div>

          {postsLoading ? (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-[4/3] animate-pulse rounded-2xl bg-gray-200"
                />
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl bg-gray-50 px-6 py-14 text-center">
              <p className="text-[1.6rem] font-medium text-gray-700">
                {selectedStatus === "active"
                  ? "Người bán chưa có tin đăng đang hoạt động"
                  : "Người bán chưa có tin đăng đã bán"}
              </p>
              <button
                type="button"
                onClick={() => void refetchPosts()}
                className="mt-4 inline-flex items-center gap-2 text-[1.4rem] font-medium text-amber-700"
              >
                <FontAwesomeIcon icon={faRotateRight} />
                Kiểm tra lại
              </button>
            </div>
          )}
        </section>

        <div className="text-center text-[1.3rem] text-gray-500">
          <Link to="/" className="hover:text-amber-700">
            Quay về trang chủ
          </Link>
        </div>
      </div>
      <ReportModal isOpen={isReportOpen} targetId={user.id} targetType={TargetType.USER} targetName={user.fullName || user.email} onClose={() => setIsReportOpen(false)} onSubmitted={() => setIsReported(true)} />
    </main>
  );
}

export default PublicProfile;
