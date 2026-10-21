export type MeasurementInput = { width: number; drop: number; windows: number; fullness: number; rollWidth: number; panels: number; allowance: number; repeat: number; unit: "cm" | "in" };
export function calculateMeasurements(input: MeasurementInput) {
  const { windows, fullness, panels } = input;
  const factor = input.unit === "in" ? 2.54 : 1;
  const width = input.width * factor, drop = input.drop * factor, roll = input.rollWidth * factor;
  const allowance = input.allowance * factor, repeat = input.repeat * factor;
  if (![width, drop, roll, windows, fullness, panels, allowance, repeat].every(Number.isFinite) || width <= 0 || width > 1500 || drop <= 0 || drop > 750 || roll < 30 || roll > 500 || windows < 1 || windows > 30 || !Number.isInteger(windows) || panels < 1 || panels > 12 || !Number.isInteger(panels) || fullness < 1 || fullness > 4 || allowance < 0 || allowance > 100 || repeat < 0 || repeat > 200) return null;
  const finishedPanelWidth = width * fullness / panels;
  const dropsPerPanel = Math.ceil(finishedPanelWidth / roll);
  const cutDrop = repeat > 0 ? Math.ceil((drop + allowance) / repeat) * repeat : drop + allowance;
  const meters = Math.ceil(dropsPerPanel * panels * cutDrop / 100 * windows * 10) / 10;
  return { meters, finishedPanelWidth, finishedDrop: drop, cutDrop, drops: dropsPerPanel * panels, windows, unit: "cm" };
}
