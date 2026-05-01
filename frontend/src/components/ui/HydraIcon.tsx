import React from "react";

interface HydraIconProps {
  size?: number;
}

export const HydraIcon: React.FC<HydraIconProps> = ({ size = 24 }) => (
  <div
    style={{
      width: size,
      height: size,
      backgroundImage: "url('/hydra-icon.png')",
      backgroundSize: "contain",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      display: "block",
      WebkitTouchCallout: "none",
      userSelect: "none",
    }}
  />
);
