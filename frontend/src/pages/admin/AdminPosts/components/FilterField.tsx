import type { ReactNode } from "react";

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[1.3rem] font-medium text-gray-600">
        {label}
      </span>
      {children}
    </label>
  );
}

export default FilterField;
