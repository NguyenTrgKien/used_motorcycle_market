import { faMoneyCheckDollar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence, motion } from "framer-motion";

export interface TransactionModalNotification {
  title: string;
  content: string;
  createdAt: string;
}

interface TransactionNotificationModalProps<
  T extends TransactionModalNotification,
> {
  notification: T | null;
  onClose: () => void;
  onView: (notification: T) => void;
}

function TransactionNotificationModal<T extends TransactionModalNotification>({
  notification,
  onClose,
  onView,
}: TransactionNotificationModalProps<T>) {
  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#5757575b] px-5"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-[46rem] rounded-2xl bg-white p-8 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-[2rem] text-emerald-700">
                <FontAwesomeIcon icon={faMoneyCheckDollar} />
              </span>
              <div>
                <p className="text-[1.2rem] font-semibold uppercase tracking-wide text-emerald-600">
                  Giao dịch mới
                </p>
                <h2 className="mt-1 text-[2rem] font-semibold text-gray-950">
                  {notification.title}
                </h2>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-5">
              <p className="leading-7 text-gray-700">{notification.content}</p>
              <p className="mt-3 text-[1.2rem] text-gray-400">
                {formatDate(notification.createdAt)}
              </p>
            </div>

            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="h-18 flex-1 rounded-xl border border-gray-300 font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => onView(notification)}
                className="h-18 flex-1 rounded-xl bg-emerald-600 font-medium text-white transition-colors hover:bg-emerald-700"
              >
                Xem giao dịch
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default TransactionNotificationModal;
