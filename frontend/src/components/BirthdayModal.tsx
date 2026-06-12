import { useState } from "react";

interface BirthdayModal {
  onClose: () => void;
  setValue: any;
}

function BirthdayModal({ onClose, setValue }: BirthdayModal) {
  const [tempBirthday, setTempBirthday] = useState({
    day: "",
    month: "",
    year: "",
  });

  return (
    <div className="fixed inset-0 bg-[#2e2e2e4e] bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-[50rem] mx-4 overflow-hidden">
        <div className="p-5">
          <h3 className="text-center font-medium mb-5">Chọn ngày sinh</h3>

          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-gray-500 mb-1">Ngày</p>
              <select
                className="w-full h-[4.6rem] border border-gray-300 rounded-xl px-4 text-center focus:outline-none focus:border-blue-500"
                value={tempBirthday.day}
                onChange={(e) =>
                  setTempBirthday((prev) => ({ ...prev, day: e.target.value }))
                }
              >
                <option value="">--</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d.toString().padStart(2, "0")}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <p className="text-gray-500 mb-1">Tháng</p>
              <select
                className="w-full h-[4.6rem] border border-gray-300 rounded-xl px-4 text-center focus:outline-none focus:border-blue-500"
                value={tempBirthday.month}
                onChange={(e) =>
                  setTempBirthday((prev) => ({
                    ...prev,
                    month: e.target.value,
                  }))
                }
              >
                <option value="">--</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m.toString().padStart(2, "0")}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <p className="text-gray-500 mb-1">Năm</p>
              <select
                className="w-full h-[4.6rem] border border-gray-300 rounded-xl px-4 text-center focus:outline-none focus:border-blue-500"
                value={tempBirthday.year}
                onChange={(e) =>
                  setTempBirthday((prev) => ({ ...prev, year: e.target.value }))
                }
              >
                <option value="">----</option>
                {Array.from(
                  { length: 50 },
                  (_, i) => new Date().getFullYear() - i,
                ).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex border-t border-gray-200 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-4 text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-bl-2xl transition-colors hover:cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={() => {
              if (tempBirthday.day && tempBirthday.month && tempBirthday.year) {
                const dateString = `${tempBirthday.year}-${tempBirthday.month}-${tempBirthday.day}`;
                setValue("birthday", dateString);
              }
              onClose();
            }}
            disabled={
              !tempBirthday.day || !tempBirthday.month || !tempBirthday.year
            }
            className="flex-1 py-4 text-white font-medium hover:bg-amber-600 bg-amber-500 rounded-br-2xl transition-colors hover:cursor-pointer"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

export default BirthdayModal;
