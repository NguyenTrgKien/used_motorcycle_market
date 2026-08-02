import type { ReactNode } from "react";

function Field({
  label,
  required,
  error,
  visible = true,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  visible?: boolean;
  className?: string;
  children: ReactNode;
}) {
  if (!visible) return null;
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-[1.4rem] font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
      {error && <p className="mt-2 text-[1.3rem] text-red-500">{error}</p>}
    </label>
  );
}

export default Field;
