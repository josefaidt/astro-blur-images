import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import rehypeStringify from "rehype-stringify"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import sharp from "sharp"
import { unified } from "unified"
import type { RemarkBlurImageOptions } from "../src/index.ts"
import { rehypeBlurWrapper, remarkBlurImage } from "../src/index.ts"

let dir: string
let server: ReturnType<typeof Bun.serve>
let landscape: Buffer

function solid(width: number, height: number) {
  return sharp({ create: { width, height, channels: 3, background: "#c6797e" } })
}

async function render(markdown: string, options?: RemarkBlurImageOptions): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkBlurImage, options)
    .use(remarkRehype)
    .use(rehypeBlurWrapper)
    .use(rehypeStringify)
    .process({ value: markdown, path: join(dir, "post.md") })
  return String(file)
}

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "astro-blur-images-"))
  landscape = await solid(300, 200).png().toBuffer()
  await writeFile(join(dir, "landscape.png"), landscape)
  // stored 300x200 with EXIF orientation 6, so it displays 200 wide and 300 tall
  await writeFile(
    join(dir, "rotated.jpg"),
    await solid(300, 200).jpeg().withMetadata({ orientation: 6 }).toBuffer(),
  )
  await writeFile(join(dir, "public-image.png"), landscape)
  server = Bun.serve({ port: 0, fetch: () => new Response(new Uint8Array(landscape)) })
})

afterAll(async () => {
  await server.stop(true)
  await rm(dir, { recursive: true, force: true })
})

describe("remarkBlurImage with rehypeBlurWrapper", () => {
  test("wraps a relative image with a placeholder sized to its aspect ratio", async () => {
    const html = await render("![a landscape](./landscape.png)")

    expect(html).toContain('<p><span class="blur-wrapper" style="aspect-ratio: 300 / 200">')
    expect(html).toMatch(
      /<img class="blur-placeholder" src="data:image\/webp;base64,[^"]+" alt="" aria-hidden="true">/,
    )
    expect(html).toContain(
      '<img src="./landscape.png" alt="a landscape" class="blur-full" loading="lazy" decoding="async" width="300" height="200">',
    )
    // the data the two plugins pass between them never reaches the HTML
    expect(html).not.toContain("data-blur")
  })

  test("downloads a remote image to make its placeholder", async () => {
    const html = await render(`![remote](${server.url.href}remote.png)`)

    expect(html).toContain('style="aspect-ratio: 300 / 200"')
    expect(html).toContain(`src="${server.url.href}remote.png"`)
  })

  test("resolves a root-relative image against publicDir", async () => {
    const html = await render("![public](/public-image.png)", { publicDir: dir })

    expect(html).toContain('style="aspect-ratio: 300 / 200"')
  })

  test("uses the dimensions an image displays at after EXIF orientation", async () => {
    const html = await render("![rotated](./rotated.jpg)")

    expect(html).toContain('style="aspect-ratio: 200 / 300"')
    expect(html).toContain('width="200" height="300"')
  })

  test("leaves an image it cannot read as a plain img", async () => {
    const html = await render("![missing](./missing.png)")

    expect(html).toBe('<p><img src="./missing.png" alt="missing"></p>')
  })
})
