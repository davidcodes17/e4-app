import { DimensionValue, FlexStyle, TextStyle } from "react-native";

export type StyleProps = {
  // Margins
  m?: DimensionValue;
  mt?: DimensionValue;
  mr?: DimensionValue;
  mb?: DimensionValue;
  ml?: DimensionValue;
  mx?: DimensionValue;
  my?: DimensionValue;

  // Paddings
  p?: DimensionValue;
  pt?: DimensionValue;
  pr?: DimensionValue;
  pb?: DimensionValue;
  pl?: DimensionValue;
  px?: DimensionValue;
  py?: DimensionValue;

  // Layout
  w?: DimensionValue;
  width?: DimensionValue;
  h?: DimensionValue;
  height?: DimensionValue;
  minW?: DimensionValue;
  minWidth?: DimensionValue;
  minH?: DimensionValue;
  minHeight?: DimensionValue;
  maxW?: DimensionValue;
  maxWidth?: DimensionValue;
  maxH?: DimensionValue;
  maxHeight?: DimensionValue;
  flex?: number;
  direction?: FlexStyle["flexDirection"];
  flexDirection?: FlexStyle["flexDirection"];
  align?: FlexStyle["alignItems"];
  alignItems?: FlexStyle["alignItems"];
  justify?: FlexStyle["justifyContent"];
  justifyContent?: FlexStyle["justifyContent"];
  wrap?: FlexStyle["flexWrap"];
  flexWrap?: FlexStyle["flexWrap"];
  basis?: DimensionValue;
  flexBasis?: DimensionValue;
  grow?: number;
  flexGrow?: number;
  shrink?: number;
  flexShrink?: number;
  gap?: number;
  alignSelf?: FlexStyle["alignSelf"];
  alignContent?: FlexStyle["alignContent"];

  // Positioning
  pos?: FlexStyle["position"];
  position?: FlexStyle["position"];
  top?: DimensionValue;
  right?: DimensionValue;
  bottom?: DimensionValue;
  left?: DimensionValue;
  z?: number;
  zIndex?: number;

  // Background
  bg?: string;
  backgroundColor?: string;
  opacity?: number;

  // Borders
  rounded?: number;
  borderRadius?: number;
  roundedTop?: number;
  roundedBottom?: number;
  roundedLeft?: number;
  roundedRight?: number;
  border?: number;
  borderWidth?: number;
  borderColor?: string;

  // Shadow
  shadow?: number;

  // Text
  textAlign?: TextStyle["textAlign"];
  textTransform?: TextStyle["textTransform"];
  textDecoration?: TextStyle["textDecorationLine"];
  textDecorationLine?: TextStyle["textDecorationLine"];
  textDecorationStyle?: TextStyle["textDecorationStyle"];
  letterSpacing?: number;
  lineHeight?: number;
  color?: string;
};

// Improved Extraction Logic
export function useStyleProps(props: any) {
  const style: any = {};
  const rest: any = {};

  Object.keys(props).forEach((key) => {
    const value = props[key];
    switch (key) {
      case "m":
        style.margin = value;
        break;
      case "mt":
        style.marginTop = value;
        break;
      case "mr":
        style.marginRight = value;
        break;
      case "mb":
        style.marginBottom = value;
        break;
      case "ml":
        style.marginLeft = value;
        break;
      case "mx":
        style.marginHorizontal = value;
        break;
      case "my":
        style.marginVertical = value;
        break;

      case "p":
        style.padding = value;
        break;
      case "pt":
        style.paddingTop = value;
        break;
      case "pr":
        style.paddingRight = value;
        break;
      case "pb":
        style.paddingBottom = value;
        break;
      case "pl":
        style.paddingLeft = value;
        break;
      case "px":
        style.paddingHorizontal = value;
        break;
      case "py":
        style.paddingVertical = value;
        break;

      case "w":
      case "width":
        style.width = value;
        break;
      case "h":
      case "height":
        style.height = value;
        break;
      case "minW":
      case "minWidth":
        style.minWidth = value;
        break;
      case "minH":
      case "minHeight":
        style.minHeight = value;
        break;
      case "maxW":
      case "maxWidth":
        style.maxWidth = value;
        break;
      case "maxH":
      case "maxHeight":
        style.maxHeight = value;
        break;

      case "flex":
        style.flex = value;
        break;
      case "direction":
      case "flexDirection":
        style.flexDirection = value;
        break;
      case "align":
      case "alignItems":
        style.alignItems = value;
        break;
      case "justify":
      case "justifyContent":
        style.justifyContent = value;
        break;
      case "wrap":
      case "flexWrap":
        style.flexWrap = value;
        break;
      case "basis":
        style.flexBasis = value;
        break;
      case "grow":
        style.flexGrow = value;
        break;
      case "shrink":
        style.flexShrink = value;
        break;
      case "gap":
        style.gap = value;
        break;
      case "alignSelf":
        style.alignSelf = value;
        break;
      case "alignContent":
        style.alignContent = value;
        break;

      case "pos":
      case "position":
        style.position = value;
        break;
      case "top":
        style.top = value;
        break;
      case "right":
        style.right = value;
        break;
      case "bottom":
        style.bottom = value;
        break;
      case "left":
        style.left = value;
        break;
      case "z":
      case "zIndex":
        style.zIndex = value;
        break;

      case "bg":
      case "backgroundColor":
        style.backgroundColor = value;
        break;
      case "opacity":
        style.opacity = value;
        break;

      case "rounded":
      case "borderRadius":
        style.borderRadius = value;
        break;
      case "roundedTop":
        style.borderTopLeftRadius = value;
        style.borderTopRightRadius = value;
        break;
      case "roundedBottom":
        style.borderBottomLeftRadius = value;
        style.borderBottomRightRadius = value;
        break;
      case "roundedLeft":
        style.borderTopLeftRadius = value;
        style.borderBottomLeftRadius = value;
        break;
      case "roundedRight":
        style.borderTopRightRadius = value;
        style.borderBottomRightRadius = value;
        break;

      case "border":
      case "borderWidth":
        style.borderWidth = value;
        break;
      case "borderColor":
        style.borderColor = value;
        break;

      case "shadow":
        style.elevation = value;
        style.shadowColor = "#000";
        style.shadowOffset = { width: 0, height: 2 };
        style.shadowOpacity = 0.1;
        style.shadowRadius = value;
        break;

      // Text Props implementation
      case "textAlign":
        style.textAlign = value;
        break;
      case "textTransform":
        style.textTransform = value;
        break;
      case "textDecoration":
      case "textDecorationLine":
        style.textDecorationLine = value;
        break;
      case "textDecorationStyle":
        style.textDecorationStyle = value;
        break;
      case "letterSpacing":
        style.letterSpacing = value;
        break;
      case "lineHeight":
        style.lineHeight = value;
        break;
      case "color":
        style.color = value;
        break;

      default:
        rest[key] = value;
        break;
    }
  });

  return { style, rest };
}
