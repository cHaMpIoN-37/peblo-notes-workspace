// components/common/Loading.tsx
// Reusable loading component with skeleton placeholders.
// Used across the app when fetching data.

export function Loading() {
  return (
    <div className="space-y-4 py-8">
      {/* Title Skeleton */}
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48 animate-pulse" />

      {/* Grid of loading cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-3 animate-pulse"
          >
            {/* Card title */}
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />

            {/* Card content */}
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
            </div>

            {/* Tags */}
            <div className="flex gap-2 pt-2">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-16" />
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-16" />
            </div>

            {/* Footer */}
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded pt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
