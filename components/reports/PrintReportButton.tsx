"use client";

import { Printer } from "lucide-react";

export function PrintReportButton() {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined") {
          window.print();
        }
      }}
      className="btn-primary"
    >
      <Printer size={15} />
      Print / Save PDF
    </button>
  );
}
