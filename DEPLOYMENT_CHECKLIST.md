# Deployment Checklist - Mobile Cache & PWA

## Pre-Deployment

- [ ] Kiểm tra tất cả files mới đã được commit
- [ ] Test trên local development
- [ ] Test trên mobile simulator/device

## Files Mới Được Thêm

### Core Files
- [x] `lib/indexeddb-storage.ts` - IndexedDB storage helper
- [x] `lib/hooks/use-auto-save.ts` - Auto-save hook
- [x] `lib/service-worker.ts` - Service Worker registration
- [x] `components/service-worker-registration.tsx` - SW registration component
- [x] `public/sw.js` - Service Worker implementation
- [x] `public/manifest.json` - PWA manifest
- [x] `public/offline.html` - Offline fallback page

### Modified Files
- [x] `lib/storage.ts` - Updated to use IndexedDB
- [x] `app/layout.tsx` - Added PWA meta tags and SW registration
- [x] `app/sets/[id]/history/page.tsx` - Added auto-save
- [x] `app/sets/[id]/flashcard/page.tsx` - Added auto-save
- [x] `app/sets/[id]/quiz/page.tsx` - Added auto-save
- [x] `next.config.mjs` - Added headers for PWA

## Build & Test

```bash
# Install dependencies (nếu cần)
npm install

# Build production
npm run build

# Test production build locally
npm start

# Hoặc
npm run dev
```

## Testing Checklist

### Desktop Testing
- [ ] Service Worker được đăng ký thành công
- [ ] IndexedDB được tạo và hoạt động
- [ ] Data được save khi chuyển tab
- [ ] Data được restore khi quay lại
- [ ] Cache hoạt động (kiểm tra Network tab)

### Mobile Testing
- [ ] PWA install prompt xuất hiện
- [ ] App có thể được cài đặt
- [ ] Icon xuất hiện trên Home Screen
- [ ] App mở ở fullscreen mode
- [ ] Data không bị mất khi chuyển app
- [ ] Offline mode hoạt động
- [ ] Auto-save hoạt động khi minimize app

### Chrome DevTools Checks

1. **Application → Service Workers**
   - Status: ✅ activated and is running
   - Scope: /

2. **Application → Manifest**
   - ✅ No errors
   - ✅ Icons hiển thị đúng
   - ✅ Display: standalone
   - ✅ Theme color đúng

3. **Application → Storage → IndexedDB**
   - ✅ QuizlyDB database tồn tại
   - ✅ userProgress store tồn tại
   - ✅ Data được lưu thành công

4. **Application → Cache Storage**
   - ✅ quizly-cache-v1 tồn tại
   - ✅ quizly-data-v1 tồn tại
   - ✅ Static files được cache

5. **Lighthouse PWA Score**
   - Target: ≥ 90/100
   - Installable: ✅
   - PWA Optimized: ✅
   - Works Offline: ✅

## Deployment Steps

### 1. Vercel Deployment (Recommended)

```bash
# Push to GitHub
git add .
git commit -m "feat: Add mobile cache, PWA, and auto-save features"
git push origin main

# Vercel sẽ tự động deploy
```

### 2. Environment Variables

Không cần thêm env vars mới cho tính năng này.

### 3. Post-Deployment Verification

Sau khi deploy, kiểm tra:

```bash
# Test URLs
https://your-app.vercel.app/
https://your-app.vercel.app/manifest.json
https://your-app.vercel.app/sw.js
https://your-app.vercel.app/offline.html
```

## Mobile Testing Steps

### iOS (Safari)

1. **Mở app trên Safari**
2. **Test PWA install**:
   - Share → Add to Home Screen
   - Mở từ Home Screen
   - Verify fullscreen mode
   
3. **Test data persistence**:
   - Học một vài flashcards
   - Chuyển sang app khác (Home → other app)
   - Quay lại app
   - ✅ Data vẫn còn

4. **Test offline**:
   - Bật Airplane mode
   - Mở app
   - ✅ Cached data vẫn hiển thị

### Android (Chrome)

1. **Mở app trên Chrome**
2. **Test PWA install**:
   - Install prompt sẽ xuất hiện
   - Hoặc Menu → Install app
   - Mở từ Home Screen
   
3. **Test data persistence**:
   - Học một vài flashcards
   - Recent apps → Switch to another app
   - Quay lại
   - ✅ Data vẫn còn

4. **Test offline**:
   - Bật Airplane mode
   - Mở app
   - ✅ Cached data vẫn hiển thị

## Performance Metrics

Measure before/after deployment:

### Before
- First Load: ~2-3s
- Tab Switch: Data loss ❌
- Offline: Not working ❌

### After (Target)
- First Load: ~2-3s
- Subsequent: ~0.5-1s ⚡
- Tab Switch: Data preserved ✅
- Offline: Working ✅

## Rollback Plan

Nếu có vấn đề:

1. **Disable Service Worker**:
```javascript
// Trong public/sw.js, comment tất cả logic
// Hoặc xóa file
```

2. **Revert IndexedDB changes**:
```bash
git revert <commit-hash>
```

3. **Clear user caches**:
- Hướng dẫn users clear browser cache
- Service Worker sẽ tự động unregister

## Known Issues & Limitations

1. **iOS Safari < 11.3**: Không hỗ trợ PWA đầy đủ
   - Fallback: Vẫn hoạt động như web app bình thường
   
2. **Private/Incognito Mode**: 
   - IndexedDB có thể bị giới hạn
   - Fallback: localStorage

3. **Storage Quotas**:
   - Mobile: ~50MB - 100MB
   - Desktop: Unlimited (với user permission)

## Support & Troubleshooting

### User Reports "Data Still Lost"

1. Kiểm tra browser version
2. Kiểm tra Private mode
3. Kiểm tra storage quota
4. Clear cache và test lại

### Service Worker Not Updating

1. Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
2. DevTools → Application → Service Workers → Update
3. Unregister và reload

## Success Metrics

Track sau khi deploy:

- [ ] Bounce rate giảm (users không rời khỏi app khi chuyển tab)
- [ ] Session duration tăng
- [ ] PWA install rate
- [ ] Offline usage analytics
- [ ] Page load time giảm

## Monitoring

Thêm analytics cho:

```javascript
// Track PWA installs
window.addEventListener('beforeinstallprompt', (e) => {
  // Log to analytics
});

// Track offline usage
window.addEventListener('offline', () => {
  // Log to analytics
});

// Track auto-save events
// In auto-save hook
```

## Next Steps After Deployment

1. Monitor error logs
2. Collect user feedback
3. Track performance metrics
4. Plan next improvements

## Contact

Nếu có vấn đề, liên hệ:
- GitHub Issues
- Email support
- Discord community

---

**Last Updated**: December 24, 2025
**Version**: 1.0.0

