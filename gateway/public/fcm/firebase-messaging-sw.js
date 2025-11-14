importScripts(
  'https://www.gstatic.com/firebasejs/10.13.1/firebase-app-compat.js',
);
importScripts(
  'https://www.gstatic.com/firebasejs/10.13.1/firebase-messaging-compat.js',
);

firebase.initializeApp({
  apiKey: 'AIzaSyCcJEYYL-K3VymRG4b1AOUPlRKSYxHHEW0',
  authDomain: 'hng-notifications.firebaseapp.com',
  projectId: 'hng-notifications',
  storageBucket: 'hng-notifications.firebasestorage.app',
  messagingSenderId: '393678055022',
  appId: '1:393678055022:web:cda5a5b708b5990715e87f',
  measurementId: 'G-LS7007L339',
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  if (!payload.notification) {
    const title = payload.data?.title || 'New message';
    const body = payload.data?.body || '';
    self.registration.showNotification(title, { body });
  }
});
