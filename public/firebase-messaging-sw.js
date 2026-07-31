// Firebase Messaging service worker for background push notifications.
// This file must stay at the root of the hosted site.

/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js')

// These values are public (same as the web client config).
// They are safe to include here.
firebase.initializeApp({
  apiKey: 'PLACEHOLDER_API_KEY',
  authDomain: 'PLACEHOLDER_AUTH_DOMAIN',
  projectId: 'PLACEHOLDER_PROJECT_ID',
  storageBucket: 'PLACEHOLDER_STORAGE_BUCKET',
  messagingSenderId: 'PLACEHOLDER_MESSAGING_SENDER_ID',
  appId: 'PLACEHOLDER_APP_ID'
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'New task'
  const options = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: payload.data || {},
    tag: payload.data?.taskId || 'task-notification',
    renotify: true
  }

  self.registration.showNotification(title, options)
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          if (url !== '/' && 'navigate' in client) {
            client.navigate(url)
          }
          return
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})
