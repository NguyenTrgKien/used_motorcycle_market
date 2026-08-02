function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-100 px-5 py-5 sm:px-7 lg:px-8">
      <div className="min-w-0">
        <h2 className="text-[2.2rem] font-semibold leading-tight text-gray-950 sm:text-[2.4rem]">
          {title}
        </h2>
        <p className="mt-1 text-[1.35rem] text-gray-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

export default SectionHeading;
