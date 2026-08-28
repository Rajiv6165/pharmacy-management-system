"use client";

import React, { useState, useEffect } from 'react';
import { Bell, Check, Loader2, BellRing, BellOff } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface Notification {
  id: number;
  order_id: number | null;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    checkPushSubscription();
  }, []);

  const fetchNotifications = async () => {
    try {
      const [notifsRes, countRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-count')
      ]);
      setNotifications(notifsRes.data);
      setUnreadCount(countRes.data.count);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const checkPushSubscription = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setPushEnabled(!!subscription);
    } catch (error) {
      console.error('Error checking push subscription:', error);
    }
  };

  const togglePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported by your browser.');
      return;
    }

    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Unsubscribe
        await subscription.unsubscribe();
        setPushEnabled(false);
      } else {
        // Subscribe
        const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicVapidKey) {
          console.error("VAPID public key not found");
          alert("Push notification configuration is missing.");
          return;
        }
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });
        
        const subData = subscription.toJSON();
        
        await api.post('/notifications/push-subscribe', {
          endpoint: subData.endpoint,
          p256dh_key: subData.keys?.p256dh,
          auth_key: subData.keys?.auth
        });
        
        setPushEnabled(true);
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
      alert('Failed to enable push notifications. Please check browser permissions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 text-paper/80 hover:text-white transition-colors cursor-pointer"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-mono font-bold leading-none text-white bg-[#8DA59B] rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-primary-dark/15 rounded-xl shadow-xl z-50 flex flex-col max-h-[80vh]">
          <div className="p-4 border-b border-paper flex items-center justify-between bg-gray-50 rounded-t-xl">
            <h3 className="font-bold text-ink flex items-center gap-2">
              Notifications
            </h3>
            <button 
              onClick={togglePush} 
              disabled={loading}
              className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer ${
                pushEnabled 
                  ? 'bg-primary-dark/10 text-primary-dark hover:bg-primary-dark/20' 
                  : 'bg-highlight text-white hover:bg-highlight/90'
              }`}
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : pushEnabled ? (
                <BellOff className="h-3 w-3" />
              ) : (
                <BellRing className="h-3 w-3" />
              )}
              {pushEnabled ? 'Disable Push' : 'Enable Push'}
            </button>
          </div>
          
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-ink/50 text-sm">
                No notifications yet.
              </div>
            ) : (
              <div className="divide-y divide-paper/50">
                {notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    className={`p-4 transition-colors ${notif.is_read ? 'bg-white opacity-75' : 'bg-highlight/5'}`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        {notif.order_id ? (
                          <Link 
                            href={`/orders/${notif.order_id}`}
                            className="font-semibold text-primary-dark hover:text-highlight transition-colors mb-1 block"
                            onClick={() => {
                              if (!notif.is_read) markAsRead(notif.id);
                              setIsOpen(false);
                            }}
                          >
                            {notif.title}
                          </Link>
                        ) : (
                          <h4 className="font-semibold text-primary-dark mb-1">{notif.title}</h4>
                        )}
                        <p className="text-sm text-ink/80 leading-snug">{notif.message}</p>
                        <span className="text-xs text-ink/50 mt-2 block">
                          {new Date(notif.created_at).toLocaleString()}
                        </span>
                      </div>
                      {!notif.is_read && (
                        <button 
                          onClick={() => markAsRead(notif.id)}
                          className="p-1.5 rounded-full hover:bg-primary-dark/10 text-primary-dark/50 hover:text-primary-dark transition-colors cursor-pointer"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
