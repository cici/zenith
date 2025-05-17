import React, { useEffect, useState } from "react";
import { practiceGoalsService, PracticeGoal, PracticeReminder } from "@/services/practiceGoalsService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Trash2, Edit, Plus, Bell, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// userId should be passed as a prop from auth context or parent component
interface PracticeGoalsWidgetProps {
  userId: string;
}

const defaultGoal: Partial<PracticeGoal> = {
  goal_type: "daily",
  minutes: 30,
  active: true,
  start_date: new Date().toISOString().slice(0, 10),
};

const defaultReminder: Partial<PracticeReminder> = {
  method: "in-app",
  days_of_week: [1, 2, 3, 4, 5],
  active: true,
  reminder_time: "18:00:00",
};

const PracticeGoalsWidget: React.FC<PracticeGoalsWidgetProps> = ({ userId }) => {
  const [tab, setTab] = useState("goals");
  // Goals state
  const [goals, setGoals] = useState<PracticeGoal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [goalForm, setGoalForm] = useState<Partial<PracticeGoal>>(defaultGoal);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalError, setGoalError] = useState<string | null>(null);
  // Reminders state
  const [reminders, setReminders] = useState<PracticeReminder[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [reminderForm, setReminderForm] = useState<Partial<PracticeReminder>>(defaultReminder);
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const { toast } = useToast();
  const [shownReminders, setShownReminders] = useState<{[id: string]: number}>({});

  // Fetch goals
  useEffect(() => {
    setLoadingGoals(true);
    practiceGoalsService.getGoals(userId)
      .then(setGoals)
      .catch(() => setGoals([]))
      .finally(() => setLoadingGoals(false));
  }, [userId]);

  // Fetch reminders
  useEffect(() => {
    setLoadingReminders(true);
    practiceGoalsService.getReminders(userId)
      .then(setReminders)
      .catch(() => setReminders([]))
      .finally(() => setLoadingReminders(false));
  }, [userId]);

  // In-app notification polling for reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0,5); // 'HH:MM'
      const currentDay = now.getDay(); // 0=Sunday
      reminders.forEach(reminder => {
        if (
          reminder.active &&
          reminder.method === 'in-app' &&
          reminder.days_of_week?.includes(currentDay) &&
          reminder.reminder_time?.slice(0,5) === currentTime
        ) {
          // Only show if not shown in last 10 min
          const lastShown = shownReminders[reminder.id] || 0;
          if (now.getTime() - lastShown > 10 * 60 * 1000) {
            toast({
              title: 'Practice Reminder',
              description: `It's time to practice! (${reminder.reminder_time})`,
            });
            setShownReminders(prev => ({ ...prev, [reminder.id]: now.getTime() }));
          }
        }
      });
    };
    checkReminders();
    const interval = setInterval(checkReminders, 60 * 1000); // every minute
    return () => clearInterval(interval);
  }, [reminders, toast, shownReminders]);

  // Handlers for goals
  const handleGoalFormChange = (field: keyof PracticeGoal, value: any) => {
    setGoalForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoalError(null);
    if (!goalForm.minutes || goalForm.minutes < 1) {
      setGoalError("Minutes must be greater than 0");
      return;
    }
    try {
      if (editingGoalId) {
        const updated = await practiceGoalsService.updateGoal(editingGoalId, goalForm as any);
        setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
        setEditingGoalId(null);
      } else {
        const created = await practiceGoalsService.createGoal({ ...goalForm, user_id: userId } as any);
        setGoals((prev) => [created, ...prev]);
      }
      setGoalForm(defaultGoal);
    } catch (err: any) {
      setGoalError(err.message || "Error saving goal");
    }
  };

  const handleEditGoal = (goal: PracticeGoal) => {
    setGoalForm(goal);
    setEditingGoalId(goal.id);
  };

  const handleDeleteGoal = async (id: string) => {
    await practiceGoalsService.deleteGoal(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
    if (editingGoalId === id) setEditingGoalId(null);
  };

  // Handlers for reminders
  const handleReminderFormChange = (field: keyof PracticeReminder, value: any) => {
    setReminderForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReminderError(null);
    if (!reminderForm.reminder_time) {
      setReminderError("Reminder time is required");
      return;
    }
    try {
      if (editingReminderId) {
        const updated = await practiceGoalsService.updateReminder(editingReminderId, reminderForm as any);
        setReminders((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        setEditingReminderId(null);
      } else {
        const created = await practiceGoalsService.createReminder({ ...reminderForm, user_id: userId } as any);
        setReminders((prev) => [created, ...prev]);
      }
      setReminderForm(defaultReminder);
    } catch (err: any) {
      setReminderError(err.message || "Error saving reminder");
    }
  };

  const handleEditReminder = (reminder: PracticeReminder) => {
    setReminderForm(reminder);
    setEditingReminderId(reminder.id);
  };

  const handleDeleteReminder = async (id: string) => {
    await practiceGoalsService.deleteReminder(id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
    if (editingReminderId === id) setEditingReminderId(null);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Practice Goals & Reminders</CardTitle>
      </CardHeader>
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
        </TabsList>
        <TabsContent value="goals">
          <CardContent>
            <form onSubmit={handleGoalSubmit} className="flex flex-col gap-2 mb-4">
              <div className="flex gap-2">
                <Select value={goalForm.goal_type} onValueChange={(v) => handleGoalFormChange("goal_type", v)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={1}
                  value={goalForm.minutes || ""}
                  onChange={(e) => handleGoalFormChange("minutes", Number(e.target.value))}
                  placeholder="Minutes"
                  className="w-32"
                />
                <Input
                  type="date"
                  value={goalForm.start_date || ""}
                  onChange={(e) => handleGoalFormChange("start_date", e.target.value)}
                  className="w-36"
                />
                <Input
                  type="date"
                  value={goalForm.end_date || ""}
                  onChange={(e) => handleGoalFormChange("end_date", e.target.value)}
                  className="w-36"
                />
                <Select value={goalForm.active ? "true" : "false"} onValueChange={(v) => handleGoalFormChange("active", v === "true") }>
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Active" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" variant="default">
                  {editingGoalId ? <Edit className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                  {editingGoalId ? "Update" : "Add"}
                </Button>
              </div>
              {goalError && <div className="text-red-500 text-sm">{goalError}</div>}
            </form>
            {loadingGoals ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
            ) : goals.length === 0 ? (
              <div className="text-muted-foreground py-8">No goals set.</div>
            ) : (
              <div className="space-y-2">
                {goals.map((goal) => (
                  <div key={goal.id} className="flex items-center gap-2 border-b py-2">
                    <span className="font-medium w-20">{goal.goal_type === "daily" ? "Daily" : "Weekly"}</span>
                    <span className="w-20">{goal.minutes} min</span>
                    <span className="w-32">{goal.start_date}</span>
                    <span className="w-32">{goal.end_date || "-"}</span>
                    <span className={goal.active ? "text-green-600" : "text-gray-400"}>{goal.active ? "Active" : "Inactive"}</span>
                    <Button size="icon" variant="ghost" onClick={() => handleEditGoal(goal)}><Edit className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDeleteGoal(goal.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </TabsContent>
        <TabsContent value="reminders">
          <CardContent>
            <form onSubmit={handleReminderSubmit} className="flex flex-col gap-2 mb-4">
              <div className="flex gap-2 items-center">
                <Input
                  type="time"
                  value={reminderForm.reminder_time || ""}
                  onChange={(e) => handleReminderFormChange("reminder_time", e.target.value)}
                  className="w-32"
                />
                <Input
                  type="text"
                  value={reminderForm.days_of_week?.join(",") || ""}
                  onChange={(e) => handleReminderFormChange("days_of_week", e.target.value.split(",").map(Number))}
                  placeholder="Days (0-6, comma)"
                  className="w-40"
                />
                <Select value={reminderForm.method} onValueChange={(v) => handleReminderFormChange("method", v)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-app">In-App</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="push">Push</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={reminderForm.active ? "true" : "false"} onValueChange={(v) => handleReminderFormChange("active", v === "true") }>
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Active" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" variant="default">
                  {editingReminderId ? <Edit className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                  {editingReminderId ? "Update" : "Add"}
                </Button>
              </div>
              {reminderError && <div className="text-red-500 text-sm">{reminderError}</div>}
            </form>
            {loadingReminders ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
            ) : reminders.length === 0 ? (
              <div className="text-muted-foreground py-8">No reminders set.</div>
            ) : (
              <div className="space-y-2">
                {reminders.map((reminder) => (
                  <div key={reminder.id} className="flex items-center gap-2 border-b py-2">
                    <span className="w-24">{reminder.reminder_time}</span>
                    <span className="w-32">{reminder.days_of_week?.join(", ")}</span>
                    <span className="w-24">{reminder.method}</span>
                    <span className={reminder.active ? "text-green-600" : "text-gray-400"}>{reminder.active ? "Active" : "Inactive"}</span>
                    <Button size="icon" variant="ghost" onClick={() => handleEditReminder(reminder)}><Edit className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDeleteReminder(reminder.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>
            )}
            {/* TODO: Integrate with notification system for email/push/in-app reminders */}
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default PracticeGoalsWidget; 