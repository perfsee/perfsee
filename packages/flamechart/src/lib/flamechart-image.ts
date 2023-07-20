export class FlamechartImage {
  public id: string
  private listeners: ((img: this) => void)[] = []
  public bitmap: null | ImageBitmap = null

  constructor(id: string) {
    this.id = id
  }

  drawFitInRect(ctx: CanvasRenderingContext2D, dx: number, dy: number, w: number, h: number) {
    if (!this.bitmap) {
      return
    }
    let scale = w / this.bitmap.width

    // If the height is too big even after scaling based on width, scale based on height instead
    if (this.bitmap.height * scale > h) {
      scale = h / this.bitmap.height
    }

    // Calculate the position to start drawing the image so it is centered
    let startX = (w - this.bitmap.width * scale) / 2
    let startY = (h - this.bitmap.height * scale) / 2

    ctx.drawImage(this.bitmap, dx + startX, dy + startY, this.bitmap.width * scale, this.bitmap.height * scale)
  }

  addEventListener(_: 'update', cb: (img: this) => void) {
    this.listeners.push(cb)
  }

  removeEventListener(_: 'update', cb: (img: this) => void) {
    this.listeners = this.listeners.filter((c) => c !== cb)
  }

  private emitUpdate() {
    for (const listener of this.listeners) {
      listener(this)
    }
  }

  static createFromBitmap(id: string, bitmap: ImageBitmap) {
    const img = new FlamechartImage(id)
    img.bitmap = bitmap
    return img
  }

  static createFromPromise(id: string, promise: Promise<ImageBitmap>) {
    const img = new FlamechartImage(id)
    promise.then((bitmap) => {
      img.bitmap = bitmap
      img.emitUpdate()
    })
    return img
  }

  static createFromSvgStr(id: string, svgStr: string) {
    return FlamechartImage.createFromPromise(
      id,
      new Promise((resolve) => {
        const img = document.createElement('img')
        img.src = 'data:image/svg+xml;base64,' + btoa(svgStr)

        img.onload = () => {
          resolve(createImageBitmap(img, 0, 0, img.width || 128, img.height || 128, {}))
        }
      }),
    )
  }

  static createFromUrl(id: string, url: string) {
    return FlamechartImage.createFromPromise(
      id,
      new Promise((resolve) => {
        const img = document.createElement('img')
        img.src = url

        img.onload = () => {
          resolve(createImageBitmap(img, 0, 0, img.width || 128, img.height || 128, {}))
        }
      }),
    )
  }

  static parseStrWithImageLabel(str: string) {
    if (str.startsWith('[img:')) {
      const end = str.indexOf(']')
      const imageId = str.substring(5, end)
      return {
        str: str.substring(end + 1),
        imageId,
      }
    }
    return {
      str,
    }
  }
}
