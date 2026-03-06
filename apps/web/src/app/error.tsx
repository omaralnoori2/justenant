'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-500">Something went wrong</h1>
        <button
          onClick={() => reset()}
          className="mt-4 btn-primary"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
