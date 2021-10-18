import React from "react";

import "./App.css";

function App() {

  // 'Unused variable' code smell
  const unusedVar = "";

  // 'Empty block statement' code smell
  try {
  }
  catch(e) {
  }

  return (
    <div className="App">
      <header className="App-header">
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
