import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../../configs/axiosInstance";
import AdminPostsFilterModal from "./components/AdminPostsFilterModal";
import AdminPostsTable from "./components/AdminPostsTable";
import AdminPostsToolbar from "./components/AdminPostsToolbar";
import DeletePostModal from "./components/DeletePostModal";
import ReasonModal from "./components/ReasonModal";
import RestorePostModal from "./components/RestorePostModal";
import { emptyFilters } from "./constants";
import type {
  AdminManagedPost,
  AdminPostFilters,
  AdminPostsResponse,
} from "./types";

function AdminPosts() {
  const [posts, setPosts] = useState<AdminManagedPost[]>([]);
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [status, setStatus] = useState("all");
  const [draftStatus, setDraftStatus] = useState("all");
  const [filters, setFilters] = useState<AdminPostFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<AdminPostFilters>(emptyFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deletingPost, setDeletingPost] = useState<AdminManagedPost | null>(
    null,
  );
  const [deleteReason, setDeleteReason] = useState("");
  const [restoringPost, setRestoringPost] = useState<AdminManagedPost | null>(
    null,
  );
  const [reasonPost, setReasonPost] = useState<AdminManagedPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const limit = 10;

  const totalPages = useMemo(
    () => Math.max(Math.ceil(total / limit), 1),
    [total],
  );

  const activeFilterCount = useMemo(
    () =>
      Object.entries(appliedFilters).filter(([key, value]) => {
        if (key === "dateField" || key === "sort") {
          return value !== emptyFilters[key as keyof AdminPostFilters];
        }

        return Boolean(value) && value !== "all";
      }).length,
    [appliedFilters],
  );

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const filterParams = Object.fromEntries(
        Object.entries(appliedFilters).filter(([key, value]) => {
          if (!value || value === "all") return false;
          if (value === emptyFilters[key as keyof AdminPostFilters])
            return false;

          return true;
        }),
      );
      const res = await axiosInstance.get<AdminPostsResponse>(
        "/api/v1/posts/admin",
        {
          params: {
            page,
            limit,
            status,
            keyword: appliedKeyword || undefined,
            ...filterParams,
          },
        },
      );

      setPosts(res.data.data.items || []);
      setTotal(res.data.data.total || 0);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể tải danh sách tin đăng",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchPosts();
  }, [page, status, appliedKeyword, appliedFilters]);

  const closeDeleteModal = () => {
    setDeletingPost(null);
    setDeleteReason("");
  };

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1);
    setAppliedKeyword(keyword.trim());
  };

  const handleStatusChange = (value: string) => {
    setPage(1);
    setStatus(value);
  };

  const handleFilterChange = (name: keyof AdminPostFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOpenFilter = () => {
    setDraftStatus(status);
    setFilters(appliedFilters);
    setIsFilterOpen(true);
  };

  const handleApplyFilters = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1);
    setStatus(draftStatus);
    setAppliedFilters(filters);
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    setDraftStatus("all");
    setFilters(emptyFilters);
  };

  const handleOpenDeleteModal = (post: AdminManagedPost) => {
    setDeletingPost(post);
    setDeleteReason("");
  };

  const handleDeletePost = async () => {
    if (!deletingPost) return;
    const reason = deleteReason.trim();
    if (!reason) {
      toast.error("Vui lòng nhập lý do xóa tin");
      return;
    }

    try {
      setIsDeleting(true);
      const res = await axiosInstance.delete(
        `/api/v1/posts/admin/${deletingPost.id}`,
        {
          data: {
            reason,
          },
        },
      );
      toast.success(res.data.message || "Đã xóa tin đăng");
      closeDeleteModal();

      if (posts.length === 1 && page > 1) {
        setPage((prev) => Math.max(prev - 1, 1));
      } else {
        await fetchPosts();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể xóa tin đăng");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestorePost = async () => {
    if (!restoringPost) return;

    try {
      setIsRestoring(true);
      const res = await axiosInstance.patch(
        `/api/v1/posts/admin/${restoringPost.id}/restore`,
      );
      toast.success(res.data.message || "Đã khôi phục tin đăng");
      setRestoringPost(null);

      if (posts.length === 1 && page > 1) {
        setPage((prev) => Math.max(prev - 1, 1));
      } else {
        await fetchPosts();
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Không thể khôi phục tin đăng",
      );
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <>
      <section className="px-5 py-6 md:px-8">
        <div className="rounded-lg border border-gray-300 bg-white p-5">
          <AdminPostsToolbar
            activeFilterCount={activeFilterCount}
            isFilterOpen={isFilterOpen}
            keyword={keyword}
            status={status}
            total={total}
            onKeywordChange={setKeyword}
            onOpenFilter={handleOpenFilter}
            onRefresh={() => void fetchPosts()}
            onSearch={handleSearch}
            onStatusChange={handleStatusChange}
          />

          <AdminPostsTable
            isLoading={isLoading}
            page={page}
            posts={posts}
            totalPages={totalPages}
            onDeletePost={handleOpenDeleteModal}
            onNextPage={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            onPrevPage={() => setPage((prev) => Math.max(prev - 1, 1))}
            onRestorePost={setRestoringPost}
            onViewReason={setReasonPost}
          />
        </div>
      </section>

      {isFilterOpen && (
        <AdminPostsFilterModal
          filters={filters}
          status={draftStatus}
          onApply={handleApplyFilters}
          onChange={handleFilterChange}
          onClose={() => setIsFilterOpen(false)}
          onReset={handleResetFilters}
          onStatusChange={setDraftStatus}
        />
      )}

      {deletingPost && (
        <DeletePostModal
          deleteReason={deleteReason}
          isDeleting={isDeleting}
          post={deletingPost}
          onClose={closeDeleteModal}
          onConfirm={() => void handleDeletePost()}
          onReasonChange={setDeleteReason}
        />
      )}

      {restoringPost && (
        <RestorePostModal
          isRestoring={isRestoring}
          post={restoringPost}
          onClose={() => setRestoringPost(null)}
          onConfirm={() => void handleRestorePost()}
        />
      )}

      {reasonPost && (
        <ReasonModal post={reasonPost} onClose={() => setReasonPost(null)} />
      )}
    </>
  );
}

export default AdminPosts;
