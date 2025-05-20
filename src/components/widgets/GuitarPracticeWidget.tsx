import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import ResizableWidget from "@/components/ResizableWidget";
import { Star, Plus, Music, Drum, Timer, UploadCloud, Settings, Grip } from "lucide-react";
import PracticeGoalsWidget from "./PracticeGoalsWidget";
import { useAuth } from "@/hooks/useAuth";
import { guitarPracticeConfigSchema } from "./guitarPracticeConfigSchema";
import { WidgetConfigPanel } from "@/components/WidgetConfigPanel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

/**
 * Props for the GuitarPracticeWidget component.
 * @property id - Unique widget identifier
 * @property title - Optional widget title
 * @property color - Optional theme color
 */
interface GuitarPracticeWidgetProps {
  id: string;
  title?: string;
  color?: string;
}

/**
 * Represents a single guitar practice session.
 */
export interface PracticeSession {
  id: string;
  date: string;
  duration: number;
  notes: string;
  techniques: string[];
  songs: string[];
  bpm: number;
  quality: number;
  improvement: string;
  audio?: string;
}

/**
 * Configuration options for the GuitarPracticeWidget.
 */
interface GuitarPracticeConfig {
  defaultSessionDuration: number;
  defaultBpm: number;
  themeColor: string;
  showImprovement: boolean;
  showAudio: boolean;
}

const COMMON_TECHNIQUES = [
  "Alternate Picking",
  "Sweep Picking",
  "Chords",
  "Scales",
  "Arpeggios",
  "Bends",
  "Vibrato",
];

const COMMON_SONGS = [
  "Stairway to Heaven",
  "Sweet Child O' Mine",
  "Hotel California",
  "Canon Rock",
  "Blackbird",
];

/**
 * Main Guitar Practice Widget component for logging and visualizing practice sessions.
 */
