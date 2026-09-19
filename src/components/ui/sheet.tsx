"use client";

import * as React from "react";
import { Dialog, DialogClose, DialogContent, DialogTrigger, type DialogContentProps } from "./dialog";

/** Bottom sheet on mobile, right-hand panel from 1024 px. Check-in, filters, marker and incident details. */
export const Sheet = Dialog;
export const SheetTrigger = DialogTrigger;
export const SheetClose = DialogClose;

export function SheetContent(props: Omit<DialogContentProps, "variant">) {
  return <DialogContent variant="sheet" {...props} />;
}
