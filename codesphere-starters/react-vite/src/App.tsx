import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-slate-900">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          React + Vite + TypeScript
        </h1>
        <p className="text-sm text-slate-600 mb-5 leading-relaxed">
          Edit <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">src/App.tsx</code> and save to see instant updates.
        </p>
        <button
          type="button"
          onClick={() => setCount((c) => c + 1)}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Count: {count}
        </button>
      </div>
    </main>
  );
}

export default App;
