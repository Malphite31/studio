'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, Settings, Gift, Coins } from "lucide-react";
import { Button } from "./ui/button";

export function TourGuide() {
    
  const features = [
    {
      icon: <Coins className="h-12 w-12 text-primary mx-auto" />,
      title: "Take Control of Your Finances",
      description: "PennyWise is here to help you track your spending, manage budgets, and save for your dreams.",
    },
    {
      icon: <PlusCircle className="h-12 w-12 text-primary mx-auto" />,
      title: "Log Everything",
      description: "Use the 'Add Transaction' button to quickly log expenses, income, and even loans.",
    },
    {
      icon: <Settings className="h-12 w-12 text-primary mx-auto" />,
      title: "Set Your Budgets",
      description: "Click 'Edit Budgets' to set monthly spending limits for different categories and stay on track.",
    },
    {
      icon: <Gift className="h-12 w-12 text-primary mx-auto" />,
      title: "Create a Wish List",
      description: "Saving up for something special? Add it to your wish list and track your progress towards your goal.",
    },
  ];

  return (
    <Carousel className="w-full max-w-md mx-auto">
      <CarouselContent>
        {features.map((feature, index) => (
          <CarouselItem key={index}>
            <div className="p-1">
              <Card className="border-none shadow-none">
                <CardContent className="flex flex-col items-center justify-center p-6 text-center gap-4">
                  {feature.icon}
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
