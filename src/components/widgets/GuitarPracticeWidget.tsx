import { useState, useEffect } from "react";
import { CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import ResizableWidget from "@/components/ResizableWidget";
import { Star, Plus, Music, Drum, Timer, UploadCloud } from "lucide-react";
import PracticeGoalsWidget from "./PracticeGoalsWidget";
import { useAuth } from "@/hooks/useAuth";

interface PracticeSession {
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

const GuitarPracticeWidget = ({ id, title = "Guitar Practice", color = "bg-blue-900" }) => {
  const [tab, setTab] = useState<'log' | 'stats' | 'goals' | 'insights'>('log');
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [duration, setDuration] = useState("30");
  const [notes, setNotes] = useState("");
  const [techniques, setTechniques] = useState<string[]>([]);
  const [songs, setSongs] = useState<string[]>([]);
  const [bpm, setBpm] = useState("120");
  const [quality, setQuality] = useState(3);
  const [improvement, setImprovement] = useState("");
  const [audio, setAudio] = useState<string | undefined>(undefined);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const { user } = useAuth();
  const userId = user?.id || 'demo-user';

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive) {
      interval = setInterval(() => setSessionTimer((t) => t + 1), 1000);
    } else if (!timerActive && sessionTimer !== 0) {
      if (interval) clearInterval(interval);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [timerActive]);

  // Add technique
  const addTechnique = (tech: string) => {
    if (!techniques.includes(tech)) setTechniques([...techniques, tech]);
  };
  // Add song
  const addSong = (song: string) => {
    if (!songs.includes(song)) setSongs([...songs, song]);
  };
  // Remove technique
  const removeTechnique = (tech: string) => setTechniques(techniques.filter(t => t !== tech));
  // Remove song
  const removeSong = (song: string) => setSongs(songs.filter(s => s !== song));

  // Add session
  const addSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!duration || isNaN(Number(duration)) || Number(duration) <= 0) return;
    setSessions([
      ...sessions,
      {
        id: Date.now().toString(),
        date,
        duration: Number(duration),
        notes,
        techniques: [...techniques],
        songs: [...songs],
        bpm: Number(bpm),
        quality,
        improvement,
        audio,
      },
    ]);
    setDate(new Date().toISOString().slice(0, 10));
    setDuration("30");
    setNotes("");
    setTechniques([]);
    setSongs([]);
    setBpm("120");
    setQuality(3);
    setImprovement("");
    setAudio(undefined);
    setSessionTimer(0);
    setTimerActive(false);
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
    <ResizableWidget color={color} minSize={15} defaultSize={30}>
      <Tabs value={tab} onValueChange={v => setTab(v as 'log' | 'stats' | 'goals' | 'insights')} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="log">Log</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="goals">Goals & Reminders</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>
        <TabsContent value="log">
          <CardContent className="space-y-4">
            {/* Session Timer Controls */}
            <div className="flex items-center gap-2 mb-2">
              <Button size="sm" variant={timerActive ? "default" : "outline"} onClick={() => setTimerActive(a => !a)}>
                {timerActive ? "Pause" : "Start"} Session
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setSessionTimer(0); setTimerActive(false); }}>
                Reset
              </Button>
              <span className="ml-2 text-muted-foreground text-xs">Session Time: {Math.floor(sessionTimer / 60)}:{(sessionTimer % 60).toString().padStart(2, '0')}</span>
            </div>
            {/* Practice Session Form */}
            <form onSubmit={addSession} className="grid gap-2">
              <div className="flex gap-2">
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-background/50" />
                <Input type="number" min="1" placeholder="Minutes" value={duration} onChange={e => setDuration(e.target.value)} className="bg-background/50" />
                <Input type="number" min="40" max="300" placeholder="BPM" value={bpm} onChange={e => setBpm(e.target.value)} className="bg-background/50" />
              </div>
              <Input placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} className="bg-background/50" />
              <div className="flex flex-wrap gap-2">
                {COMMON_TECHNIQUES.map(tech => (
                  <Button key={tech} size="sm" variant={techniques.includes(tech) ? "default" : "secondary"} onClick={e => { e.preventDefault(); addTechnique(tech); }}>
                    <Drum className="w-4 h-4 mr-1" /> {tech}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {techniques.map(tech => (
                  <span key={tech} className="inline-flex items-center bg-muted rounded px-2 py-1 text-xs mr-1">
                    {tech} <Button size="sm" variant="ghost" onClick={e => { e.preventDefault(); removeTechnique(tech); }}><span className="ml-1">×</span></Button>
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {COMMON_SONGS.map(song => (
                  <Button key={song} size="sm" variant={songs.includes(song) ? "default" : "secondary"} onClick={e => { e.preventDefault(); addSong(song); }}>
                    <Music className="w-4 h-4 mr-1" /> {song}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {songs.map(song => (
                  <span key={song} className="inline-flex items-center bg-muted rounded px-2 py-1 text-xs mr-1">
                    {song} <Button size="sm" variant="ghost" onClick={e => { e.preventDefault(); removeSong(song); }}><span className="ml-1">×</span></Button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Session Quality:</span>
                {[1,2,3,4,5].map(star => (
                  <Button key={star} type="button" size="icon" variant="ghost" onClick={() => setQuality(star)}>
                    <Star className={cn("w-4 h-4", quality >= star ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground")}/>
                  </Button>
                ))}
              </div>
              <Input placeholder="Areas for improvement" value={improvement} onChange={e => setImprovement(e.target.value)} className="bg-background/50" />
              {/* Audio snippet upload placeholder */}
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" type="button" disabled>
                  <UploadCloud className="w-4 h-4 mr-1" /> Upload Audio (coming soon)
                </Button>
              </div>
              <Button type="submit" className="bg-primary/90 hover:bg-primary mt-2">
                <Plus size={16} /> Log Practice Session
              </Button>
            </form>
            {/* Practice Session List */}
            <div className="space-y-1">
              {sessions.map(session => (
                <div key={session.id} className="flex flex-col border-b border-border/50 last:border-0 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Timer className="w-4 h-4 text-muted-foreground" />
                    <span>{session.date} • {session.duration} min • BPM {session.bpm}</span>
                    <span className="ml-2">Quality: {Array.from({length: session.quality}).map((_,i) => <Star key={i} className="w-3 h-3 text-yellow-400 inline" />)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {session.techniques.map(tech => (
                      <span key={tech} className="bg-muted rounded px-2 py-1 text-xs">{tech}</span>
                    ))}
                    {session.songs.map(song => (
                      <span key={song} className="bg-muted rounded px-2 py-1 text-xs">{song}</span>
                    ))}
                  </div>
                  {session.notes && <div className="text-xs text-muted-foreground mt-1">Notes: {session.notes}</div>}
                  {session.improvement && <div className="text-xs text-muted-foreground mt-1">Improvement: {session.improvement}</div>}
                </div>
              ))}
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
    </ResizableWidget>
  );
};

export default GuitarPracticeWidget; 