import { useState, useEffect } from "react";

interface GenderModalProps {
  onClose: () => void;
  setValue: any;
  initialGender?: string;
}

function GenderModal({ onClose, setValue, initialGender }: GenderModalProps) {
  const [selectedGender, setSelectedGender] = useState("");

  // Khởi tạo giá trị hiện tại khi mở modal
  useEffect(() => {
    if (initialGender) {
      setSelectedGender(initialGender);
    }
  }, [initialGender]);

  const genderOptions = [
    { label: "Nam", value: "male" },
    { label: "Nữ", value: "female" },
    { label: "Khác", value: "other" },
  ];

  const handleConfirm = () => {
    if (selectedGender) {
      setValue("gender", selectedGender);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#2e2e2e4e] bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-[40rem] mx-4 overflow-hidden">
        <div className="p-5">
          <h3 className="text-center font-medium mb-10 text-[1.8rem]">
            Chọn giới tính
          </h3>

          <div className="flex items-center gap-5">
            {genderOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedGender(option.value)}
                className={`w-full h-20 rounded-xl border transition-all
                  ${
                    selectedGender === option.value
                      ? "border-amber-500 bg-amber-50 text-amber-600 font-medium"
                      : "border-gray-300 hover:border-gray-400"
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex border-t border-gray-200 mt-10">
          <button
            onClick={onClose}
            className="flex-1 py-4 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-bl-2xl transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedGender}
            className="flex-1 py-4 text-white font-medium bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 rounded-br-2xl transition-colors"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

export default GenderModal;
