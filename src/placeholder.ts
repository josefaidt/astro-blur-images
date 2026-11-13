import sharp from "sharp"

/** A tiny blurred stand-in for an image, with the full image's dimensions. */
export interface BlurPlaceholder {
  /** The placeholder as a `data:image/webp;base64,...` URI. */
  dataURI: string
  /** Width of the full image in pixels, after EXIF orientation. */
  width: number
  /** Height of the full image in pixels, after EXIF orientation. */
  height: number
}

/** How the placeholder is generated. */
export interface PlaceholderOptions {
  /** Width of the placeholder in pixels. The browser scales and blurs it. Defaults to 40. */
  size?: number
  /** WebP quality of the placeholder, from 1 to 100. Defaults to 20. */
  quality?: number
}

/** Generates a placeholder from an image file path or the image's bytes. */
export async function createBlurPlaceholder(
  input: string | Buffer,
  options: PlaceholderOptions = {},
): Promise<BlurPlaceholder> {
  const { size = 40, quality = 20 } = options
  const image = sharp(input)
  const { autoOrient } = await image.metadata()

  const placeholder = await image
    .autoOrient()
    .resize(size, null, { withoutEnlargement: true })
    .webp({ quality })
    .toBuffer()

  return {
    dataURI: `data:image/webp;base64,${placeholder.toString("base64")}`,
    width: autoOrient.width,
    height: autoOrient.height,
  }
}

/** Downloads a remote image so a placeholder can be generated from its bytes. */
export async function fetchImage(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch image ${url}: ${response.status}`)
  }
  return Buffer.from(await response.arrayBuffer())
}
