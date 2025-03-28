const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const passport = require('passport');
const i18nextMiddleware = require('i18next-http-middleware');
const swagger = require('./swagger');

const i18n = require('./i18n');
const errorMiddleware = require('./middleware/error');
const { jwtStrategy } = require('./config/passport');

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const eventRoutes = require('./routes/event.routes');
const categoryRoutes = require('./routes/category.routes');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Logger middleware
app.use(morgan('dev'));

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// i18n middleware
app.use(i18nextMiddleware.handle(i18n));

// Authentication middleware
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/categories', categoryRoutes);

// Swagger API Documentation
app.use('/api-docs', swagger.serve, swagger.setup);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use(errorMiddleware);

module.exports = app; 