import { faSliders, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, type FormEvent, type ReactNode } from "react";
import {
  bodyTypeOptions,
  conditionOptions,
  fuelTypeOptions,
  transmissionOptions,
} from "../Post/constants/createPost.constants";
import {
  categoryBodyTypes,
  categoryFilterFields,
  type VehicleFilterSection,
} from "./vehicleFilter.config";

export interface VehicleFilters {
  province: string;
  brandName: string;
  bodyType: string;
  condition: string;
  fuelType: string;
  transmission: string;
  minPrice: string;
  maxPrice: string;
  minYear: string;
  maxYear: string;
}

interface Props {
  filters: VehicleFilters;
  categorySlug: string | null;
  brandOptions: Array<{ value: string; label: string }>;
  filterSection: VehicleFilterSection | null;
  popoverPosition?: { top: number; left: number };
  onChange: (name: keyof VehicleFilters, value: string) => void;
  onApply: () => void;
  onClose: () => void;
  onReset: () => void;
}

const fieldClass =
  "h-16 w-full rounded-xl border border-gray-200 bg-white px-4 text-[1.4rem] text-gray-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100";

const MAX_PRICE = 5_000_000_000;
const PRICE_STEP = 10_000_000;

function VehicleFilterModal({
  filters,
  categorySlug,
  brandOptions,
  filterSection,
  popoverPosition,
  onChange,
  onApply,
  onClose,
  onReset,
}: Props) {
  const visibleFields = categorySlug
    ? categoryFilterFields[categorySlug] || []
    : [];
  const visibleBodyTypeOptions = categorySlug
    ? bodyTypeOptions.filter((option) =>
        (categoryBodyTypes[categorySlug] || []).includes(option.value),
      )
    : [];
  const showSection = (section: VehicleFilterSection) =>
    !filterSection || filterSection === section;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) =>
      event.key === "Escape" && onClose();
    const previousOverflow = document.body.style.overflow;
    if (!popoverPosition) {
      document.body.style.overflow = "hidden";
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, popoverPosition]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onApply();
  };

  return (
    <div
      className={`fixed inset-0 z-[1000] ${
        popoverPosition
          ? ""
          : "flex items-end justify-center bg-gray-950/50 backdrop-blur-[2px] sm:items-center sm:p-6"
      }`}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      role="presentation"
    >
      <form
        onSubmit={handleSubmit}
        className={
          popoverPosition
            ? "fixed flex max-h-[70vh] w-[38rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
            : "flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-[60rem] sm:rounded-3xl"
        }
        style={popoverPosition}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vehicle-filter-title"
      >
        {!popoverPosition && (
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-5 sm:px-7">
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <FontAwesomeIcon icon={faSliders} />
              </span>
              <div>
                <h2
                  id="vehicle-filter-title"
                  className="text-[2rem] font-semibold text-gray-900"
                >
                  Bộ lọc xe
                </h2>
                <p className="text-[1.3rem] text-gray-500">
                  Chọn nhiều tiêu chí để tìm xe phù hợp
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-12 w-12 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
              aria-label="Đóng bộ lọc"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        )}

        <div
          className={`overflow-y-auto ${popoverPosition ? "px-5 py-5" : "px-5 py-6 sm:px-7"}`}
        >
          <div
            className={`grid gap-x-5 gap-y-6 ${popoverPosition ? "grid-cols-1" : "sm:grid-cols-2"}`}
          >
            {showSection("price") && (
              <Field label="Khoảng giá" wide>
                <PriceRange
                  minPrice={filters.minPrice}
                  maxPrice={filters.maxPrice}
                  onChange={onChange}
                />
              </Field>
            )}
            {showSection("condition") && (
              <Field label="Tình trạng" wide>
                <FilterSelect
                  name="condition"
                  value={filters.condition}
                  options={conditionOptions}
                  onChange={onChange}
                  radio={Boolean(popoverPosition)}
                  onSelect={popoverPosition ? onClose : undefined}
                />
              </Field>
            )}
            {showSection("brandName") &&
              visibleFields.includes("brandName") && (
                <Field label="Hãng xe">
                  <FilterSelect
                    name="brandName"
                    value={filters.brandName}
                    options={brandOptions}
                    onChange={onChange}
                    emptyLabel="Tất cả hãng"
                    radio={Boolean(popoverPosition)}
                    onSelect={popoverPosition ? onClose : undefined}
                  />
                </Field>
              )}
            {showSection("bodyType") && visibleFields.includes("bodyType") && (
              <Field label="Loại xe">
                <FilterSelect
                  name="bodyType"
                  value={filters.bodyType}
                  options={visibleBodyTypeOptions}
                  onChange={onChange}
                  radio={Boolean(popoverPosition)}
                  onSelect={popoverPosition ? onClose : undefined}
                />
              </Field>
            )}
            {showSection("fuelType") && visibleFields.includes("fuelType") && (
              <Field label="Nhiên liệu">
                <FilterSelect
                  name="fuelType"
                  value={filters.fuelType}
                  options={fuelTypeOptions}
                  onChange={onChange}
                  radio={Boolean(popoverPosition)}
                  onSelect={popoverPosition ? onClose : undefined}
                />
              </Field>
            )}
            {showSection("transmission") &&
              visibleFields.includes("transmission") && (
                <Field label="Hộp số">
                  <FilterSelect
                    name="transmission"
                    value={filters.transmission}
                    options={transmissionOptions}
                    onChange={onChange}
                    radio={Boolean(popoverPosition)}
                    onSelect={popoverPosition ? onClose : undefined}
                  />
                </Field>
              )}
            {showSection("year") && visibleFields.includes("year") && (
              <Field label="Năm sản xuất" wide>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    value={filters.minYear}
                    onChange={(event) =>
                      onChange("minYear", event.target.value)
                    }
                    className={fieldClass}
                    placeholder="Từ năm"
                  />
                  <input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    value={filters.maxYear}
                    onChange={(event) =>
                      onChange("maxYear", event.target.value)
                    }
                    className={fieldClass}
                    placeholder="Đến năm"
                  />
                </div>
              </Field>
            )}
          </div>
        </div>

        <div
          className={`flex gap-3 border-t border-gray-100 px-5 ${popoverPosition ? "justify-end py-4" : "py-5 sm:justify-end sm:px-7"}`}
        >
          <button
            type="button"
            onClick={onReset}
            className={`h-16 rounded-xl border border-gray-200 px-6 font-semibold text-gray-700 transition hover:bg-gray-50 ${
              popoverPosition ? "shrink-0" : "flex-1 sm:flex-none"
            }`}
          >
            {popoverPosition ? "Xóa lọc" : "Đặt lại"}
          </button>
          {!popoverPosition && (
            <button
              type="submit"
              className="h-16 flex-1 rounded-xl bg-amber-500 px-8 font-semibold text-white transition hover:bg-amber-600 sm:flex-none"
            >
              Áp dụng bộ lọc
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function PriceRange({
  minPrice,
  maxPrice,
  onChange,
}: {
  minPrice: string;
  maxPrice: string;
  onChange: (name: keyof VehicleFilters, value: string) => void;
}) {
  const minValue = minPrice ? Number(minPrice) : 0;
  const maxValue = maxPrice ? Number(maxPrice) : MAX_PRICE;
  const minPercent = (minValue / MAX_PRICE) * 100;
  const maxPercent = (maxValue / MAX_PRICE) * 100;
  const thumbClass =
    "pointer-events-none absolute inset-x-0 top-1/2 h-2 w-full -translate-y-1/2 appearance-none bg-transparent outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-amber-500 [&::-moz-range-thumb]:shadow-md";

  const formatPrice = (value: number) => {
    if (value === 0) return "0 đ";
    if (value === MAX_PRICE) return "5 tỷ";
    if (value >= 1_000_000_000) {
      return `${Number((value / 1_000_000_000).toFixed(2))} tỷ`;
    }
    return `${Number((value / 1_000_000).toFixed(0))} triệu`;
  };

  const updateMinPrice = (value: number) => {
    const nextValue = Math.min(value, maxValue - PRICE_STEP);
    onChange("minPrice", nextValue === 0 ? "" : String(nextValue));
  };

  const updateMaxPrice = (value: number) => {
    const nextValue = Math.max(value, minValue + PRICE_STEP);
    onChange("maxPrice", nextValue === MAX_PRICE ? "" : String(nextValue));
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-5">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <span className="block text-[1.2rem] text-gray-500">Từ</span>
          <span className="text-[1.5rem] font-semibold text-gray-900">
            {formatPrice(minValue)}
          </span>
        </div>
        <div className="h-px flex-1 bg-gray-200" />
        <div className="text-right">
          <span className="block text-[1.2rem] text-gray-500">Đến</span>
          <span className="text-[1.5rem] font-semibold text-gray-900">
            {formatPrice(maxValue)}
          </span>
        </div>
      </div>
      <div className="relative h-8">
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gray-200" />
        <div
          className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-amber-500"
          style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
        />
        <input
          type="range"
          min="0"
          max={MAX_PRICE}
          step={PRICE_STEP}
          value={minValue}
          onChange={(event) => updateMinPrice(Number(event.target.value))}
          className={`${thumbClass} z-20`}
          aria-label="Giá thấp nhất"
        />
        <input
          type="range"
          min="0"
          max={MAX_PRICE}
          step={PRICE_STEP}
          value={maxValue}
          onChange={(event) => updateMaxPrice(Number(event.target.value))}
          className={`${thumbClass} z-30`}
          aria-label="Giá cao nhất"
        />
      </div>
      <div className="mt-2 flex justify-between text-[1.2rem] text-gray-400">
        <span>0 đ</span>
        <span>5 tỷ</span>
      </div>
    </div>
  );
}

function Field({
  label,
  wide = false,
  children,
}: {
  label: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <span className="mb-2 block text-[1.4rem] font-medium text-gray-700">
        {label}
      </span>
      {children}
    </div>
  );
}

function FilterSelect({
  name,
  value,
  options,
  onChange,
  emptyLabel = "Tất cả",
  radio = false,
  onSelect,
}: {
  name: keyof VehicleFilters;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (name: keyof VehicleFilters, value: string) => void;
  emptyLabel?: string;
  radio?: boolean;
  onSelect?: () => void;
}) {
  if (radio) {
    const radioOptions = [{ value: "", label: emptyLabel }, ...options];
    return (
      <div className="grid gap-2">
        {radioOptions.map((option) => (
          <label
            key={option.value || "all"}
            className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border px-4 transition ${
              value === option.value
                ? "border-amber-400 bg-amber-50 text-amber-700"
                : "border-gray-200 text-gray-700 hover:border-amber-300 hover:bg-amber-50"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => {
                onChange(name, option.value);
                onSelect?.();
              }}
              className="h-5 w-5 accent-amber-500"
            />
            <span className="font-medium">{option.label}</span>
          </label>
        ))}
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(event) => onChange(name, event.target.value)}
      className={fieldClass}
    >
      <option value="">{emptyLabel}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export default VehicleFilterModal;
