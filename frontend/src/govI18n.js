import React, { createContext, useContext, useState } from 'react';

const govTranslations = {
  en: { name: 'English', dashboard: 'Dashboard', usersRoles: 'Users & Roles', departments: 'Departments', auditLogs: 'Audit Logs', requests: 'Requests', settings: 'Settings', signOut: 'Sign Out', digitalWorkflow: 'Digital Document Workflow', mainGov: 'Main State Government', stateGov: 'State Government', createFile: 'Create New File', myTasks: 'My Tasks', fileTracking: 'File Tracking', reports: 'Reports', selectLang: 'Language' },
  hi: { name: 'हिन्दी', dashboard: 'डैशबोर्ड', usersRoles: 'उपयोगकर्ता और भूमिकाएं', departments: 'विभाग', auditLogs: 'ऑडिट लॉग', requests: 'अनुरोध', settings: 'सेटिंग्स', signOut: 'साइन आउट', digitalWorkflow: 'डिजिटल दस्तावेज़ कार्यप्रवाह', mainGov: 'मुख्य राज्य सरकार', stateGov: 'राज्य सरकार', createFile: 'नई फ़ाइल बनाएं', myTasks: 'मेरे कार्य', fileTracking: 'फ़ाइल ट्रैकिंग', reports: 'रिपोर्ट', selectLang: 'भाषा' },
  kn: { name: 'ಕನ್ನಡ', dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', usersRoles: 'ಬಳಕೆದಾರರು ಮತ್ತು ಪಾತ್ರಗಳು', departments: 'ಇಲಾಖೆಗಳು', auditLogs: 'ಆಡಿಟ್ ಲಾಗ್‌ಗಳು', requests: 'ವಿನಂತಿಗಳು', settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು', signOut: 'ಸೈನ್ ಔಟ್', digitalWorkflow: 'ಡಿಜಿಟಲ್ ದಾಖಲೆ ಕಾರ್ಯಪ್ರವಾಹ', mainGov: 'ಮುಖ್ಯ ರಾಜ್ಯ ಸರ್ಕಾರ', stateGov: 'ರಾಜ್ಯ ಸರ್ಕಾರ', createFile: 'ಹೊಸ ಫೈಲ್ ರಚಿಸಿ', myTasks: 'ನನ್ನ ಕಾರ್ಯಗಳು', fileTracking: 'ಫೈಲ್ ಟ್ರ್ಯಾಕಿಂಗ್', reports: 'ವರದಿಗಳು', selectLang: 'ಭಾಷೆ' },
  bn: { name: 'বাংলা', dashboard: 'ড্যাশবোর্ড', usersRoles: 'ব্যবহারকারী ও ভূমিকা', departments: 'বিভাগ', auditLogs: 'অডিট লগ', requests: 'অনুরোধ', settings: 'সেটিংস', signOut: 'সাইন আউট', digitalWorkflow: 'ডিজিটাল নথি কার্যপ্রবাহ', mainGov: 'মূল রাজ্য সরকার', stateGov: 'রাজ্য সরকার', createFile: 'নতুন ফাইল তৈরি', myTasks: 'আমার কাজ', fileTracking: 'ফাইল ট্র্যাকিং', reports: 'রিপোর্ট', selectLang: 'ভাষা' },
  te: { name: 'తెలుగు', dashboard: 'డ్యాష్‌బోర్డ్', usersRoles: 'వినియోగదారులు & పాత్రలు', departments: 'శాఖలు', auditLogs: 'ఆడిట్ లాగ్‌లు', requests: 'అభ్యర్థనలు', settings: 'సెట్టింగ్‌లు', signOut: 'సైన్ అవుట్', digitalWorkflow: 'డిజిటల్ పత్రం వర్క్‌ఫ్లో', mainGov: 'ప్రధాన రాష్ట్ర ప్రభుత్వం', stateGov: 'రాష్ట్ర ప్రభుత్వం', createFile: 'కొత్త ఫైల్ సృష్టించు', myTasks: 'నా పనులు', fileTracking: 'ఫైల్ ట్రాకింగ్', reports: 'నివేదికలు', selectLang: 'భాష' },
  mr: { name: 'मराठी', dashboard: 'डॅशबोर्ड', usersRoles: 'वापरकर्ते आणि भूमिका', departments: 'विभाग', auditLogs: 'ऑडिट लॉग', requests: 'विनंत्या', settings: 'सेटिंग्ज', signOut: 'साइन आउट', digitalWorkflow: 'डिजिटल कागदपत्र कार्यप्रवाह', mainGov: 'मुख्य राज्य सरकार', stateGov: 'राज्य सरकार', createFile: 'नवीन फाइल तयार करा', myTasks: 'माझी कार्ये', fileTracking: 'फाइल ट्रॅकिंग', reports: 'अहवाल', selectLang: 'भाषा' },
  ta: { name: 'தமிழ்', dashboard: 'டாஷ்போர்டு', usersRoles: 'பயனர்கள் & பாத்திரங்கள்', departments: 'துறைகள்', auditLogs: 'ஆடிட் பதிவுகள்', requests: 'கோரிக்கைகள்', settings: 'அமைப்புகள்', signOut: 'வெளியேறு', digitalWorkflow: 'டிஜிட்டல் ஆவண பணிப்பாய்வு', mainGov: 'முதன்மை மாநில அரசு', stateGov: 'மாநில அரசு', createFile: 'புதிய கோப்பு உருவாக்கு', myTasks: 'எனது பணிகள்', fileTracking: 'கோப்பு கண்காணிப்பு', reports: 'அறிக்கைகள்', selectLang: 'மொழி' },
  gu: { name: 'ગુજરાતી', dashboard: 'ડેશબોર્ડ', usersRoles: 'વપરાશકર્તા અને ભૂમિકા', departments: 'વિભાગો', auditLogs: 'ઓડિટ લોગ', requests: 'વિનંતીઓ', settings: 'સેટિંગ્સ', signOut: 'સાઇન આઉટ', digitalWorkflow: 'ડિજિટલ દસ્તાવેજ વર્કફ્લો', mainGov: 'મુખ્ય રાજ્ય સરકાર', stateGov: 'રાજ્ય સરકાર', createFile: 'નવી ફાઇલ બનાવો', myTasks: 'મારા કાર્યો', fileTracking: 'ફાઇલ ટ્રૅકિંગ', reports: 'રિપોર્ટ', selectLang: 'ભાષા' },
  ml: { name: 'മലയാളം', dashboard: 'ഡാഷ്ബോർഡ്', usersRoles: 'ഉപയോക്താക്കളും പങ്കുകളും', departments: 'വകുപ്പുകൾ', auditLogs: 'ഓഡിറ്റ് ലോഗുകൾ', requests: 'അഭ്യർത്ഥനകൾ', settings: 'ക്രമീകരണങ്ങൾ', signOut: 'സൈൻ ഔട്ട്', digitalWorkflow: 'ഡിജിറ്റൽ രേഖ വർക്ക്ഫ്ലോ', mainGov: 'പ്രധാന സംസ്ഥാന സർക്കാർ', stateGov: 'സംസ്ഥാന സർക്കാർ', createFile: 'പുതിയ ഫയൽ സൃഷ്ടിക്കുക', myTasks: 'എൻ്റെ ജോലികൾ', fileTracking: 'ഫയൽ ട്രാക്കിംഗ്', reports: 'റിപ്പോർട്ടുകൾ', selectLang: 'ഭാഷ' }
};

const LangContext = createContext();

export const LangProvider = ({ children }) => {
  const [lang, setLang] = useState(localStorage.getItem('gov_lang') || 'en');
  const t = govTranslations[lang];
  const changeLang = (code) => { setLang(code); localStorage.setItem('gov_lang', code); };
  return <LangContext.Provider value={{ lang, t, changeLang, govTranslations }}>{children}</LangContext.Provider>;
};

export const useGovLang = () => useContext(LangContext);

export default govTranslations;
