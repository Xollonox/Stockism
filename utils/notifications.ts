// Push Notifications — Firebase Cloud Messaging
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '../../services/firebase';
import { db } from '../../services/firebase';

const VAPID_KEY = 'BG0iRd5mE5P7R-h9H--bPYMfNKUzxLjnYI-BJ_Vk0eLhLMJtXLiY_r21NISVqPD6VzJ5DnfLBfKPE6EBoBBiFA';

export async function requestNotificationPermission(uid: string): Promise<boolean> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const messaging = getMessaging(app);
    const fcmToken = await getToken(messaging, { vapidKey: VAPID_KEY });

    // Save token to user's document
    await setDoc(doc(db, 'users', uid), { fcmToken }, { merge: true });
    return true;
  } catch {
    return false;
  }
}

// In-app notification (when app is open)
export function setupForegroundNotifications(callback: (payload: any) => void) {
  try {
    const messaging = getMessaging(app);
    onMessage(messaging, (payload) => {
      callback(payload);
    });
  } catch {}
}

// Send notification via Firebase Functions (or directly via API)
export async function sendNotification(uid: string, title: string, body: string, data?: Record<string, string>) {
  // Store in Firestore for in-app display
  await addDoc(collection(db, 'notifications'), {
    uid,
    title,
    body,
    data: data || {},
    read: false,
    createdAt: serverTimestamp(),
  });
}
