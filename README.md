# astro-blur-images

Blurred placeholders for images in Astro Markdown. Each image renders as a tiny blurred preview inlined in the HTML, sized to the image's aspect ratio so the page does not shift, and fades to the full image once it loads.

It has three parts:

- `remarkBlurImage`, a remark plugin that generates a 40px WebP placeholder for each Markdown image with [sharp](https://sharp.pixelplumbing.com/)
- `rehypeBlurWrapper`, a rehype plugin that renders the placeholder behind the lazily loaded full image
- `blurImages()`, an Astro integration that adds the stylesheet and the small client script that reveals each full image

## Install

```sh
bun add astro-blur-images @astrojs/markdown-remark
```

`sharp` is a peer dependency, which Astro already installs for its image service.

## Use

Astro 7 renders Markdown with Sätteri by default, and remark and rehype plugins only run in the `unified()` processor, so the plugins go there:

```js
// astro.config.mjs
import { unified } from "@astrojs/markdown-remark"
import { defineConfig } from "astro/config"
import blurImages, { rehypeBlurWrapper, remarkBlurImage } from "astro-blur-images"

export default defineConfig({
  integrations: [blurImages()],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkBlurImage],
      rehypePlugins: [rehypeBlurWrapper],
    }),
  },
})
```

Both plugins are needed: the remark plugin makes the placeholders and the rehype plugin renders them. Images are found by URL:

- `./photo.jpg` resolves against the Markdown file, and Astro still optimizes the full image as usual
- `/photo.jpg` resolves against `public/`
- `https://...` is downloaded at build time
- an image that cannot be read renders as a plain `<img>`

### Options

```js
remarkPlugins: [[remarkBlurImage, { size: 40, quality: 20, publicDir: "public" }]]
```

| Option | Default | |
| --- | --- | --- |
| `size` | `40` | Width of the placeholder in pixels. Larger is sharper and heavier in the HTML. |
| `quality` | `20` | WebP quality of the placeholder, from 1 to 100. |
| `publicDir` | `public` in the working directory | Where root-relative URLs resolve. Set it when Astro runs from a directory other than the project root. |

### Styling

The integration adds `styles.css`. Override these custom properties to restyle it:

| Property | Default |
| --- | --- |
| `--blur-image-radius` | `0.375rem` |
| `--blur-image-blur` | `20px` |
| `--blur-image-duration` | `0.4s` |

The rendered markup is a `span.blur-wrapper` holding `img.blur-placeholder` and `img.blur-full`. The wrapper gets `data-loaded` once the full image loads, or fails to. Without JavaScript the full image shows right away, and with reduced motion it appears without the fade.

To use the plugins without the integration, import `astro-blur-images/styles.css` and `astro-blur-images/client` yourself.

## Develop

```sh
bun install
bun test                 # runs the plugins through unified against generated images
bun run example:build    # builds the package and the Astro site in example/
bun run example:dev      # the example in astro dev
bun run example:preview  # the built example served by wrangler, as it runs on Cloudflare
```

## Release

Run the Release workflow from the Actions tab, or:

```sh
gh workflow run release --field bump=minor
```

It runs the tests, builds the example, and bumps the version. Then it deploys the example to Cloudflare Workers, pushes the release commit and tag to `main`, and publishes release notes. Nothing is pushed until the deploy succeeds, so a failed run leaves nothing to undo.

The workflow needs two repository secrets: `CLOUDFLARE_API_TOKEN`, a token that can edit Workers scripts on the account and Workers routes on the `josef.dev` zone, and `CLOUDFLARE_ACCOUNT_ID`. The example's Worker config is `example/wrangler.jsonc`, which serves the prerendered site as static assets at [astro-blur-images.josef.dev](https://astro-blur-images.josef.dev).

## Publish

```sh
npm publish
```

`prepublishOnly` builds `dist/` and runs the tests first. Only `dist/`, `styles.css`, the README, and the license are published.
