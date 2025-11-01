# Meeting Scheduler - Backend API

Node.js/Express backend with MongoDB and automated email notifications for meeting scheduling application.

## 🚀 Features

- ✅ RESTful API with Express.js
- 🔐 JWT Authentication
- 📧 Automated Email Notifications (Gmail SMTP)
- 📤 CSV Bulk Upload
- 🗄️ MongoDB Database
- 🔔 Party Join Notifications
- 📊 Meeting Statistics
- 🎨 Beautiful HTML Email Templates
- 🖼️ Marketing Promotion Integration

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB)
- Gmail account with App Password

## 🛠️ Installation

1. Navigate to backend directory:
```bash
cd meeting-scheduler-backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env`:
```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB (Already configured)
MONGODB_URI=mongodb+srv://ocavior_user:asdsd------@ocavior.m5eo9ky.mongodb.net/sircc?retryWrites=true&w=majority&appName=Ocavior

# JWT Secret (Change this!)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345

# Gmail Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password

# URLs
FRONTEND_URL=http://localhost:3000
VITAL_SCAN_URL=https://vital-scan.actofit.com/
```

## 📧 Gmail Setup (IMPORTANT!)

To send emails, you need a Gmail App Password:

1. Go to your Google Account settings
2. Security → 2-Step Verification (enable if not already)
3. Security → App Passwords
4. Generate new app password for "Mail"
5. Copy the 16-character password
6. Update `.env` file:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=abcd-efgh-ijkl-mnop
   ```

## 🌱 Seed Database with Users

Create 5 default users:

```bash
node seedUsers.js
```

**Default Users Created:**
1. **Admin**: admin@example.com / admin123
2. **John**: john@example.com / john123
3. **Jane**: jane@example.com / jane123
4. **Mike**: mike@example.com / mike123
5. **Sarah**: sarah@example.com / sarah123

## 🏃 Run the Server

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server will start at `http://localhost:5000`

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/login       - Login user
POST   /api/auth/register    - Register new user
```

### Meetings
```
GET    /api/meetings              - Get all meetings
GET    /api/meetings/stats        - Get meeting statistics
GET    /api/meetings/:id          - Get single meeting
POST   /api/meetings              - Create meeting (sends invitations)
PUT    /api/meetings/:id          - Update meeting
DELETE /api/meetings/:id          - Delete meeting
POST   /api/meetings/:id/party-joined  - Send party joined notification
POST   /api/meetings/bulk-upload  - Bulk upload CSV
```

### Health Check
```
GET    /api/health            - Check API status
```

## 📧 Email Features

### 1. Meeting Invitation Email
Sent automatically when:
- Creating a new meeting
- Updating a meeting

**Includes:**
- Meeting details (title, date, time, venue)
- All participants list
- Beautiful HTML template
- Marketing promotion for Vital Scan (if poster exists)

### 2. Party Joined Notification
Sent when:
- Admin clicks "Party Joined" button
- Selects which participant joined

**Includes:**
- Notification that a party has joined
- Meeting details
- Contact information of joined party

## 🖼️ Marketing Promotion

To include Vital Scan promotion in emails:

1. Add `promotionPoster.png` to `backend/public/` directory
2. Emails will automatically include the promotion
3. If poster doesn't exist, promotion section is skipped

## 📊 Database Collections

### Users Collection
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (admin/user),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Meetings Collection
```javascript
{
  title: String,
  description: String,
  date: Date,
  time: String,
  venue: String,
  country: String,
  location: String (SG/MUM),
  companyA: {
    name: String,
    email: String,
    phone: String
  },
  companyB: { ... },
  broker1: { ... },
  broker2: { ... },
  clientContact: { ... },
  statusCompanyA: String,
  statusCompanyB: String,
  status: String (scheduled/completed/cancelled),
  invitationsSent: Boolean,
  createdBy: ObjectId (User),
  createdAt: Date,
  updatedAt: Date
}
```

## 📤 CSV Bulk Upload Format

Your CSV should have these columns:

```csv
TIME,CEDANT / COMPANY A,country,REINSURER / COMPANY B,VENUE,STATUS (Company A),STATUS (Company B),1 / 0,SG/MUM,1st Broker,2nd Broker,CLIENT's CONTACT
```

**Optional Email/Phone Columns:**
- CEDANT / COMPANY A Email
- CEDANT / COMPANY A Phone
- REINSURER / COMPANY B Email
- REINSURER / COMPANY B Phone
- 1st Broker Email
- 1st Broker Phone
- 2nd Broker Email
- 2nd Broker Phone
- CLIENT's CONTACT Email
- CLIENT's CONTACT Phone

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- CORS enabled for frontend
- Input validation
- Error handling middleware
- Protected routes

## 🐛 Testing

Test the API:

```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Get meetings (with token)
curl http://localhost:5000/api/meetings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📁 Project Structure

```
meeting-scheduler-backend/
├── config/
│   └── database.js          # MongoDB connection
├── models/
│   ├── User.js              # User model
│   └── Meeting.js           # Meeting model
├── routes/
│   ├── auth.js              # Authentication routes
│   └── meetings.js          # Meeting routes
├── middleware/
│   └── auth.js              # JWT verification
├── utils/
│   └── emailService.js      # Email templates & sending
├── public/
│   └── promotionPoster.png  # (Add this file)
├── uploads/                 # Temp CSV uploads
├── .env                     # Environment variables
├── server.js                # Main server file
├── seedUsers.js             # User seeding script
└── package.json
```

## 🔄 Workflow

1. **User Login** → Receives JWT token
2. **Create Meeting** → Meeting saved → Emails sent automatically
3. **CSV Upload** → Meetings created in bulk → Emails sent to all
4. **Party Joins** → Admin clicks button → Notifications sent to others

## ⚠️ Important Notes

1. **Database**: MongoDB will auto-create collections on first use
2. **Emails**: Configure Gmail App Password for email sending
3. **Security**: Change JWT_SECRET in production
4. **Passwords**: All seed passwords should be changed after first login
5. **CORS**: Currently allows all origins (configure for production)

## 🐞 Troubleshooting

**MongoDB Connection Issues:**
```bash
# Check if MongoDB URI is correct in .env
# Ensure IP is whitelisted in MongoDB Atlas
```

**Email Not Sending:**
```bash
# Verify EMAIL_USER and EMAIL_PASSWORD in .env
# Check Gmail App Password is correct
# Ensure 2-Step Verification is enabled in Gmail
```

**Port Already in Use:**
```bash
# Change PORT in .env file
# Or kill process using port 5000
```

## 📝 Development Tips

1. Use Postman/Thunder Client for API testing
2. Check server logs for errors
3. MongoDB Compass for database visualization
4. Keep .env file secure (never commit to git)

## 🚀 Production Deployment

Before deploying:

1. Change JWT_SECRET to strong random string
2. Set NODE_ENV=production
3. Configure CORS for specific domain
4. Use environment variables on hosting platform
5. Enable MongoDB Atlas network access
6. Set up proper error logging

## 📞 Support

For issues:
1. Check server logs
2. Verify .env configuration
3. Test API endpoints with curl/Postman
4. Check MongoDB connection

---

**Ready to use!** Start the server and connect your React frontend. 🎉