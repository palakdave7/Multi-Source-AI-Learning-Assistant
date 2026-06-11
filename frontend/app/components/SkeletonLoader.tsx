export function MessageSkeleton() {
  return (
    <div className="flex justify-start animate-pulse">
      <div className="max-w-[75%] space-y-2">
        <div className="bg-slate-800 rounded-2xl px-4 py-3 space-y-2">
          <div className="h-3 bg-slate-700 rounded w-64" />
          <div className="h-3 bg-slate-700 rounded w-48" />
          <div className="h-3 bg-slate-700 rounded w-56" />
        </div>
      </div>
    </div>
  );
}

export function SourceSkeleton() {
  return (
    <div className="bg-slate-800 rounded-lg p-2 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 bg-slate-700 rounded" />
        <div className="h-3 bg-slate-700 rounded w-40" />
      </div>
    </div>
  );
}
