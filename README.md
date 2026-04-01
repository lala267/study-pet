# 桌面爬宠学习计时器

第一阶段 MVP，基于 Tauri + React + TypeScript。

## 启动

1. 安装依赖：`npm install`
2. 若未安装 Rust，请先安装 Rust 工具链
3. 桌面开发模式：`npm run tauri dev`
4. 仅前端预览：`npm run dev`

## 桌面模式说明

- `npm run dev` 只会启动浏览器里的前端预览，不是真正桌面应用
- `npm run tauri dev` 才会以 Tauri 独立窗口方式运行
- 当前机器若缺少 Rust / Cargo，先安装 Rust 工具链后再运行桌面版

## 已实现

- 小型桌面计时器 UI
- 桌宠状态切换
- 正计时 / 番茄钟
- 开始 / 暂停 / 继续 / 重置 / 结束本轮
- 今日累计学习时长
- 本地持久化设置和今日累计时长
