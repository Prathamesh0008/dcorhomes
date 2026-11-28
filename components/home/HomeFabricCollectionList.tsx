'use client';

import type { FocusEvent, ReactNode } from 'react';
import styles from './HomeFabricCollection.module.css';

export default function HomeFabricCollectionList({ children }: { children: ReactNode }) {
  function revealFocusedCard({ currentTarget: list, target }: FocusEvent<HTMLUListElement>) {
    const card = target.closest('li');
    if (!card || !target.matches(':focus-visible')) return;

    requestAnimationFrame(() => {
      if (document.activeElement !== target) return;

      const viewport = list.getBoundingClientRect();
      const bounds = card.getBoundingClientRect();
      if (bounds.left < viewport.left || bounds.right > viewport.right) {
        list.scrollBy({ left: bounds.left - viewport.left, behavior: 'instant' });
      }
    });
  }

  return (
    <ul className={styles.cards} role="list" aria-label="Curtain fabric categories" tabIndex={0} onFocus={revealFocusedCard}>
      {children}
    </ul>
  );
}
