import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faClock,
  faMotorcycle,
  faTriangleExclamation,
  faUsers,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
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

const baseOverviewStats = [
  {
    title: "Tin đang hiển thị",
    value: "1.248",
    trend: "+12,4%",
    icon: faMotorcycle,
    color: "bg-amber-50 text-amber-600",
  },
  {
    title: "Người dùng",
    value: "8.642",
    trend: "+8,1%",
    icon: faUsers,
    color: "bg-sky-50 text-sky-600",
  },
  {
    title: "Chờ kiểm duyệt",
    value: "0",
    trend: "Cần xử lý",
    icon: faClock,
    color: "bg-violet-50 text-violet-600",
  },
  {
    title: "Doanh thu tháng",
    value: "128,5tr",
    trend: "+18,7%",
    icon: faWallet,
    color: "bg-emerald-50 text-emerald-600",
  },
];

const recentActivities = [
  "5 tin đăng mới trong 30 phút gần nhất",
  "2 tài khoản vừa hoàn tất xác minh",
  "1 báo cáo gian lận đang chờ phản hồi",
  "Gói đẩy tin Premium tăng 14% tuần này",
];

const userReports = [
  {
    title: "Nghi vấn tin đăng lừa đảo",
    reporter: "Phạm Quốc Bảo",
    target: "Honda SH 150i 2022",
    time: "12 phút trước",
    level: "Khẩn cấp",
  },
  {
    title: "Người bán không phản hồi sau đặt cọc",
    reporter: "Đặng Thanh Mai",
    target: "Yamaha Janus 2020",
    time: "38 phút trước",
    level: "Cao",
  },
  {
    title: "Thông tin xe không đúng mô tả",
    reporter: "Võ Minh Đức",
    target: "Vespa Primavera ABS",
    time: "1 giờ trước",
    level: "Trung bình",
  },
];

function PendingPostsSkeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 3 }).map((_, index) => (
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

  const overviewStats = useMemo(
    () =>
      baseOverviewStats.map((stat) =>
        stat.title === "Chờ kiểm duyệt"
          ? { ...stat, value: pendingTotal.toLocaleString("vi-VN") }
          : stat,
      ),
    [pendingTotal],
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
              limit: 3,
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
                <strong className="mt-2 block text-[2.8rem]">
                  {stat.value}
                </strong>
              </div>
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-lg ${stat.color}`}
              >
                <FontAwesomeIcon icon={stat.icon} />
              </div>
            </div>
            <p className="mt-5 text-[1.3rem] font-medium text-emerald-600">
              {stat.trend}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-lg border border-gray-300 bg-white p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-[2rem] font-semibold">Tin chờ kiểm duyệt</h2>
              <p className="mt-1 text-gray-500">
                Ưu tiên các tin có giá trị cao hoặc bị báo cáo
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/admin/posts/pending")}
              className="h-12 rounded-lg underline px-5 text-blue-500 transition-colors hover:text-blue-600 hover:cursor-pointer"
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

        <section className="rounded-lg border border-gray-300 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[2rem] font-bold">Cảnh báo</h2>
            <span className="rounded-full bg-red-50 px-3 py-1 text-[1.2rem] font-semibold text-red-600">
              {userReports.length} báo cáo
            </span>
          </div>
          <div className="mt-5 space-y-4">
            {userReports.map((report) => (
              <article
                key={report.title}
                className="rounded-lg border border-gray-100 bg-gray-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {report.title}
                    </h3>
                    <p className="mt-1 text-[1.3rem] text-gray-500">
                      Người báo cáo: {report.reporter}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[1.2rem] font-semibold text-red-600">
                    {report.level}
                  </span>
                </div>
                <div className="mt-3 flex flex-col gap-1 text-[1.3rem] text-gray-500">
                  <span>Tin liên quan: {report.target}</span>
                  <span>{report.time}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="rounded-lg border border-gray-300 bg-white p-6 xl:col-span-2">
          <h2 className="text-[2rem] font-bold">Hoạt động gần đây</h2>
          <div className="mt-5 space-y-4">
            {recentActivities.map((activity, index) => (
              <div
                key={activity}
                className="flex items-center gap-4 rounded-lg bg-gray-50 p-4"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-gray-700">
                  <FontAwesomeIcon
                    icon={index === 2 ? faTriangleExclamation : faCircleCheck}
                  />
                </div>
                <p className="font-medium text-gray-700">{activity}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-gray-300 bg-gray-900 p-6 text-white">
          <h2 className="text-[2rem] font-bold">Việc cần làm hôm nay</h2>
          <p className="mt-3 text-gray-300">
            Xử lý tin chờ duyệt trước 18:00, rà soát báo cáo lừa đảo và kiểm tra
            nhóm tài khoản có hành vi bất thường.
          </p>
          <button
            type="button"
            className="mt-6 h-12 rounded-lg bg-white px-5 font-semibold text-gray-900 transition-colors hover:bg-amber-100"
          >
            Mở danh sách
          </button>
        </section>
      </div>
    </section>
  );
}

export default Dashboard;
