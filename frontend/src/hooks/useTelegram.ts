import { useEffect } from 'react';
import { 
  useWebApp, 
  useInitData, 
  useCloudStorage,
  useHapticFeedback,
  useExpand
} from '@vkruglikov/react-telegram-web-app';

export function useTelegram() {
  const webApp = useWebApp();
  const initData = useInitData();
  const cloudStorage = useCloudStorage();
  const haptic = useHapticFeedback();
  const expand = useExpand();

  useEffect(() => {
    if (webApp) {
      // Configure WebApp
      webApp.ready();
      webApp.enableClosingConfirmation();
      
      // Set header color
      webApp.setHeaderColor(webApp.colorScheme === 'dark' ? '#1a1a1a' : '#ffffff');
      
      // Expand to full screen
      expand();
    }
  }, [webApp, expand]);

  const showMainButton = (text: string, onClick: () => void) => {
    if (webApp?.MainButton) {
      webApp.MainButton.setText(text);
      webApp.MainButton.onClick(onClick);
      webApp.MainButton.show();
    }
  };

  const hideMainButton = () => {
    if (webApp?.MainButton) {
      webApp.MainButton.hide();
    }
  };

  const showBackButton = (onClick: () => void) => {
    if (webApp?.BackButton) {
      webApp.BackButton.onClick(onClick);
      webApp.BackButton.show();
    }
  };

  const hideBackButton = () => {
    if (webApp?.BackButton) {
      webApp.BackButton.hide();
    }
  };

  const showConfirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (webApp?.showConfirm) {
        webApp.showConfirm(message, (confirmed) => {
          resolve(confirmed);
        });
      } else {
        resolve(window.confirm(message));
      }
    });
  };

  const showAlert = (message: string): Promise<void> => {
    return new Promise((resolve) => {
      if (webApp?.showAlert) {
        webApp.showAlert(message, () => {
          resolve();
        });
      } else {
        alert(message);
        resolve();
      }
    });
  };

  const impactOccurred = (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => {
    haptic?.impactOccurred(style);
  };

  const notificationOccurred = (type: 'error' | 'success' | 'warning') => {
    haptic?.notificationOccurred(type);
  };

  const saveToCloudStorage = async (key: string, value: string) => {
    try {
      await cloudStorage?.setItem(key, value);
    } catch (error) {
      console.error('Error saving to cloud storage:', error);
      localStorage.setItem(key, value);
    }
  };

  const getFromCloudStorage = async (key: string): Promise<string | null> => {
    try {
      return await cloudStorage?.getItem(key) || null;
    } catch (error) {
      console.error('Error getting from cloud storage:', error);
      return localStorage.getItem(key);
    }
  };

  return {
    webApp,
    initData,
    user: initData?.user,
    colorScheme: webApp?.colorScheme || 'light',
    themeParams: webApp?.themeParams,
    showMainButton,
    hideMainButton,
    showBackButton,
    hideBackButton,
    showConfirm,
    showAlert,
    impactOccurred,
    notificationOccurred,
    saveToCloudStorage,
    getFromCloudStorage,
    platform: webApp?.platform
  };
}
