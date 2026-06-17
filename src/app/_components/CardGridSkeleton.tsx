export function CardGridSkeleton() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <div className="h-4 w-20 bg-gray-100 rounded-full mb-6 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          >
            <div className="h-44 bg-gray-100 animate-pulse" />
            <div className="px-4 pt-4 pb-3 space-y-3">
              <div className="h-3 w-16 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-5 w-32 bg-gray-100 rounded-full animate-pulse" />
              <div className="flex gap-2 pt-1">
                <div className="flex-1 h-14 bg-gray-100 rounded-xl animate-pulse" />
                <div className="flex-1 h-14 bg-gray-100 rounded-xl animate-pulse" />
                <div className="flex-1 h-14 bg-gray-100 rounded-xl animate-pulse" />
              </div>
            </div>
            <div className="px-4 pb-4 flex gap-2">
              <div className="h-6 w-20 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-6 w-16 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
