import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilter,
  faMagnifyingGlass,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import type { FormEvent } from "react";
import { statusFilters } from "../constants";

interface AdminPostsToolbarProps {
  activeFilterCount: number;
  isFilterOpen: boolean;
  keyword: string;
  status: string;
  total: number;
  onKeywordChange: (value: string) => void;
  onOpenFilter: () => void;
  onRefresh: () => void;
  onSearch: (e: FormEvent<HTMLFormElement>) => void;
  onStatusChange: (value: string) => void;
}

function AdminPostsToolbar({
  activeFilterCount,
  isFilterOpen,
  keyword,
  status,
  total,
  onKeywordChange,
  onOpenFilter,
  onRefresh,
  onSearch,
  onStatusChange,
}: AdminPostsToolbarProps) {
  return (
    <>
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onStatusChange(item.value)}
              className={`h-14 rounded-lg px-5 text-[1.4rem] transition-colors ${
                status === item.value
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="text-amber-800">
          <span className="font-medium uppercase">Tổng tin</span>
          <span className="ml-2 font-medium">({total})</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <form onSubmit={onSearch} className="relative h-20 flex-1">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            type="text"
            placeholder="Tìm nhanh theo tiêu đề, ID, người đăng, SĐT, email hoặc biển số"
            className="h-full w-full rounded-lg border border-gray-300 bg-gray-50 pl-14 pr-4 outline-none transition-colors focus:border-amber-400 focus:bg-white"
          />
        </form>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onOpenFilter}
            className={`flex h-20 items-center justify-center gap-3 rounded-lg border px-5 font-medium transition-colors ${
              isFilterOpen || activeFilterCount
                ? "border-amber-300 bg-amber-50 text-amber-700"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <FontAwesomeIcon icon={faFilter} />
            Bộ lọc
            {activeFilterCount > 0 && <span>({activeFilterCount})</span>}
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="flex h-20 items-center justify-center gap-3 rounded-lg border border-gray-300 px-5 font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <FontAwesomeIcon icon={faRotateRight} />
            Tải lại
          </button>
        </div>
      </div>
    </>
  );
}

export default AdminPostsToolbar;
