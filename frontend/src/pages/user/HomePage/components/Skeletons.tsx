function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

function SectionHeadingSkeleton() {
  return (
    <div className="border-b border-gray-100 px-5 py-6 sm:px-7 lg:px-8">
      <SkeletonBlock className="h-7 w-48" />
      <SkeletonBlock className="mt-3 h-4 w-72 max-w-full bg-gray-100" />
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div className="flex min-h-[11rem] flex-col items-center justify-center gap-3 px-3 py-4">
      <SkeletonBlock className="h-20 w-20 rounded-xl" />
      <SkeletonBlock className="h-4 w-20 bg-gray-100" />
    </div>
  );
}

export function CategorySectionSkeleton() {
  return (
    <section className="rounded-2xl bg-white px-5 py-5 sm:px-7">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {Array.from({ length: 8 }).map((_, index) => (
          <CategorySkeleton key={index} />
        ))}
      </div>
    </section>
  );
}

export function PostSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <SkeletonBlock className="aspect-[4/3] rounded-none" />
      <div className="space-y-3 p-4">
        <SkeletonBlock className="h-5 w-full" />
        <SkeletonBlock className="h-5 w-4/5 bg-gray-100" />
        <SkeletonBlock className="h-6 w-32 bg-amber-100" />
        <SkeletonBlock className="h-4 w-3/4 bg-gray-100" />
      </div>
    </div>
  );
}

export function PostSectionSkeleton({ count = 8 }: { count?: number }) {
  return (
    <section className="mt-8 rounded-2xl bg-white">
      <SectionHeadingSkeleton />
      <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-4 lg:p-8">
        {Array.from({ length: count }).map((_, index) => (
          <PostSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}

export function BrandSectionSkeleton() {
  return (
    <section className="mt-8 rounded-2xl bg-white px-5 py-7 sm:px-7 lg:px-8">
      <div className="mb-6">
        <SkeletonBlock className="h-7 w-64 max-w-full" />
        <SkeletonBlock className="mt-3 h-4 w-52 bg-gray-100" />
      </div>
      <div className="flex gap-3 overflow-hidden pb-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <SkeletonBlock
            key={index}
            className="h-32 flex-none basis-[45%] rounded-xl sm:basis-[28%] lg:basis-[calc((100%-3.75rem)/6)]"
          />
        ))}
      </div>
    </section>
  );
}
