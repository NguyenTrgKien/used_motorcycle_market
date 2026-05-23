interface BottomBtnProps {
  btnLeftTitle: string;
  btnRightTitle: string;
  handleCancel: () => void;
  handleSubmit: () => void;
  isLoading: boolean;
}

function BottomBtn({
  btnLeftTitle,
  btnRightTitle,
  handleCancel,
  handleSubmit,
  isLoading,
}: BottomBtnProps) {
  return (
    <div className="flex items-center justify-end gap-4 mt-10">
      <button
        className="px-8 py-3 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
        onClick={handleCancel}
        disabled={isLoading}
      >
        {btnLeftTitle}
      </button>
      <button
        className="px-8 py-3 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
        onClick={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? "Đang xử lý..." : btnRightTitle}
      </button>
    </div>
  );
}

export default BottomBtn;
