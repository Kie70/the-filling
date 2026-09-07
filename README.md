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
- `public/audio/classroom-ambience.wav`：背景音乐。
- `exports/`：滚动进度 88%–95% 的往返循环视频。
- `.openai/hosting.json`：现有 Sites 静态部署配置。

视频随滚动变化，不会自动播放时间轴。支持减少动态效果设置；浏览器无法解码帧库时回退到视频定位。背景音轨通过用户交互开启，右上角声音图标可切换。

当前部署：https://vectrus-scroll-cinema.zhuby933.chatgpt.site （私有访问）。

GitHub 保存源码；Sites 部署需单独发布，推送 GitHub 不会自动更新线上版本。
