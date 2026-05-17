export function Loading({ text = 'Đang tải...', variant = 'default' }) {
  if (variant === 'cards') {
    return Array.from({ length: 3 }).map((_, index) => (
      <div className="san-card" key={index}>
        <div className="skeleton h-40" />
        <div className="san-body">
          <div className="skeleton h-5 w-2/3" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-4/5" />
          <div className="skeleton h-6 w-1/2 mt-2" />
        </div>
        <div className="san-footer">
          <div className="skeleton h-9 flex-1" />
          <div className="skeleton h-9 w-20" />
        </div>
      </div>
    ));
  }

  if (variant === 'table') {
    return (
      <div className="p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="mb-3 grid grid-cols-[56px_1fr_1fr_120px] gap-4" key={index}>
            <div className="skeleton h-5" />
            <div className="skeleton h-5" />
            <div className="skeleton h-5" />
            <div className="skeleton h-5" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="loading-state">
      <div className="spinner" />
      <p>{text}</p>
    </div>
  );
}
