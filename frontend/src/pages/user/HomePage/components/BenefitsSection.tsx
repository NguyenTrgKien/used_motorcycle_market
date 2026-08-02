import {
  faComments,
  faMagnifyingGlass,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const benefits = [
  {
    icon: faShieldHalved,
    title: "Tin đăng minh bạch",
    description: "Thông tin rõ ràng giúp bạn an tâm hơn khi tìm kiếm xe.",
  },
  {
    icon: faMagnifyingGlass,
    title: "Tìm kiếm dễ dàng",
    description: "Khám phá xe nhanh chóng theo loại, hãng và ngân sách.",
  },
  {
    icon: faComments,
    title: "Kết nối trực tiếp",
    description: "Trao đổi thuận tiện với người bán ngay trên nền tảng.",
  },
];

function BenefitsSection() {
  return (
    <section className="mt-8 rounded-2xl border border-gray-200 bg-white px-5 py-9 sm:px-8 lg:px-10">
      <div className="text-center">
        <h2 className="text-[2.2rem] font-semibold text-gray-800 sm:text-[2.4rem]">
          Vì sao chọn chúng tôi?
        </h2>
        <p className="mt-2 text-[1.4rem] text-gray-500">
          Một nơi đơn giản để tìm kiếm và kết nối mua bán xe
        </p>
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {benefits.map((benefit) => (
          <div
            key={benefit.title}
            className="flex gap-4 rounded-xl border border-gray-100 bg-gray-50/80 p-5"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-[1.8rem] text-orange-600">
              <FontAwesomeIcon icon={benefit.icon} />
            </span>
            <div>
              <h3 className="font-semibold text-gray-700">{benefit.title}</h3>
              <p className="mt-1 text-[1.35rem] leading-relaxed text-gray-500">
                {benefit.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default BenefitsSection;
