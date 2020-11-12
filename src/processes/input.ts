import { Process } from ".";
import { Shape } from "../shape";
import { ProcessProps } from "./process";
import { ContourTrail } from "./trails";

export class ResolveProcessesOnEscape extends Process {
  constructor(processProps: Partial<Omit<ProcessProps, "endless">>) {
    super({ ...processProps, endless: true });
  }

  init() {
    window.addEventListener("keydown", this.onKeyDown);
  }

  step(dt: number) {}

  resolve() {
    super.resolve();
    window.removeEventListener("keydown", this.onKeyDown);
  }

  onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && this.manager !== null) this.manager.resolveAll();
  };
}

export class Navigation extends Process {
  hoverEffect: ContourTrail | null = null;

  constructor(
    private readonly shapes: Shape[],
    private readonly shapeProps: {
      strokeStyle: string;
      translationFactorX: number;
      translationFactorY: number;
    },
    processProps?: Partial<Omit<ProcessProps, "endless">>
  ) {
    super({ ...processProps, endless: true });
  }

  init() {
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("click", this.onClick);
  }

  step(dt: Number) {}

  resolve() {
    super.resolve();
    window.removeEventListener("click", this.onClick);
    window.removeEventListener("mousemove", this.onMouseMove);
  }

  onMouseMove = (e: MouseEvent) => {
    if (this.manager === null) return;

    const { canvas } = this.manager;
    const canvasRect = canvas.getBoundingClientRect();
    const x = e.pageX - canvasRect.x - canvas.width * this.shapeProps.translationFactorX;
    const y = e.pageY - canvasRect.y - canvas.height * this.shapeProps.translationFactorY;
    let containingShape = null;
    for (const shape of this.shapes) {
      if (shape.worldContains(x, y)) {
        containingShape = shape;
        break; // Since there's only one cursor and no overlapping shapes, we can skip early.
      }
    }
    if (containingShape !== null) {
      document.body.style.cursor = "pointer";
      if (this.hoverEffect === null) {
        this.hoverEffect = new ContourTrail(
          containingShape,
          {
            maxLineWidth: 14,
            minLineWidth: 6,
            strokeStyle: this.shapeProps.strokeStyle,
            numShapes: 14,
          },
          {
            duration: 1250,
          }
        );
        this.manager.push(this.hoverEffect);
      }
    } else {
      if (this.hoverEffect !== null) {
        this.resolveHoverEffect();
      }
    }
  };

  onClick = (e: MouseEvent) => {
    if (this.hoverEffect !== null) {
      if (this.hoverEffect.shape.url) window.open(this.hoverEffect.shape.url);
      this.resolveHoverEffect();
    }
  };

  resolveHoverEffect() {
    document.body.style.cursor = "auto";
    if (this.hoverEffect !== null) {
      this.hoverEffect.resolve();
      this.hoverEffect = null;
    }
  }
}
