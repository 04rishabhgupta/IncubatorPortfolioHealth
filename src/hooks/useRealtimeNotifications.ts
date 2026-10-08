'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/store';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { notificationFromRow } from '@/lib/supabase/mappers';

/**
 * Subscribes to Supabase Realtime updates on `notification_recipients` and `notifications`
 * for the authenticated staff member. Automatically appends incoming notifications to the
 * store and triggers interactive Sonner toasts.
 */
export function useRealtimeNotifications() {
  const router = useRouter();
  const currentUser = useStore((s) => s.currentUser);
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    if (!currentUser?.id) return;

    try {
      const supabase = createClient();
      const recipientId = currentUser.id;

      // Create a unique channel for this user's notifications
      const channel = supabase
        .channel(`realtime:notifications:${recipientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_recipients',
          filter: `recipient_id=eq.${recipientId}`,
        },
        async (payload) => {
          try {
            const notifId = payload.new.notification_id;
            if (!notifId) return;

            // Fetch the notification details
            const { data: notifRow } = await supabase
              .from('notifications')
              .select('*')
              .eq('id', notifId)
              .single();

            if (!notifRow) return;

            const appNotif = notificationFromRow(notifRow, Boolean(payload.new.read_at));

            // Update Zustand store
            useStore.setState((state) => {
              const exists = state.notifications.some((n) => n.id === appNotif.id);
              if (exists) return state;
              return {
                notifications: [appNotif, ...state.notifications],
              };
            });

            // Trigger sonner toast
            toast.info(appNotif.title, {
              description: appNotif.message,
              action: {
                label: 'View',
                onClick: () => {
                  useStore.getState().markNotificationRead(appNotif.id);
                  if (appNotif.actionUrl) {
                    routerRef.current.push(appNotif.actionUrl);
                  } else if (appNotif.startupId) {
                    routerRef.current.push(`/startups/${appNotif.startupId}`);
                  }
                },
              },
            });
          } catch (err) {
            console.error('Failed to process realtime notification insert:', err);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notification_recipients',
          filter: `recipient_id=eq.${recipientId}`,
        },
        (payload) => {
          const notifId = payload.new.notification_id;
          const isRead = Boolean(payload.new.read_at);
          if (!notifId) return;

          useStore.setState((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === notifId ? { ...n, read: isRead } : n
            ),
          }));
        }
      )
      .subscribe();

      return () => {
        try {
          supabase.removeChannel(channel);
        } catch {}
      };
    } catch (err) {
      console.warn('Realtime notifications subscription unavailable:', err);
    }
  }, [currentUser?.id]);
}
