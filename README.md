# Peblo - AI-Powered Notes Workspace

A modern, collaborative notes application with AI-powered insights, real-time auto-save, and public sharing capabilities.

## 🌟 Features

### Core Features
- ✅ **User Authentication** - Secure signup/login with NextAuth.js and bcrypt
- ✅ **CRUD Notes** - Create, read, update, delete notes with auto-save
- ✅ **Tags & Organization** - Organize notes with custom tags and filtering
- ✅ **Search** - Full-text search across note titles and content
- ✅ **Public Sharing** - Generate shareable links for individual notes

### AI Features (Google Gemini)
- ✨ **Auto-Summary** - AI generates concise summaries of your notes
- 📋 **Action Items** - Automatically extract actionable items from content
- 💡 **Title Suggestions** - Get AI-powered title recommendations
- All AI features are optional and on-demand

### Dashboard & Insights
- 📊 **Productivity Dashboard** - View note statistics and insights
- 📈 **Analytics** - Track your productivity with charts and metrics
- 🎯 **Quick Stats** - Total notes, tags used, and more

### User Experience
- 🌓 **Dark Mode** - Full dark mode support throughout the app
- 📱 **Responsive Design** - Mobile-first, works on all devices
- ⌨️ **Keyboard Shortcuts** - Cmd+S to save, Tab navigation
- 💾 **Real-time Auto-save** - Never lose your work (debounced every 2s)
- ⚠️ **Unsaved Changes Warning** - Protected against accidental data loss

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js with JWT & Credentials Provider
- **Password Security**: bcryptjs with validation
- **AI**: Google Gemini API (Free tier)
- **Icons**: Lucide React
- **Utilities**: nanoid for IDs, clsx for className management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Setup**
```bash
cd peblo-notes-workspace
npm install
```

2. **Configure environment**
```bash
cp .env.example .env.local
```

Then edit `.env.local`:
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `GEMINI_API_KEY`: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

3. **Setup database**
```bash
npx prisma generate
npx prisma db push
```

4. **Start development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📚 API Routes

### Authentication
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get session

### Notes
- `GET /api/notes` - Get all notes
- `POST /api/notes` - Create note
- `PATCH /api/notes/[id]` - Update note
- `DELETE /api/notes/[id]` - Delete note

### AI Features
- `POST /api/notes/[id]/ai` - Generate AI content

### Public Sharing
- `GET /api/shared/[shareId]` - Get public note

## 🔐 Security

- ✅ Password hashing with bcryptjs
- ✅ JWT sessions
- ✅ Route protection with middleware
- ✅ Environment variable secrets

## 📖 Usage

### Creating a Note
1. Click "New Note"
2. Enter title and content
3. Add tags
4. Auto-saves every 2 seconds

### Sharing a Note
1. Click "Share" button
2. Copy link
3. Share with anyone

### AI Features
1. **Summary** - Get AI overview
2. **Action Items** - Extract tasks
3. **Title Suggestion** - Get AI title

## 📦 Scripts

```bash
npm run dev          # Dev server
npm run build        # Build
npm start            # Production

npx prisma generate # Generate client
npx prisma db push  # Sync database
npx prisma studio  # Prisma UI
npm run lint        # Lint
```

## 🐛 Troubleshooting

### Database errors
```bash
rm prisma/dev.db
npx prisma db push
```

### AI not working
- Check GEMINI_API_KEY is set
- Verify API quota
- Make sure note is saved

### Auth issues
- Check NEXTAUTH_SECRET
- Clear cookies
- Verify URLs match

## 🎨 Customization

### Theme
Edit `tailwind.config.js` for colors

### AI Model
Edit `lib/gemini.ts` to change model

## 📊 Database Schema

### User
- id, name, email, password (hashed)
- createdAt, updatedAt

### Note
- id, title, content
- tags (JSON array)
- summary, actionItems, suggestedTitle (AI)
- isPublic, shareId
- userId, createdAt, updatedAt

## 🚀 Deployment

### Vercel
Push to GitHub and connect on Vercel

### Environment
```env
NEXTAUTH_SECRET="production-secret"
NEXTAUTH_URL="https://your-domain.com"
GEMINI_API_KEY="your-key"
DATABASE_URL="file:./prod.db"
```

## 📝 License

Peblo internship assignment © 2026

---

**Built with ❤️ for Peblo**
