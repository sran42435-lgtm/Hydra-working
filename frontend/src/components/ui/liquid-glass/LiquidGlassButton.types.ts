// frontend/src/components/ui/liquid-glass/LiquidGlassButton.types.ts

import { ReactNode } from "react";

export interface LiquidGlassButtonProps {
  children?: ReactNode;
  /** Diameter tombol (default 44) */
  size?: number;
  /** Callback saat tombol ditekan dan dilepas */
  onPress?: () => void;
  /** Style tambahan untuk positioning */
  style?: React.CSSProperties;
  /** Kelas CSS tambahan */
  className?: string;
  /** Intensitas distorsi (0–1, default 0.3) */
  distortionIntensity?: number;
  /** Apakah tombol dalam keadaan aktif */
  active?: boolean;
}
