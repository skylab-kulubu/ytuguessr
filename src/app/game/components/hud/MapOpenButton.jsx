"use client";

import { MapFold } from "../Glyph";

/** `compact`: isaret konmusken onay butonunun yaninda kalan ikincil hali. */
export default function MapOpenButton({ onClick, compact = false }) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Haritayı aç"
        className="btn btn-ghost h-12 w-12 rounded-[10px] bg-canvas/85"
      >
        <MapFold className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="btn btn-primary h-12 gap-2.5 rounded-[10px] pr-5 pl-4 text-[0.9375rem]"
    >
      <MapFold className="h-[18px] w-[18px]" />
      Haritayı aç
    </button>
  );
}
