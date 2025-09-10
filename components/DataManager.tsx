import React from "react";
import { saveToGitHub } from "../services/githubStorage";

export default function DataManager() {
  const handleSave = async () => {
    await saveToGitHub({
      date: new Date().toISOString(),
      amount: 1234,
      note: "測試存檔"
    });
    alert("✅ 已存入 GitHub data.json！");
  };

  return (
    <div>
      <h2>資料管理</h2>
      <button onClick={handleSave}>存測試資料到 GitHub</button>
    </div>
  );
}
