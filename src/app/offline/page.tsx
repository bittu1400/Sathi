import * as React from "react";
import Link from "next/link";
import { Mountain, WifiOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardBody } from "@/components/ui/card";

export default function OfflineFallbackPage() {
  return (
    <div className="max-w-md mx-auto py-12 space-y-6 text-center">
      <div className="w-16 h-16 rounded-full bg-warning/15 border border-warning/30 flex items-center justify-center mx-auto">
        <WifiOff className="w-8 h-8 text-warning" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold tracking-tight">You are Offline</h1>
        <p className="text-sm text-text-muted">
          No active internet connection detected. Sathi is built offline-first for Nepal’s mountain trails.
        </p>
      </div>

      <Card className="text-left space-y-3">
        <CardHeader>
          <h3 className="font-semibold text-sm">Available Offline Features</h3>
        </CardHeader>
        <CardBody className="space-y-2 text-sm text-text-muted">
          <p>✓ Track position and current altitude via GPS</p>
          <p>✓ Record Lake Louise AMS check-ins</p>
          <p>✓ Trigger one-tap emergency SOS via SMS fallback</p>
          <p>✓ View downloaded PMTiles offline route maps</p>
        </CardBody>
      </Card>

      <div className="flex flex-col gap-3">
        <Link href="/trek">
          <Button variant="primary" className="w-full">
            <Mountain className="w-4 h-4 mr-2" />
            Open Active Trek Mode
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
        <Link href="/routes">
          <Button variant="secondary" className="w-full">
            View Offline Routes
          </Button>
        </Link>
      </div>
    </div>
  );
}
