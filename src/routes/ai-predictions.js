// Version test minimal - ai-predictions.js
const express = require('express');
const router = express.Router();

router.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Test minimal IA - ça marche !',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