const GuitarPracticeWidget: React.FC<GuitarPracticeWidgetProps> = ({ id, title = "Guitar Practice", color = "bg-blue-900" }) => {
  const [tab, setTab] = useState<'log' | 'stats' | 'goals' | 'insights'>('log');
  const [sessions, setSessions] = useState<PracticeSession[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('guitarPracticeSessions');
      if (saved) return JSON.parse(saved);
    }
    return [];
  });
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const defaultConfig: GuitarPracticeConfig = {
    defaultSessionDuration: 30,
    defaultBpm: 120,
    themeColor: '#2563EB',
    showImprovement: true,
    showAudio: true,
  };
  const [config, setConfig] = useState<GuitarPracticeConfig>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem("guitarPracticeWidgetConfig") : null;
    if (saved) return { ...defaultConfig, ...JSON.parse(saved) };
    return defaultConfig;
  });
  const [duration, setDuration] = useState<string>(() => String(config.defaultSessionDuration));
  const [notes, setNotes] = useState<string>("");
  const [debouncedNotes, setDebouncedNotes] = useState<string>("");
  const [techniques, setTechniques] = useState<string[]>([]);
  const [songs, setSongs] = useState<string[]>([]);
  const [bpm, setBpm] = useState<string>(() => String(config.defaultBpm));
  const [quality, setQuality] = useState<number>(3);
  const [improvement, setImprovement] = useState<string>("");
  const [debouncedImprovement, setDebouncedImprovement] = useState<string>("");
  const [audio, setAudio] = useState<string | undefined>(undefined);
  const [sessionTimer, setSessionTimer] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const { user } = useAuth();
  const userId: string = user?.id || 'demo-user';
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect((): void => {
    localStorage.setItem("guitarPracticeWidgetConfig", JSON.stringify(config));
  }, [config]);

  // Persist sessions to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('guitarPracticeSessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  // Debounce notes input
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedNotes(notes), 300);
    return () => clearTimeout(handler);
  }, [notes]);

  // Debounce improvement input
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedImprovement(improvement), 300);
    return () => clearTimeout(handler);
  }, [improvement]);

  /** Handles updating the widget configuration. */
  const handleConfigChange = (name: string, value: any): void => {
    setConfig((prev: GuitarPracticeConfig) => ({ ...prev, [name]: value }));
  };

  // Timer effect
  useEffect((): (() => void) => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive) {
      interval = setInterval(() => setSessionTimer((t) => t + 1), 1000);
    } else if (!timerActive && sessionTimer !== 0) {
      if (interval) clearInterval(interval);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [timerActive, sessionTimer]);

  /** Adds a technique to the current session. */
  const handleAddTechnique = (tech: string): void => {
    if (!techniques.includes(tech)) setTechniques([...techniques, tech]);
  };
  /** Adds a song to the current session. */
  const handleAddSong = (song: string): void => {
    if (!songs.includes(song)) setSongs([...songs, song]);
  };
  /** Removes a technique from the current session. */
  const handleRemoveTechnique = (tech: string): void => setTechniques(techniques.filter(t => t !== tech));
  /** Removes a song from the current session. */
  const handleRemoveSong = (song: string): void => setSongs(songs.filter(s => s !== song));

  /** Handles form submission to add a new practice session. */
  const handleAddSession = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!duration || isNaN(Number(duration)) || Number(duration) <= 0) return;
    setSessions((prev: PracticeSession[]) => [
      ...prev,
      {
        id: Date.now().toString(),
        date,
        duration: Number(duration),
        notes: debouncedNotes,
        techniques: [...techniques],
        songs: [...songs],
        bpm: Number(bpm),
        quality,
        improvement: debouncedImprovement,
        audio,
      },
    ]);
    setDate(new Date().toISOString().slice(0, 10));
    setDuration(String(config.defaultSessionDuration));
    setNotes("");
    setDebouncedNotes("");
    setTechniques([]);
    setSongs([]);
    setBpm(String(config.defaultBpm));
    setQuality(3);
    setImprovement("");
    setDebouncedImprovement("");
    setAudio(undefined);
    setSessionTimer(0);
    setTimerActive(false);
    toast({ title: "Session logged", description: "Your practice session has been added!", duration: 2500 });
  };

  // Statistics
  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((acc, s) => acc + s.duration, 0);
  const mostPracticedTechnique = (() => {
    const count: Record<string, number> = {};
    sessions.forEach(s => s.techniques.forEach(t => { count[t] = (count[t] || 0) + 1; }));
    return Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
  })();
  const mostPracticedSong = (() => {
    const count: Record<string, number> = {};
    sessions.forEach(s => s.songs.forEach(t => { count[t] = (count[t] || 0) + 1; }));
    return Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
  })();

  // --- Insights Logic ---
  // 1. Frequency and recency for techniques/songs
  const techniqueStats: Record<string, { count: number; last: string | null }> = {};
  const songStats: Record<string, { count: number; last: string | null }> = {};
  sessions.forEach(s => {
    s.techniques.forEach(t => {
      if (!techniqueStats[t]) techniqueStats[t] = { count: 0, last: null };
      techniqueStats[t].count++;
      if (!techniqueStats[t].last || s.date > techniqueStats[t].last) techniqueStats[t].last = s.date;
    });
    s.songs.forEach(song => {
      if (!songStats[song]) songStats[song] = { count: 0, last: null };
      songStats[song].count++;
      if (!songStats[song].last || s.date > songStats[song].last) songStats[song].last = s.date;
    });
  });
  // Find least practiced (by count, then by recency)
  const leastPracticedTechniques = Object.entries(techniqueStats)
    .sort((a, b) => a[1].count - b[1].count || (a[1].last || '').localeCompare(b[1].last || ''))
    .slice(0, 3)
    .map(([name]) => name);
  const leastPracticedSongs = Object.entries(songStats)
    .sort((a, b) => a[1].count - b[1].count || (a[1].last || '').localeCompare(b[1].last || ''))
    .slice(0, 3)
    .map(([name]) => name);

  // 2. Streaks (consecutive days with sessions)
  const sessionDates = Array.from(new Set(sessions.map(s => s.date))).sort();
  let currentStreak = 0, bestStreak = 0, streak = 0;
  let prevDate: Date | null = null;
  sessionDates.forEach(dateStr => {
    const date = new Date(dateStr);
    if (prevDate) {
      const diff = (date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        streak++;
      } else if (diff > 1) {
        streak = 1;
      }
    } else {
      streak = 1;
    }
    if (streak > bestStreak) bestStreak = streak;
    prevDate = date;
  });
  currentStreak = streak;

  // 3. Balance report (distribution)
  const totalTech = Object.values(techniqueStats).reduce((a, b) => a + b.count, 0);
  const totalSong = Object.values(songStats).reduce((a, b) => a + b.count, 0);
  const techBalance = Object.entries(techniqueStats).map(([name, stat]) => ({ name, percent: totalTech ? Math.round((stat.count / totalTech) * 100) : 0 }));
  const songBalance = Object.entries(songStats).map(([name, stat]) => ({ name, percent: totalSong ? Math.round((stat.count / totalSong) * 100) : 0 }));

  return (
    <ResizableWidget color={config.themeColor || color} minSize={15} defaultSize={30}>
      <Card className="h-full flex flex-col">
        {/* Unified Header Bar */}
        <div className="flex items-center justify-between w-full px-2 py-2 border-b mb-4">
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 text-transparent bg-clip-text" />
            <span className="font-poppins font-semibold text-lg">{title || 'Guitar Practice'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsConfigOpen(true)} aria-label="Settings" className="hover:text-cyan-400 focus-visible:text-cyan-400">
              <Settings className="h-5 w-5" />
            </Button>
            {/* Drag handle for moving the widget */}
            {/* TODO: Integrate with dnd-kit or grid system for drag-and-drop */}
            <Button
              variant="ghost"
              size="icon"
              className="cursor-grab widget-drag-handle hover:text-cyan-400 focus-visible:text-cyan-400"
              aria-label="Move widget"
            >
              <Grip size={20} />
            </Button>
          </div>
        </div>
        <Tabs value={tab} onValueChange={v => setTab(v as 'log' | 'stats' | 'goals' | 'insights')} className="w-full flex-1 flex flex-col">
          {/* Modern Tabs Bar */}
          <TabsList className="rounded-lg bg-muted/40 p-1 flex gap-1 mb-4">
            <TabsTrigger value="log" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:via-blue-500 data-[state=active]:to-cyan-400 data-[state=active]:text-white font-poppins">Log</TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:via-blue-500 data-[state=active]:to-cyan-400 data-[state=active]:text-white font-poppins">Statistics</TabsTrigger>
            <TabsTrigger value="goals" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:via-blue-500 data-[state=active]:to-cyan-400 data-[state=active]:text-white font-poppins">Goals & Reminders</TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:via-blue-500 data-[state=active]:to-cyan-400 data-[state=active]:text-white font-poppins">Insights</TabsTrigger>
          </TabsList>
          {/* Settings Dialog (keep after TabsList) */}
          <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Guitar Practice Settings</DialogTitle>
              </DialogHeader>
              <WidgetConfigPanel
                schema={[
                  { name: 'defaultSessionDuration', type: 'number', label: 'Default Session Duration (minutes)', default: 30, min: 1, max: 300 },
                  { name: 'defaultBpm', type: 'number', label: 'Default BPM', default: 120, min: 40, max: 300 },
                  { name: 'themeColor', type: 'color', label: 'Theme Color', default: '#2563EB' },
                  { name: 'showImprovement', type: 'checkbox', label: 'Show "Areas for improvement" field', default: true },
                  { name: 'showAudio', type: 'checkbox', label: 'Show audio upload button', default: true },
                ]}
                values={config}
                onChange={handleConfigChange}
              />
              <div className="flex justify-end mt-4">
                <Button onClick={() => setIsConfigOpen(false)}>
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <TabsContent value="log">
            <CardContent className="flex flex-col h-full space-y-4">
              {/* Modern Practice Session Form */}
              <form onSubmit={handleAddSession} className="flex flex-col gap-4 bg-muted/30 rounded-xl p-4 shadow-sm">
                {/* Date, Duration, BPM Row */}
                <div className="flex gap-2">
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-background/60 rounded-lg font-poppins text-sm" />
                  <Input type="number" min="1" placeholder="Minutes" value={duration} onChange={e => setDuration(e.target.value)} className="bg-background/60 rounded-lg font-poppins text-sm" />
                  <Input type="number" min="40" max="300" placeholder="BPM" value={bpm} onChange={e => setBpm(e.target.value)} className="bg-background/60 rounded-lg font-poppins text-sm" />
                </div>
                {/* Notes */}
                <Input placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} className="bg-background/60 rounded-lg font-poppins text-sm" />
                {/* Techniques Selection */}
                <div className="flex flex-wrap gap-2">
                  {COMMON_TECHNIQUES.map(tech => (
                    <Button
                      key={tech}
                      size="sm"
                      type="button"
                      variant={techniques.includes(tech) ? "default" : "secondary"}
                      className={techniques.includes(tech)
                        ? "bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 text-white rounded-full font-poppins text-xs px-3 py-1 shadow hover:shadow-md focus-visible:shadow-md transition-all hover:scale-105 focus-visible:scale-105"
                        : "bg-muted/50 rounded-full font-poppins text-xs px-3 py-1 hover:shadow-md focus-visible:shadow-md transition-all hover:scale-105 focus-visible:scale-105"}
                      onClick={e => { e.preventDefault(); handleAddTechnique(tech); }}
                    >
                      <Drum className="w-4 h-4 mr-1 align-middle" /> {tech}
                    </Button>
                  ))}
                </div>
                {/* Selected Techniques */}
                <div className="flex flex-wrap gap-2">
                  {techniques.map(tech => (
                    <span key={tech} className="inline-flex items-center bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 text-white rounded-full px-3 py-1 text-xs font-poppins shadow align-middle" tabIndex={0} aria-label={`Technique: ${tech}`}>
                      {tech}
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        className="ml-1 p-0 text-white hover:text-cyan-200 focus-visible:ring-2 focus-visible:ring-cyan-400"
                        onClick={e => { e.preventDefault(); handleRemoveTechnique(tech); }}
                        aria-label={`Remove technique ${tech}`}
                      >
                        ×
                      </Button>
                    </span>
                  ))}
                </div>
                {/* Songs Selection */}
                <div className="flex flex-wrap gap-2">
                  {COMMON_SONGS.map(song => (
                    <Button
                      key={song}
                      size="sm"
                      type="button"
                      variant={songs.includes(song) ? "default" : "secondary"}
                      className={songs.includes(song)
                        ? "bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 text-white rounded-full font-poppins text-xs px-3 py-1 shadow hover:shadow-md focus-visible:shadow-md transition-all hover:scale-105 focus-visible:scale-105"
                        : "bg-muted/50 rounded-full font-poppins text-xs px-3 py-1 hover:shadow-md focus-visible:shadow-md transition-all hover:scale-105 focus-visible:scale-105"}
                      onClick={e => { e.preventDefault(); handleAddSong(song); }}
                    >
                      <Music className="w-4 h-4 mr-1 align-middle" /> {song}
                    </Button>
                  ))}
                </div>
                {/* Selected Songs */}
                <div className="flex flex-wrap gap-2">
                  {songs.map(song => (
                    <span key={song} className="inline-flex items-center bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 text-white rounded-full px-3 py-1 text-xs font-poppins shadow align-middle" tabIndex={0} aria-label={`Song: ${song}`}>
                      {song}
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        className="ml-1 p-0 text-white hover:text-cyan-200 focus-visible:ring-2 focus-visible:ring-cyan-400"
                        onClick={e => { e.preventDefault(); handleRemoveSong(song); }}
                        aria-label={`Remove song ${song}`}
                      >
                        ×
                      </Button>
                    </span>
                  ))}
                </div>
                {/* Session Quality Stars */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-poppins">Session Quality:</span>
                  {[1,2,3,4,5].map(star => (
                    <Button
                      key={star}
                      type="button"
                      size="icon"
                      variant="ghost"
                      className={quality >= star ? "text-yellow-400 fill-yellow-400 focus-visible:ring-2 focus-visible:ring-cyan-400 hover:scale-110 focus-visible:scale-110 transition-transform" : "text-muted-foreground focus-visible:ring-2 focus-visible:ring-cyan-400 hover:scale-110 focus-visible:scale-110 transition-transform"}
                      onClick={() => setQuality(star)}
                      aria-label={`Set quality to ${star}`}
                    >
                      <Star className="w-4 h-4 align-middle" />
                    </Button>
                  ))}
                </div>
                {/* Areas for Improvement */}
                {config.showImprovement && (
                  <Input placeholder="Areas for improvement" value={improvement} onChange={e => setImprovement(e.target.value)} className="bg-background/60 rounded-lg font-poppins text-sm" />
                )}
                {/* Audio snippet upload placeholder */}
                {config.showAudio && (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" type="button" disabled className="rounded-lg font-poppins text-xs">
                      <UploadCloud className="w-4 h-4 mr-1" /> Upload Audio (coming soon)
                    </Button>
                  </div>
                )}
                {/* Log Session Button */}
                <Button type="submit" className="w-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 hover:from-purple-600 hover:to-cyan-500 text-white font-bold font-poppins rounded-lg py-2 mt-2 shadow hover:shadow-xl focus-visible:shadow-xl transition-all hover:scale-105 focus-visible:scale-105">
                  <Plus size={16} className="mr-1 align-middle" /> Log Practice Session
                </Button>
              </form>
              {/* Practice Session List */}
              <div className="flex-1 min-h-0 overflow-y-auto space-y-4 mt-2" role="list">
                {sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
                    <span className="text-5xl mb-2">🎸</span>
                    <div className="font-poppins text-lg font-semibold mb-1">No practice sessions yet</div>
                    <div className="text-sm">Log your first session to get started!</div>
                  </div>
                ) : (
                  sessions.map(session => (
                    <PracticeSessionCard key={session.id} session={session} />
                  ))
                )}
              </div>
            </CardContent>
          </TabsContent>
          <TabsContent value="stats">
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="font-semibold text-sm mb-1">Total Sessions</div>
                  <div className="text-2xl font-bold">{totalSessions}</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="font-semibold text-sm mb-1">Total Duration</div>
                  <div className="text-2xl font-bold">{totalMinutes} min</div>
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="font-semibold text-sm mb-1">Most Practiced Technique</div>
                <div className="text-lg font-bold">{mostPracticedTechnique}</div>
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="font-semibold text-sm mb-1">Most Practiced Song</div>
                <div className="text-lg font-bold">{mostPracticedSong}</div>
              </div>
            </CardContent>
          </TabsContent>
          <TabsContent value="goals">
            {/* Practice Goals & Reminders Tab */}
            {userId && <PracticeGoalsWidget userId={userId} />}
          </TabsContent>
          <TabsContent value="insights">
            <CardContent className="space-y-6">
              <div>
                <div className="font-semibold text-lg mb-2">Recommendations</div>
                <div className="space-y-1">
                  {leastPracticedTechniques.length > 0 ? (
                    <div>
                      <span className="font-medium">Techniques to focus on:</span> {leastPracticedTechniques.join(", ")}
                    </div>
                  ) : <div className="text-muted-foreground">No technique data yet.</div>}
                  {leastPracticedSongs.length > 0 ? (
                    <div>
                      <span className="font-medium">Songs to revisit:</span> {leastPracticedSongs.join(", ")}
                    </div>
                  ) : <div className="text-muted-foreground">No song data yet.</div>}
                </div>
              </div>
              <div>
                <div className="font-semibold text-lg mb-2">Practice Streaks</div>
                <div className="flex gap-8">
                  <div>
                    <span className="font-medium">Current Streak:</span> {currentStreak} day{currentStreak !== 1 ? 's' : ''}
                  </div>
                  <div>
                    <span className="font-medium">Best Streak:</span> {bestStreak} day{bestStreak !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-lg mb-2">Practice Balance</div>
                <div className="mb-2 font-medium">Techniques</div>
                {techBalance.length > 0 ? (
                  <div className="space-y-1">
                    {techBalance.map(tb => (
                      <div key={tb.name} className="flex items-center gap-2">
                        <span className="w-32">{tb.name}</span>
                        <div className="bg-muted rounded h-2 w-32 overflow-hidden">
                          <div className="bg-primary" style={{ width: `${tb.percent}%`, height: '100%' }} />
                        </div>
                        <span className="text-xs">{tb.percent}%</span>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-muted-foreground">No technique data yet.</div>}
                <div className="mt-4 mb-2 font-medium">Songs</div>
                {songBalance.length > 0 ? (
                  <div className="space-y-1">
                    {songBalance.map(sb => (
                      <div key={sb.name} className="flex items-center gap-2">
                        <span className="w-32">{sb.name}</span>
                        <div className="bg-muted rounded h-2 w-32 overflow-hidden">
                          <div className="bg-primary" style={{ width: `${sb.percent}%`, height: '100%' }} />
                        </div>
                        <span className="text-xs">{sb.percent}%</span>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-muted-foreground">No song data yet.</div>}
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
        <CardFooter className="bg-muted/20 border-t border-border/40">
          <div className="w-full flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Music size={14} className="text-muted-foreground" />
              <span className="text-muted-foreground">Practice Sessions</span>
            </div>
            <div className="font-medium">
              {totalSessions} sessions
            </div>
          </div>
        </CardFooter>
      </Card>
    </ResizableWidget>
  );
};

// --- Subcomponents ---

/**
 * Props for the PracticeSessionCard subcomponent.
 */
interface PracticeSessionCardProps {
  session: PracticeSession;
}

/**
 * Renders a single practice session as a card.
 */
const PracticeSessionCard: React.FC<PracticeSessionCardProps> = ({ session }) => (
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
interface PillProps {
  label: string;
  gradient: string;
  ariaLabel?: string;
  onRemove?: () => void;
}

/**
 * Renders a pill-style tag for techniques or songs, with optional remove button.
 */
const Pill: React.FC<PillProps> = ({ label, gradient, ariaLabel, onRemove }) => (
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

export default GuitarPracticeWidget; 