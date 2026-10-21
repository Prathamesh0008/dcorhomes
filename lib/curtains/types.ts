export type CurtainConfig = {
  style: string;
  fabric: string;
  mainColor: string;
  sheerColor: string;
  pattern: string;
  room: string;
};
export type PreviewLook = CurtainConfig & { id: string; image: string; thumbnail: string; alt: string };
