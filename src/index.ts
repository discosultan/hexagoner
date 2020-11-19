import { RenderManager } from "./render-manager";
import { ProcessManager } from "./process-manager";
import { Shape, ShapeProps } from "./shape";
import { Vec2, Easing } from "./math";
import {
  Execute,
  GenerateHex,
  GenerateRect,
  GenerateRectDiagonally,
  Navigation,
  ResolveProcessesOnKeyDown,
  Rotate,
  Translate,
  Wait,
  WaitAllProcesses,
} from "./processes";
import {
  FillRenderer,
  ImageRenderer,
  StrokeRenderer,
  TextRenderer,
} from "./renderers";

type ShapeMetaProps = {
  color: string;
  src: string;
  width: number;
  height: number;
  url?: string;
};

type ShapeMeta = Omit<ShapeMetaProps, "src"> & { image: HTMLImageElement };

export type Props = {
  shapes: ShapeMetaProps[],
  primaryFont: string,
  secondaryFont: string,
  primaryColor: string,
  primaryText: string,
  secondaryText: string,
};

export function start(canvas: HTMLCanvasElement, props: Props) {
  const shapes = mapShapeImages(props.shapes);
  Promise.all([
    ...shapes.map(shape => preloadImage(shape.image)),
    preloadFont(canvas, props.primaryFont),
    preloadFont(canvas, props.secondaryFont),
  ]).then(() => run(canvas, { ...props, shapes }));
}

function mapShapeImages(
  shapesMeta: ShapeMetaProps[]
): ShapeMeta[] {
  return shapesMeta.map((meta) => {
    const image = new Image();
    image.src = meta.src;
    return {
      color: meta.color,
      image,
      url: meta.url,
      width: meta.width,
      height: meta.height,
    };
  });
}

function preloadImage(image: HTMLImageElement): Promise<void> {
  return new Promise((resolve, _reject) => (image.onload = () => resolve()));
}

async function preloadFont(canvas: HTMLCanvasElement, font: string) {
  // TODO: preload font with fonts API.
}

