export default function BookingLoading() {
  return (
    <div
      aria-busy="true"
      className="w-full bg-surface"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-4 animate-pulse">
        <div className="h-24 rounded-2xl bg-surface-container-low border border-outline-variant/20" />
        <div className="bg-surface-container-lowest rounded-2xl shadow-tier-1 border border-outline-variant/30 p-6 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-12 rounded-xl bg-surface-container-low"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
