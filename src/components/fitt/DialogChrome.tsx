'use client';

import type React from 'react';
import { useEffect, useRef } from 'react';
import styles from './fitt.module.css';

export function DialogChrome({
  kicker,
  title,
  meta,
  tabs,
  onClose,
  children,
}: {
  kicker: string;
  title: string;
  meta?: React.ReactNode;
  tabs: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const dlgRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    lastFocus.current = document.activeElement as HTMLElement;
    closeRef.current?.focus();
    return () => {
      lastFocus.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && dlgRef.current) {
        const focusable = Array.from(dlgRef.current.querySelectorAll<HTMLElement>('button,select,textarea,[href]')).filter(el => el.offsetParent);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className={styles.ov} aria-hidden="false" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.dlg} role="dialog" aria-modal="true" aria-labelledby="fittDlgTitle" ref={dlgRef}>
        <div className={styles.dlgH}>
          <div>
            <div className={styles.note}>{kicker}</div>
            <h2 id="fittDlgTitle">{title}</h2>
            {meta && <div style={{ marginTop: 6 }}>{meta}</div>}
          </div>
          <button className={styles.x} aria-label="Close" ref={closeRef} onClick={onClose}>&times;</button>
        </div>
        <div className={styles.dtabs} role="tablist">{tabs}</div>
        <div className={styles.dlgB}>{children}</div>
      </div>
    </div>
  );
}
