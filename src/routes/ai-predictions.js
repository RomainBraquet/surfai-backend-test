const express = require('express');
const router = express.Router();

router.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Test minimal IA - ça marche !',
    timestamp: new Date().toISOString()
  });
});

router.get('/demo/:userId', (req, res) => {
  res.json({
    status: 'success',
    message: 'Démo IA basique fonctionnelle',
    userId: req.params.userId,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
