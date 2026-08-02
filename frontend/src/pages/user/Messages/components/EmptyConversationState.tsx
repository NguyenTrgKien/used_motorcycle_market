interface EmptyConversationStateProps {
  onGoHome: () => void;
}

function EmptyConversationState({ onGoHome }: EmptyConversationStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <img
        src="https://www.shutterstock.com/image-vector/young-man-woman-having-friendly-600nw-2723715093.jpg"
        alt=""
        className="w-[50rem]"
      />
      <div className="text-center text-gray-500">
        <div>
          <p className="text-[1.8rem] font-medium text-gray-900">
            Bạn chưa có cuộc trò chuyện nào!
          </p>
          <p className="mt-2">
            Trải nghiệm chat để làm rõ thông tin về mặt hàng trước khi bắt đầu
            thực hiện mua bán
          </p>
          <button
            className="mt-6 rounded-md bg-amber-400 px-5 py-2 text-white transition-colors hover:bg-amber-500"
            onClick={onGoHome}
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmptyConversationState;
