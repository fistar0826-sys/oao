import React from "react";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ✅ Firebase 設定物件修正：最後一行沒有多餘逗號
const firebaseConfig = {
  apiKey: "AIzaSyC_placeholder_api_key",
  authDomain: "placeholder-project.firebaseapp.com",
  projectId: "placeholder-project"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function OriginalApp() {
  return (
    <div>
      <h1>Personal Finance Navigator</h1>
      <p>Firebase 已成功初始化</p>
    </div>
  );
}

export default OriginalApp;
