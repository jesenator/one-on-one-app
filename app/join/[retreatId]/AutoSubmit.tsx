"use client";
import { useEffect, useRef } from "react";

export default function AutoSubmit({ action }: { action: () => void }) {
  const called = useRef(false);
  useEffect(() => {
    if (!called.current) {
      called.current = true;
      action();
    }
  }, [action]);
  return null;
}
