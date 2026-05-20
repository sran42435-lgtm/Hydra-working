// Elastic deformation calculator untuk glass surface

export interface ElasticConfig {
  maxDeformation: number;   // deformasi maksimum (misal 12px)
  stiffness: number;        // kekakuan balik (0–1, makin besar makin cepat kembali)
  radius: number;           // radius pengaruh deformasi (px)
}

export const defaultElasticConfig: ElasticConfig = {
  maxDeformation: 12,
  stiffness: 0.85,
  radius: 80,
};

/**
 * Hitung deformasi elastis pada suatu titik akibat sentuhan.
 * @param distance - jarak dari titik sentuh ke titik yang dihitung
 * @param pressure - tekanan (0–1)
 * @param config - konfigurasi elastisitas
 * @returns nilai deformasi (px)
 */
export function computeElasticDeformation(
  distance: number,
  pressure: number,
  config: ElasticConfig = defaultElasticConfig
): number {
  if (distance > config.radius) return 0;
  const falloff = 1 - distance / config.radius;
  const gaussian = Math.exp(-(distance * distance) / (2 * (config.radius / 3) ** 2));
  return config.maxDeformation * pressure * gaussian;
}

/**
 * Hitung recovery force (gaya balik) untuk animasi.
 * @param deformation - deformasi saat ini
 * @param config - konfigurasi
 * @returns gaya balik (mendorong ke 0)
 */
export function computeRecoveryForce(
  deformation: number,
  config: ElasticConfig = defaultElasticConfig
): number {
  return -deformation * config.stiffness;
}
