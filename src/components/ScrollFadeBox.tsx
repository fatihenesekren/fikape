export function ScrollFadeBox({
  children,
  itemCount,
  visibleCount = 4,
  maxHeight,
}: {
  children: React.ReactNode;
  itemCount: number;
  visibleCount?: number;
  maxHeight: number;
}) {
  if (itemCount <= visibleCount) {
    return <>{children}</>;
  }

  return (
    <div className="border border-gray-100 rounded-2xl p-3 bg-gray-50/40">
      <div
        className="overflow-y-auto pr-1 -mr-1"
        style={{
          maxHeight,
          WebkitOverflowScrolling: "touch",
          maskImage: "linear-gradient(to bottom, black calc(100% - 28px), transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black calc(100% - 28px), transparent 100%)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
