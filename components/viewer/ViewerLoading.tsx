interface Props {
  className?: string
  progress?: number | null
}

export function ViewerLoading({ className = 'fixed inset-0', progress }: Props) {
  const hasProgress = progress != null

  return (
    <div className={`${className} bg-gray-900 flex flex-col items-center justify-center gap-4 text-gray-400`}>
      {hasProgress ? (
        <div
          className="w-48 h-2 rounded-full bg-gray-700 overflow-hidden"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Cargando libro"
        >
          <div
            className="h-full bg-gray-300 transition-[width] duration-150 ease-out motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : (
        <div
          className="h-10 w-10 rounded-full border-2 border-gray-700 border-t-gray-300 animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
      )}
      <span>{hasProgress ? `Cargando libro… ${progress}%` : 'Cargando libro…'}</span>
    </div>
  )
}
