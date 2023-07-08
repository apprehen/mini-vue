import { defineConfig } from "vite"
import path from 'path'

export default defineConfig({
  // 打包配置
  build: {
    // 入口文件
    lib: {
      entry: path.resolve(__dirname, 'src/index.js'),
      name: 'mini-vue',
      fileName: (format) => `mini-vue.${format}.js`
    },
    // 输出目录
    outDir: path.resolve(__dirname, 'dist'),
    // 静态资源路径
    assetsDir: path.resolve(__dirname, 'assets'),
    // index.html路径
    indexHtml: path.resolve(__dirname, 'index.html'),
    // 是否开启压缩
    minify: false,
    // 是否开启sourcemap
    sourcemap: false,
  }
})