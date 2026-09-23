'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Critical Application Error</h2>
        <p className="text-neutral-400 max-w-md mb-6">{error?.message}</p>
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
        >
          Reload
        </button>
      </body>
    </html>
  );
}
