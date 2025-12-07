import React, { createContext, useState, useEffect } from 'react';
import en from '../locales/en.json';
import ru from '../locales/ru.json';

const translations = { en, ru };

export const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState(() => {
        // Load from localStorage or default to Russian
        const saved = localStorage.getItem('language');
        return saved || 'ru';
    });

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    const t = (key) => {
        const keys = key.split('.');
        let value = translations[language];

        for (const k of keys) {
            value = value?.[k];
            if (value === undefined) break;
        }

        // Fallback to English if key not found
        if (value === undefined) {
            value = translations.en;
            for (const k of keys) {
                value = value?.[k];
                if (value === undefined) break;
            }
        }

        return value || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}
