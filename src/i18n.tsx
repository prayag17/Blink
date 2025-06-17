import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";

i18next.use(LanguageDetector).use(initReactI18next).use(Backend).init({
    returnObjects: true,
    fallbackLng: "en", // Language to fallback to if the selected is not configured
    debug: true, //To enable us see errors
    lng: "en", //Default language as english
});
