// @ts-check
import { unified } from "@astrojs/markdown-remark"
import { defineConfig } from "astro/config"
import { fileURLToPath } from "node:url"
// In a project of your own, import from "astro-blur-images" instead
import blurImages, { rehypeBlurWrapper, remarkBlurImage } from "../dist/index.js"

export default defineConfig({
  integrations: [blurImages()],
  markdown: {
    processor: unified({
      remarkPlugins: [
        // publicDir is only needed here because the scripts run Astro from the package root
        [remarkBlurImage, { publicDir: fileURLToPath(new URL("./public", import.meta.url)) }],
      ],
      rehypePlugins: [rehypeBlurWrapper],
    }),
  },
})
