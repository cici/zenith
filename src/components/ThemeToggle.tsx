import { Moon, Sun, Laptop, Palette } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColorScheme, ThemeMode } from "@/types/theme";

export function ThemeToggle() {
  const { theme, setThemeMode, setColorScheme, toggleThemeMode } = useTheme();

  const modeIcon = {
    light: <Sun className="h-[1.2rem] w-[1.2rem]" />,
    dark: <Moon className="h-[1.2rem] w-[1.2rem]" />,
    system: <Laptop className="h-[1.2rem] w-[1.2rem]" />,
  };

  const colorSchemeLabels: Record<ColorScheme, string> = {
    default: "Default",
    blue: "Blue",
    green: "Green",
    purple: "Purple",
    orange: "Orange",
  };

  const currentModeIcon = modeIcon[theme.mode] || modeIcon.system;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          {currentModeIcon}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Theme Settings</DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Appearance
        </DropdownMenuLabel>
        
        <DropdownMenuItem onClick={() => setThemeMode("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
          {theme.mode === "light" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => setThemeMode("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
          {theme.mode === "dark" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => setThemeMode("system")}>
          <Laptop className="mr-2 h-4 w-4" />
          <span>System</span>
          {theme.mode === "system" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Color Scheme
        </DropdownMenuLabel>
        
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette className="mr-2 h-4 w-4" />
            <span>Color Scheme</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {colorSchemeLabels[theme.colorScheme]}
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => setColorScheme("default")}>
              Default
              {theme.colorScheme === "default" && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setColorScheme("blue")}>
              Blue
              {theme.colorScheme === "blue" && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setColorScheme("green")}>
              Green
              {theme.colorScheme === "green" && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setColorScheme("purple")}>
              Purple
              {theme.colorScheme === "purple" && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setColorScheme("orange")}>
              Orange
              {theme.colorScheme === "orange" && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 