'use client';
import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { ALL_ACHIEVEMENTS, type AchievementData } from '@/lib/achievements';
import type { UserDataAggregate, Achievement } from '@/lib/types';
import { getSdks, errorEmitter, FirestorePermissionError } from '@/firebase/index';

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
    const batch = writeBatch(firestore);
    const achievementsToCreate: any[] = [];
    for (const achievement of newlyUnlocked) {
      const achievementRef = doc(firestore, 'users', userId, 'achievements', achievement.id);
      const newAchievementData: Omit<Achievement, 'userId' | 'id'> = {
        unlockedAt: serverTimestamp(),
      };
      batch.set(achievementRef, newAchievementData);
      achievementsToCreate.push({ id: achievement.id, ...newAchievementData });
    }

    batch.commit().then(() => {
      if (onNewAchievementsUnlocked) {
        onNewAchievementsUnlocked(newlyUnlocked);
      }
    }).catch(error => {
      const contextualError = new FirestorePermissionError({
        path: `users/${userId}/achievements`,
        operation: 'write',
        requestResourceData: achievementsToCreate,
      });
      errorEmitter.emit('permission-error', contextualError);
    });
  }
};
