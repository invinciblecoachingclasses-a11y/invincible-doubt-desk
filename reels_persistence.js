/**
 * =====================================================
 * MODULE: INVINCIBLE 360 - REEL PROGRESS & TELEMETRY ENGINE
 * Architecture: Standalone LocalStorage & Cloud XP Synchronizer
 * =====================================================
 */

(function() {
  const STORAGE_KEYS = {
    COMPLETED_REELS: 'invincible_completed_reels',
    STREAK: 'invincible_reel_streak',
    PENDING_XP_QUEUE: 'invincible_offline_xp_queue',
    TOTAL_XP: 'invincible_user_xp'
  };

  class ReelPersistenceEngine {
    constructor() {
      this.streak = parseInt(localStorage.getItem(STORAGE_KEYS.STREAK) || '0', 10);
      this.completedIds = new Set(this.getStoredArray(STORAGE_KEYS.COMPLETED_REELS));
      this.bindNetworkListeners();
    }

    getStoredArray(key) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : [];
      } catch (e) {
        return [];
      }
    }

    setStoredArray(key, arr) {
      try {
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
      return unsolved.length > 0 ? unsolved : deck; // Reset if student finished entire deck
    }

    recordSuccess(cardId, baseXP = 20, isBoss = false) {
      this.streak++;
      localStorage.setItem(STORAGE_KEYS.STREAK, String(this.streak));

      // Mark Card ID as completed
      if (cardId) {
        this.completedIds.add(String(cardId));
        this.setStoredArray(STORAGE_KEYS.COMPLETED_REELS, Array.from(this.completedIds));
      }

      // Calculate XP with Streak Multipliers
      const streakBonus = this.streak > 2 ? 10 : 0;
      const totalEarnedXP = (isBoss ? 50 : baseXP) + streakBonus;

      this.incrementGlobalXP(totalEarnedXP);
      this.syncXPToCloud(totalEarnedXP, cardId, true);

      return {
        totalEarnedXP,
        currentStreak: this.streak,
        isStreakBonusApplied: streakBonus > 0
      };
    }

    recordFailure(cardId) {
      this.streak = 0;
      localStorage.setItem(STORAGE_KEYS.STREAK, '0');
      this.syncXPToCloud(0, cardId, false);
      return { totalEarnedXP: 0, currentStreak: 0 };
    }

    incrementGlobalXP(xpAmount) {
      const currentGlobalXP = parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_XP) || '0', 10);
      const newGlobalXP = currentGlobalXP + xpAmount;
      localStorage.setItem(STORAGE_KEYS.TOTAL_XP, String(newGlobalXP));

      const xpDisplayEl = document.getElementById('xpCounter');
      if (xpDisplayEl) {
        xpDisplayEl.textContent = newGlobalXP;
      }

      window.dispatchEvent(new CustomEvent('invincible_xp_updated', {
        detail: { xp: newGlobalXP, added: xpAmount }
      }));
    }

    async syncXPToCloud(xpEarned, cardId, isCorrect) {
      const payload = {
        card_id: cardId,
        xp_earned: xpEarned,
        streak: this.streak,
        is_correct: isCorrect,
        timestamp: Date.now()
      };

      if (!navigator.onLine) {
        this.queueOfflinePayload(payload);
        return;
      }

      try {
        const res = await fetch('/api/update-xp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Network error');
      } catch (e) {
        this.queueOfflinePayload(payload);
      }
    }

    queueOfflinePayload(payload) {
      const queue = this.getStoredArray(STORAGE_KEYS.PENDING_XP_QUEUE);
      queue.push(payload);
      this.setStoredArray(STORAGE_KEYS.PENDING_XP_QUEUE, queue);
    }

    async flushOfflineQueue() {
      const queue = this.getStoredArray(STORAGE_KEYS.PENDING_XP_QUEUE);
      if (queue.length === 0) return;

      try {
        const res = await fetch('/api/sync-offline-xp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ batch: queue })
        });
        if (res.ok) {
          localStorage.removeItem(STORAGE_KEYS.PENDING_XP_QUEUE);
        }
      } catch (e) {}
    }

    bindNetworkListeners() {
      window.addEventListener('online', () => this.flushOfflineQueue());
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
