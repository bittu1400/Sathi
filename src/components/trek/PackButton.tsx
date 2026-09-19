"use client";

import * as React from "react";
import { Button } from "../ui/button";
import { downloadPack, getPack, deletePack } from "@/lib/offline/packs";
import { Download, CheckCircle, Trash2, Loader2 } from "lucide-react";

export interface PackButtonProps {
  routeId: string;
  tilesUrl: string;
  tilesBytes: number;
}

export function PackButton({
  routeId,
  tilesUrl,
  tilesBytes,
}: PackButtonProps) {
  const [status, setStatus] = React.useState<"idle" | "downloading" | "ready">(
    "idle"
  );
  const [progress, setProgress] = React.useState<number>(0);

  React.useEffect(() => {
    getPack(routeId).then((blob) => {
      if (blob) setStatus("ready");
    });
  }, [routeId]);

  const handleDownload = async () => {
    setStatus("downloading");
    setProgress(0);
    const blob = await downloadPack(routeId, tilesUrl, tilesBytes, (pct) => {
      setProgress(pct);
    });
    if (blob) {
      setStatus("ready");
    } else {
      setStatus("idle");
    }
  };

  const handleRemove = async () => {
    await deletePack(routeId);
    setStatus("idle");
  };

  if (status === "ready") {
    return (
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" className="bg-ok/10 text-ok border-ok/30">
          <CheckCircle className="w-4 h-4 mr-1.5" />
          Offline Ready
        </Button>
        <Button variant="ghost" size="icon" title="Remove Pack" onClick={handleRemove}>
          <Trash2 className="w-4 h-4 text-text-muted hover:text-danger" />
        </Button>
      </div>
    );
  }

  if (status === "downloading") {
    return (
      <div className="space-y-1">
        <Button variant="secondary" size="sm" disabled>
          <Loader2 className="w-4 h-4 mr-2 animate-spin text-accent" />
          Downloading ({progress}%)
        </Button>
        <div className="w-full bg-surface-3 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-accent h-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  const megabytes = Math.round(tilesBytes / (1024 * 1024));

  return (
    <Button variant="secondary" size="sm" onClick={handleDownload}>
      <Download className="w-4 h-4 mr-2" />
      Download Pack · {megabytes > 0 ? `${megabytes} MB` : "34 MB"}
    </Button>
  );
}
