import React from "react";
import OriginalApp from "./OriginalApp";
import DataManager from "./components/DataManager";

function App() {
  return (
    <div>
      <h1>Personal Finance Navigator</h1>
      <OriginalApp />
      <hr />
      <DataManager />
    </div>
  );
}

export default App;
