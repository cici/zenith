import { ThemeSettings } from "@/components/ThemeSettings";

export function ThemeManagerPage() {
  return (
    <div className="container py-10 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Theme Manager</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Customize the appearance of your application by adjusting theme settings, color schemes, and preferences.
        </p>
      </div>
      
      <ThemeSettings />
      
      <div className="mt-12 border-t pt-8">
        <h2 className="text-xl font-semibold mb-4">Theme Preview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Sample Card */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Card Component</h3>
            <div className="rounded-lg border shadow-sm bg-card text-card-foreground p-6">
              <h4 className="text-lg font-semibold">Card Title</h4>
              <p className="text-muted-foreground mt-2">This is a sample card component to preview the theme.</p>
              <div className="flex justify-end mt-4">
                <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground">
                  Action Button
                </button>
              </div>
            </div>
          </div>
          
          {/* Sample Form Elements */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Form Elements</h3>
            <div className="rounded-lg border shadow-sm bg-card text-card-foreground p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Input Field</label>
                <input type="text" placeholder="Sample input" className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Select Field</label>
                <select className="w-full px-3 py-2 border rounded-md">
                  <option>Option 1</option>
                  <option>Option 2</option>
                  <option>Option 3</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="sample-checkbox" />
                <label htmlFor="sample-checkbox">Checkbox example</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ThemeManagerPage; 