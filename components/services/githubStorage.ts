// components/services/githubStorage.ts

export async function saveToGitHub(newItem: any) {
  const repo = "fistar0826-sys/oao"; // 你的 repo
  const filePath = "data.json";      // 存檔路徑
  const branch = "main";             // 分支
  const token = process.env.GH_TOKEN || ""; // ✅ 從 GitHub Secrets 讀取

  if (!token) {
    throw new Error("❌ GH_TOKEN not found. 請確認已在 GitHub Secrets 設定 GH_TOKEN");
  }

  // 1. 抓取現有 data.json
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`, {
    headers: { Authorization: `token ${token}` }
  });
  const fileData = await res.json();

  // 2. 解碼 JSON
  const content = atob(fileData.content);
  let json = JSON.parse(content);

  // 3. 加入新資料
  json.push(newItem);

  // 4. 更新回 GitHub
  const updatedContent = btoa(JSON.stringify(json, null, 2));
  await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "Update data.json",
      content: updatedContent,
      sha: fileData.sha,
      branch: branch,
    }),
  });
}
