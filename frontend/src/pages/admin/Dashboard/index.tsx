import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faMotorcycle,
  faUsers,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../../configs/axiosInstance";
import { ReasonType, ReportStatus, TargetType } from "../../../shared";
import type { ListingPost } from "../../user/Post/post.types";

const AdminTrendChart = lazy(() => import("./AdminTrendChart"));

interface PendingPostsResponse {
  data: {
    items: ListingPost[];
    total: number;
    page: number;
    limit: number;
  };
}

interface DashboardStatValue {
  value: number;
  trendPercent?: number | null;
}

interface DashboardStatsResponse {
  data: {
    activePosts: DashboardStatValue;
    users: DashboardStatValue;
    pendingPosts: DashboardStatValue;
    monthlyRevenue: DashboardStatValue;
  };
}

interface PendingReport {
  id: number;
  targetId: number;
  targetType: "post" | "user";
  reasonType: string;
  reasonDetail: string;
  status: string;
  createdAt: string;
  reporter?: { id: number; fullName?: string; email: string };
  target?: {
    id: number;
    title?: string;
    slug?: string;
    fullName?: string;
    email?: string;
  } | null;
}

interface PendingReportsResponse {
  data: {
    items: PendingReport[];
    pagination: { total: number };
  };
}

const reasonLabels: Record<string, string> = {
  [ReasonType.FAKE_INFO]: "Thông tin không trung thực",
  [ReasonType.WRONG_PRICE]: "Giá không đúng",
  [ReasonType.DUPLICATE_POST]: "Tin trùng lặp",
  [ReasonType.ALREADY_SOLD]: "Xe đã bán",
  [ReasonType.STOLEN_VEHICLE]: "Nghi ngờ xe gian",
  [ReasonType.FAKE_IMAGES]: "Hình ảnh giả",
  [ReasonType.FRAUD]: "Lừa đảo",
  [ReasonType.SPAM]: "Spam",
  [ReasonType.ABUSIVE]: "Ngôn từ xúc phạm",
  [ReasonType.SCAM]: "Giả mạo",
  [ReasonType.OTHER]: "Lý do khác",
};

const baseOverviewStats = [
  {
    key: "activePosts",
    title: "Tin đang hiển thị",
    value: "1.248",
    trend: "+12,4%",
    icon: faMotorcycle,
    color: "bg-amber-50 text-amber-600",
  },
  {
    key: "users",
    title: "Người dùng",
    value: "8.642",
    trend: "+8,1%",
    icon: faUsers,
    color: "bg-sky-50 text-sky-600",
  },
  {
    key: "pendingPosts",
    title: "Chờ kiểm duyệt",
    value: "0",
    trend: "Cần xử lý",
    icon: faClock,
    color: "bg-violet-50 text-violet-600",
  },
  {
    key: "monthlyRevenue",
    title: "Doanh thu tháng",
    value: "128,5tr",
    trend: "+18,7%",
    icon: faWallet,
    color: "bg-emerald-50 text-emerald-600",
  },
] as const;

function PendingPostsSkeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="grid gap-3 px-5 py-4 md:grid-cols-[1.2fr_1fr_0.8fr_0.8fr] md:items-center"
        >
          <div className="min-w-0 space-y-2">
            <div className="h-5 w-4/5 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100 md:hidden" />
          </div>
          <div className="hidden h-5 w-3/4 animate-pulse rounded bg-gray-200 md:block" />
          <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-7 w-24 animate-pulse rounded-full bg-amber-100" />
        </div>
      ))}
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [pendingPosts, setPendingPosts] = useState<ListingPost[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [isPendingLoading, setIsPendingLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<
    DashboardStatsResponse["data"] | null
  >(null);
  const [pendingReports, setPendingReports] = useState<PendingReport[]>([]);
  const [pendingReportTotal, setPendingReportTotal] = useState(0);
  const [isReportsLoading, setIsReportsLoading] = useState(true);

  const overviewStats = useMemo(
    () =>
      baseOverviewStats.map((stat) => {
        if (!dashboardStats) {
          return stat.key === "pendingPosts"
            ? { ...stat, value: pendingTotal.toLocaleString("vi-VN") }
            : { ...stat, value: "—", trend: "Đang tải" };
        }

        const currentStat = dashboardStats[stat.key];
        const value =
          stat.key === "monthlyRevenue"
            ? `${currentStat.value.toLocaleString("vi-VN")}đ`
            : currentStat.value.toLocaleString("vi-VN");
        const trend =
          stat.key === "pendingPosts"
            ? stat.trend
            : currentStat.trendPercent === null ||
                currentStat.trendPercent === undefined
              ? "Chưa có dữ liệu kỳ trước"
              : `${currentStat.trendPercent > 0 ? "+" : ""}${currentStat.trendPercent.toLocaleString("vi-VN")}% · ${
                  stat.key === "activePosts"
                    ? "Tin mới so với tháng trước"
                    : stat.key === "users"
                      ? "Đăng ký mới so với tháng trước"
                      : "So với tháng trước"
                }`;

        return {
          ...stat,
          value,
          trend,
          trendPercent: currentStat.trendPercent,
        };
      }),
    [dashboardStats, pendingTotal],
  );

  useEffect(() => {
    const fetchPendingOverview = async () => {
      try {
        setIsPendingLoading(true);
        const res = await axiosInstance.get<PendingPostsResponse>(
          "/api/v1/posts/admin/pending",
          {
            params: {
              page: 1,
              limit: 5,
            },
          },
        );

        setPendingPosts(res.data.data.items || []);
        setPendingTotal(res.data.data.total || 0);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "Không thể tải tin chờ kiểm duyệt",
        );
      } finally {
        setIsPendingLoading(false);
      }
    };

    void fetchPendingOverview();
  }, []);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const res = await axiosInstance.get<DashboardStatsResponse>(
          "/api/v1/admin/dashboard/stats",
        );
        setDashboardStats(res.data.data);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "Không thể tải thống kê tổng quan",
        );
      }
    };

    void fetchDashboardStats();
  }, []);

  useEffect(() => {
    const fetchPendingReports = async () => {
      try {
        setIsReportsLoading(true);
        const res = await axiosInstance.get<PendingReportsResponse>(
          "/api/v1/report",
          {
            params: { page: 1, limit: 3, status: ReportStatus.PENDING },
          },
        );
        setPendingReports(res.data.data.items || []);
        setPendingReportTotal(res.data.data.pagination?.total || 0);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            "Không thể tải báo cáo đang chờ xử lý",
        );
      } finally {
        setIsReportsLoading(false);
      }
    };

    void fetchPendingReports();
  }, []);

  return (
    <section className="px-5 py-6 md:px-8">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {overviewStats.map((stat) => (
          <article
            key={stat.title}
            className="rounded-lg border border-gray-300 bg-white p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[1.4rem] text-gray-500">{stat.title}</p>
                <span className="mt-2 block text-[2.8rem] font-semibold">
                  {stat.value}
                </span>
              </div>
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-lg ${stat.color}`}
              >
                <FontAwesomeIcon icon={stat.icon} />
              </div>
            </div>
            <p
              className={`mt-5 text-[1.3rem] font-medium ${
                "trendPercent" in stat &&
                typeof stat.trendPercent === "number" &&
                stat.trendPercent < 0
                  ? "text-red-600"
                  : "text-emerald-600"
              }`}
            >
              {stat.trend}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="order-2 rounded-lg border border-gray-300 bg-white p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-[2rem] font-medium">Tin chờ kiểm duyệt</h2>
              <p className="mt-1 text-gray-500">
                Ưu tiên các tin có giá trị cao
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/admin/posts/pending")}
              className="rounded-lg px-4 py-2 font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
            >
              Xem tất cả
            </button>
          </div>

          <div className="mt-5 overflow-hidden rounded-lg border border-gray-300">
            <div className="hidden grid-cols-[1.2fr_1fr_0.8fr_0.8fr] bg-gray-50 px-5 py-4 text-[1.3rem] font-semibold uppercase text-gray-500 md:grid">
              <span>Tin đăng</span>
              <span>Người bán</span>
              <span>Giá</span>
              <span>Trạng thái</span>
            </div>
            {isPendingLoading ? (
              <PendingPostsSkeleton />
            ) : pendingPosts.length === 0 ? (
              <div className="border-t border-gray-100 px-5 py-8 text-center text-gray-500">
                Hiện chưa có tin nào đang chờ duyệt.
              </div>
            ) : (
              pendingPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/admin/posts/pending/${post.slug}`}
                  className="grid gap-3 border-t border-gray-300 px-5 py-4 transition-colors hover:bg-gray-50 md:grid-cols-[1.2fr_1fr_0.8fr_0.8fr] md:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate">{post.title}</p>
                    <p className="mt-1 truncate text-[1.2rem] font-normal text-gray-400 md:hidden">
                      {post.user?.fullName || "Người bán"}
                    </p>
                  </div>
                  <div className="hidden truncate text-gray-600 md:block">
                    {post.user?.fullName || "Người bán"}
                  </div>
                  <div className="font-semibold text-red-500">
                    {Number(post.price).toLocaleString("vi-VN")} đ
                  </div>
                  <div>
                    <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-[1.2rem] font-semibold text-amber-700">
                      Chờ duyệt
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="order-1 rounded-lg border border-gray-300 bg-white p-6 xl:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[2rem] font-medium">Báo cáo chờ xử lý</h2>
              <span className="rounded-full bg-red-50 px-3 py-1 text-[1.2rem] font-semibold text-red-600">
                {pendingReportTotal.toLocaleString("vi-VN")} báo cáo
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate("/admin/reports")}
              className="w-fit rounded-lg px-4 py-2 font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
            >
              Xem tất cả
            </button>
          </div>
          {isReportsLoading ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-lg bg-gray-100"
                />
              ))}
            </div>
          ) : pendingReports.length === 0 ? (
            <div className="mt-5 rounded-lg bg-gray-50 px-4 py-10 text-center text-gray-500">
              Không có báo cáo nào đang chờ xử lý.
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pendingReports.map((report) => {
                const targetName =
                  report.target?.title ||
                  report.target?.fullName ||
                  report.target?.email ||
                  `#${report.targetId}`;
                const targetPath =
                  report.targetType === TargetType.POST && report.target?.slug
                    ? `/admin/posts/view/${report.target.slug}`
                    : `/admin/users/${report.targetId}`;

                return (
                  <Link
                    key={report.id}
                    to={targetPath}
                    state={{
                      from: "/admin/dashboard",
                      report: {
                        id: report.id,
                        reasonType: report.reasonType,
                        reasonLabel:
                          reasonLabels[report.reasonType] || report.reasonType,
                        reasonDetail: report.reasonDetail,
                        status: report.status,
                      },
                    }}
                    className="block rounded-lg border border-gray-100 bg-gray-50 p-4 transition-colors hover:border-amber-200 hover:bg-amber-50/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900">
                          {reasonLabels[report.reasonType] || report.reasonType}
                        </h3>
                        <p className="mt-1 truncate text-[1.3rem] text-gray-500">
                          Người báo cáo:{" "}
                          {report.reporter?.fullName ||
                            report.reporter?.email ||
                            "Người dùng"}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-[1.2rem] font-semibold text-amber-700">
                        Chờ xử lý
                      </span>
                    </div>
                    <div className="mt-3 flex flex-col gap-1 text-[1.3rem] text-gray-500">
                      <span className="truncate">
                        {report.targetType === TargetType.POST
                          ? "Tin liên quan"
                          : "Người dùng liên quan"}
                        : {targetName}
                      </span>
                      <span>
                        {new Date(report.createdAt).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
        <div className="order-3 min-w-0">
          <Suspense
            fallback={
              <div className="h-[42rem] animate-pulse rounded-lg bg-gray-100" />
            }
          >
            <AdminTrendChart />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
