if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(registration => {
      console.log('✓ Service Worker registrado correctamente');
      
      // Notificar sobre actualizaciones
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateNotification();
          }
        });
      });
    })
    .catch(error => console.error('✗ Error registrando Service Worker:', error));

  // Períodica sincronización
  if ('periodicSync' in registration) {
    try {
      navigator.serviceWorker.ready.then(registration => {
        registration.periodicSync.register('update-check', {
          minInterval: 24 * 60 * 60 * 1000 // 24 horas
        });
      });
    } catch (error) {
      console.log('Sync periódico no disponible:', error);
    }
  }
}

// Detectar cambios de conectividad
window.addEventListener('online', () => {
  console.log('🌐 Conexión restaurada');
  showNotification('Conexión restaurada', 'Tu app está sincronizada');
});

window.addEventListener('offline', () => {
  console.log('📡 Sin conexión');
  showNotification('Sin conexión', 'Puedes usar la app sin internet');
});

// Notificación de actualización disponible
function showUpdateNotification() {
  const hasShown = sessionStorage.getItem('update-shown');
  if (hasShown) return;
  
  sessionStorage.setItem('update-shown', 'true');
  
  const toast = document.createElement('div');
  toast.id = 'update-toast';
  toast.style.cssText = `
    position: fixed;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    background: #3b82f6;
    color: white;
    padding: 14px 20px;
    border-radius: 10px;
    font-weight: 700;
    z-index: 9999;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    gap: 12px;
  `;
  
  toast.innerHTML = `
    <span>📦 Nueva versión disponible</span>
    <button onclick="location.reload()" style="
      background: white;
      color: #3b82f6;
      border: 0;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 700;
      font-size: 12px;
    ">Actualizar</button>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => toast.remove(), 10000);
}

// Sistema de notificaciones
function showNotification(title, message) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body: message,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%230a0e18" width="192" height="192"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="80" font-weight="bold" fill="%2310b981" font-family="Arial">⚡</text></svg>',
      badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><circle cx="48" cy="48" r="45" fill="%2310b981"/></svg>'
    });
  }
}

// Solicitar permisos de notificaciones
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        showNotification('¡Gracias!', 'Recibirás actualizaciones importantes');
      }
    });
  }
}

// Función para compartir perfil
async function shareProfile(profileData) {
  if (!navigator.share) {
    console.log('API Share no disponible');
    return;
  }

  try {
    await navigator.share({
      title: 'FF MAX - Perfil de Sensibilidad',
      text: `Perfil: ${profileData.model}\nFactor: ${profileData.factor}x\nScore: ${profileData.score}%`,
      url: window.location.href
    });
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error compartiendo:', error);
    }
  }
}

// Detectar instalación de PWA
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  let deferredPrompt = e;
  
  const installBtn = document.createElement('button');
  installBtn.id = 'install-app-btn';
  installBtn.textContent = '📱 Instalar App';
  installBtn.style.cssText = `
    position: fixed;
    bottom: 100px;
    right: 20px;
    background: #10b981;
    color: #022c22;
    border: 0;
    padding: 12px 18px;
    border-radius: 10px;
    font-weight: 700;
    cursor: pointer;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  `;
  
  installBtn.addEventListener('click', async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Usuario respondió: ${outcome}`);
    installBtn.remove();
  });
  
  // Mostrar después de 3 segundos si no está instalado
  setTimeout(() => {
    if (!document.getElementById('install-app-btn')) {
      document.body.appendChild(installBtn);
    }
  }, 3000);
});

// Detectar cuando la app fue instalada
window.addEventListener('appinstalled', () => {
  console.log('✓ PWA instalada correctamente');
  const btn = document.getElementById('install-app-btn');
  if (btn) btn.remove();
  
  // Notificar instalación exitosa
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        showNotification('¡Instalación completada!', 'FF MAX Calibrador está listo para usar offline');
      }
    });
  }
});

// Detectar si está en modo app (installed PWA)
function isRunningAsApp() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true ||
         document.referrer.includes('android-app://');
}

console.log(`Modo: ${isRunningAsApp() ? '📱 App' : '🌐 Browser'}`);
