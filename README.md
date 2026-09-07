# 《填塞物》（The Filling）

基于 React 18、TypeScript、Vite 和 Tailwind CSS 3 的心理恐怖叙事单页网站。

## 本地运行

```sh
npm ci
npm run dev
```

## 构建

```sh
npm run build
npm run preview
```

构建产物位于 `dist/`，可以作为静态网站部署。

## 项目结构

- `src/App.tsx`：限宽视频首屏与导航。
- `src/useVideoScrub.ts`：滚动视频控制、WebCodecs 帧解码、缓存和视频定位回退。
- `src/story.md`：故事全文，修改标题或正文时以此文件为准。
- `src/LandingContent.tsx`：章节目录和故事排版。
- `src/BackgroundAudio.tsx`：背景音乐及声音开关。
- `public/videos/classroom-horror.mp4`：页面使用的视频。
- `public/audio/classroom-original.m4a`：从页面原视频直接提取的背景音轨。
- `exports/`：滚动进度 88%–95% 的往返循环视频。
- `.openai/hosting.json`：现有 Sites 静态部署配置。

视频随滚动变化，不会自动播放时间轴。支持减少动态效果设置；浏览器无法解码帧库时回退到视频定位。页面加载时尝试播放背景音；如果浏览器拦截有声自动播放，会在首次点击、触摸或按键时重试。右上角声音图标表示实际播放状态，被拦截后点击图标会直接尝试播放；播放中点击则关闭声音。

## GitHub Pages

自动部署配置位于 `.github/workflows/pages.yml`。仓库已公开并启用 GitHub Pages（Source: GitHub Actions），推送 `main` 或手动运行该工作流会构建并发布网站。

网站地址：https://kie70.github.io/the-filling/

工作流使用 `/the-filling/` 作为构建路径，视频和音频会自动沿用该路径。本地开发仍使用根路径。

GitHub Pages 为当前部署平台。旧的 Sites 私有部署保留，但不会随 GitHub 推送更新。
