import React from "react";
import { initializeApp } from "firebase/app";

// Firebase 設定（請換成你自己的專案設定值）
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
};

// 初始化 Firebase
initializeApp(firebaseConfig);

function App() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">🚀 Personal Finance Navigator</h1>
      <p className="mt-2">React + Vite + Tailwind + Firebase 已成功初始化 🎉</p>
    </div>
  );
}

export default App;
