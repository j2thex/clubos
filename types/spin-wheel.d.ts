declare module "spin-wheel" {
  interface WheelItem {
    label?: string;
    backgroundColor?: string;
    labelColor?: string;
    weight?: number;
    image?: HTMLImageElement;
    imageOpacity?: number;
    imageRadius?: number;
    imageRotation?: number;
    imageScale?: number;
  }

  interface WheelProps {
    items: WheelItem[];
    isInteractive?: boolean;
    pointerAngle?: number;
    itemLabelFontSizeMax?: number;
    itemLabelRadius?: number;
    itemLabelRadiusMax?: number;
    itemLabelAlign?: string;
    itemLabelRotation?: number;
    itemLabelFont?: string;
    itemLabelBaselineOffset?: number;
    borderWidth?: number;
    borderColor?: string;
    lineWidth?: number;
    lineColor?: string;
    radius?: number;
    rotationResistance?: number;
    itemBackgroundColors?: string[];
    itemLabelColors?: string[];
    overlayImage?: string;
    image?: string;
  }

  export class Wheel {
    constructor(container: HTMLElement, props?: WheelProps);
    spinToItem(
      itemIndex: number,
      duration?: number,
      spinToCenter?: boolean,
      numberOfRevolutions?: number,
      direction?: number,
      easingFunction?: (t: number) => number,
    ): void;
    remove(): void;
  }
}
