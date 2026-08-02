import { useState } from "react";
import type { VehicleBrand } from "../types";

function BrandSection({
  brands,
  selectedBrand,
  onSelect,
}: {
  brands: VehicleBrand[];
  selectedBrand: string;
  onSelect: (brand: string) => void;
}) {
  if (brands.length === 0) return null;

  return (
    <section className="mt-8 rounded-2xl bg-white px-5 py-7 sm:px-7 lg:px-8">
      <div className="mb-6">
        <h2 className="text-[2.2rem] font-semibold text-gray-950 sm:text-[2.4rem]">
          Khám phá theo thương hiệu
        </h2>
        <p className="mt-1 text-[1.35rem] text-gray-500">
          Chọn hãng xe bạn đang quan tâm
        </p>
      </div>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {brands.map((brand) => {
          return (
            <button
              key={brand.id}
              type="button"
              onClick={() => onSelect(brand.name)}
              className={`flex min-h-32 flex-none basis-[45%] snap-start flex-col items-center justify-center gap-3 rounded-xl border px-4 py-4 text-center font-semibold transition-colors sm:basis-[28%] lg:basis-[calc((100%-3.75rem)/6)] ${
                selectedBrand.toLowerCase() === brand.name.toLowerCase()
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : "border-gray-200 text-gray-700 hover:border-amber-200 hover:bg-amber-50/50"
              }`}
            >
              <BrandLogo brand={brand} />
              <span className="line-clamp-1">{brand.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function BrandLogo({ brand }: { brand: VehicleBrand }) {
  const [hasError, setHasError] = useState(false);

  if (!brand.logo || hasError) {
    return (
      <span className="flex h-14 w-20 items-center justify-center rounded-lg bg-gray-100 text-[1.8rem] font-bold text-gray-400">
        {brand.name.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={brand.logo}
      alt={`Logo ${brand.name}`}
      className="h-14 w-20 object-contain"
      onError={() => setHasError(true)}
    />
  );
}

export default BrandSection;
