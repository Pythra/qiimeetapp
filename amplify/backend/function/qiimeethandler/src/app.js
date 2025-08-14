const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const aws = require('aws-sdk');
const multerS3 = require('multer-s3');
const sharp = require('sharp');
const { optimizeAndUpload } = require('./utils/imageOptimizer');
const bodyParser = require('body-parser');
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const paystackRoutes = require('./routes/paystackroutes');
const transactionRoutes = require('./routes/transactionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const agoraRoutes = require('./routes/agoraRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "*")
  next()
});

app.use(cors());
app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());
app.use(express.json());

// Root health check
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'QiMeet API is running on AWS Lambda',
    timestamp: new Date().toISOString()
  });
});

// Catch-all logger for all incoming requests
app.use((req, res, next) => {
  console.log('INCOMING:', req.method, req.originalUrl);
  next();
});

// Connect to MongoDB
connectDB();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}

// S3 config
aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
const s3 = new aws.S3();

// Local storage for temporary files
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({ storage: multerStorage });

// S3 upload for multiple images
const uploadS3 = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,  
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, `${Date.now()}_${file.originalname}`);
    }
  })
});

// Upload routes
app.post('/api/upload-images', uploadS3.array('images', 6), (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });
  const imageUrls = req.files.map(file => file.location);
  res.json({ success: true, imageUrls });
});

// New optimized bulk upload endpoint
app.post('/api/upload-images-optimized', upload.array('images', 6), async (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

  try {
    const { optimizeAndUploadMultiple } = require('./utils/imageOptimizer');
    
    const localPaths = req.files.map(file => file.path);
    const optimizedUrls = await optimizeAndUploadMultiple(localPaths);
    
    // Clean up local files
    localPaths.forEach(path => {
      if (fs.existsSync(path)) {
        fs.unlinkSync(path);
      }
    });
    
    res.json({ success: true, imageUrls: optimizedUrls });
  } catch (error) {
    console.error('Error in optimized upload:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/paystack', paystackRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/agora', agoraRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notification', notificationRoutes);

// Export the app object
module.exports = app;
