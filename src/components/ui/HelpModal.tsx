"use client";

import { ReactNode } from "react";
import { FiInfo } from "react-icons/fi";
import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function HelpModal({ title, onClose, children }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="w-[90%] max-w-md bg-[#141F24] border border-[#444] rounded-xl p-6 space-y-4 text-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <FiInfo /> {title}
        </h3>
        {children}
        <div className="text-right">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}