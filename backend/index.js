const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const FormData = require('form-data');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors({
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Python FastAPI service URL
const PYTHON_API_URL = 'http://localhost:8000';

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Node.js backend is running' });
});


app.post('/solve-formula', async (req, res) => {
    console.log(req.body);
    try {
        const response = await axios.post(`${PYTHON_API_URL}/solve-formula/`, {
            formula: req.body.formula
        });
        if (response.status === 200) {
            res.json(response.data);
        } else {
            res.status(response.status).json({
                status: 'error',
                message: response.data.detail || 'Error from Python API'
            });
    }
    }
    catch (error) {
        console.error('Error solving formula:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Internal server error'
        });
    }}
);

// Endpoint to process image and get formula
app.post('/process-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'No image file provided' 
            });
        }

        // Create form data to send to Python API
        const formData = new FormData();
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        // Send request to Python FastAPI service
        const response = await axios.post(
            `${PYTHON_API_URL}/recognize-formula/`,
            formData,
            {
                headers: {
                    ...formData.getHeaders()
                }
            }
        );

        // Return the response from Python API
        res.json(response.data);

    } catch (error) {
        console.error('Error processing image:', error);
        
        // Handle different types of errors
        if (error.response) {
            res.status(error.response.status).json({
                status: 'error',
                message: error.response.data.detail || 'Error from Python API'
            });
        } else if (error.request) {
            res.status(503).json({
                status: 'error',
                message: 'Python API service is not responding'
            });
        } else {
            res.status(500).json({
                status: 'error',
                message: error.message || 'Internal server error'
            });
        }
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: err.message || 'Something went wrong!'
    });
});

app.listen(port, () => {
    console.log(`Node.js backend server running at http://localhost:${port}`);
    console.log(`Make sure the Python FastAPI service is running at ${PYTHON_API_URL}`);
});
