import { Process, ProcessProps } from "./process";
import { Shape } from "../shape";
import { Vec2 } from "../math";
import { StrokeRenderer } from "../renderers";

type StrokeProps = {
  strokeStyle: string;
  minLineWidth: number;
  maxLineWidth: number;
};
type NumShapes = { numShapes: number };

export class ContourTrail extends Process {
  phase = 0;
  hoverShapes: Shape[] = [];
  // Temp vectors for calc results.
  pa = Vec2.newZero();
  pb = Vec2.newZero();

  constructor(
    readonly shape: Shape,
    private readonly shapeProps: Partial<NumShapes> & StrokeProps,
    processProps: Partial<Omit<ProcessProps, "endless">>
  ) {
    super({
      ...processProps,
      endless: true,
      duration: (processProps.duration ?? 1000) / shape.points.length,
    });

    const numShapes = shapeProps.numShapes ?? 10;
    for (let i = 0; i < numShapes; i++) {
      const p = this.shape.points[0];
      const p1 = p.clone();
      const p2 = p.clone();
      this.hoverShapes.push(
        new Shape([p1, Vec2.add(p2, p2, Vec2.one)], {
          translation: this.shape.translation,
          renderer: new StrokeRenderer(
            this.shapeProps.strokeStyle,
            this.shapeProps.minLineWidth +
              ((this.shapeProps.maxLineWidth - this.shapeProps.minLineWidth) *
                i) /
                numShapes
          ),
        })
      );
    }
  }

  init() {
    if (this.manager === null) return;

    this.manager.shapes.push(...this.hoverShapes);
  }

  step(dt: number) {
    this.elapsed += dt;
    const { hoverShapes, progress } = this;
    const { points } = this.shape;

    for (let i = 0; i < hoverShapes.length - 1; i++) {
      const dst = hoverShapes[i];
      const src = hoverShapes[i + 1];
      dst.points[0].x = src.points[0].x;
      dst.points[0].y = src.points[0].y;
      dst.points[1].x = src.points[1].x;
      dst.points[1].y = src.points[1].y;
    }
    const last = hoverShapes[hoverShapes.length - 1];
    const from = points[this.phase];
    const to = points[(this.phase + 1) % points.length];
    Vec2.lerp(last.points[0], from, to, progress);
    Vec2.lerp(
      last.points[1],
      Vec2.add(this.pa, from, Vec2.one),
      Vec2.add(this.pb, to, Vec2.one),
      progress
    );
    if (progress === 1) nextPhase(this, points.length);

    for (const hoverShape of this.hoverShapes) hoverShape.setDirty();
  }

  resolve() {
    super.resolve();

    if (this.manager === null) return;

    const { shapes } = this.manager;
    for (const hoverShape of this.hoverShapes) {
      shapes.splice(shapes.indexOf(hoverShape), 1);
    }
  }
}

function nextPhase(process: { phase: number, elapsed: number }, maxPhases: number) {
  process.phase = (process.phase + 1) % maxPhases;
  process.elapsed = 0;
}
