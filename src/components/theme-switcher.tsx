'use client';

import * as React from 'react';
import { Moon, Sun, Palette } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';

const themes = [
    { name: 'Violet', value: 'theme-violet'},
    { name: 'Blue', value: 'theme-blue'},
    { name: 'Green', value: 'theme-green'},
    { name: 'Orange', value: 'theme-orange'},
    { name: 'Rose', value: 'theme-rose'},
    { name: 'Slate', value: 'theme-slate'},
    { name: 'Gray', value: 'theme-gray'},
    { name: 'Zinc', value: 'theme-zinc'},
    { name: 'Neutral', value: 'theme-neutral'},
    { name: 'Stone', value: 'theme-stone'},
]

export function ThemeSwitcher() {
  const { setTheme } = useTheme();

  const handleColorChange = (color: string) => {
    const colorThemes = themes.map(t => t.value);
    document.body.classList.forEach(className => {
        if (colorThemes.includes(className)) {
            document.body.classList.remove(className);
        }
    });
    document.body.classList.add(color);
  };
  
  React.useEffect(() => {
    // Set a default theme class if none is present
    const colorThemes = themes.map(t => t.value);
    const hasColorTheme = Array.from(document.body.classList).some(c => colorThemes.includes(c));
    if (!hasColorTheme) {
        document.body.classList.add('theme-violet');
    }
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          System
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette className="mr-2 h-4 w-4" />
            <span>Color</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {themes.map((colorTheme) => (
                <DropdownMenuItem
                  key={colorTheme.value}
                  onClick={() => handleColorChange(colorTheme.value)}
                >
                  {colorTheme.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
