/**
 * iOS는 미디어 쿼리가 정확히 맞는 스플래시 이미지 하나만 사용한다.
 * device 크기는 CSS 픽셀, 파일명은 물리 픽셀이라 배율만큼 차이가 난다.
 */
const DEVICES = [
  { height: 956, ratio: 3, width: 440 },
  { height: 932, ratio: 3, width: 430 },
  { height: 874, ratio: 3, width: 402 },
  { height: 852, ratio: 3, width: 393 },
  { height: 844, ratio: 3, width: 390 },
  { height: 812, ratio: 3, width: 375 },
  { height: 896, ratio: 3, width: 414 },
  { height: 896, ratio: 2, width: 414 },
  { height: 667, ratio: 2, width: 375 },
];

export const APPLE_STARTUP_IMAGES = DEVICES.map(({ height, ratio, width }) => ({
  media: `(device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait)`,
  url: `/splash/apple-splash-${width * ratio}x${height * ratio}.jpg`,
}));
