import { useCallback, useEffect, useMemo, useState } from "react";
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
type TrendMetric = "revenue" | "transactionCount";

interface TrendData {
  range: TrendRange;
  series: Array<{
    date: string;
    revenue: number;
    transactionCount: number;
  }>;
}

const compactNumber = new Intl.NumberFormat("vi-VN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const formatDate = (value: string) => {
  const [, month, day] = value.split("-");
  return `${day}/${month}`;
};

function RevenueTrendChart() {
  const [range, setRange] = useState<TrendRange>("30d");
  const [metric, setMetric] = useState<TrendMetric>("revenue");
  const [data, setData] = useState<TrendData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTrends = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await axiosInstance.get<{ data: TrendData }>(
        "/api/v1/listing-payments/admin/revenue-trends",
        { params: { range } },
      );
      setData(response.data.data);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Không thể tải xu hướng doanh thu");
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void loadTrends();
  }, [loadTrends]);

  const hasData = useMemo(
    () => Boolean(data?.series.some((item) => item[metric] > 0)),
    [data, metric],
  );

  const metricLabel = metric === "revenue" ? "Doanh thu" : "Số giao dịch";

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-[2rem] font-semibold text-gray-900">Xu hướng doanh thu</h2>
          <p className="mt-1 text-gray-500">Theo dõi doanh thu và số giao dịch theo ngày</p>
        </div>
        <div className="inline-flex w-fit rounded-lg bg-gray-100 p-1">
          {(["7d", "30d"] as TrendRange[]).map((value) => (
            <button key={value} type="button" onClick={() => setRange(value)} className={`rounded-md px-4 py-2 text-[1.3rem] font-medium transition-colors ${range === value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>
              {value === "7d" ? "7 ngày" : "30 ngày"}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={() => setMetric("revenue")} className={`rounded-lg border px-4 py-2 text-[1.3rem] font-medium ${metric === "revenue" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-600"}`}>Doanh thu</button>
        <button type="button" onClick={() => setMetric("transactionCount")} className={`rounded-lg border px-4 py-2 text-[1.3rem] font-medium ${metric === "transactionCount" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-600"}`}>Số giao dịch</button>
      </div>
      {isLoading ? (
        <div className="mt-6 h-[32rem] animate-pulse rounded-lg bg-gray-100" />
      ) : error ? (
        <div className="mt-6 flex h-[32rem] flex-col items-center justify-center rounded-lg bg-red-50 text-red-700"><p>{error}</p><button type="button" onClick={() => void loadTrends()} className="mt-4 rounded-lg bg-red-600 px-5 py-2 font-medium text-white">Thử lại</button></div>
      ) : !hasData ? (
        <div className="mt-6 flex h-[32rem] items-center justify-center rounded-lg bg-gray-50 text-gray-500">Chưa có dữ liệu trong khoảng thời gian này</div>
      ) : (
        <div className="mt-6 h-[32rem] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data?.series || []} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={20} />
              <YAxis tickFormatter={(value: number) => compactNumber.format(value)} tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} width={65} />
              <Tooltip labelFormatter={(label) => `Ngày ${formatDate(String(label))}`} formatter={(value) => [metric === "revenue" ? `${Number(value).toLocaleString("vi-VN")}đ` : Number(value).toLocaleString("vi-VN"), metricLabel]} contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }} />
              {metric === "revenue" ? <Bar dataKey="revenue" fill="#d97706" radius={[5, 5, 0, 0]} maxBarSize={42} /> : <Line type="monotone" dataKey="transactionCount" stroke="#0284c7" strokeWidth={3} dot={range === "7d"} activeDot={{ r: 5 }} />}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export default RevenueTrendChart;
