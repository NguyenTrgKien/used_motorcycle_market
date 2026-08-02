import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faMagnifyingGlass,
  faRotateRight,
  faShieldHalved,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../../configs/axiosInstance";
import type { ListingPost } from "../../user/Post/post.types";

interface PendingPostsResponse {
  data: {
    items: ListingPost[];
    total: number;
    page: number;
    limit: number;
  };
}

function PendingPostsSkeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 5 }).map((_, index) => (
        <article
          key={index}
          className="grid gap-4 p-5 xl:grid-cols-[10rem_1.2fr_1fr_0.8fr_0.8fr_12rem] xl:items-center"
        >
          <div className="h-[8rem] animate-pulse rounded-lg border border-gray-300 bg-gray-200" />

          <div className="min-w-0 space-y-3">
            <div className="h-6 w-4/5 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-3/5 animate-pulse rounded bg-gray-100" />
            <div className="h-7 w-24 animate-pulse rounded-full bg-amber-100" />
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-200" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
            </div>
          </div>

          <div className="h-5 w-28 animate-pulse rounded bg-gray-200" />
          <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-12 w-full animate-pulse rounded-lg border border-gray-300 bg-gray-100" />
        </article>
      ))}
    </div>
  );
}

function PendingPosts() {
  const [posts, setPosts] = useState<ListingPost[]>([]);
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const limit = 10;

  const totalPages = useMemo(
    () => Math.max(Math.ceil(total / limit), 1),
    [total],
  );

  const fetchPendingPosts = async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get<PendingPostsResponse>(
        "/api/v1/posts/admin/pending",
        {
          params: {
            page,
            limit,
            keyword: appliedKeyword || undefined,
          },
        },
      );

      setPosts(res.data.data.items || []);
      setTotal(res.data.data.total || 0);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Không thể tải danh sách tin chờ kiểm duyệt",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchPendingPosts();
  }, [page, appliedKeyword]);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1);
    setAppliedKeyword(keyword.trim());
  };

  return (
    <section className="px-5 py-6 md:px-8">
      <div className="rounded-lg border border-gray-300 bg-white p-5">
        <div className="flex justify-end mb-10">
          <div className="flex items-center gap-2 rounded-lg text-amber-800">
            <p className="font-medium uppercase">Tổng tin chờ duyệt</p>
            <p className="font-medium">({total})</p>
          </div>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <form onSubmit={handleSearch} className="relative h-20 flex-1">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              type="text"
              placeholder="Tìm theo tiêu đề, mô tả hoặc người bán"
              className="h-full w-full rounded-lg border border-gray-300 bg-gray-50 pl-14 pr-4 outline-none transition-colors focus:border-amber-400 focus:bg-white"
            />
          </form>
          <button
            type="button"
            onClick={() => void fetchPendingPosts()}
            className="flex h-20 items-center justify-center gap-3 rounded-lg border border-gray-300 px-5 font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <FontAwesomeIcon icon={faRotateRight} />
            Tải lại
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border border-gray-300">
          <div className="hidden grid-cols-[10rem_1.2fr_1fr_0.8fr_0.8fr_12rem] bg-gray-100 px-5 py-4 text-[1.3rem] font-semibold uppercase text-gray-500 xl:grid">
            <span>Ảnh</span>
            <span>Tin đăng</span>
            <span>Người bán</span>
            <span>Giá</span>
            <span>Ngày gửi</span>
            <span>Thao tác</span>
          </div>

          {isLoading ? (
            <PendingPostsSkeleton />
          ) : posts.length === 0 ? (
            <div className="flex min-h-[28rem] flex-col items-center justify-center p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                <FontAwesomeIcon icon={faShieldHalved} />
              </div>
              <p className="mt-4 font-semibold text-gray-900">
                Không có tin nào đang chờ duyệt
              </p>
              <p className="mt-1 text-gray-500">
                Danh sách sẽ tự cập nhật khi người dùng gửi tin mới.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {posts.map((post) => {
                const image =
                  post.post_images?.find((item) => item.isPrimary)?.imageUrl ||
                  post.post_images?.[0]?.imageUrl;

                return (
                  <article
                    key={post.id}
                    className="grid gap-4 p-5 xl:grid-cols-[10rem_1.2fr_1fr_0.8fr_0.8fr_12rem] xl:items-center"
                  >
                    <div className="h-[8rem] overflow-hidden rounded-lg border border-gray-300 bg-gray-50">
                      {image ? (
                        <img
                          src={image}
                          alt={post.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[1.2rem] text-gray-400">
                          Không có ảnh
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate text-[1.8rem]">{post.title}</h2>
                      <p className="mt-2 line-clamp-2 text-[1.3rem] text-gray-500">
                        {post.vehicle?.brandName} {post.vehicle?.modelName}
                        {post.vehicle?.manufactureYear
                          ? ` • ${post.vehicle.manufactureYear}`
                          : ""}
                        {post.province ? ` • ${post.province}` : ""}
                      </p>
                      <span className="mt-3 inline-flex rounded-full bg-amber-50 px-3 py-1 text-[1.2rem] font-semibold text-amber-700">
                        Chờ duyệt
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                        <FontAwesomeIcon icon={faUser} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {post.user?.fullName || "Người bán"}
                        </p>
                        <p className="truncate text-[1.4rem] text-gray-400">
                          {post.user?.phone || "Chưa công khai SĐT"}
                        </p>
                      </div>
                    </div>

                    <div className="font-semibold text-amber-600">
                      {Number(post.price).toLocaleString("vi-VN")} đ
                    </div>

                    <div className="flex items-center gap-2 text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                    </div>
                          
                    <Link
                      to={`/admin/posts/pending/${post.slug}`}
                      className="flex h-12 items-center justify-center gap-2 rounded-lg border border-gray-300 font-medium text-gray-600 transition-colors hover:bg-gray-50"
                    >
                      <FontAwesomeIcon icon={faEye} />
                      Chi tiết
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-[1.3rem] text-gray-500">
            Trang {page} / {totalPages}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="h-12 rounded-lg border border-gray-300 px-5 font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Trước
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              className="h-12 rounded-lg border border-gray-300 px-5 font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PendingPosts;
