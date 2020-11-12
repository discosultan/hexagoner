import { Shape } from "./shape";
import { Process } from "./processes";

export class ProcessManager {
  private readonly processes: Process[] = [];

  constructor(
    public readonly canvas: HTMLCanvasElement,
    public readonly shapes: Shape[],
    private readonly timeScale: number = 1,
  ) {}

  get resolvableProcesses() {
    return this.processes.filter((proc) => !proc.endless);
  }

  push(...processes: Process[]) {
    for (const process of processes) {
      process.manager = this;
      process.init();
      this.processes.push(process);
    }
    return this;
  }

  step(dt: number) {
    for (let i = this.processes.length - 1; i >= 0; i--) {
      const process = this.processes[i];
      process.step(dt * this.timeScale);
      if (process.isFulfilled) {
        this.processes.splice(i, 1);
        this.push(...process.children);
      }
    }
  }

  resolveAll() {
    while (this.resolvableProcesses.length > 0) {
      this.step(100000); // Some arbitrary large number.
    }
  }
}
