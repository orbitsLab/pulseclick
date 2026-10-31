"use client";

import { useState } from "react";
import { Badge } from "@/components/reui/badge";
import {
  ColorPicker,
  ColorPickerContent,
  ColorPickerSwatch,
  ColorPickerSwatches,
  ColorPickerTrigger,
  getForegroundColor,
} from "@/components/reui/color-picker";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

const LABEL_COLORS = [
  { value: "#ef4444", label: "Red" },
  { value: "#f97316", label: "Orange" },
  { value: "#eab308", label: "Yellow" },
  { value: "#22c55e", label: "Green" },
  { value: "#14b8a6", label: "Teal" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#ec4899", label: "Pink" },
  { value: "#64748b", label: "Slate" },
];

export function Pattern() {
  const [name, setName] = useState("Needs design");
  const [color, setColor] = useState<string | null>("#8b5cf6");
  const custom =
    !!color && !LABEL_COLORS.some((preset) => preset.value === color);
  const ink = color ? getForegroundColor(color) : null;

  return (
    <Card className="w-full max-w-sm rounded-[8px] border-[var(--app-border)] bg-[var(--app-panel)] text-[var(--app-text)] shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Edit label</CardTitle>
        <CardDescription className="text-xs text-[var(--app-muted)]">
          Labels group issues across projects.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="label-name" className="text-xs font-medium text-[var(--app-text)]">
              Name
            </FieldLabel>
            <Input
              id="label-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-8 rounded-[4px] border-[var(--app-border)] bg-[var(--app-panel-alt)] text-xs focus:border-[var(--app-accent)]"
            />
          </Field>
          <Field>
            <FieldLabel id="label-color-label" className="text-xs font-medium text-[var(--app-text)]">
              Color
            </FieldLabel>
            <ColorPicker value={color} onValueChange={setColor}>
              <div className="flex items-center gap-2">
                <ColorPickerSwatches
                  colors={LABEL_COLORS}
                  shape="circle"
                  aria-labelledby="label-color-label"
                  className="flex-1"
                />
                <ColorPickerTrigger size="icon-sm" aria-label="Custom color" className="rounded-full border border-[var(--app-border)]">
                  {custom ? (
                    <ColorPickerSwatch shape="circle" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </ColorPickerTrigger>
                <ColorPickerContent align="end" />
              </div>
            </ColorPicker>
          </Field>
          <div className="flex items-center gap-3 pt-1">
            <span className="text-xs text-[var(--app-muted)]">Preview</span>
            <Badge
              className="rounded-[4px] px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: color ?? undefined,
                color: ink ?? undefined,
              }}
            >
              {name.trim() || "Untitled"}
            </Badge>
          </div>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
