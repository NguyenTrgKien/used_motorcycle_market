import {
  faClock,
  faEnvelope,
  faHeadset,
  faLocationDot,
  faPaperPlane,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { toast } from "react-toastify";

function Contact() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    message: "",
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.fullName.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin liên hệ");
      return;
    }

    toast.success("Đã gửi yêu cầu hỗ trợ");
    setForm({
      fullName: "",
      email: "",
      message: "",
    });
  };

  return (
    <div className="px-[10rem] pt-[9rem] pb-[4rem]">
      <div className="grid grid-cols-[1fr_38rem] gap-8">
        <section className="rounded-xl border border-gray-200 bg-white p-8">
          <div className="border-b border-gray-200 pb-5">
            <h1 className="text-[2.6rem] font-medium text-gray-900">
              Liên hệ hỗ trợ
            </h1>
            <p className="mt-2 text-[1.5rem] text-gray-500">
              Gửi yêu cầu hỗ trợ, báo lỗi hoặc cần tư vấn khi sử dụng nền tảng
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
            <div>
              <label className="mb-2 block text-[1.4rem] text-gray-600">
                Họ tên
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    fullName: event.target.value,
                  }))
                }
                className="h-[4.6rem] w-full rounded-xl border border-gray-300 px-5 text-[1.4rem] outline-none transition-colors focus:border-amber-400"
                placeholder="Nhập họ tên của bạn"
              />
            </div>

            <div>
              <label className="mb-2 block text-[1.4rem] text-gray-600">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
                className="h-[4.6rem] w-full rounded-xl border border-gray-300 px-5 text-[1.4rem] outline-none transition-colors focus:border-amber-400"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-[1.4rem] text-gray-600">
                Nội dung
              </label>
              <textarea
                value={form.message}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    message: event.target.value,
                  }))
                }
                rows={6}
                className="w-full resize-none rounded-xl border border-gray-300 px-5 py-4 text-[1.4rem] outline-none transition-colors focus:border-amber-400"
                placeholder="Bạn cần hỗ trợ vấn đề gì?"
              />
            </div>

            <button
              type="submit"
              className="inline-flex h-[4.4rem] w-fit items-center gap-2 rounded-xl bg-amber-500 px-6 text-[1.4rem] font-medium text-white transition-colors hover:bg-amber-600"
            >
              <FontAwesomeIcon icon={faPaperPlane} />
              Gửi yêu cầu
            </button>
          </form>
        </section>

        <aside className="flex flex-col gap-6">
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                <FontAwesomeIcon icon={faHeadset} />
              </span>
              <div>
                <h2 className="text-[1.8rem] font-medium text-gray-900">
                  Kênh hỗ trợ
                </h2>
                <p className="text-[1.3rem] text-gray-500">
                  Chúng tôi phản hồi sớm nhất có thể
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <a
                href="tel:19001234"
                className="flex h-[4.2rem] items-center gap-3 rounded-xl border border-gray-300 px-4 text-[1.4rem] text-gray-700 transition-colors hover:bg-gray-50"
              >
                <FontAwesomeIcon icon={faPhone} className="text-gray-400" />
                1900 1234
              </a>
              <a
                href="mailto:support@example.com"
                className="flex h-[4.2rem] items-center gap-3 rounded-xl border border-gray-300 px-4 text-[1.4rem] text-gray-700 transition-colors hover:bg-gray-50"
              >
                <FontAwesomeIcon icon={faEnvelope} className="text-gray-400" />
                support@example.com
              </a>
              <div className="flex h-[4.2rem] items-center gap-3 rounded-xl border border-gray-300 px-4 text-[1.4rem] text-gray-700">
                <FontAwesomeIcon icon={faClock} className="text-gray-400" />
                08:00 - 18:00, Thứ 2 - Thứ 7
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-[1.8rem] font-medium text-gray-900">
              Văn phòng
            </h2>
            <div className="mt-4 flex items-start gap-3 text-[1.4rem] leading-relaxed text-gray-600">
              <FontAwesomeIcon
                icon={faLocationDot}
                className="mt-1 text-gray-400"
              />
              <span>TP. Hồ Chí Minh, Việt Nam</span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default Contact;
