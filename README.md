# LOSTAR 迷航星 — 作品集網站

這是一個純靜態網站（不需要伺服器、不需要安裝任何東西）。

```
index.html          ← 網站本體（所有內容都在這裡）
images/             ← 作品圖片（img-01.webp …）
resume/lostar-resume.pdf   ← 「下載履歷」按鈕下載的檔案（公開版）
.nojekyll           ← 告訴 GitHub 不要處理檔案（可有可無）
README.md           ← 這份說明（上傳後也可以刪掉）
```

## 一、上傳到 GitHub Pages（網頁操作，不用裝任何軟體）

1. 註冊／登入 https://github.com
2. 右上角「＋」→ **New repository**
   - Repository name：例如 `lostar`（若想要網址是 `帳號.github.io`，名稱就必須是 `帳號.github.io`）
   - 選 **Public**
   - 其他選項都不用勾，直接按 **Create repository**
3. 進到新 repository，點 **uploading an existing file**（或 Add file → Upload files）
4. 把**資料夾裡面的東西**全部拖進去：`index.html`、`images` 資料夾、`resume` 資料夾
   - `.nojekyll` 和 `README.md` **可丟可不丟**：沒有它們網站一樣正常運作。`.nojekyll` 是 0 KB 的空檔案（Windows 可能會因為隱藏檔而拖不進去，不用管它）；`README.md` 丟進去只會顯示在 repository 首頁當說明，不影響網站，不想要就不要上傳
   - 注意是拖「裡面的內容」，不是拖外層 `site` 資料夾；`index.html` 必須在最上層
   - 一次最多 100 個檔案，這個網站約 60 個檔案，剛好夠
5. 往下拉按 **Commit changes**，等上傳完成
6. 上方 **Settings** → 左側 **Pages**
   - Source 選 **Deploy from a branch**
   - Branch 選 **main**、資料夾選 **/(root)** → **Save**
7. 等 1～3 分鐘，重新整理 Pages 頁面，最上面會出現網址：
   - 專案網站：`https://你的帳號.github.io/lostar/`
   - 若 repository 叫 `你的帳號.github.io`：`https://你的帳號.github.io/`

## 二、之後怎麼更新內容

最簡單：把改好的新 `index.html`（或新圖片）重新用 **Add file → Upload files** 上傳，同名檔案會被取代，Commit 後 1～2 分鐘自動更新。
（改完看不到變化時，用 Ctrl+Shift+R 強制重新整理。）

## 三、自己的網域（選用）

1. 到 Cloudflare、Namecheap、GoDaddy、PChome 網址註冊等買網域（約每年 300～800 元）
2. GitHub：repository → Settings → Pages → **Custom domain** 填入網域 → Save，並勾 **Enforce HTTPS**
3. 到網域商的 DNS 設定新增：
   - 根網域（例 `lostar.art`）：4 筆 A 記錄，指向 `185.199.108.153`、`185.199.109.153`、`185.199.110.153`、`185.199.111.153`
   - `www`：CNAME 指向 `你的帳號.github.io`
4. 等 DNS 生效（幾分鐘到數小時）

## 四、擁有者模式（排序／釘選作品）

在網址後面加上 `#fix404`，例如 `https://你的帳號.github.io/lostar/#fix404`。
右下角會出現「OWNER MODE」，可在作品頁釘選、調整前後順序。
這些設定只存在**你自己的瀏覽器**，訪客看不到。要讓所有人看到：按「匯出設定」，把產生的那段 `SITE_CONFIG` 文字交給 Claude（或貼進 `index.html` 取代原本的 `var SITE_CONFIG = …;`），重新上傳。

## 五、履歷

- 網站上「下載履歷」下載的是 `resume/lostar-resume.pdf`（公開版：只寫「新北市板橋區」，有手機號碼）。
- **完整版（含完整住址）不要放進這個資料夾**，自己留著，需要時另外寄給對方。
- 要換履歷：用新檔案覆蓋 `resume/lostar-resume.pdf`（檔名不要改）。

## 六、公開前建議檢查

- 牡羊 41 目前沒有作品；各系列的年份、說明、LINE 連結還空著
- 頁面裡的訪客計數使用 goatcounter（xiaoxiangyi.goatcounter.com），如果不想統計可請 Claude 移除
- 手機與電腦各開一次確認；用無痕視窗開網址，確認不是看到舊版快取

## 常見問題

- **打開是 404**：`index.html` 沒有在最上層，或 Pages 還沒部署完（等 3 分鐘）。
- **圖片不見**：`images` 資料夾沒有一起上傳，或資料夾名稱大小寫被改。
- **下載履歷沒反應**：`resume` 資料夾沒上傳，或檔名不是 `lostar-resume.pdf`。

## 讓「已有 N 位旅人經過此處」顯示出來（GoatCounter 設定）

網站程式已經寫好，只差 GoatCounter 後台的設定。程式裡的網站代碼是 `xiaoxiangyi`，對應 `https://xiaoxiangyi.goatcounter.com`。

1. 到 https://www.goatcounter.com 註冊，網站代碼（Site code）填 `xiaoxiangyi`。如果已經註冊過就直接登入，這一步跳過。
2. 登入後進入 `https://xiaoxiangyi.goatcounter.com`，點上方 **Settings（設定）**。
3. 在 Site 設定頁找到 **Allow adding visitor counts on your website**，把它打勾，然後按頁面下方的 Save。這個開關沒開，網頁就抓不到人數，數字區塊會一直隱藏。
4. 把網站放到 GitHub Pages（網址像 `https://xiaoxiangyi.github.io/`）。GoatCounter 只能在正式網址上計數，claude.ai 預覽頁和直接雙擊開 index.html 都不會計數。
5. 用瀏覽器打開你的網站，重新整理一次。約 1.5 秒後，頁面最底部（`© 2026 LOSTAR` 上方）會出現「已有 N 位旅人經過此處」，數字會從 0 跳到實際人數。
6. 如果想先看版面，在網址後面加 `?visitors=1234`，就會顯示假數字，不會影響真實統計。

注意：
- 還沒有任何人瀏覽時是 0，頁面會顯示 1（算你自己這次）。
- 瀏覽器的廣告攔截或隱私外掛可能擋掉 GoatCounter，那位訪客的這次瀏覽就不會被計入，也看不到數字，這是正常現象。
- 數字依「頁面路徑」統計；找不到時會改用整個網站的總數。
- 想關掉統計，把程式裡 `GOATCOUNTER_CODE = 'xiaoxiangyi'` 的代碼清空即可，人數區塊也會自動隱藏。
