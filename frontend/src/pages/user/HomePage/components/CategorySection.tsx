import {
  faBolt,
  faBus,
  faCarSide,
  faGaugeHigh,
  faMotorcycle,
  faTractor,
  faTruck,
  faTruckPickup,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import type { HomeCategory } from "../types";
import SectionError from "./SectionError";
import { CategorySectionSkeleton } from "./Skeletons";

function CategorySection({
  categories,
  isLoading,
  hasError,
  onRetry,
}: {
  categories: HomeCategory[];
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
}) {
  if (isLoading) {
    return <CategorySectionSkeleton />;
  }

  if (hasError) {
    return (
      <SectionError
        title="Không thể tải danh mục"
        description="Đã có sự cố khi tải danh sách danh mục."
        onRetry={onRetry}
      />
    );
  }

  return (
    <section className="rounded-2xl bg-white px-5 py-5 sm:px-7">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {categories.slice(0, 8).map((category, index) => (
          <Link
            key={category.id}
            to={`/vehicles?category=${encodeURIComponent(category.slug)}`}
            className="flex min-h-[11rem] flex-col items-center justify-center gap-3 rounded-xl px-3 py-4 text-gray-700 transition-colors hover:bg-amber-50 hover:text-amber-700"
          >
            <CategoryVisual category={category} index={index} />
            <span className="line-clamp-1 font-medium">{category.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CategoryVisual({
  category,
  index,
}: {
  category: HomeCategory;
  index: number;
}) {
  const iconMap = {
    motorbike: faMotorcycle,
    motorcycle: faMotorcycle,
    car: faCarSide,
    truck: faTruck,
    electric: faBolt,
    bus: faBus,
    special: faTractor,
  };
  const icons = [faMotorcycle, faCarSide, faTruckPickup, faGaugeHigh];
  const icon =
    iconMap[category.icon as keyof typeof iconMap] ||
    icons[index % icons.length];

  return (
    <span className="flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-xl text-[2.4rem] text-amber-500">
      {category.image ? (
        <img
          src={category.image}
          alt={category.name}
          className="h-full w-full object-contain"
        />
      ) : (
        <FontAwesomeIcon icon={icon} />
      )}
    </span>
  );
}

export default CategorySection;
