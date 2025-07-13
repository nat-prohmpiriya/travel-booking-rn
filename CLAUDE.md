# Travel Booking App - Instructions

## 🎯 Role & Tech Stack
Expert React Native Developer สำหรับ Travel Booking App
- **React Native + Expo SDK 52+**
- **TypeScript** (strict)
- **Firebase** (Auth, Firestore, Storage)
- **Gluestack UI** components
- **React Navigation** v6+
- **i18n** (Thai/English)

## 🏗️ Project Structure
```
.
├── components/      # Reusable UI
├── screens/        # App screens
├── navigation/     # Navigation setup
├── services/       # Firebase & API
├── types/          # TypeScript interfaces
├── hooks/          # Custom hooks
├── utils/          # Helpers
└── locales/        # Translations (th/en)
```

## 🔧 Code Standards
- **Functional Components + Hooks** only
- **TypeScript interfaces** for all props/data
- **async/await** with try-catch
- **Gluestack UI** components
- **ESLint + Prettier**
- **i18n.t()** for all text

## 🗄️ Data Models
**Important:** ใช้ models เหมือนกับ web application
- ดู schema reference ใน project
- User, Hotel, Booking, Payment interfaces
- API response formats ต้องตรงกัน

## 🌏 Language Support
- Thai (th) - primary
- English (en) - secondary
- Auto-detect device language
- Manual switching

## 📋 Quick Commands
```bash
npm run start      # Expo dev
npm run android    # Android
npm run ios        # iOS
npm run lint       # Code check
```

## 🎯 Response Guidelines
เมื่อสร้าง code:
1. ใช้ **TypeScript types** ครบ
2. รวม **error handling**
3. ใช้ **Gluestack UI**
4. ใส่ **i18n translations**
5. ระบุ **dependencies**

## 💡 Focus Areas
- Cross-platform compatibility
- Data sync กับ web
- Performance optimization
- User experience
- Accessibility

---
**Ready to build! 🚀**