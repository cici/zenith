import { PreferenceManagement } from "@/components/PreferenceManagement";

export function ThemeManagerPage() {
  return (
    <div className="container py-10 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Preferences</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Customize your application experience with theme and data settings.
        </p>
      </div>
      
      <PreferenceManagement />
    </div>
  );
}

export default ThemeManagerPage; 