'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface PasswordStrengthMeterProps {
  password?: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const evaluatePassword = (pass: string) => {
    let score = 0;
    if (!pass) return { score, text: '', color: '' };

    // Award points for different criteria
    if (pass.length > 8) score++;
    if (pass.length > 12) score++;
    if (pass.match(/[a-z]/)) score++;
    if (pass.match(/[A-Z]/)) score++;
    if (pass.match(/[0-9]/)) score++;
    if (pass.match(/[^a-zA-Z0-9]/)) score++; // Special characters

    let text = '';
    let color = '';

    switch (score) {
      case 0:
      case 1:
      case 2:
        text = 'Weak';
        color = 'bg-red-500';
        break;
      case 3:
      case 4:
        text = 'Medium';
        color = 'bg-yellow-500';
        break;
      case 5:
      case 6:
        text = 'Strong';
        color = 'bg-green-500';
        break;
      default:
        text = 'Weak';
        color = 'bg-red-500';
    }

    return { score, text, color };
  };

  const { score, text, color } = evaluatePassword(password || '');
  const progressValue = (score / 6) * 100;

  return (
    <div className="space-y-1">
      <Progress value={progressValue} className="h-2" indicatorClassName={color} />
      <p className="text-xs font-medium" style={{ color: `var(--${color.replace('bg-', '')})` }}>
        {text}
      </p>
    </div>
  );
}
