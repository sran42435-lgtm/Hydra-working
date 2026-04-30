import React from "react";

interface HydraIconProps {
  size?: number;
}

export const HydraIcon: React.FC<HydraIconProps> = ({ size = 24 }) => (
  <img
    src="/hydra-icon.png"
    alt="Hydra AI"
    width={size}
    height={size}
    style={{ display: "block" }}
  />
);
