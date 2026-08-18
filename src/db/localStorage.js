const KEYS = {
  INSTALLED: 'periodmood_installed',
  VERSION: 'periodmood_version',
  LAST_VISIT: 'periodmood_lastVisit',
  ONBOARDED: 'periodmood_onboarded'
};

export const LocalStorageService = {
  setInstalled(version = '1.0.0') {
    localStorage.setItem(KEYS.INSTALLED, 'true');
    localStorage.setItem(KEYS.VERSION, version);
  },

  isInstalled() {
    return localStorage.getItem(KEYS.INSTALLED) === 'true';
  },

  updateLastVisit() {
    localStorage.setItem(KEYS.LAST_VISIT, new Date().toISOString());
  },

  setOnboarded(status = true) {
    localStorage.setItem(KEYS.ONBOARDED, String(status));
  },

  isOnboarded() {
    return localStorage.getItem(KEYS.ONBOARDED) === 'true';
  },

  clearAllFlags() {
    Object.values(KEYS).forEach(key => localStorage.removeItem(key));
  }
};