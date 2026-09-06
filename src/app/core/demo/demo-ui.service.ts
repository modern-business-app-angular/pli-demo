import { Injectable, signal } from '@angular/core';
import { db } from '../../../mocks/db';
import { DEMO_CONFIG } from './demo.config';

/**
 * UI state of the portfolio layer: "À propos" drawer, demo data reset, tour replay.
 */
@Injectable({ providedIn: 'root' })
export class DemoUiService {
  readonly config = DEMO_CONFIG;

  /** Whether the "À propos de cette démo" drawer is open. */
  readonly aboutOpen = signal(false);

  /** True when this session restored data saved by a previous visit. */
  readonly restoredFromStorage = db.restored;

  /** ISO date of the restored snapshot, if any. */
  readonly savedAt = db.savedAt;

  /** Set to true to replay the guided tour once the layout is ready. */
  readonly tourRequested = signal(false);

  openAbout(): void {
    this.aboutOpen.set(true);
  }

  closeAbout(): void {
    this.aboutOpen.set(false);
  }

  /** Drop the persisted snapshot and reload so the seed data is back. */
  resetDemo(): void {
    db.clear();
    try {
      localStorage.removeItem(DEMO_CONFIG.storage.tourDone);
    } catch {
      // Storage disabled: nothing to clear.
    }
    location.reload();
  }

  requestTour(): void {
    this.aboutOpen.set(false);
    this.tourRequested.set(true);
  }
}
