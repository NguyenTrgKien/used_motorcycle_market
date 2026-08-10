import { faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ListingPost } from "../../Post/post.types";
import PostCard from "./PostCard";
import SectionHeading from "./SectionHeading";
import SectionError from "./SectionError";
import { PostSectionSkeleton } from "./Skeletons";

function RecommendationSection({
  posts,
  isLoading,
  hasError,
  hasFilters,
  onReset,
  onRetry,
}: {
  posts: ListingPost[];
  isLoading: boolean;
  hasError: boolean;
  hasFilters: boolean;
  onReset: () => void;
  onRetry: () => void;
}) {
  if (isLoading) {
    return <PostSectionSkeleton />;
  }

  if (hasError) {
    return (
      <SectionError
        title="Không thể tải tin đăng"
        description="Đã có sự cố khi tải danh sách tin đăng."
        onRetry={onRetry}
        className="mt-8"
      />
    );
  }

  return (
    <section
      id="recommendations"
      className="mt-8 scroll-mt-24 rounded-2xl bg-white"
    >
      <SectionHeading
        title="Dành cho bạn"
        description={
          hasFilters
            ? "Tin đăng phù hợp với lựa chọn hiện tại"
            : "Những tin mới nhất đang được người bán cập nhật"
        }
        action={
          hasFilters ? (
            <button
              type="button"
              onClick={onReset}
              className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-4 text-[1.35rem] font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              <FontAwesomeIcon icon={faRotateLeft} />
              Bỏ bộ lọc
            </button>
          ) : undefined
        }
      />
      <div className="p-5 sm:p-7 lg:p-8">
        {posts.length === 0 ? (
          <div className="rounded-xl bg-gray-50 px-6 py-14 text-center">
            <p className="text-[1.8rem] font-semibold text-gray-900">
              Chưa có tin phù hợp
            </p>
            <p className="mt-2 text-gray-500">
              Thử chọn danh mục, thương hiệu hoặc khoảng giá khác.
            </p>
            <button
              type="button"
              onClick={onReset}
              className="mt-5 font-medium text-amber-600 hover:text-amber-700"
            >
              Xem tất cả tin
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {posts.slice(0, 8).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default RecommendationSection;
