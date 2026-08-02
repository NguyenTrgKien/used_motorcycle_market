import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import type { FormEvent } from "react";
import {
  bodyTypeOptions,
  dateFieldOptions,
  displayStatusOptions,
  reportOptions,
  sortOptions,
  statusFilters,
} from "../constants";
import type { AdminPostFilters } from "../types";
import FilterField from "./FilterField";

interface AdminPostsFilterModalProps {
  filters: AdminPostFilters;
  status: string;
  onApply: (e: FormEvent<HTMLFormElement>) => void;
  onChange: (name: keyof AdminPostFilters, value: string) => void;
  onClose: () => void;
  onReset: () => void;
  onStatusChange: (value: string) => void;
}

function AdminPostsFilterModal({
  filters,
  status,
  onApply,
  onChange,
  onClose,
  onReset,
  onStatusChange,
}: AdminPostsFilterModalProps) {
  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/40 px-5">
      <form
        onSubmit={onApply}
        className="flex max-h-[90vh] w-full max-w-[96rem] flex-col rounded-lg bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-6">
          <div>
            <h2 className="text-[2.2rem] font-semibold text-gray-900">
              Bộ lọc nâng cao
            </h2>
            <p className="mt-1 text-[1.4rem] text-gray-500">
              Kết hợp nhiều điều kiện để xử lý tin đăng nhanh hơn.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-gray-500 transition-colors hover:bg-gray-100"
          >
            <FontAwesomeIcon icon={faClose} />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FilterField label="Trạng thái duyệt">
              <select
                value={status}
                onChange={(e) => onStatusChange(e.target.value)}
                className="h-18 w-full rounded-lg border border-gray-300 bg-white px-4 outline-none focus:border-amber-400"
              >
                {statusFilters.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Trạng thái hiển thị">
              <select
                value={filters.displayStatus}
                onChange={(e) => onChange("displayStatus", e.target.value)}
                className="h-18 w-full rounded-lg border border-gray-300 bg-white px-4 outline-none focus:border-amber-400"
              >
                {displayStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Loại xe">
              <select
                value={filters.bodyType}
                onChange={(e) => onChange("bodyType", e.target.value)}
                className="h-18 w-full rounded-lg border border-gray-300 bg-white px-4 outline-none focus:border-amber-400"
              >
                {bodyTypeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Sắp xếp">
              <select
                value={filters.sort}
                onChange={(e) => onChange("sort", e.target.value)}
                className="h-18 w-full rounded-lg border border-gray-300 bg-white px-4 outline-none focus:border-amber-400"
              >
                {sortOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Hãng xe">
              <input
                value={filters.brandName}
                onChange={(e) => onChange("brandName", e.target.value)}
                className="h-18 w-full rounded-lg border border-gray-300 bg-white px-4 outline-none focus:border-amber-400"
                placeholder="Honda, Yamaha..."
              />
            </FilterField>
            <FilterField label="Dòng xe">
              <input
                value={filters.modelName}
                onChange={(e) => onChange("modelName", e.target.value)}
                className="h-18 w-full rounded-lg border border-gray-300 bg-white px-4 outline-none focus:border-amber-400"
                placeholder="SH, Wave, Vision..."
              />
            </FilterField>
            <FilterField label="Giá từ">
              <input
                value={filters.minPrice}
                onChange={(e) => onChange("minPrice", e.target.value)}
                type="number"
                min="0"
                className="h-18 w-full rounded-lg border border-gray-300 bg-white px-4 outline-none focus:border-amber-400"
                placeholder="0"
              />
            </FilterField>
            <FilterField label="Giá đến">
              <input
                value={filters.maxPrice}
                onChange={(e) => onChange("maxPrice", e.target.value)}
                type="number"
                min="0"
                className="h-18 w-full rounded-lg border border-gray-300 bg-white px-4 outline-none focus:border-amber-400"
                placeholder="100000000"
              />
            </FilterField>
            <FilterField label="Mốc thời gian">
              <select
                value={filters.dateField}
                onChange={(e) => onChange("dateField", e.target.value)}
                className="h-18 w-full rounded-lg border border-gray-300 bg-white px-4 outline-none focus:border-amber-400"
              >
                {dateFieldOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Từ ngày">
              <input
                value={filters.dateFrom}
                onChange={(e) => onChange("dateFrom", e.target.value)}
                type="date"
                className="h-18 w-full rounded-lg border border-gray-300 bg-white px-4 outline-none focus:border-amber-400"
              />
            </FilterField>
            <FilterField label="Đến ngày">
              <input
                value={filters.dateTo}
                onChange={(e) => onChange("dateTo", e.target.value)}
                type="date"
                className="h-18 w-full rounded-lg border border-gray-300 bg-white px-4 outline-none focus:border-amber-400"
              />
            </FilterField>
            <FilterField label="Report">
              <select
                value={filters.hasReports}
                onChange={(e) => onChange("hasReports", e.target.value)}
                className="h-18 w-full rounded-lg border border-gray-300 bg-white px-4 outline-none focus:border-amber-400"
              >
                {reportOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Tỉnh/thành">
              <input
                value={filters.province}
                onChange={(e) => onChange("province", e.target.value)}
                className="h-18 w-full rounded-lg border border-gray-300 bg-white px-4 outline-none focus:border-amber-400"
                placeholder="TP. Hồ Chí Minh"
              />
            </FilterField>
            <FilterField label="Quận/huyện">
              <input
                value={filters.district}
                onChange={(e) => onChange("district", e.target.value)}
                className="h-18 w-full rounded-lg border border-gray-300 bg-white px-4 outline-none focus:border-amber-400"
                placeholder="Quận 1"
              />
            </FilterField>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 p-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onReset}
            className="h-18 rounded-lg border border-gray-300 px-5 font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Xóa lọc
          </button>
          <button
            type="submit"
            className="h-18 rounded-lg bg-gray-900 px-5 font-medium text-white transition-colors hover:bg-gray-800"
          >
            Áp dụng
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminPostsFilterModal;
