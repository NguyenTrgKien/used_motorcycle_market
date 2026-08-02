import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCarSide,
  faChevronRight,
  faMotorcycle,
  faTruck,
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCategories } from "../apis/category.api";

function CategoryMenuPopup({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    staleTime: 10 * 60 * 1000,
  });
  const activeCategories = categories.filter(
    (category) => category.status === "active",
  );

  const getCategoryIcon = (slug: string) => {
    if (slug === "xe-may" || slug === "xe-dien") return faMotorcycle;
    if (slug === "xe-tai" || slug === "xe-chuyen-dung") return faTruck;
    return faCarSide;
  };

  const handleSelectCategory = (slug: string) => {
    onClose();
    navigate(`/vehicles?category=${encodeURIComponent(slug)}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="absolute left-0 top-[calc(100%+1.4rem)] z-[999] w-[36rem] overflow-hidden rounded-2xl border border-gray-200 bg-white text-gray-700 shadow-2xl"
    >
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="font-semibold text-gray-900">Danh mục xe</h3>
        <p className="mt-1 text-[1.4rem] text-gray-500">
          Chọn loại xe bạn muốn tìm kiếm
        </p>
      </div>

      <div className="max-h-[42rem] overflow-y-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex animate-pulse items-center gap-3 rounded-xl p-3"
              >
                <div className="h-14 w-14 rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-gray-200" />
                  <div className="h-3 w-3/4 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : activeCategories.length > 0 ? (
          activeCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => handleSelectCategory(category.slug)}
              className="group flex w-full items-center gap-5 rounded-xl p-3 text-left transition-colors hover:bg-orange-50"
            >
              <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl text-[2rem] text-orange-600">
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <FontAwesomeIcon icon={getCategoryIcon(category.slug)} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-gray-900">
                  {category.name}
                </span>
              </span>
              <FontAwesomeIcon
                icon={faChevronRight}
                className="text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-orange-500"
              />
            </button>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-gray-500">
            Chưa có danh mục xe
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default CategoryMenuPopup;
