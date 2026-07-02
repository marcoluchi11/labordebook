export function ViewerLoading({ className = 'fixed inset-0' }: { className?: string }) {
  return (
    <div className={`${className} bg-gray-900 flex flex-col items-center justify-center gap-4 text-gray-400`}>
      <div
        className="h-10 w-10 rounded-full border-2 border-gray-700 border-t-gray-300 animate-spin motion-reduce:animate-none"
        aria-hidden="true"
      />
      <span>Cargando libro…</span>
    </div>
  )
}
