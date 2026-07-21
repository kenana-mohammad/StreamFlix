const express = require('express');
const router = express.Router();

const contentRoutes = require('./routes/content.routes');
const movieRoutes = require('./routes/movie.routes');
const seriesRoutes = require('./routes/series.routes');
const seasonRoutes = require('./routes/season.routes');
const episodeRoutes = require('./routes/episode.routes');
const relationRoutes = require('./routes/content-relation.routes');

router.use('/contents', contentRoutes);
router.use('/movies', movieRoutes);
router.use('/series', seriesRoutes);
router.use('/seasons', seasonRoutes);
router.use('/episodes', episodeRoutes);
router.use('/', relationRoutes);

module.exports = router;