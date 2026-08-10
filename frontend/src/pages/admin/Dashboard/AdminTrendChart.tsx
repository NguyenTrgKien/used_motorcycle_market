import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import axiosInstance from "../../../configs/axiosInstance";

type TrendRange = "7d" | "30d";
type TrendMetric = "revenue" | "newUsers" | "newPosts";

interface TrendSummaryValue {
  value: number;
  trendPercent: number | null;
}

interface TrendResponse {
  data: {
    range: TrendRange;
    summary: Record<TrendMetric, TrendSummaryValue>;
    series: Array<{
      date: string;
      revenue: number;
      newUsers: number;
      newPosts: number;
    }>;
  };
}

const metricOptions: Array<{
  key: TrendMetric;
  label: string;
  color: string;
}> = [
  { key: "revenue", label: "Doanh thu", color: "#d97706" },
  { key: "newUsers", label: "Người dùng mới", color: "#0284c7" },
  { key: "newPosts", label: "Tin đăng mới", color: "#7c3aed" },
];

const formatDate = (value: string) => {
  const [, month, day] = value.split("-");
  return `${day}/${month}`;
};

const compactNumber = new Intl.NumberFormat("vi-VN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function AdminTrendChart() {
  const [range, setRange] = useState<TrendRange>("30d");
  const [metric, setMetric] = useState<TrendMetric>("revenue");
  const [data, setData] = useState<TrendResponse["data"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const chartScrollRef = useRef<HTMLDivElement>(null);

  const fetchTrends = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await axiosInstance.get<TrendResponse>(
        "/api/v1/admin/dashboard/trends",
        { params: { range } },
      );
      setData(response.data.data);
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          "Không thể tải dữ liệu xu hướng",
      );
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void fetchTrends();
  }, [fetchTrends]);

  useEffect(() => {
    if (!data || range !== "30d") return;
    const frame = window.requestAnimationFrame(() => {
      const container = chartScrollRef.current;
      if (container) container.scrollLeft = container.scrollWidth;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [data, metric, range]);

  const activeOption = metricOptions.find((item) => item.key === metric)!;
  const hasData = useMemo(
    () => Boolean(data?.series.some((item) => item[metric] > 0)),
    [data, metric],
  );

  return (
    <section className="h-full rounded-lg border border-gray-300 bg-white p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-[2rem] font-medium">Xu hướng hoạt động</h2>
          <p className="mt-1 text-gray-500">Theo dõi biến động theo ngày</p>
        </div>
        <div className="inline-flex w-fit rounded-lg bg-gray-100 p-1">
          {(["7d", "30d"] as TrendRange[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRange(value)}
              className={`rounded-md px-4 py-2 text-[1.3rem] font-medium transition-colors ${
                range === value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {value === "7d" ? "7 ngày" : "30 ngày"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {metricOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setMetric(option.key)}
            className={`rounded-lg border px-4 py-2 text-[1.3rem] font-medium transition-colors ${
              metric === option.key
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="mt-6 h-[34rem] animate-pulse rounded-lg bg-gray-100" />
      ) : error ? (
        <div className="mt-6 flex h-[34rem] flex-col items-center justify-center rounded-lg bg-red-50 px-5 text-center">
          <p className="text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => void fetchTrends()}
            className="mt-4 rounded-lg bg-red-600 px-5 py-2 font-medium text-white hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <>
          {!hasData ? (
            <div className="mt-6 flex h-[30rem] items-center justify-center rounded-lg bg-gray-50 text-gray-500">
              Chưa có dữ liệu {activeOption.label.toLowerCase()} trong kỳ này.
            </div>
          ) : (
            <>
              {range === "30d" && (
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-[1.2rem] text-gray-400">
                    Vuốt hoặc cuộn ngang để xem thêm
                  </span>
                  <div className="hidden gap-2 sm:flex">
                    <button
                      type="button"
                      aria-label="Xem dữ liệu trước đó"
                      onClick={() =>
                        chartScrollRef.current?.scrollBy({
                          left: -320,
                          behavior: "smooth",
                        })
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:border-gray-400 hover:bg-gray-50"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      aria-label="Xem dữ liệu tiếp theo"
                      onClick={() =>
                        chartScrollRef.current?.scrollBy({
                          left: 320,
                          behavior: "smooth",
                        })
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:border-gray-400 hover:bg-gray-50"
                    >
                      →
                    </button>
                  </div>
                </div>
              )}
              <div className="mt-4 flex w-full min-w-0">
              <div className="h-[30rem] w-[6rem] shrink-0 bg-white">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={data?.series || []}
                    margin={{ top: 8, right: 0, left: 0, bottom: 30 }}
                  >
                    <YAxis
                      dataKey={metric}
                      tickFormatter={(value: number) =>
                        compactNumber.format(value)
                      }
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      width={58}
                      allowDecimals={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div
                ref={chartScrollRef}
                className="min-w-0 flex-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                <div
                  className={`h-[30rem] ${
                    range === "30d" ? "min-w-[120rem]" : "min-w-full"
                  }`}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={data?.series || []}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        tick={{ fill: "#6b7280", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={24}
                      />
                      <YAxis dataKey={metric} hide allowDecimals={false} />
                      <Tooltip
                        labelFormatter={(label) =>
                          `Ngày ${formatDate(String(label))}`
                        }
                        formatter={(value) => [
                          metric === "revenue"
                            ? `${Number(value).toLocaleString("vi-VN")}đ`
                            : Number(value).toLocaleString("vi-VN"),
                          activeOption.label,
                        ]}
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid #e5e7eb",
                        }}
                      />
                      {metric === "revenue" ? (
                        <Bar
                          dataKey={metric}
                          fill={activeOption.color}
                          radius={[5, 5, 0, 0]}
                          maxBarSize={40}
                        />
                      ) : (
                        <Line
                          type="monotone"
                          dataKey={metric}
                          stroke={activeOption.color}
                          strokeWidth={3}
                          dot={range === "7d"}
                          activeDot={{ r: 5 }}
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}

export default AdminTrendChart;
