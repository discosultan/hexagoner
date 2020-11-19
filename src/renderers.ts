import { Shape } from "./shape";

export interface Renderer {
  render(ctx: CanvasRenderingContext2D, shape: Shape): void;
}

export class ImageRenderer implements Renderer {
  constructor(private readonly image: HTMLImageElement) {}

  render(ctx: CanvasRenderingContext2D, shape: Shape) {
    const img = this.image;
    const { x, y, width, height } = shape.worldBoundingRect;
    ctx.drawImage(img, 0, 0, img.width, img.height, x, y, width, height);
  }
}

export class FillRenderer implements Renderer {
  constructor(private readonly fillStyle: string = "#EA2E49") {}

  render(ctx: CanvasRenderingContext2D, shape: Shape) {
    ctx.fillStyle = this.fillStyle;
    ctx.fill();
  }
}

export class StrokeRenderer implements Renderer {
  constructor(
    private readonly strokeStyle: string = "#EA2E49",
    private readonly lineWidth: number = 8,
  ) {}

  render(ctx: CanvasRenderingContext2D, shape: Shape) {
    ctx.strokeStyle = this.strokeStyle;
    ctx.lineWidth = this.lineWidth;
    ctx.stroke();
  }
}

export class TextRenderer implements Renderer {
  constructor(
    private readonly text: string,
    private readonly font: string = "15px Arial",
    private readonly textAlign: CanvasTextAlign = "start",
    private readonly fillStyle: string = "#EA2E49",
  ) {}

  render(ctx: CanvasRenderingContext2D, shape: Shape) {
    ctx.font = this.font;
    ctx.textAlign = this.textAlign;
    ctx.fillStyle = this.fillStyle;
    const { x, y, height } = shape.worldBoundingRect;
    ctx.fillText(this.text, x, y + height * 0.5);
  }
}
