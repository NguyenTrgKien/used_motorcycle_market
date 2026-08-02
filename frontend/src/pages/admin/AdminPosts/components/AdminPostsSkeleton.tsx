function AdminPostsSkeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 5 }).map((_, index) => (
        <article
          key={index}
          className="grid gap-4 p-5 xl:grid-cols-[10rem_1.2fr_1fr_0.8fr_0.8fr_14rem] xl:items-center"
        >
          <div className="h-[8rem] animate-pulse rounded-lg border border-gray-300 bg-gray-200" />
          <div className="min-w-0 space-y-3">
            <div className="h-6 w-4/5 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-3/5 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-200" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
          <div className="h-5 w-28 animate-pulse rounded bg-gray-200" />
          <div className="h-7 w-24 animate-pulse rounded-full bg-gray-200" />
          <div className="h-12 w-full animate-pulse rounded-lg border border-gray-300 bg-gray-100" />
        </article>
      ))}
    </div>
  );
}

export default AdminPostsSkeleton;
