/**
 * =====================================================
 * MODULE: INVINCIBLE 360 - REEL PROGRESS & LOCAL TELEMETRY
 * Architecture: 100% Standalone Browser Storage Engine (Optimized)
 * =====================================================
 */

(function() {
  const STORAGE_KEYS = {
    COMPLETED_REELS: 'invincible_completed_reels',
    STREAK: 'invincible_reel_streak',
    TOTAL_XP: 'invincible_user_xp'
  };

  class ReelPersistenceEngine {
    constructor() {
      this.streak = parseInt(localStorage.getItem(STORAGE_KEYS.STREAK) || '0', 10);
      this.completedIds = new Set(this.getStoredArray(STORAGE_KEYS.COMPLETED_REELS));
      this.syncDisplayXP();
    }

    getStoredArray(key) {
      try {
        const item = localStorage.getItem(key);
        // CRITICAL FIX: Prevent massive string parsing from locking the main UI thread
        if (!item || item.length > 100000) {
            if (item && item.length > 100000) localStorage.removeItem(key);
            return [];
        }
        return JSON.parse(item);
      } catch (e) {
        return [];
      }
    }

    setStoredArray(key, arr) {
      try {
        // Prevent array bloat from causing future freezes
        if (arr.length > 500) arr = arr.slice(-500);
        localStorage.setItem(key, JSON.stringify(arr));
      } catch (e) {}
    }

    getStreak() {
      return this.streak;
    }

    isCompleted(cardId) {
      return this.completedIds.has(String(cardId));
    }

    filterUnsolvedDeck(deck) {
      if (!Array.isArray(deck)) return [];
      const unsolved = deck.filter(card => !this.isCompleted(card.id));
      return unsolved.length > 0 ? unsolved : deck; // Reset when deck is finished
    }

    recordSuccess(cardId, baseXP = 20, isBoss = false) {
      this.streak++;
      localStorage.setItem(STORAGE_KEYS.STREAK, String(this.streak));

      if (cardId) {
        this.completedIds.add(String(cardId));
        this.setStoredArray(STORAGE_KEYS.COMPLETED_REELS, Array.from(this.completedIds));
      }

      // Calculate XP with Streak Multipliers
      const streakBonus = this.streak > 2 ? 10 : 0;
      const totalEarnedXP = (isBoss ? 50 : baseXP) + streakBonus;

      this.incrementGlobalXP(totalEarnedXP);

      return {
        totalEarnedXP,
        currentStreak: this.streak,
        isStreakBonusApplied: streakBonus > 0
      };
    }

    recordFailure(cardId) {
      this.streak = 0;
      localStorage.setItem(STORAGE_KEYS.STREAK, '0');
      return { totalEarnedXP: 0, currentStreak: 0 };
    }

    incrementGlobalXP(xpAmount) {
      const currentGlobalXP = parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_XP) || '680', 10);
      const newGlobalXP = currentGlobalXP + xpAmount;
      localStorage.setItem(STORAGE_KEYS.TOTAL_XP, String(newGlobalXP));

      this.syncDisplayXP();

      window.dispatchEvent(new CustomEvent('invincible_xp_updated', {
        detail: { xp: newGlobalXP, added: xpAmount }
      }));
    }

    syncDisplayXP() {
      const currentXP = localStorage.getItem(STORAGE_KEYS.TOTAL_XP) || '680';
      const xpDisplayEl = document.getElementById('xpCounter');
      const userXpDisplayEl = document.getElementById('userXpDisplay');
      if (xpDisplayEl) xpDisplayEl.textContent = currentXP;
      if (userXpDisplayEl) userXpDisplayEl.textContent = currentXP;
    }

    resetSessionProgress() {
      this.completedIds.clear();
      localStorage.removeItem(STORAGE_KEYS.COMPLETED_REELS);
      localStorage.removeItem(STORAGE_KEYS.STREAK);
      this.streak = 0;
    }
  }

  window.ReelPersistence = new ReelPersistenceEngine();
})();
