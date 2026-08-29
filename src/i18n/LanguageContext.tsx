import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'ar' | 'en';

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  dir: 'ltr',
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = (l: Language) => setLangState(l);

  return (
    <LanguageContext.Provider value={{ lang, setLang, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);

export const t = (key: string, lang: Language = 'en') => {
  const map: Record<string, string> = {
    'dashboard': lang === 'ar' ? 'لوحة القيادة' : 'Dashboard',
    'scanner': lang === 'ar' ? 'الماسح الضوئي' : 'QR Scanner',
    'register': lang === 'ar' ? 'تسجيل' : 'Register',
    'map': lang === 'ar' ? 'الخريطة' : 'Map',
    'admin': lang === 'ar' ? 'الإدارة' : 'Admin Panel',
    'inventory': lang === 'ar' ? 'المخزون' : 'Inventory',
    'welcome': lang === 'ar' ? 'مرحباً' : 'Welcome back',
    'scan_action': lang === 'ar' ? 'بدء المسح' : 'Start Scan',
    'upload': lang === 'ar' ? 'رفع صورة' : 'Upload Image',
    'search_placeholder': lang === 'ar' ? 'بحث...' : 'Search...',
    'load_demo': lang === 'ar' ? 'تحميل بيانات تجريبية' : 'Load Demo Data',
  };
  return map[key] || key;
};
