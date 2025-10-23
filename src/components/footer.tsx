'use client';

import { Coins } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full mt-auto">
      <div className="container mx-auto flex items-center justify-center p-4 text-sm text-muted-foreground">
        <Coins className="h-4 w-4 mr-2 text-primary" />
        <span>Made by Benz Siangco</span>
      </div>
    </footer>
  );
}
