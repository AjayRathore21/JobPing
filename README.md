# i have make antd v5 compatible with react-19 using cmd yarn add @ant-design/v5-patch-for-react-19

# implemented authentication using passport-jwt.

# Cold Mailer

A full-stack cold email automation application that allows you to upload CSV contact lists and send personalized emails at scale.

## Features

- 🔐 **User Authentication** - Secure signup/login with JWT tokens
- 📧 **Email Campaigns** - Send personalized cold emails to your contacts
- 📁 **CSV Upload** - Import contact lists via CSV files
- 📊 **Dashboard** - Manage your campaigns and uploads
- ☁️ **Cloud Storage** - Files stored securely on Cloudinary

## Tech Stack

### Frontend

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Ant Design** - UI component library
- **Zustand** - State management
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Sass** - CSS preprocessing

### Backend

- **Node.js** - Runtime environment
- **Express 5** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Passport.js** - Authentication middleware
- **JWT** - Token-based auth
- **Nodemailer** - Email sending
- **Cloudinary** - File storage
- **Multer** - File upload handling

## Project Structure

```
cold-mailer/
├── cold-mailer-be/          # Backend
│   ├── configs/             # Configuration files
│   ├── controller/          # Route controllers
│   ├── jobs/                # Background jobs
│   ├── model/               # Database models
│   ├── routes/              # API routes
│   ├── utils/               # Helper utilities
│   └── index.js             # Entry point
│
├── cold-mailer-fe/          # Frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── configs/         # Axios config
│   │   ├── hooks/           # Custom hooks
│   │   ├── store/           # Zustand store
│   │   ├── App.tsx          # Main app component
│   │   └── index.tsx        # Entry point
│   └── vite.config.ts       # Vite configuration
│
└── README.md
```

## Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB
- npm or yarn

### Environment Variables

#### Backend (`cold-mailer-be/.env`)

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

#### Frontend (`cold-mailer-fe/.env`)

```env
VITE_BASE_URL=http://localhost:3000
```

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd cold-mailer
   ```

2. **Install backend dependencies**

   ```bash
   cd cold-mailer-be
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../cold-mailer-fe
   npm install
   ```

### Running the Application

1. **Start the backend server**

   ```bash
   cd cold-mailer-be
   npm run dev
   ```

   The backend will run on `http://localhost:3000`

2. **Start the frontend development server**
   ```bash
   cd cold-mailer-fe
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

## API Endpoints

### Authentication

| Method | Endpoint       | Description         |
| ------ | -------------- | ------------------- |
| POST   | `/auth/signup` | Register a new user |
| POST   | `/auth/login`  | Login user          |

### CSV Upload

| Method | Endpoint      | Description       |
| ------ | ------------- | ----------------- |
| POST   | `/upload/csv` | Upload a CSV file |

### Email

| Method | Endpoint      | Description         |
| ------ | ------------- | ------------------- |
| POST   | `/send-email` | Send email campaign |

## License

ISC

## Author

Ajay
