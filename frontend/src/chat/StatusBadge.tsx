import React from "react";
import { cn } from "@/lib/utils";

const StatusBadge = ({ status }: { status: "online" | "offline" }) => {
  return (
    <div
      className={cn(
        "absolute -bottom-0 -right-0 size-3 rounded-full border-1 border-card z-100",
        status === "online" && "status-online",
        status === "offline" && "status-offline"
      )}
    ></div>
  );
};

export default StatusBadge;
