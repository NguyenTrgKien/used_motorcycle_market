import {
  faLock,
  faShieldHalved,
  faAddressBook,
  faTriangleExclamation,
  faClose,
} from "@fortawesome/free-solid-svg-icons";
import {
  faEnvelope,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import axiosInstance from "../../../configs/axiosInstance";
import ChangeContactModal from "../../../components/ChangeContactModal/ChangeContactModal";
import { useUser } from "../../../hooks/useUser";
import { Link } from "react-router-dom";
import { useGetSecurity } from "./api/useGetSecurity";
import Manage2FAModal from "./components/Manage2FaModal";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ContactModalType = "email" | "phone";

interface SectionCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}

interface ToggleRowProps {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

interface Session {
  id: string | number;
  device: string;
  location: string;
  time: string;
  isCurrent: boolean;
  isDesktop: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sessions hooks
// ─────────────────────────────────────────────────────────────────────────────

function useSessions() {
  return useQuery<Session[]>({
    queryKey: ["sessions"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/v1/auth/sessions");
      return res.data.data; // adjust to your response envelope
    },
  });
}

function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) =>
      axiosInstance.delete(`/api/v1/auth/sessions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Đã đăng xuất thiết bị");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Không thể đăng xuất thiết bị",
      );
    },
  });
}

function useRevokeAllSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => axiosInstance.delete("/api/v1/auth/sessions"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Đã đăng xuất tất cả thiết bị khác");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Không thể đăng xuất");
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  children,
  danger = false,
}: SectionCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border p-6 ${danger ? "border-red-300" : "border-gray-200"}`}
    >
      <div className="flex items-center gap-3 mb-5">
        <span
          className={`text-[1.8rem] ${danger ? "text-red-500" : "text-gray-400"}`}
        >
          {icon}
        </span>
        <h3
          className={`text-[1.6rem] font-medium ${danger ? "text-red-500" : "text-gray-900"}`}
        >
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function ToggleRow({ label, description, value, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-[1.4rem]">
      <div className="flex-1 pr-6">
        <p className="text-[1.45rem] text-gray-800">{label}</p>
        <p className="text-[1.3rem] text-gray-400 mt-[3px]">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative inline-flex w-[4.2rem] h-[2.4rem] rounded-full shrink-0 transition-colors duration-200 focus:outline-none ${value ? "bg-amber-500" : "bg-gray-200"}`}
      >
        <span
          className={`inline-block w-[2rem] h-[2rem] bg-white rounded-full shadow-sm transition-transform duration-200 mt-[0.2rem] ${value ? "translate-x-[2rem]" : "translate-x-[0.2rem]"}`}
        />
      </button>
    </div>
  );
}

function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const [confirmText, setConfirmText] = useState("");
  const CONFIRM_PHRASE = "XÓA TÀI KHOẢN";

  const mutation = useMutation({
    mutationFn: async () => axiosInstance.delete("/api/v1/auth/account"),
    onSuccess: () => {
      toast.success("Tài khoản đã được xóa");
      // TODO: redirect / logout
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Không thể xóa tài khoản");
    },
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.2 }}
        className="w-[92%] md:w-[48rem] bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="flex items-center border-b border-red-100 px-6 py-5">
          <div>
            <h2 className="text-[2rem] font-medium text-red-600">
              Xóa tài khoản
            </h2>
            <p className="text-gray-500 text-[1.4rem]">
              Hành động không thể hoàn tác
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto w-11 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all"
          >
            <FontAwesomeIcon icon={faClose} />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">
            <p className="text-[1.4rem] text-red-700 leading-relaxed">
              ⚠️ Tất cả dữ liệu bao gồm hồ sơ cá nhân, lịch sử giao dịch và
              thông tin tài khoản sẽ bị <strong>xóa vĩnh viễn</strong>. Bạn
              không thể khôi phục sau khi xác nhận.
            </p>
          </div>

          <label className="text-[1.4rem] text-gray-600 block mb-2">
            Nhập{" "}
            <span className="font-medium text-gray-900">
              "{CONFIRM_PHRASE}"
            </span>{" "}
            để xác nhận
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={CONFIRM_PHRASE}
            className="w-full h-[4.6rem] rounded-lg px-4 border border-gray-300 outline-none focus:border-red-400 text-[1.4rem] transition-colors mb-4"
          />

          <button
            onClick={() => mutation.mutate()}
            disabled={confirmText !== CONFIRM_PHRASE || mutation.isPending}
            className="w-full h-[4.6rem] rounded-xl bg-red-500 hover:bg-red-600 transition-colors text-white text-[1.5rem] font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? "Đang xử lý..." : "Xác nhận xóa tài khoản"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Security() {
  const { user } = useUser();

  // Modal states
  const [showContactModal, setShowContactModal] =
    useState<ContactModalType | null>(null);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 2FA
  const { data: responseSecurity } = useGetSecurity();
  const dataSecurity = responseSecurity?.security;

  // Privacy
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(true);

  const { data: sessions = [], isLoading: sessionsLoading } = useSessions();
  const revokeSessionMutation = useRevokeSession();
  const revokeAllMutation = useRevokeAllSessions();

  const privacyMutation = useMutation({
    mutationFn: async (payload: { showEmail: boolean; showPhone: boolean }) =>
      axiosInstance.patch("/api/v1/user/privacy", payload),
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Không thể cập nhật quyền riêng tư",
      );
    },
  });

  const handlePrivacyToggle = (
    field: "showEmail" | "showPhone",
    value: boolean,
  ) => {
    const next = {
      showEmail: field === "showEmail" ? value : showEmail,
      showPhone: field === "showPhone" ? value : showPhone,
    };
    if (field === "showEmail") setShowEmail(value);
    else setShowPhone(value);
    privacyMutation.mutate(next);
  };

  const revokeSession = (id: string | number) => {
    revokeSessionMutation.mutate(id);
  };

  const revokeAllOthers = () => {
    revokeAllMutation.mutate();
  };

  return (
    <>
      <div className="w-full mx-auto p-[2rem] flex flex-col gap-6">
        <div className="border-b border-gray-200 pb-5">
          <h2 className="text-[2.2rem] font-medium text-gray-900">
            Bảo mật & quyền riêng tư
          </h2>
          <p className="text-gray-500 text-[1.4rem] mt-1">
            Quản lý mật khẩu, phiên đăng nhập và quyền riêng tư tài khoản
          </p>
        </div>

        <SectionCard icon={<FontAwesomeIcon icon={faLock} />} title="Mật khẩu">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              {user.hasPassword ? (
                <div>
                  <p className="text-gray-400">Mật khẩu</p>
                  <p className="text-[1.6rem] text-gray-800 mt-[2px]">
                    Đã thiết lập
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-400">Mật khẩu</p>
                  <p className="text-[1.6rem] text-gray-800 mt-[2px]">
                    Chưa thiết lập
                  </p>
                  <p className="text-[1.4rem] text-gray-400 mt-[2px]">
                    Thêm mật khẩu để đăng nhập bằng email
                  </p>
                </div>
              )}
            </div>

            <Link
              to="password"
              className="flex items-center justify-center h-[3.6rem] px-5 rounded-xl border border-gray-300 text-[1.4rem] text-gray-700 hover:bg-gray-50 transition-colors shrink-0"
            >
              {user.hasPassword ? "Đổi mật khẩu" : "Tạo mật khẩu"}
            </Link>
          </div>
        </SectionCard>

        <SectionCard
          icon={<FontAwesomeIcon icon={faAddressBook} />}
          title="Thông tin liên hệ"
        >
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                <FontAwesomeIcon icon={faEnvelope} />
              </span>
              <div>
                <p className="text-[1.2rem] text-gray-400">Email</p>
                <p className="text-[1.45rem] text-gray-800 mt-[2px]">
                  {user?.email || "—"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowContactModal("email")}
              className="h-[3.6rem] px-5 rounded-xl border border-gray-300 text-[1.4rem] text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Đổi email
            </button>
          </div>

          <hr className="border-gray-100" />

          <div className="flex items-center justify-between py-5">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-[1.4rem]">
                📱
              </span>
              <div>
                <p className="text-[1.2rem] text-gray-400">Số điện thoại</p>
                <p className="text-[1.45rem] text-gray-800 mt-[2px]">
                  {user?.phone || "Chưa liên kết"}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowContactModal("phone");
              }}
              className="h-[3.6rem] px-5 rounded-xl border border-gray-300 text-[1.4rem] text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {user?.phone ? "Đổi số điện thoại" : "Thêm số điện thoại"}
            </button>
          </div>
        </SectionCard>

        <SectionCard
          icon={<FontAwesomeIcon icon={faShieldHalved} />}
          title="Xác thực 2 yếu tố"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <span
                className={`inline-block text-[1.2rem] px-3 py-[3px] rounded-full border mb-3 ${dataSecurity?.two_factor_enabled ? "bg-green-50 text-green-600 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}
              >
                {dataSecurity?.two_factor_enabled ? "Đã bật" : "Đã tắt"}
              </span>
              <p className="text-[1.4rem] text-gray-500 leading-relaxed">
                {dataSecurity?.two_factor_enabled
                  ? "Tài khoản đang được bảo vệ bởi xác thực 2 yếu tố. OTP sẽ được gửi khi đăng nhập trên thiết bị lạ."
                  : "Bật xác thực 2 yếu tố để tăng cường bảo mật. OTP sẽ được gửi về email hoặc SMS của bạn."}
              </p>
            </div>
            <button
              onClick={() => setShow2FAModal(true)}
              className="h-[3.6rem] px-5 rounded-xl border border-gray-300 text-[1.4rem] text-gray-700 hover:bg-gray-50 transition-colors shrink-0"
            >
              Quản lý
            </button>
          </div>
        </SectionCard>

        <SectionCard
          icon={<span className="text-[1.8rem]">🖥️</span>}
          title="Phiên đăng nhập"
        >
          <p className="text-[1.4rem] text-gray-500 mb-4">
            Các thiết bị đang đăng nhập vào tài khoản của bạn
          </p>

          {sessionsLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 animate-pulse"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl ${session.isCurrent ? "bg-amber-50 border border-amber-100" : "bg-gray-50"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[2rem]">
                        {session.isDesktop ? "💻" : "📱"}
                      </span>
                      <div>
                        <p className="text-[1.4rem] font-medium text-gray-800">
                          {session.device}
                        </p>
                        <p className="text-[1.2rem] text-gray-400 mt-[2px]">
                          {session.location} · {session.time}
                        </p>
                      </div>
                    </div>
                    {session.isCurrent ? (
                      <span className="text-[1.2rem] px-3 py-[3px] rounded-full bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
                        Thiết bị này
                      </span>
                    ) : (
                      <button
                        onClick={() => revokeSession(session.id)}
                        disabled={revokeSessionMutation.isPending}
                        className="text-[1.3rem] px-4 py-[5px] rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors shrink-0 disabled:opacity-50"
                      >
                        Đăng xuất
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {sessions.filter((s) => !s.isCurrent).length > 0 && (
                <button
                  onClick={revokeAllOthers}
                  disabled={revokeAllMutation.isPending}
                  className="mt-4 text-[1.4rem] text-red-500 hover:text-red-600 transition-colors hover:underline disabled:opacity-50"
                >
                  {revokeAllMutation.isPending
                    ? "Đang xử lý..."
                    : "Đăng xuất tất cả thiết bị khác"}
                </button>
              )}
            </>
          )}
        </SectionCard>

        <SectionCard
          icon={
            <FontAwesomeIcon
              icon={showEmail || showPhone ? faEye : faEyeSlash}
            />
          }
          title="Quyền riêng tư"
        >
          <p className="text-[1.4rem] text-gray-500 mb-2">
            Kiểm soát thông tin nào được hiển thị với người dùng khác.
          </p>
          <div className="divide-y divide-gray-100">
            <ToggleRow
              label="Hiển thị email công khai"
              description="Người dùng khác có thể thấy địa chỉ email của bạn"
              value={showEmail}
              onChange={(v) => handlePrivacyToggle("showEmail", v)}
            />
            <ToggleRow
              label="Hiển thị số điện thoại"
              description="Người dùng khác có thể thấy số điện thoại của bạn"
              value={showPhone}
              onChange={(v) => handlePrivacyToggle("showPhone", v)}
            />
          </div>
        </SectionCard>

        <SectionCard
          icon={<FontAwesomeIcon icon={faTriangleExclamation} />}
          title="Vùng nguy hiểm"
          danger
        >
          <p className="text-[1.4rem] text-gray-500 mb-5">
            Xóa tài khoản sẽ xóa toàn bộ dữ liệu vĩnh viễn bao gồm hồ sơ cá
            nhân, lịch sử giao dịch và thông tin liên quan. Hành động này{" "}
            <strong className="text-gray-700">không thể hoàn tác</strong>.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="h-[4rem] px-6 rounded-xl border border-red-300 text-[1.4rem] text-red-500 hover:bg-red-50 transition-colors"
          >
            Xóa tài khoản
          </button>
        </SectionCard>
      </div>

      <AnimatePresence>
        {showContactModal && (
          <ChangeContactModal
            type={showContactModal}
            onClose={() => setShowContactModal(null)}
          />
        )}
        {show2FAModal && (
          <Manage2FAModal
            twoFactorEnabled={dataSecurity?.two_factor_enabled}
            onClose={() => setShow2FAModal(false)}
          />
        )}
        {showDeleteModal && (
          <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

export default Security;
