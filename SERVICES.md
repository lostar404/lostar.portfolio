# LOSTAR 作品集 — 使用中的外部服務清單

更新日期：2026-10-21

## 1. GitHub（網站託管）
- 倉庫：https://github.com/lostar404/lostar.portfolio
- 網站網址：https://lostar404.github.io/lostar.portfolio/
- 用途：用 GitHub Pages 免費託管這個靜態網站。推上 main 分支後約 1～2 分鐘自動更新。
- 帳號：lostar404（登入信箱 xiaovip2002@gmail.com）

## 2. Supabase（留言資料庫）
- 後台：https://supabase.com/dashboard
- 組織：lostar.portfolio（Free）／專案：lostar-notes
- 專案網址：https://gbwoznjcujkafuzbkqhl.supabase.co
- 資料表：`public.notes`（欄位 id、body、hidden、created_at）
- 用途：儲存全螢幕版右側的訪客留言，所有訪客看到同一批。
- 網站裡使用的是「Publishable key」（可公開，已寫在網頁程式中）。
- 管理留言：後台 Table Editor → notes。把 `hidden` 打勾＝從網站隱藏，也可直接刪除列。
- 防護：資料表有 RLS（訪客只能讀取未隱藏的留言、新增 1～30 字留言）；整站每分鐘上限 20 則；前端每次送出間隔 8 秒。
- 注意：**Secret key（sb_secret_…）與資料庫密碼絕對不要放進網站或貼給任何人。**
- 免費方案注意：專案長時間（約 7 天）沒有任何連線可能被暫停，暫停時留言會讀取／送出失敗，到後台按「Restore」即可。

## 3. GoatCounter（流量統計，無 cookie）
- 站台代碼：lostar404 → https://lostar404.goatcounter.com
- 用途：計算瀏覽次數與按鈕點擊事件；網站上「已有 N 位旅人經過此處」讀取它的公開計數。
- 代碼設定在網頁程式的 `GOATCOUNTER_CODE`。

## 4. Abacus（備用訪客計數）
- 服務：https://abacus.jasoncameron.dev（第三方免費計數 API）
- 命名空間：lostar404-portfolio／鍵：visits
- 用途：GoatCounter 之外的備援訪客計數，基準值 45。

## 5. Google Fonts（字體）
- 服務：fonts.googleapis.com／fonts.gstatic.com
- 使用字體：Fraunces、Space Grotesk 系列、Noto Serif TC、Noto Sans TC 等。
- 用途：讓不同裝置顯示相同字體。

## 6. 連結出去的外部網站（不是服務，只是連結）
- Instagram：https://www.instagram.com/lostar.0404
- 友站（NEIGHBOR STARS）：https://sakanaouo.github.io/（郭乃瑜 作品集）

## 7. 開發時使用的輔助
- Claude（預覽頁面為 claude.ai 的 Artifact，僅作預覽；正式網站是上面的 GitHub Pages）。

---
備註：電話與住址不放在網站任何地方。
