# Image Analysis System

## How It Works

The unWalleted task rewards system uses **real OCR (Optical Character Recognition)** to extract text from images and verify that users have completed tasks with relevant hashtags and keywords. Here's how the implementation works:

### Current Implementation (Real OCR)

1. **Image Upload**: Users upload screenshots of their social media posts, blog posts, or other content
2. **Real OCR Processing**: The system uses **Tesseract.js** to extract actual text from images
3. **Keyword Analysis**: Extracted text is analyzed for:
   - **Hashtags**: `#unWalleted`, `#unwallet`, `#taskrewards`, `#flowblockchain`, etc.
   - **Keywords**: `unwalleted`, `web3`, `blockchain`, `crypto`, `tokens`, etc.
   - **Recency Indicators**: `today`, `just`, `now`, `recent`, etc.
4. **Confidence Scoring**: 
   - 60% weight for relevant hashtags
   - 20% weight for relevant keywords
   - 20% weight for recency indicators
5. **Validation Results**: Users receive detailed feedback on what was detected

### Sample Analysis Results

```json
{
  "hasRelevantHashtags": true,
  "isRecent": true,
  "confidence": 0.8,
  "message": "✅ Great! Found relevant hashtags and recent content. Task verification successful!",
  "extractedText": "Just completed my daily task on unWalleted! #unWalleted #taskrewards #flowblockchain",
  "foundKeywords": ["unwalleted", "taskrewards", "flowblockchain"],
  "foundHashtags": ["#unWalleted", "#taskrewards", "#flowblockchain"]
}
```

## Current Implementation: Tesseract.js

The system now uses **Tesseract.js** for real OCR text extraction:

```javascript
const Tesseract = require('tesseract.js');

async function extractTextFromImage(imageData) {
  try {
    console.log('Starting OCR text extraction with Tesseract.js...');
    
    // Remove data:image/... prefix if present
    const base64Data = imageData.includes('data:image/') 
      ? imageData.split(',')[1] 
      : imageData;
    
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Use Tesseract.js to extract text
    const result = await Tesseract.recognize(
      imageBuffer,
      'eng', // English language
      {
        logger: m => console.log('OCR Progress:', m.status, m.progress)
      }
    );
    
    const extractedText = result.data.text.trim();
    console.log('OCR Extraction completed. Text found:', extractedText.substring(0, 100) + '...');
    
    return extractedText || null;
  } catch (error) {
    console.error('OCR extraction error:', error);
    return null;
  }
}
```

### Advantages of Tesseract.js

- ✅ **Free and Open Source**: No API costs or usage limits
- ✅ **Privacy**: Text extraction happens on your server, not third-party services
- ✅ **Offline Capable**: Works without internet connection
- ✅ **Multi-language Support**: Can be extended to support other languages
- ✅ **Customizable**: Can be tuned for specific use cases

## Alternative OCR Services

For production scaling, you can also consider these cloud-based OCR services:

### Option 1: Google Cloud Vision API
```javascript
const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();

async function extractTextFromImage(imageData) {
  const request = {
    image: { content: imageData.split(',')[1] }, // Remove data:image/... prefix
    features: [{ type: 'TEXT_DETECTION' }]
  };
  
  const [result] = await client.annotateImage(request);
  return result.fullTextAnnotation?.text || null;
}
```

### Option 2: AWS Textract
```javascript
const AWS = require('aws-sdk');
const textract = new AWS.Textract();

async function extractTextFromImage(imageData) {
  const params = {
    Document: {
      Bytes: Buffer.from(imageData.split(',')[1], 'base64')
    }
  };
  
  const result = await textract.detectDocumentText(params).promise();
  return result.Blocks
    .filter(block => block.BlockType === 'LINE')
    .map(block => block.Text)
    .join(' ');
}
```

### Option 3: Azure Computer Vision
```javascript
const ComputerVisionClient = require('@azure/cognitiveservices-computervision').ComputerVisionClient;
const ApiKeyCredentials = require('@azure/ms-rest-js').ApiKeyCredentials;

const computerVisionClient = new ComputerVisionClient(
  new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': process.env.AZURE_VISION_KEY } }),
  process.env.AZURE_VISION_ENDPOINT
);

async function extractTextFromImage(imageData) {
  const result = await computerVisionClient.recognizePrintedTextInStream(false, Buffer.from(imageData.split(',')[1], 'base64'));
  return result.regions
    .map(region => region.lines.map(line => line.words.map(word => word.text).join(' ')).join(' '))
    .join(' ');
}
```

## Supported Keywords and Hashtags

### Project-Specific Hashtags
- `#unWalleted`
- `#unwallet`
- `#taskrewards`
- `#flowblockchain`
- `#magiclink`

### General Web3 Keywords
- `#web3`
- `#blockchain`
- `#crypto`
- `#tokens`
- `#dapps`
- `#onflow`

### Recency Indicators
- `today`
- `yesterday`
- `now`
- `just`
- `recent`
- `latest`
- `new`

## Configuration

Update the `PROJECT_KEYWORDS` array in `server/index.js` to add or modify supported hashtags:

```javascript
const PROJECT_KEYWORDS = [
  '#unWalleted',
  '#unwallet',
  '#taskrewards',
  '#flowblockchain',
  '#magiclink',
  '#web3',
  '#blockchain',
  '#crypto',
  '#tokens',
  '#dapps',
  '#onflow'
];
```

## Testing

To test the real OCR image analysis:

1. Upload any image with text (the system will use Tesseract.js to extract text)
2. Check the console for OCR progress and extracted text
3. Verify that relevant hashtags and keywords are detected
4. Confirm confidence scores are calculated correctly

## Performance Considerations

- **Image Quality**: Clear, high-resolution images work best
- **Text Contrast**: Dark text on light background is most readable
- **Processing Time**: OCR can take 2-5 seconds depending on image complexity
- **File Size**: Images are limited to 50MB for upload

## Security Considerations

- Validate image file types and sizes
- Implement rate limiting for image uploads
- Consider image compression to reduce processing time
- Store analysis results securely
- Implement proper error handling for OCR failures 