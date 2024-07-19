const express = require('express');
const multer = require('multer');
const path = require('path');
const videoController = require('./controllers/videoController');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());

// Serve static files from the outputs directory
app.use('/outputs', express.static(path.join(__dirname, 'outputs')));

// Serve the HTML file
app.use(express.static(path.join(__dirname)));

app.post('/convert', upload.single('video'), videoController.convertVideo);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
