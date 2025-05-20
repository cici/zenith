import React from "react";
import { Timer, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PracticeSession } from "../GuitarPracticeWidget";

/**
 * Props for the PracticeSessionCard subcomponent.
 */
export interface PracticeSessionCardProps {
  session: PracticeSession;
}

/**
 * Renders a single practice session as a card.
 */
export const PracticeSessionCard: React.FC<PracticeSessionCardProps> = ({ session }) => (
  <div
    className="bg-white/80 dark:bg-muted/40 rounded-xl shadow-lg border border-border/30 py-2 px-4 flex flex-col gap-2 font-poppins transition-all max-w-xl mx-auto hover:shadow-xl focus-within:shadow-xl transition-shadow"
    role="listitem"
  >
    {/* Header: Date, Duration, BPM, Quality */}
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-3 text-sm font-semibold">
        <Timer className="w-4 h-4 text-muted-foreground align-middle" />
        <span>{session.date}</span>
        <span>• {session.duration} min</span>
        <span>• BPM {session.bpm}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-1">Quality:</span>
        {Array.from({length: session.quality}).map((_,i) => (
          <Star key={i} className="w-3 h-3 text-yellow-400 inline" aria-hidden="true" />
        ))}
      </div>
    </div>
    {/* Techniques and Songs */}
    <div className="flex flex-wrap gap-2 mt-1">
      {session.techniques.map(tech => (
        <Pill key={tech} label={tech} gradient="from-purple-500 via-blue-500 to-cyan-400" ariaLabel={`Technique: ${tech}`}/>
      ))}
      {session.songs.map(song => (
        <Pill key={song} label={song} gradient="from-blue-500 via-cyan-400 to-purple-500" ariaLabel={`Song: ${song}`}/>
      ))}
    </div>
    {/* Notes */}
    {session.notes && <div className="text-xs text-muted-foreground mt-1">Notes: {session.notes}</div>}
    {/* Improvement */}
    {session.improvement && <div className="text-xs text-muted-foreground mt-1">Improvement: {session.improvement}</div>}
  </div>
);

/**
 * Props for the Pill subcomponent.
 */
export interface PillProps {
  label: string;
  gradient: string;
  ariaLabel?: string;
  onRemove?: () => void;
}

/**
 * Renders a pill-style tag for techniques or songs, with optional remove button.
 */
export const Pill: React.FC<PillProps> = ({ label, gradient, ariaLabel, onRemove }) => (
  <span
    className={`bg-gradient-to-r ${gradient} text-white rounded-full px-3 py-1 text-xs font-poppins shadow align-middle`}
    tabIndex={0}
    aria-label={ariaLabel || label}
  >
    {label}
    {onRemove && (
      <Button
        size="sm"
        variant="ghost"
        type="button"
        className="ml-1 p-0 text-white hover:text-cyan-200 focus-visible:ring-2 focus-visible:ring-cyan-400"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
      >
        ×
      </Button>
    )}
  </span>
); 