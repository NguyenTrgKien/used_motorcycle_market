import { faRotateRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function SectionError({
  title,
  description,
  onRetry,
  className = "",
}: {
  title: string;
  description: string;
  onRetry: () => void;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-red-100 bg-white px-6 py-10 text-center ${className}`}
    >
      <h2 className="text-[1.8rem] font-semibold text-gray-900">{title}</h2>
      <p className="mt-2 text-[1.35rem] text-gray-500">{description}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-amber-500 px-5 font-medium text-white transition-colors hover:bg-amber-600"
      >
        <FontAwesomeIcon icon={faRotateRight} />
        Thử lại
      </button>
    </section>
  );
}

export default SectionError;
