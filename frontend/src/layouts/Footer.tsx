import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faLocationDot,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import {
  faFacebookF,
  faInstagram,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import { Link } from "react-router-dom";
import logo from "../assets/images/logo(1).png";

const marketplaceLinks = [
  { label: "Trang chủ", to: "/" },
  { label: "Đăng tin bán xe", to: "/posts/create" },
  { label: "Quản lý tin đăng", to: "/posts/manage" },
  { label: "Tin đã lưu", to: "/saved-listings" },
];

const supportLinks = [
  { label: "Về chúng tôi", to: "/about" },
  { label: "Liên hệ hỗ trợ", to: "/contact" },
  { label: "Cài đặt tài khoản", to: "/setting/profile" },
  { label: "Bảo mật tài khoản", to: "/setting/security" },
];

const socialLinks = [
  { label: "Facebook", href: "https://www.facebook.com", icon: faFacebookF },
  { label: "Instagram", href: "https://www.instagram.com", icon: faInstagram },
  { label: "YouTube", href: "https://www.youtube.com", icon: faYoutube },
];

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-[128rem] px-6 py-12 sm:px-10 lg:px-16 lg:py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_0.8fr_1.1fr] lg:gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-block" aria-label="Về trang chủ">
              <img
                src={logo}
                alt="Chợ xe máy"
                className="h-[5.2rem] w-[13rem] rounded-full object-cover"
              />
            </Link>
            <p className="mt-5 max-w-[36rem] text-[1.4rem] leading-7 text-slate-400">
              Nền tảng mua bán xe máy minh bạch, nhanh chóng và thuận tiện, giúp
              bạn dễ dàng tìm thấy chiếc xe phù hợp.
            </p>
            <div className="mt-6 flex gap-3">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={item.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 text-[1.4rem] transition-colors hover:border-orange-500 hover:bg-orange-500 hover:text-white"
                >
                  <FontAwesomeIcon icon={item.icon} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-[1.6rem] font-semibold text-white">Khám phá</h2>
            <ul className="mt-5 space-y-4 text-[1.4rem]">
              {marketplaceLinks.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="transition-colors hover:text-orange-400"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-[1.6rem] font-semibold text-white">Hỗ trợ</h2>
            <ul className="mt-5 space-y-4 text-[1.4rem]">
              {supportLinks.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="transition-colors hover:text-orange-400"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-[1.6rem] font-semibold text-white">Liên hệ</h2>
            <ul className="mt-5 space-y-4 text-[1.4rem]">
              <li className="flex items-start gap-3">
                <FontAwesomeIcon
                  icon={faLocationDot}
                  className="mt-1 w-5 shrink-0 text-orange-500"
                />
                <span>Thành phố Hồ Chí Minh, Việt Nam</span>
              </li>
              <li>
                <a
                  href="tel:19001234"
                  className="flex items-center gap-3 transition-colors hover:text-orange-400"
                >
                  <FontAwesomeIcon
                    icon={faPhone}
                    className="w-5 shrink-0 text-orange-500"
                  />
                  <span>1900 1234</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:hotro@choxemay.vn"
                  className="flex items-center gap-3 transition-colors hover:text-orange-400"
                >
                  <FontAwesomeIcon
                    icon={faEnvelope}
                    className="w-5 shrink-0 text-orange-500"
                  />
                  <span>hotro@choxemay.vn</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-slate-800 pt-6 text-[1.3rem] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} Chợ Xe Máy. Mọi quyền được bảo lưu.</p>
          <p>Mua bán an tâm, chọn xe đúng ý.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
