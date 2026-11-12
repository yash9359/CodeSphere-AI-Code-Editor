import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <main className="app-shell">
      <div className="app-card">
        <h1>React + Vite + TypeScript</h1>
        <p>
          Edit <code>src/App.tsx</code> and save to see instant updates.
        </p>
        <button
          type="button"
          onClick={() => setCount((c) => c + 1)}
          className="app-button"
        >
          Count: {count}
        </button>
      </div>
    </main>
  );
}

export default App;
