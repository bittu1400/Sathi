"use client";

import * as React from "react";
import { CheckCircle2, Download, Trash2 } from "lucide-react";
import { downloadPack, getPack, deletePack } from "@/lib/offline/packs";
import { Button } from "../ui/button";
import { Panel } from "../ui/panel";
import { Progress } from "../ui/spinner";
import { runWithUndo } from "../ui/use-undo";

export interface PackButtonProps {
  routeId: string;
  tilesUrl: string;
  tilesBytes: number;
}

/** Offline pack panel: size, progress, done, error with retry, remove with Undo. */
export function PackButton({ routeId, tilesUrl, tilesBytes }: PackButtonProps) {
  const [status, setStatus] = React.useState<"idle" | "downloading" | "ready" | "error">("idle");
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    getPack(routeId).then((blob) => blob && setStatus("ready"));
  }, [routeId]);

  const download = async () => {
    setStatus("downloading");
    setProgress(0);
    const blob = await downloadPack(routeId, tilesUrl, tilesBytes, setProgress);
    setStatus(blob ? "ready" : "error");
  };

  const remove = () =>
    runWithUndo({
      apply: () => setStatus("idle"),
      revert: () => setStatus("ready"),
      commit: () => deletePack(routeId),
      message: "Offline pack removed",
    });

  const megabytes = Math.round(tilesBytes / (1024 * 1024));

  return (
    <Panel title="Offline map pack" meta={megabytes > 0 ? `${megabytes} MB` : undefined} className="space-y-3">
      {status === "ready" ? (
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-body text-ok">
            <CheckCircle2 className="size-5" aria-hidden /> Saved on this phone
          </p>
          <Button variant="ghost" onClick={remove}>
            <Trash2 className="size-4" aria-hidden /> Remove
          </Button>
        </div>
      ) : status === "downloading" ? (
        <div className="space-y-2">
          <p className="text-body">Downloading… {progress}%</p>
          <Progress value={progress} valueText={`${progress}% of ${megabytes} MB`} />
        </div>
      ) : (
        <>
          <p className="text-small text-text-muted">Wi-Fi recommended. Lets the base map load with no signal.</p>
          {status === "error" && <p className="text-small text-danger">Download failed. Check your connection and retry.</p>}
          <Button variant="secondary" className="w-full" onClick={download}>
            <Download className="size-4" aria-hidden /> {status === "error" ? "Retry download" : "Download pack"}
          </Button>
        </>
      )}
    </Panel>
  );
}
