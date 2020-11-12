import { Vec2 } from "../math";
import { Process, ProcessProps } from "./process";
import { Shape } from "../shape";

export class Wait extends Process {
  step(dt: number) {
    super.step(dt);
  }
}

export class WaitAllProcesses extends Process {
  step(dt: number) {
    if (this.manager === null || this.manager.resolvableProcesses.length <= 1)
      this.resolve();
  }
}

export class Translate extends Process {
  constructor(
    private readonly shape: Shape,
    private readonly target: Vec2,
    processProps?: Partial<ProcessProps>
  ) {
    super(processProps);
  }

  step(dt: number) {
    super.step(dt);

    Vec2.lerp(this.shape.translation, Vec2.zero, this.target, this.progress);
    this.shape.setDirty();
  }
}

export class Rotate extends Process {
  constructor(
    private readonly shape: Shape,
    private readonly target: number,
    processProps?: Partial<ProcessProps>
  ) {
    super(processProps);
  }

  step(dt: number) {
    super.step(dt);

    this.shape.rotation = this.progress * this.target;
    this.shape.setDirty();
  }
}

export class Execute extends Process {
  constructor(
    private readonly command: () => void,
    processProps?: Partial<ProcessProps>
  ) {
    super(processProps);
  }

  step(dt: number) {
    this.command();
    this.resolve();
  }
}