function run(canvas: HTMLCanvasElement, props: Omit<Props, "shapes"> & { shapes: ShapeMeta[] }) {
  // Config.
  const easingFn = Easing.easeInOutCubic;
  const hexDiameter = 100;
  const hexGenDuration = 600;
  const rotationDuration = 300;
  const shapeFillDuration = 400;
  const hexTranslationDuration = 300;
  const flipVertically = new Vec2(-1, 1);
  const textRectWidth = 300;
  const textRectHeight = 50;
  const translationFactorX = 0.36;
  const translationFactorY = 0.5;
  const timeScale = 0.5;

  const shapes: Shape[] = [];
  const processManager = new ProcessManager(canvas, shapes, timeScale);
  const renderer = new RenderManager(
    canvas,
    shapes,
    translationFactorX,
    translationFactorY
  );

  // Generate two sets of hexes:
  // 1. initial contours which will be animated
  // 2. fill shapes which will be filled after contours are in place

  const base = new Vec2(hexDiameter, 0);
  const translationNE = Vec2.rotate(Vec2.newZero(), base, Math.PI / 3);
  const translationW = Vec2.rotate(Vec2.newZero(), base, Math.PI);
  const translationSE = Vec2.rotate(Vec2.newZero(), base, (5 * Math.PI) / 3);

  const hexMidContour = Shape.empty({
    renderer: new StrokeRenderer(props.primaryColor),
  });
  const hexNEContour = newHex({ url: props.shapes[1].url });
  const hexWContour = newHex({ url: props.shapes[2].url });
  const hexSEContour = newHex({ url: props.shapes[3].url });
  shapes.push(hexMidContour); // Rest will be added during animation.

  // Hex fill mask will be added after contours are animated.
  const hexFillMask = Shape.empty({
    scale: flipVertically,
    renderer: null,
  });
  const hexMidFill = newHex({ scale: flipVertically });
  const hexNEFill = newHex({
    scale: flipVertically,
    translation: translationNE,
  });
  const hexWFill = newHex({ scale: flipVertically, translation: translationW });
  const hexSEFill = newHex({
    scale: flipVertically,
    translation: translationSE,
  });
  hexFillMask.push(hexMidFill, hexNEFill, hexWFill, hexSEFill);

  function newHex(shapeProps: Partial<ShapeProps>) {
    return Shape.hex(0, 0, hexDiameter, {
      ...shapeProps,
      renderer: new StrokeRenderer(props.primaryColor),
    });
  }

  addFillRect(hexMidFill, props.shapes[0]);
  addFillRect(hexNEFill, props.shapes[1]);
  addFillRect(hexWFill, props.shapes[2]);
  addFillRect(hexSEFill, props.shapes[3]);

  function addFillRect(shape: Shape, meta: ShapeMeta) {
    const bgFillRect = Shape.rect(
      -hexDiameter * 0.5,
      -hexDiameter * 0.5,
      hexDiameter,
      hexDiameter,
      {
        renderer: new FillRenderer(meta.color),
      }
    );
    shape.push(bgFillRect);
    const imgFillRect = Shape.rect(
      -meta.width * 0.5,
      -meta.height * 0.5,
      meta.width,
      meta.height,
      {
        renderer: new ImageRenderer(meta.image),
      }
    );
    shape.push(imgFillRect);
  }

  const textRect = Shape.empty({
    renderer: null,
    translation: new Vec2(60, -textRectHeight * 0.5),
  });
  shapes.push(textRect);
  function createText(text: string, translation: Vec2, scale: Vec2, font: string) {
    return Shape.rect(0, 0, textRectWidth, textRectHeight * 0.5, {
      renderer: new TextRenderer(text, font, undefined, props.primaryColor),
      translation: translation,
      scale: scale,
    });
  }
  textRect.push(createText(props.primaryText, new Vec2(0, 10), new Vec2(1, 1), props.primaryFont));
  textRect.push(createText(
    props.secondaryText, new Vec2(0, textRectHeight + 10), new Vec2(1, 0.6), props.secondaryFont
  ));

  processManager.push(
    // The wait process is for testing purposes.
    new Wait({ duration: 0 }).push(
      new GenerateHex(
        hexMidContour,
        {
          diameter: hexDiameter,
        },
        {
          easingFn,
          duration: hexGenDuration,
        }
      ).push(
        new Rotate(hexMidContour, -Math.TWO_PI, {
          easingFn,
          duration: rotationDuration,
        }).push(
          addTranslateHex(hexWContour, translationW),
          addTranslateHex(hexSEContour, translationSE),
          addTranslateHex(hexNEContour, translationNE)
        )
      ),
      new WaitAllProcesses({}).push(
        new Execute(() => shapes.push(hexFillMask)).push(
          new GenerateRectDiagonally(
            hexFillMask,
            {
              x: -hexDiameter * 1,
              y: -hexDiameter * 1.5,
              width: hexDiameter * 2.5,
              height: hexDiameter * 3,
            },
            {
              duration: shapeFillDuration,
            }
          )
        ),
        new GenerateRect(
          textRect,
          {
            width: textRectWidth,
            height: textRectHeight,
          },
          {
            duration: shapeFillDuration,
          }
        ),
        new Navigation([hexNEContour, hexWContour, hexSEContour], {
          strokeStyle: props.primaryColor,
          translationFactorX,
          translationFactorY,
        })
      )
    )
  );

  function addTranslateHex(shape: Shape, translation: Vec2) {
    return new Execute(() => shapes.push(shape)).push(
      new Translate(shape, translation, {
        easingFn: easingFn,
        duration: hexTranslationDuration,
      })
    );
  }

  // Newer browser return ' ' while older return 'Spacebar'.
  processManager.push(new ResolveProcessesOnKeyDown(['Escape', ' ', 'Spacebar']));

  // Render loop.
  let prevTimestamp = 0;
  window.requestAnimationFrame(step);
  function step(timestamp: number) {
    const dt = timestamp - prevTimestamp;
    prevTimestamp = timestamp;

    processManager.step(dt);
    renderer.step(dt);

    window.requestAnimationFrame(step);
  }
}
