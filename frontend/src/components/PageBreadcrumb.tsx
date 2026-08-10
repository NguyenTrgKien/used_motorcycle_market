import { faChevronRight, faHouse } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, useLocation } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  to?: string;
}

const settingLabels: Record<string, string> = {
  profile: "Thông tin cá nhân",
  address: "Địa chỉ",
  security: "Bảo mật & quyền riêng tư",
  "security/password": "Mật khẩu",
  "login-tracking": "Lịch sử đăng nhập",
  "identity-verification": "Xác minh danh tính",
  "professional-seller": "Người bán chuyên",
};

function getBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  if (pathname === "/about") {
    return [{ label: "Giới thiệu" }];
  }
  if (pathname === "/contact") {
    return [{ label: "Liên hệ hỗ trợ" }];
  }
  if (pathname === "/notifications") {
    return [{ label: "Thông báo" }];
  }
  if (pathname === "/my-reports") {
    return [{ label: "Báo cáo của tôi" }];
  }
  if (pathname === "/saved-listings") {
    return [{ label: "Tin đã lưu" }];
  }
  if (pathname === "/transactions") {
    return [{ label: "Lịch sử giao dịch" }];
  }
  if (pathname === "/posts/manage") {
    return [{ label: "Quản lý tin" }];
  }
  if (pathname === "/seller/plans") {
    return [
      { label: "Quản lý bán hàng", to: "/posts/manage" },
      { label: "Gói người bán" },
    ];
  }
  if (pathname === "/posts/create") {
    return [
      { label: "Quản lý tin", to: "/posts/manage" },
      { label: "Đăng tin" },
    ];
  }
  if (/^\/posts\/[^/]+\/edit$/.test(pathname)) {
    return [
      { label: "Quản lý tin", to: "/posts/manage" },
      { label: "Chỉnh sửa tin" },
    ];
  }
  if (/^\/posts\/[^/]+$/.test(pathname)) {
    return [
      { label: "Tìm kiếm xe", to: "/vehicles" },
      { label: "Chi tiết tin đăng" },
    ];
  }
  if (/^\/users\/[^/]+$/.test(pathname)) {
    return [{ label: "Hồ sơ người bán" }];
  }
  if (pathname.startsWith("/setting/")) {
    const settingPath = pathname.replace("/setting/", "");
    return [
      { label: "Cài đặt tài khoản", to: "/setting/profile" },
      { label: settingLabels[settingPath] || "Cài đặt" },
    ];
  }

  return [];
}

function PageBreadcrumb() {
  const { pathname } = useLocation();

  if (
    pathname === "/" ||
    pathname === "/vehicles" ||
    pathname.startsWith("/messages")
  ) {
    return null;
  }

  const items = getBreadcrumbItems(pathname);

  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="mx-auto w-full px-[20rem] pt-6"
    >
      <ol className="flex flex-wrap items-center gap-2 text-[1.3rem] text-gray-500">
        <li>
          <Link
            to="/"
            className="flex items-center gap-2 transition-colors hover:text-amber-600"
          >
            <FontAwesomeIcon icon={faHouse} />
            Trang chủ
          </Link>
        </li>
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="contents">
              <FontAwesomeIcon
                icon={faChevronRight}
                aria-hidden="true"
                className="text-[1rem] text-gray-400"
              />
              {item.to && !isCurrent ? (
                <Link
                  to={item.to}
                  className="transition-colors hover:text-amber-600"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="font-medium text-gray-800"
                  aria-current={isCurrent ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default PageBreadcrumb;
