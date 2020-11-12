import { Easing } from "../math";
import { ProcessManager } from "../process-manager";

enum Status {
  "pending",
  "fulfilled",
  "rejected",
}

export type ProcessProps = Readonly<{
  duration: number,
  endless: boolean,
  easingFn: (t: number) => number,
}>;

export class Process {
  readonly duration: number;
  readonly endless: boolean;
  readonly easingFn: (t: number) => number;

  readonly children: Process[] = [];
  elapsed = 0;
  status = Status.pending;
  manager: ProcessManager | null = null;

  constructor(props?: Partial<ProcessProps>) {
    this.duration = props?.duration ?? 1000;
    this.endless = props?.endless ?? false;
    this.easingFn = props?.easingFn ?? Easing.linear;
  }

  get progress() {
    return this.easingFn(Math.min(this.elapsed / this.duration, 1));
  }

  init() {}

  push(...args: Process[]) {
    this.children.push(...args);
    return this;
  }

  resolve() {
    this.status = Status.fulfilled;
  }
  reject() {
    this.status = Status.rejected;
  }

  get isFulfilled() {
    return this.status === Status.fulfilled;
  }

  step(dt: number) {
    this.elapsed += dt;
    if (this.progress === 1) this.resolve();
  }
}
