import express from 'express';
import validator from 'validator';
import qr from 'qr-image';
import swaggerUI from 'swagger-ui-express';
import swaggerSpec from './swagger-config.js';
import mongoose from 'mongoose';
import axios from 'axios';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Connect to MongoDB using Mongoose
mongoose.connect('mongodb+srv://yasaswini:yasaswini@cluster0.4fwjmxp.mongodb.net/generate_qr?retryWrites=true&w=majority', { //mongodb://localhost:27017/generate_qr
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define the schema for QR data
const qrSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    validate: {
      validator: (value) => validator.isURL(value),
      message: 'Invalid URL',
    },
  },
  //timestamp: { type: Date, default: Date.now, },
  //timestamps: [Date],
  firstGeneratedTimestamp: {
    type: Date,
    default: Date.now,
  },
  lastRetrievedTimestamp: {
    type: Date,
  },
  qrCode: {
    type: Buffer, //. Buffers are Node.js' way of handling binary data.
  },
});

// Create a Mongoose model based on the schema
const QRModel = mongoose.model('QRModel', qrSchema);

app.use(express.json());

// Function to check URL safety using Google Safe Browsing API
async function checkUrlSafety(url) {
  const API_KEY = 'AIzaSyClayvI9VNDzdqvii2zZU4JVD7Z0MP5Wf0'; 
  const API_URL = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';

  try {
    const response = await axios.post(API_URL, {
      client: {
        clientId: 'YourCompany',
        clientVersion: '1.0.0'
      },
      threatInfo: {
        threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING'],
        platformTypes: ['ANY_PLATFORM'],
        threatEntryTypes: ['URL'],
        threatEntries: [{ 'url': url }]
      }
    }, {
      params: { key: API_KEY }
    });

    if (response.data.matches && response.data.matches.length > 0) {
      return { safe: false, matches: response.data.matches };
    } else {
      return { safe: true };
    }
  } catch (error) {
    console.error('Error checking URL safety:', error);
    return { safe: false, error: error.message };
  }
}

// Endpoint for generating QR code or retrieving existing QR code (POST request)
/**
 * @swagger
 * /generate-qr:
 *   post:
 *     summary: Generate QR code or retrieve existing QR code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 description: The URL for which to generate or retrieve the QR code
 *     responses:
 *       200:
 *         description: QR code generated successfully
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid or potentially malicious URL provided
 *       500:
 *         description: Internal Server Error
 */
app.post('/generate-qr', async (req, res) => {
  const { url } = req.body;

  try {
    // Check URL safety
    const safetyResult = await checkUrlSafety(url);
    if (!safetyResult.safe) {
      return res.status(400).json({ error: 'Unsafe URL detected', matches: safetyResult.matches });
    }

    // Check if the URL is already present in MongoDB
    let existingQR = await QRModel.findOne({ url });

    if (!existingQR) {
      // Generate QR code if the URL is not found
      const qrCodeBuffer = qr.imageSync(url, { type: 'png' });

      //Create a new QRModel instance
      existingQR = new QRModel({url, qrCode: qrCodeBuffer})
      
      await existingQR.validate();

      await existingQR.save();
      
      // URL found, guide the user to use the /get-qr endpoint
      res.set('Content-Type', 'image/png');
      return res.status(200).send(qrCodeBuffer);
    }

    existingQR.lastRetrievedTimestamp = new Date();
    // Save data to MongoDB
    await existingQR.save();

    res.set('Content-Type', 'image/png');
    res.status(200).send(existingQR.qrCode)
    //res.json({ success: true, message: 'QR code generated and URL saved!' });
  
  } catch (err) {
    if (err.name === 'ValidationError') {
      // Mongoose validation error
      return res.status(400).json({ error: 'Invalid URL' });
    }
    console.error('Error generating or retrieving QR code:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint for deleting the QR code image and URL (DELETE request)
/**
 * @swagger
 * /delete-qr:
 *   delete:
 *     summary: Delete the QR code image and URL
 *     parameters:
 *       - in: query
 *         name: url
 *         schema:
 *           type: string
 *         description: The URL for the QR code to delete
 *     responses:
 *       200:
 *         description: QR code and URL deleted successfully
 *       400:
 *         description: Invalid URL provided
 *       404:
 *         description: QR code not found
 *       500:
 *         description: Internal Server Error
 */
app.delete('/delete-qr', async (req, res) => {
  const { url } = req.query;

  try {
    // Find and delete the document from MongoDB
    const result = await QRModel.findOneAndDelete({ url });

    if (!result) {
      return res.status(404).json({ error: 'URL not found' });
    }

    res.json({ success: true, message: 'QR code, URL, and record deleted!' });
  } catch (error) {
    console.error('Error deleting QR code:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});



