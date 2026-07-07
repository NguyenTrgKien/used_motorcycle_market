import { faCalendarDays } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type YearPickerButtonProps = {
  value?: string;
  placeholder: string;
  clearLabel?: string;
  onOpen: () => void;
  onClear: () => void;
};

type YearPickerPopupProps = {
  title: string;
  years: string[];
  selectedYear?: string;
  closeLabel?: string;
  onSelect: (year: string) => void;
  onClose: () => void;
};

function YearPickerButton({
  value,
  placeholder,
  clearLabel = "Xóa",
  onOpen,
  onClear,
}: YearPickerButtonProps) {
  return (
    <div className="flex h-[4.6rem] overflow-hidden rounded-xl border border-gray-300 bg-white transition-colors focus-within:border-amber-500 focus-within:shadow-[0_0_0_3px_rgba(245,158,11,0.12)]">
      <button
        type="button"
        onClick={onOpen}
        className={`flex flex-1 items-center justify-between px-5 text-left text-[1.4rem] ${
          value ? "text-gray-900" : "text-gray-400"
        }`}
      >
        <span>{value || placeholder}</span>
        <FontAwesomeIcon icon={faCalendarDays} className="text-amber-500" />
      </button>
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="border-l border-gray-200 px-4 text-[1.3rem] font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-red-500"
        >
          {clearLabel}
        </button>
      )}
    </div>
  );
}

function YearPickerPopup({
  title,
  years,
  selectedYear,
  closeLabel = "Đóng",
  onSelect,
  onClose,
}: YearPickerPopupProps) {
  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-[#4343432f] px-6">
      <div className="w-full max-w-[42rem] rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-[1.8rem] font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="grid max-h-[36rem] grid-cols-4 gap-3 overflow-y-auto pr-1">
          {years.map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => onSelect(year)}
              className={`h-[4rem] rounded-lg border text-[1.4rem] font-medium transition-colors ${
                selectedYear === year
                  ? "border-amber-500 bg-amber-500 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
              }`}
            >
              {year}
            </button>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-[1.4rem] font-medium text-gray-500 bg-gray-200 transition-colors hover:bg-gray-300 hover:text-gray-900"
          >
            {closeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export { YearPickerButton, YearPickerPopup };
