# Travel Booking App - Prompts Collection

## 🏗️ Project Setup Prompts

### 1. Initial Project Setup
```
สร้าง Travel Booking app project structure ด้วย:
- Expo + TypeScript setup
- ติดตั้ง dependencies: Firebase, Gluestack UI, React Navigation
- สร้าง folder structure มาตรฐาน
- Setup TypeScript config และ ESLint
- สร้าง basic App.tsx entry point
```

### 2. Firebase Configuration
```
Setup Firebase configuration สำหรับ Travel Booking app:
- Firebase project setup (Auth, Firestore, Storage)
- สร้าง firebaseConfig.ts
- สร้าง services folder พร้อม authService.ts, hotelService.ts, bookingService.ts, reviewService.ts, storageService.ts
- สร้าง TypeScript interfaces สำหรับ Firebase data models
- Setup Firebase Security Rules สำหรับ hotels, bookings collections
```

## 🔐 Authentication Prompts

### 3. Authentication System
```
สร้าง complete authentication system ด้วย:
- Login/Register screens ใช้ Gluestack UI
- Firebase Auth integration (Email + Google Sign-in)
- Custom hook: useAuth สำหรับ auth state management
- TypeScript interfaces: User, AuthState
- Error handling และ loading states
- AuthNavigator และ AppNavigator
```

### 4. User Profile Management
```
เขียน user profile management feature:
- ProfileScreen ใช้ Gluestack UI
- Edit profile functionality
- Avatar upload ด้วย Firebase Storage
- Custom hook: useProfile
- TypeScript interface: UserProfile
```

## 🏨 Core Features Prompts

### 5. Hotel Search & Listing
```
สร้าง hotel search และ listing feature:
- SearchForm component (destination, dates, guests)
- HotelList component แสดงผลการค้นหา
- HotelCard component พร้อม image, rating, price
- Search filters (price range, rating, amenities)
- Custom hook: useHotelSearch
- TypeScript interfaces: Hotel, SearchParams, Filter
```

### 6. Hotel Detail & Booking
```
เขียน hotel detail และ booking flow:
- HotelDetailScreen พร้อม image gallery
- Amenities, reviews, location map
- BookingForm component
- Booking confirmation flow
- Integration กับ Firestore bookings collection
- Custom hook: useBooking
- TypeScript interfaces: Booking, Review
```

### 7. Booking History
```
สร้าง booking history feature:
- BookingHistoryScreen
- BookingCard component (past, upcoming, cancelled)
- Booking status tracking
- Cancel booking functionality
- Custom hook: useBookingHistory
- Real-time updates ด้วย Firestore listeners
```

## 🎨 UI Components Prompts

### 8. Custom Input Components
```
สร้าง custom input components ด้วย Gluestack UI:
- DatePicker component สำหรับ check-in/check-out
- GuestSelector component (adults, children, rooms)
- LocationInput component พร้อม autocomplete
- PriceRangeSlider component
- TypeScript props interfaces ครบถ้วน
```

### 9. Loading & Error Components
```
เขียน reusable loading และ error components:
- LoadingScreen component
- ErrorBoundary component
- EmptyState component
- NetworkError component
- ใช้ Gluestack UI styling
- TypeScript props interfaces
```

## 🔧 Custom Hooks Prompts

### 10. Data Fetching Hooks
```
เขียน custom hooks สำหรับ data operations:
- useFirestore hook สำหรับ CRUD operations
- useRealtime hook สำหรับ real-time listeners
- useImageUpload hook สำหรับ Firebase Storage
- Include loading, error, success states
- TypeScript generic types
- Cleanup functions
```

### 11. Form Management Hooks
```
สร้าง form management hooks:
- useForm hook สำหรับ form state
- useValidation hook สำหรับ input validation
- useSearchForm hook สำหรับ hotel search
- useBookingForm hook สำหรับ booking process
- TypeScript interfaces สำหรับ form data
```

## 🗄️ Database & API Prompts

### 12. Firestore Schema & Operations
```
สร้าง Firestore schema และ operations:
- Collections: users, hotels, bookings, reviews
- CRUD functions สำหรับแต่ละ collection
- Query functions (search, filter, pagination)
- Security Rules สำหรับ data protection
- TypeScript interfaces สำหรับ documents
- Error handling และ offline support
```

### 13. Payment Integration
```
implement payment system:
- Stripe/Omise integration
- Payment flow components
- Payment success/failure handling
- Receipt generation
- Payment history tracking
- TypeScript interfaces: Payment, Receipt
```

## 🧪 Debug & Fix Prompts

### 14. Performance Optimization
```
ปรับปรุง app performance:
- Analyze และ fix performance bottlenecks
- Implement lazy loading สำหรับ images
- Optimize FlatList rendering
- Memory leak prevention
- Bundle size optimization
- Add performance monitoring
```

### 15. Error Debugging
```
แก้ไข error นี้:
**Error:** [paste error message]
**Code:** [paste problematic code]
**Platform:** iOS/Android/Both
**Expected Behavior:** [describe what should happen]

ต้องการ step-by-step solution พร้อม prevention tips
```

## 📱 Testing & Deployment Prompts

### 16. Testing Setup
```
สร้าง testing infrastructure:
- Jest + React Native Testing Library setup
- Unit tests สำหรับ components และ hooks
- Integration tests สำหรับ Firebase operations
- E2E tests สำหรับ critical user flows
- Mock Firebase services สำหรับ testing
```

### 17. Build & Deployment
```
prepare app สำหรับ production:
- Build configuration สำหรับ iOS/Android
- Environment variables setup
- App icon และ splash screen
- Store listing optimization
- Performance monitoring setup
- Crash reporting integration
```

---

## 🎯 วิธีใช้ Prompts

1. **Copy prompt** ที่ต้องการ
2. **ปรับแต่งรายละเอียด** ตามความต้องการ
3. **ใช้ร่วมกับ System Instructions** ด้านบน
4. **เพิ่มข้อมูลเฉพาะ** หากจำเป็น

**ตัวอย่าง:**
```
สร้าง hotel search และ listing feature:
- SearchForm รองรับ Bangkok, Phuket, Chiang Mai
- แสดง 20 hotels ต่อหน้า
- Filter: ราคา 500-5000 บาท, rating 3+ ดาว
- Sort by: ราคา, rating, ระยะทาง
- Custom hook: useHotelSearch พร้อม caching
```