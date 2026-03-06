export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-brand">404</h1>
        <p className="text-gray-500 mt-2">Page not found</p>
        <a href="/" className="mt-4 inline-block text-brand hover:underline">
          Go home
        </a>
      </div>
    </div>
  );
}
