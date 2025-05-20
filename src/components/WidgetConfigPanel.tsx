import React from "react";

interface WidgetConfigPanelProps {
  schema: any;
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
}

export function WidgetConfigPanel({ schema, values, onChange }: WidgetConfigPanelProps) {
  return (
    <form className="space-y-4">
      {schema.fields.map((field: any) => {
        const value = values[field.name] ?? field.default;
        switch (field.type) {
          case "boolean":
            return (
              <label key={field.name} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!value}
                  onChange={e => onChange(field.name, e.target.checked)}
                />
                {field.label}
              </label>
            );
          case "number":
            return (
              <label key={field.name} className="flex flex-col">
                {field.label}
                <input
                  type="number"
                  value={value}
                  min={field.min}
                  max={field.max}
                  onChange={e => onChange(field.name, Number(e.target.value))}
                  className="border rounded px-2 py-1"
                />
              </label>
            );
          case "color":
            return (
              <label key={field.name} className="flex flex-col">
                {field.label}
                <input
                  type="color"
                  value={value}
                  onChange={e => onChange(field.name, e.target.value)}
                  className="w-10 h-10 p-0 border-none"
                />
              </label>
            );
          case "string":
            return (
              <label key={field.name} className="flex flex-col">
                {field.label}
                <input
                  type="text"
                  value={value}
                  onChange={e => onChange(field.name, e.target.value)}
                  className="border rounded px-2 py-1"
                />
              </label>
            );
          default:
            return null;
        }
      })}
    </form>
  );
} 