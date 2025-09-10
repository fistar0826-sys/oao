
# 一鍵部署到 GitHub Pages（Vite + React）

這個專案已加入 GitHub Actions 工作流程，推到 `main` 分支就會自動：
1. 安裝依賴
2. 使用 Vite 進行打包，並自動設定 `base`（適用 project pages 與 user/organization pages）
3. 部署到 GitHub Pages

## 使用步驟（最簡單：直接上傳到 GitHub 網頁）
1. 在 GitHub 建立一個新的 Repository（建議命名：`personal-finance-navigator`）。
2. 下載本專案 zip，解壓縮後把全部檔案 **直接拖曳** 上傳到該 Repository（包含 `.github/workflows/deploy.yml`）。
3. 確保分支是 `main`（若是 `master`，可在工作流程的 `branches` 改成 `master`）。
4. Push/Upload 完成後，進入 **Actions** 分頁，等待工作流程完成。
5. 完成後，網站 URL 通常是：
   - User/Org Pages（repo 名稱形如 `你的帳號.github.io`）：`https://你的帳號.github.io/`
   - Project Pages（一般 repo）：`https://你的帳號.github.io/<repo 名稱>/`

> 備註：工作流程會自動判斷是否為 `*.github.io` 專案，並自動設定 `Vite --base`。

## 本地開發（可選）
```bash
npm install
npm run dev
```

## 手動打包（可選）
```bash
npm run build
# 打包輸出在 dist/
```

