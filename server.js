const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const admin = require('firebase-admin');
const XLSX = require('xlsx');

const app = express();
const port = 3000;

// Setup multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Serve frontend static files
app.use(express.static('public'));

// Upload route
app.post('/upload', upload.fields([
  { name: 'excel', maxCount: 1 },
  { name: 'serviceAccount', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files || !req.files['excel'] || !req.files['serviceAccount']) {
      return res.status(400).json({ message: 'Both files required.' });
    }

    const excelFile = req.files['excel'][0];
    const serviceAccountFile = req.files['serviceAccount'][0];

    // Read and parse service account JSON manually (important fix)
    const serviceAccountJson = fs.readFileSync(serviceAccountFile.path, 'utf8');
    const serviceAccount = JSON.parse(serviceAccountJson);

    // Initialize Firebase Admin
    if (!admin.apps.length) { 
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    // Read Excel File
    const workbook = XLSX.readFile(excelFile.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    // console.log('Excel parsed data:', jsonData);

    // Upload data to Firestore
    const db = admin.firestore();
    const batch = db.batch();
    const collectionRef = db.collection('ExcelData');

    jsonData.forEach((data) => {
      const docRef = collectionRef.doc();
      batch.set(docRef, data);
    });
    await batch.commit();

    // 🧹 Clean up uploaded files
    fs.unlinkSync(excelFile.path);
    fs.unlinkSync(serviceAccountFile.path);
    
    res.json({ message: 'Excel uploaded successfully to Firestore.' });
    
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});


// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
