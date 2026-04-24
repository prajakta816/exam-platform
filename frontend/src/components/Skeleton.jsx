// ✨ Shimmer base utility
const Shimmer = ({ className = "" }) => (
  <div
    className={`relative overflow-hidden bg-slate-100 rounded-xl before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.4s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent ${className}`}
  />
);

// ─── Quiz Card Skeleton ─────────────────────────────────────────────────────
export const QuizCardSkeleton = () => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
    {/* Avatar + author row */}
    <div className="flex items-center gap-3">
      <Shimmer className="w-8 h-8 rounded-full" />
      <Shimmer className="h-3 w-24 rounded-full" />
    </div>
    {/* Title */}
    <Shimmer className="h-5 w-3/4 rounded-lg" />
    {/* Description */}
    <Shimmer className="h-3 w-full rounded-full" />
    <Shimmer className="h-3 w-2/3 rounded-full" />
    {/* CTA */}
    <div className="flex items-center gap-2 pt-1">
      <Shimmer className="h-3 w-20 rounded-full" />
      <Shimmer className="h-3 w-3 rounded-full" />
    </div>
  </div>
);

// ─── Note Card Skeleton ─────────────────────────────────────────────────────
export const NoteCardSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden flex flex-col">
    <div className="p-6 flex-grow space-y-4">
      {/* Badge + price */}
      <div className="flex justify-between items-center">
        <Shimmer className="h-5 w-14 rounded-full" />
        <Shimmer className="h-4 w-8 rounded-md" />
      </div>
      {/* Title */}
      <Shimmer className="h-5 w-3/4 rounded-lg" />
      {/* Downloads */}
      <Shimmer className="h-3 w-28 rounded-full" />
      {/* Description lines */}
      <Shimmer className="h-3 w-full rounded-full" />
      <Shimmer className="h-3 w-5/6 rounded-full" />
      <Shimmer className="h-3 w-2/3 rounded-full" />
      {/* Uploader */}
      <div className="flex items-center gap-2 pt-2">
        <Shimmer className="w-6 h-6 rounded-full" />
        <Shimmer className="h-3 w-28 rounded-full" />
      </div>
    </div>
    {/* Action bar */}
    <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
      <Shimmer className="flex-1 h-9 rounded-lg" />
      <Shimmer className="w-9 h-9 rounded-lg" />
      <Shimmer className="w-9 h-9 rounded-lg" />
    </div>
  </div>
);

// ─── Stat Card Skeleton (dashboard grid) ────────────────────────────────────
export const StatCardSkeleton = () => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
    <Shimmer className="w-12 h-12 rounded-2xl" />
    <Shimmer className="h-5 w-32 rounded-lg" />
    <Shimmer className="h-3 w-24 rounded-full" />
    <Shimmer className="h-3 w-16 rounded-full" />
  </div>
);

// ─── List Row Skeleton (dashboard mini-lists) ────────────────────────────────
export const ListRowSkeleton = () => (
  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
    <div className="flex items-center gap-4">
      <Shimmer className="w-11 h-11 rounded-xl" />
      <div className="space-y-2">
        <Shimmer className="h-4 w-36 rounded-lg" />
        <Shimmer className="h-3 w-24 rounded-full" />
      </div>
    </div>
    <Shimmer className="w-8 h-8 rounded-lg" />
  </div>
);

// ─── Grid helpers ─────────────────────────────────────────────────────────────
export const QuizGridSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <QuizCardSkeleton key={i} />
    ))}
  </div>
);

export const NoteGridSkeleton = ({ count = 9 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    {Array.from({ length: count }).map((_, i) => (
      <NoteCardSkeleton key={i} />
    ))}
  </div>
);
