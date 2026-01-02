# 🚀 Quick Start Checklist

## Pre-flight Check ✈️

### 1. Environment Setup
- [ ] Node.js installed (v18+ recommended)
- [ ] npm or pnpm installed
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

### 2. Backend Setup
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Start server
npm run dev
```

**Expected:** Server running on http://localhost:3000

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd drishti-frontend

# Install dependencies
npm install

# Run automated setup
.\setup-integration.ps1

# OR manually create .env.local
cp .env.example .env.local

# Start frontend
npm run dev
```

**Expected:** Frontend running on http://localhost:5173

### 4. Verification Tests

#### Test 1: Backend Health
```bash
curl http://localhost:3000/health
```
**Expected:** `{"status":"ok",...}`

#### Test 2: Frontend Load
- [ ] Open http://localhost:5173
- [ ] No console errors
- [ ] UI loads properly

#### Test 3: API Connection
- [ ] Open DevTools Network tab
- [ ] Navigate through app
- [ ] API calls succeed (200 status)

#### Test 4: WebSocket Connection
- [ ] Open DevTools Console
- [ ] Look for "✅ WebSocket connected"
- [ ] No connection errors

### 5. Feature Tests

#### Test Real-time Updates
- [ ] Open Crowd Intelligence page
- [ ] Data loads from backend
- [ ] No mock data visible
- [ ] Updates happen automatically

#### Test Incident Management
- [ ] Navigate to Dispatch Center
- [ ] Teams and volunteers load
- [ ] Can assign to incidents
- [ ] Real-time updates work

#### Test AI Predictions
- [ ] Open AI Command Center
- [ ] Predictions load from backend
- [ ] Risk analysis displays
- [ ] Real-time AI updates

## 🐛 Troubleshooting

### Issue: "Cannot connect to backend"
**Fix:**
```bash
cd server
npm run dev
```

### Issue: "WebSocket connection failed"
**Fix:** Check `.env.local`:
```env
VITE_WS_URL=ws://localhost:3000
```

### Issue: "Module not found: socket.io-client"
**Fix:**
```bash
npm install socket.io-client
```

### Issue: "Still seeing mock data"
**Fix:**
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Verify using V2 components
4. Check import statements

## ✅ Success Indicators

You know it's working when:
- ✅ No 404 errors in console
- ✅ "✅ WebSocket connected" in console
- ✅ Real data in UI (not mock)
- ✅ Updates happen without refresh
- ✅ Loading states appear briefly
- ✅ No TypeScript errors

## 📚 Next Steps

After successful setup:
1. Read `BACKEND_INTEGRATION_COMPLETE.md`
2. Review `API_TESTING_GUIDE.md`
3. Check `INTEGRATION_SUMMARY.md`
4. Explore example code in `src/examples/`

## 🎯 Ready for Production?

Before deploying:
- [ ] All tests passing
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Security reviewed
- [ ] Documentation updated
- [ ] Environment variables set
- [ ] Backend deployed
- [ ] Frontend built and deployed

---

**Need help?** Check the documentation files or review error messages in console.

**Status:** Ready to rock! 🎸
