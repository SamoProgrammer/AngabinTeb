export default function DiscoveryLoading() {
  return (
    <div
      aria-busy="true"
      className="w-full bg-surface"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-4 animate-pulse">
        <div className="h-28 rounded-2xl bg-surface-container-low border border-outline-variant/20" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 rounded-2xl bg-surface-container-lowest shadow-tier-1 border border-outline-variant/30"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
