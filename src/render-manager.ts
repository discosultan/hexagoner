import { Shape } from "./shape";

export class RenderManager {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(
    public readonly canvas: HTMLCanvasElement,
    public readonly shapes: Shape[],
    private readonly translationFactorX = 0.5,
    private readonly translationFactorY = 0.5,
  ) {
    this.ctx = canvas.getContext("2d") ??
    (() => {
      throw Error("2D context not available.");
    })();;
  }

  step(dt: number) {
    this.ensureCanvasValid();
    this.ctx.clearRect(
      -this.translationFactorX * this.canvas.width,
      -this.translationFactorY * this.canvas.height,
      this.canvas.width,
      this.canvas.height
    );
    this.renderShapes(this.ctx, this.shapes);
  }

  renderShapes(ctx: CanvasRenderingContext2D, shapes: Shape[]) {
    for (const shape of shapes) {
      const points = shape.worldPoints;
      if (points.length === 0) continue;

      // Setup path.
      ctx.beginPath();
      let p = points[points.length - 1];
      ctx.moveTo(p.x, p.y);
      for (p of points) ctx.lineTo(p.x, p.y);

      // Render.
      shape.render(ctx);

      // Render children.
      // Child shapes are always clipped to their parents.
      if (shape.children.length > 0) {
        ctx.save();
        ctx.clip();
        this.renderShapes(ctx, shape.children);
        ctx.restore();
      }
    }
  }

  ensureCanvasValid() {
    if (
      this.canvas.clientWidth !== this.canvas.width ||
      this.canvas.clientHeight !== this.canvas.height
    ) {
      this.canvas.width = this.canvas.clientWidth;
      this.canvas.height = this.canvas.clientHeight;

      this.ctx.translate(
        this.canvas.width * this.translationFactorX,
        this.canvas.height * this.translationFactorY
      );
      this.ctx.lineCap = "round";
      this.ctx.lineJoin = "round";
    }
  }
}
