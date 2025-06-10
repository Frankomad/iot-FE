
import { useState, useEffect } from 'react';
import { subscribeToPush } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    setIsSupported('serviceWorker' in navigator && 'PushManager' in window);
    
    // Check if user is already subscribed
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setIsSubscribed(!!subscription);
        });
      });
    }
  }, []);

  const subscribe = async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        toast({
          title: "Permission Denied",
          description: "Please allow notifications to receive alerts.",
          variant: "destructive",
        });
        return;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          'BEbDsREdM4x6IuftaABaRV_mQ3mhLJ7c3LVSH9gaJUXo8qTDz-YSQ2zwZ0gG8jU5mx-bMewYF_MupIb1S7C4fck'
        ),
      });

      // Convert subscription to our format
      const subscriptionJSON = subscription.toJSON();
      
      if (subscriptionJSON.endpoint && subscriptionJSON.keys) {
        await subscribeToPush(
          subscriptionJSON.endpoint,
          subscriptionJSON.keys.p256dh || '',
          subscriptionJSON.keys.auth || ''
        );

        setIsSubscribed(true);
        toast({
          title: "Subscribed!",
          description: "You'll now receive push notifications for sensor alerts.",
        });
      }
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      toast({
        title: "Subscription Failed",
        description: "Failed to subscribe to push notifications.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          setIsSubscribed(false);
          toast({
            title: "Unsubscribed",
            description: "You will no longer receive push notifications.",
          });
        }
      }
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      toast({
        title: "Error",
        description: "Failed to unsubscribe from notifications.",
        variant: "destructive",
      });
    }
  };

  return {
    isSupported,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
  };
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
