import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import anhchonxe from "../../../../assets/images/anhchonxe.png";
import anhaigoiy from "../../../../assets/images/anhaigoiy.png";

const guideSteps = [
  {
    emoji: "📸",
    chip: "Ảnh xe",
    title: "Tải ảnh & để AI phân tích",
    description:
      "Chọn tối đa 12 ảnh rõ nét — ngoại thất, nội thất, đồng hồ km và biển số. Sau đó nhấn Phân tích ảnh bằng AI để hệ thống tự điền thông tin xe.",
    tip: "Chụp ban ngày, đủ sáng, góc rộng. Biển số và màu sắc rõ giúp AI nhận diện chính xác hơn.",
    image: anhchonxe,
  },
  {
    emoji: "💰",
    chip: "Định giá",
    title: "Tham khảo giá AI gợi ý",
    description:
      "Nhập giá bán mong muốn hoặc nhấn AI gợi ý để xem khoảng giá thị trường cho dòng xe tương tự. Bạn có thể chỉnh lại bất cứ lúc nào.",
    tip: "Giá AI dựa trên dữ liệu thị trường thực tế — đặt giá sát thị trường giúp tin được xem nhiều hơn.",
    image: anhaigoiy,
  },
  {
    emoji: "📋",
    chip: "Thông tin đăng",
    title: "Tiêu đề & mô tả rõ ràng",
    description:
      "Tiêu đề nên ghi đủ hãng, dòng, năm và tình trạng (ví dụ: Honda SH 150i 2022 chính chủ). Mô tả nêu lịch sử bảo dưỡng, giấy tờ và lý do bán.",
    tip: "Tin có tiêu đề và mô tả đầy đủ được xem nhiều hơn 3 lần so với tin thiếu thông tin.",
    image: "/images/guide/step-info.png",
  },
  {
    emoji: "🚗",
    chip: "Thông tin xe",
    title: "Điền chi tiết kỹ thuật",
    description:
      "Chọn loại xe, hãng, dòng xe, năm sản xuất và điền số km đã đi. Thông tin đầy đủ giúp tin xuất hiện khi người mua lọc tìm kiếm.",
    tip: "Số km là yếu tố người mua quan tâm nhất — điền trung thực để tạo uy tín.",
    image: "/images/guide/step-vehicle.png",
  },
  {
    emoji: "📍",
    chip: "Địa điểm",
    title: "Địa điểm xem xe",
    description:
      "Chọn tỉnh/thành, quận/huyện và nhập địa chỉ cụ thể. Người mua gần bạn sẽ tìm thấy tin dễ hơn và chủ động liên hệ xem xe.",
    tip: "Địa chỉ chi tiết giúp người mua sắp xếp lịch — tăng khả năng chốt nhanh.",
    image: "/images/guide/step-location.png",
  },
];

const AUTO_DELAY = 4000;

function CreatePostGuideModal({
  dontShowAgain,
  onDontShowAgainChange,
  onClose,
}: {
  dontShowAgain: boolean;
  onDontShowAgainChange: (value: boolean) => void;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const total = guideSteps.length;
  const step = guideSteps[current];
  const isLast = current === total - 1;

  const goTo = (index: number, dir?: number) => {
    setDirection(dir ?? (index > current ? 1 : -1));
    setCurrent(index);
  };

  const goNext = () => {
    setDirection(1);
    setCurrent((c) => (c + 1) % total);
  };

  const goPrev = () => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + total) % total);
  };

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(goNext, AUTO_DELAY);
  };

  useEffect(() => {
    timerRef.current = setTimeout(goNext, AUTO_DELAY);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current]);

  const handleManualNav = (fn: () => void) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    fn();
    resetTimer();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 py-8 sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <motion.div
        className="w-full max-w-[60rem] overflow-hidden rounded-2xl bg-white shadow-xl"
        initial={{ y: 96, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 96, opacity: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="border-b border-b-gray-300 px-6 pb-4 pt-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-medium">Hướng dẫn đăng tin xe</span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng hướng dẫn"
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
            >
              <FontAwesomeIcon icon={faXmark} className="text-[1.4rem]" />
            </button>
          </div>

          <div className="h-1 overflow-hidden rounded-full bg-green-100">
            <motion.div
              className="h-full rounded-full bg-green-500"
              animate={{ width: `${((current + 1) / total) * 100}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[1.4rem]">
            <span>
              Bước {current + 1} / {total}
            </span>
            <span>{Math.round(((current + 1) / total) * 100)}%</span>
          </div>
        </div>

        <div className="p-10">
          <div className="mb-10 flex flex-wrap gap-2">
            {guideSteps.map((s, i) => (
              <button
                key={s.chip}
                type="button"
                onClick={() => handleManualNav(() => goTo(i))}
                className={`rounded-full border px-3 py-1 text-[1.4rem] transition-colors ${
                  i === current
                    ? "border-amber-400 bg-amber-50 font-medium text-amber-700"
                    : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300"
                }`}
              >
                {s.chip}
              </button>
            ))}
          </div>

          <div className="overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current}
                custom={direction}
                variants={{
                  enter: (d: number) => ({ opacity: 0, x: d * 24 }),
                  center: { opacity: 1, x: 0 },
                  exit: (d: number) => ({ opacity: 0, x: d * -24 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <div className="mb-6 flex flex-col gap-5">
                  <img
                    src={step.image}
                    alt={step.title}
                    className="h-80 w-full rounded-xl border border-gray-400 object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-[1.4rem] leading-7 text-gray-600">
                      {step.description}
                    </p>
                  </div>
                </div>

                <div className="rounded-r-xl border-l-4 border-amber-400 bg-gray-50 py-3 pl-4 pr-4 text-[1.4rem] leading-7 text-gray-600">
                  <span className="font-medium text-gray-800">Mẹo: </span>
                  {step.tip}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="px-6 pb-5 pt-5">
          <div className="mb-4 flex justify-center gap-1.5">
            {guideSteps.map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  width: i === current ? 20 : 6,
                  opacity: i === current ? 1 : 0.3,
                }}
                transition={{ duration: 0.2 }}
                className="h-1.5 cursor-pointer rounded-full bg-amber-500"
                onClick={() => handleManualNav(() => goTo(i))}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-[1.4rem] text-gray-500">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => onDontShowAgainChange(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
              />
              Không hiển thị lại
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleManualNav(goPrev)}
                className="flex h-[4rem] items-center justify-center rounded-xl border border-gray-200 px-5 text-[1.4rem] text-gray-600 transition-colors hover:bg-gray-50"
              >
                ← Trước
              </button>
              <button
                type="button"
                onClick={isLast ? onClose : () => handleManualNav(goNext)}
                className="flex h-[4rem] items-center justify-center rounded-xl bg-amber-500 px-6 text-[1.4rem] font-medium text-white transition-colors hover:bg-amber-600"
              >
                {isLast ? "Bắt đầu đăng tin ✓" : "Tiếp theo →"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default CreatePostGuideModal;
