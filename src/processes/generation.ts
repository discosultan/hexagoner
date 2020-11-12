import { Process, ProcessProps } from "./process";
import { Shape } from "../shape";
import { Vec2 } from "../math";

type Coords = { x: number; y: number };
type Size = { width: number; height: number };
type Diameter = { diameter: number };

export class GenerateRect extends Process {
  private readonly shape: Shape;
  private readonly target: Shape;

  constructor(
    shape: Shape,
    shapeProps: Partial<Coords> & Size,
    processProps: Partial<ProcessProps>,
  ) {
    super(processProps);
    this.shape = shape;

    const x = shapeProps.x ?? 0;
    const y = shapeProps.y ?? 0;
    this.target = Shape.rect(
      x,
      y,
      shapeProps.width,
      shapeProps.height
    );
    addPoints(this.shape, 4, x, y);
    this.shape.points[2] = this.target.points[3].clone();
    this.shape.points[3] = this.target.points[3].clone();
  }

  step(dt: number) {
    super.step(dt);

    const { progress } = this;
    const shapePoints = this.shape.points;
    const targetPoints = this.target.points;
    Vec2.lerp(shapePoints[1], targetPoints[0], targetPoints[1], progress);
    Vec2.lerp(shapePoints[2], targetPoints[3], targetPoints[2], progress);
    this.shape.setDirty();
  }
}

export class GenerateRectDiagonally extends Process {
  private readonly target: Shape;
  phase = 0;

  constructor(
    private readonly shape: Shape,
    shapeProps: Partial<Coords> & Size,
    processProps: Partial<ProcessProps>,
  ) {
    // 2 phases for full generation.
    super({ ...processProps, duration: (processProps.duration ?? 1000) / 2 });

    const x = shapeProps.x ?? 0;
    const y = shapeProps.y ?? 0;

    this.target = Shape.rect(x, y, shapeProps.width, shapeProps.height);
    addPoints(this.shape, 5, x, y);
  }

  step(dt: number) {
    this.elapsed += dt;
    const { progress } = this;
    const points = this.shape.points;
    const targetPoints = this.target.points;
    if (this.phase === 0) {
      Vec2.lerp(points[0], targetPoints[0], targetPoints[1], progress);
      Vec2.lerp(points[1], targetPoints[0], targetPoints[1], progress);
      Vec2.lerp(points[3], targetPoints[0], targetPoints[3], progress);
      Vec2.lerp(points[4], targetPoints[0], targetPoints[3], progress);
      if (progress === 1) nextPhase(this);
    } else if (this.phase === 1) {
      Vec2.lerp(points[0], targetPoints[1], targetPoints[2], progress);
      Vec2.lerp(points[4], targetPoints[3], targetPoints[2], progress);
      if (progress === 1) {
        points.length = 4;
        this.resolve();
      }
    }
    this.shape.setDirty();
  }
}

export class GenerateHex extends Process {
  private readonly target: Shape;
  phase = 0;

  constructor(
    private readonly shape: Shape,
    shapeProps: Partial<Coords> & Diameter,
    processProps: Partial<ProcessProps>,
  ) {
    // 3 phases for full generation.
    super({...processProps, duration: (processProps.duration ?? 1000) / 3 });

    const x = shapeProps.x ?? 0;
    const y = shapeProps.y ?? 0;

    this.target = Shape.hex(x, y, shapeProps.diameter);
    addPoints(this.shape, 6, x, y);
  }

  step(dt: number) {
    this.elapsed += dt;
    const { progress } = this;
    const points = this.shape.points;
    const targetPoints = this.target.points;
    if (this.phase === 0) {
      Vec2.lerp(points[0], Vec2.zero, targetPoints[2], progress);
      Vec2.lerp(points[1], Vec2.zero, targetPoints[2], progress);
      Vec2.lerp(points[2], Vec2.zero, targetPoints[2], progress);
      Vec2.lerp(points[3], Vec2.zero, targetPoints[5], progress);
      Vec2.lerp(points[4], Vec2.zero, targetPoints[5], progress);
      Vec2.lerp(points[5], Vec2.zero, targetPoints[5], progress);
      if (progress === 1) nextPhase(this);
    } else if (this.phase === 1) {
      Vec2.lerp(points[1], targetPoints[2], targetPoints[3], progress);
      Vec2.lerp(points[2], targetPoints[2], targetPoints[3], progress);
      Vec2.lerp(points[4], targetPoints[5], targetPoints[0], progress);
      Vec2.lerp(points[5], targetPoints[5], targetPoints[0], progress);
      if (progress === 1) nextPhase(this);
    } else if (this.phase === 2) {
      Vec2.lerp(points[2], targetPoints[3], targetPoints[4], progress);
      Vec2.lerp(points[5], targetPoints[0], targetPoints[1], progress);
      if (progress === 1) this.resolve();
    }
    this.shape.setDirty();
  }
}

function addPoints(shape: Shape, count: number, x: number, y: number) {
  const points = Array.apply(null, Array(count)).map((_) => new Vec2(x, y));
  shape.points.push(...points);
  shape.setDirty();
}

function nextPhase(process: { phase: number, elapsed: number }) {
  process.phase++;
  process.elapsed = 0;
}
