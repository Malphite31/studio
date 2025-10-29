'use client';
import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { ALL_ACHIEVEMENTS, type AchievementData } from '@/lib/achievements';
import type { UserDataAggregate, Achievement } from '@/lib/types';
import { getSdks } from '@/firebase/index';

/**
 * Checks for and unlocks new achievements for a user.
 * @param userId The ID of the user.
 * @param data All relevant user data for checking achievements.
 * @param onNewAchievementsUnlocked Optional callback that fires with newly unlocked achievements.
 */
export const checkAndUnlockAchievements = async (
  userId: string,
  data: UserDataAggregate,
  onNewAchievementsUnlocked?: (unlocked: AchievementData[]) => void
) => {
  const { firestore } = getSdks(undefined as any);
  if (!data.unlockedAchievements) return;

  const unlockedIds = new Set(data.unlockedAchievements.map(a => a.id));

  const newlyUnlocked: AchievementData[] = [];

  for (const achievement of ALL_ACHIEVEMENTS) {
    if (!unlockedIds.has(achievement.id)) {
      if (achievement.check(data)) {
        newlyUnlocked.push(achievement);
      }
    }
  }

  if (newlyUnlocked.length > 0) {
    try {
      const batch = writeBatch(firestore);
      for (const achievement of newlyUnlocked) {
        const achievementRef = doc(firestore, 'users', userId, 'achievements', achievement.id);
        const newAchievement: Omit<Achievement, 'userId'> = {
          id: achievement.id,
          unlockedAt: serverTimestamp(),
        };
        batch.set(achievementRef, newAchievement);
      }
      await batch.commit();

      if (onNewAchievementsUnlocked) {
        onNewAchievementsUnlocked(newlyUnlocked);
      }
    } catch (error) {
      console.error("Failed to save new achievements:", error);
    }
  }
};
