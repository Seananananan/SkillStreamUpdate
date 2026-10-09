export default function Loading() {
  return (
    <main
      id="main-content"
      className="flex min-h-screen items-start justify-center bg-canvas px-5 py-16"
    >
      <div className="w-full max-w-2xl">
        <div className="h-7 w-56 animate-pulse rounded bg-subtle" />
        <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-subtle" />
        <div className="mt-8 h-28 animate-pulse rounded-[10px] border border-line bg-subtle" />
        <div className="mt-5 h-44 animate-pulse rounded-[10px] border border-line bg-subtle" />
        <p role="status" className="sr-only">
          Loading
        </p>
      </div>
    </main>
  );
}
