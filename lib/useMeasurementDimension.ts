"use client";
import { useState } from "react";

/** Keep physical dimensions in cm so changing display units never changes yardage. */
export function useMeasurementDimension(initialCm: string, unit: "cm" | "in") {
  const [cm, setCm] = useState(initialCm);
  const displayed = unit === "cm" || cm === "" ? cm : String(Math.round(Number(cm) / 2.54 * 100) / 100);
  function setDisplayed(value: string) {
    setCm(value === "" ? "" : unit === "cm" ? value : String(Number(value) * 2.54));
  }
  return [displayed, setDisplayed, cm] as const;
}
