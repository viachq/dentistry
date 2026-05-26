function Pulse({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <Pulse className="h-5 w-3/4 mb-3" />
      <Pulse className="h-3 w-full mb-2" />
      <Pulse className="h-3 w-5/6 mb-4" />
      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <Pulse className="h-5 w-20" />
        <Pulse className="h-5 w-12 rounded-full" />
      </div>
    </div>
  );
}

export function DoctorCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-100">
      <Pulse className="h-64 rounded-none" />
      <div className="p-5">
        <Pulse className="h-5 w-2/3 mb-2" />
        <Pulse className="h-4 w-1/3 mb-3" />
        <Pulse className="h-3 w-full mb-1" />
        <Pulse className="h-3 w-4/5" />
      </div>
    </div>
  );
}

export function ReviewSkeleton() {
  return (
    <div className="border border-gray-100 rounded-2xl p-6">
      <div className="flex gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <Pulse key={i} className="w-4 h-4 rounded-full" />
        ))}
      </div>
      <Pulse className="h-3 w-full mb-2" />
      <Pulse className="h-3 w-4/5 mb-4" />
      <div className="flex items-center justify-between">
        <div>
          <Pulse className="h-4 w-24 mb-1" />
          <Pulse className="h-3 w-16" />
        </div>
        <Pulse className="h-3 w-20" />
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative h-[90vh] min-h-[560px] bg-gray-900 flex items-center">
      <div className="w-full max-w-6xl mx-auto px-6 py-20">
        <Pulse className="h-16 w-80 mb-4 bg-gray-700" />
        <Pulse className="h-5 w-64 mb-10 bg-gray-700" />
        <div className="flex gap-4">
          <Pulse className="h-12 w-48 rounded-xl bg-gray-700" />
          <Pulse className="h-12 w-36 rounded-xl bg-gray-700" />
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <Pulse className="h-8 w-48 mb-3" />
      <Pulse className="h-4 w-72 mb-10" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function DoctorPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8 flex flex-col md:flex-row gap-6">
        <Pulse className="w-40 h-48 rounded-2xl flex-shrink-0" />
        <div className="flex-1">
          <Pulse className="h-7 w-56 mb-2" />
          <Pulse className="h-5 w-32 mb-3" />
          <Pulse className="h-4 w-24 mb-4" />
          <Pulse className="h-3 w-full mb-2" />
          <Pulse className="h-3 w-4/5 mb-4" />
          <Pulse className="h-10 w-44 rounded-lg" />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
        <Pulse className="h-6 w-24 mb-4" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="py-3 flex justify-between border-b border-gray-50 last:border-0">
            <Pulse className="h-4 w-40" />
            <Pulse className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
