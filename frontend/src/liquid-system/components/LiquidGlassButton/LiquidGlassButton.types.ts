// src/liquid-system/components/LiquidGlassButton/LiquidGlassButton.types.ts

import { ReactNode } from 'react';
import { GlassPreset } from '../../materials/glass.presets';
import { SpringConfig } from '../../physics/spring.config';

export interface LiquidGlassButtonProps {
  children?: ReactNode;
  /** Diameter tombol (default 44) */
  size?: number;
  /** Callback saat tombol ditekan */
  onPress?: () => void;
  /** Style tambahan untuk positioning */
  style?: React.CSSProperties;
  /** Kelas CSS tambahan */
  className?: string;
  /** Preset material kaca (default: 'crystal') */
  preset?: keyof typeof import('../../materials/glass.presets').glassPresets;
  /** Intensitas distorsi optik (0–1) */
  distortionIntensity?: number;
  /** Apakah tombol dalam keadaan aktif */
  active?: boolean;
  /** Konfigurasi spring untuk animasi hover/tap */
  springConfig?: SpringConfig;
}
