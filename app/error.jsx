"use client";

export default function Error({ error, reset }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong.</h1>
      <button
        onClick={reset}
        className="rounded-md bg-brand-500 px-4 py-2 text-white hover:bg-brand-600"
      >
        Try again
      </button>
    </div>
  );
}
