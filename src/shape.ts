import { Vec2, Mat2x3 } from "./math";
import { Renderer, StrokeRenderer } from "./renderers";

export enum Type {
  "image",
  "fill",
  "stroke",
  "text",
  "none",
}

export interface BoundingRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ShapeProps = Readonly<{
  renderer: Renderer | null,
  translation: Vec2,
  rotation: number,
  scale: Vec2,
  url: string | null,
}>;

export class Shape {
  private readonly renderer: Renderer | null;
  readonly points: Vec2[];

  readonly children: Shape[] = [];
  parent: Shape | null = null;

  translation: Vec2;
  rotation: number;
  scale: Vec2;
  url: string | null;

  private pointsDirty = true;
  private readonly lazyWorldPoints: Vec2[] = [];
  private lazyWorldBoundingRect: BoundingRect | null = null;
  private localTransform = Mat2x3.newIdentity();
  private lazyAbsTransform = Mat2x3.newIdentity();

  constructor(points: Vec2[], props?: Partial<ShapeProps>) {
    this.points = points;
    this.renderer = props?.renderer === undefined ? new StrokeRenderer() : props.renderer;
    this.translation = props?.translation ?? Vec2.newZero();
    this.rotation = props?.rotation ?? 0;
    this.scale = props?.scale ?? Vec2.newOne();
    this.url = props?.url ?? null;
  }

  get absTransform(): Mat2x3 {
    Mat2x3.fromSRT(
      this.localTransform,
      this.scale,
      this.rotation,
      this.translation
    );

    if (this.parent === null) {
      return this.localTransform;
    } else {
      Mat2x3.multiply(
        this.lazyAbsTransform,
        this.parent.absTransform,
        this.localTransform
      );
      return this.lazyAbsTransform;
    }
  }

  get worldPoints() {
    if (this.pointsDirty) {
      for (let i = 0; i < this.points.length; i++) {
        if (!this.lazyWorldPoints[i]) this.lazyWorldPoints[i] = Vec2.newZero();
        Vec2.transform(this.lazyWorldPoints[i], this.points[i], this.absTransform);
      }
      this.pointsDirty = false;
    }
    return this.lazyWorldPoints;
  }

  get worldBoundingRect() {
    if (this.lazyWorldBoundingRect === null) {
      let min = new Vec2(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
      let max = new Vec2(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
      for (const p of this.worldPoints) {
        Vec2.min(min, min, p);
        Vec2.max(max, max, p);
      }
      this.lazyWorldBoundingRect = {
        x: min.x,
        y: min.y,
        width: max.x - min.x,
        height: max.y - min.y,
      };
    }
    return this.lazyWorldBoundingRect;
  }

  // Ref: https://stackoverflow.com/a/8721483/1466456
  worldContains(x: number, y: number) {
    let result = false;
    const points = this.worldPoints;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const iAboveY = points[i].y > y;
      const jAboveY = points[j].y > y;
      if (
        iAboveY !== jAboveY &&
        x <
          ((points[j].x - points[i].x) * (y - points[i].y)) /
            (points[j].y - points[i].y) +
            points[i].x
      ) {
        result = !result;
      }
    }
    return result;
  }

  push(...shapes: Shape[]) {
    for (const shape of shapes) shape.parent = this;
    this.children.push(...shapes);
    return this;
  }

  setDirty() {
    this.lazyWorldBoundingRect = null;
    this.pointsDirty = true;
    for (const child of this.children) child.setDirty();
  }

  render(ctx: CanvasRenderingContext2D) {
    if (this.renderer !== null) this.renderer.render(ctx, this);
  }

  static empty(props?: Partial<ShapeProps>) {
    return new Shape([], props);
  }

  static hex(x: number, y: number, diameter: number, props?: Partial<ShapeProps>) {
    const a = diameter * 0.25;
    const b = a * Math.sqrt(3);
    const points = [
      new Vec2(x + 0, y - 2 * a),
      new Vec2(x + b, y - a),
      new Vec2(x + b, y + a),
      new Vec2(x + 0, y + 2 * a),
      new Vec2(x - b, y + a),
      new Vec2(x - b, y - a),
    ];
    return new Shape(points, props);
  }

  static rect(
    x: number,
    y: number,
    width: number,
    height: number,
    props?: Partial<ShapeProps>,
  ) {
    const points = [
      new Vec2(x, y),
      new Vec2(x + width, y),
      new Vec2(x + width, y + height),
      new Vec2(x, y + height),
    ];
    return new Shape(points, props);
  }
}
