# Event Locator Application

A multi-user event locator application allowing users to discover events based on location and preferences, built with Node.js, Express, PostgreSQL, and Redis.

![Swagger UI Documentation](./docs/images/swagger-ui.png)

## Features

- **User Management**
  - Secure user registration and login with JWT authentication
  - User profiles with location preferences
  - Category-based event preferences
  - Multi-language support

- **Event Management**
  - Create, read, update, and delete events
  - Geospatial search capabilities
  - Category-based filtering
  - Event ratings and reviews
  - Favorite events system

- **Location Services**
  - PostGIS-powered location search
  - Radius-based event discovery
  - Google Maps integration
  
- **Real-time Features**
  - Event notifications via email
  - Redis-based message queuing
  - WebSocket updates for event changes

![Application Architecture](./docs/images/architecture.png)

## Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with PostGIS for geospatial queries
- **Authentication**: JWT, Passport.js, bcrypt
- **Validation**: express-validator
- **Internationalization**: i18next
- **Queue System**: Redis
- **Testing**: Jest
- **Logging**: Winston
- **Email**: Nodemailer
- **Real-time**: WebSocket

![Database Schema](./docs/images/database-schema.png)

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher) with PostGIS extension
- Redis
- Gmail account (for notifications)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Chidera0001/Event-Locator-App-Backend
   cd Event-Locator-App-Backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env`:
   ```bash
   cp .env .env
   ```

4. Update the `.env` file with your credentials:
   ```env
   # Server
   PORT=3000
   NODE_ENV=development

   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_NAME=event_locator
   DB_SSL=false

   # Authentication
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=7d

   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=

   # Email
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your.email@gmail.com
   SMTP_PASSWORD=your_app_password

   # Google Maps
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

5. Create the database and enable PostGIS:
   ```sql
   CREATE DATABASE event_locator;
   \c event_locator
   CREATE EXTENSION postgis;
   ```

6. Run database migrations:
   ```bash
   npm run migrate
   ```

7. Start the server:
   ```bash
   npm run dev    # Development mode
   npm start      # Production mode
   ```

![API Testing](./docs/images/api-testing.png)

## API Documentation

### Authentication

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login and get JWT token

### User Profile

- `GET /api/users/profile`: Get current user profile
- `PUT /api/users/profile`: Update user profile
- `PUT /api/users/password`: Update password
- `GET /api/users/location`: Get user location
- `PUT /api/users/location`: Update user location
- `GET /api/users/preferences`: Get user category preferences
- `PUT /api/users/preferences`: Update user category preferences
- `GET /api/users/favorites`: Get user favorite events

### Events

- `POST /api/events`: Create a new event
- `GET /api/events`: Get list of events
- `GET /api/events/:id`: Get event details
- `PUT /api/events/:id`: Update an event
- `DELETE /api/events/:id`: Delete an event
- `GET /api/events/search/location`: Search events by location
- `GET /api/events/category/:id`: Get events by category
- `POST /api/events/:id/favorite`: Add event to favorites
- `DELETE /api/events/:id/favorite`: Remove event from favorites
- `POST /api/events/:id/reviews`: Add a review for an event
- `GET /api/events/:id/reviews`: Get reviews for an event

### Categories

- `GET /api/categories`: Get all categories
- `GET /api/categories/:id`: Get category details

![API Endpoints](./docs/images/api-endpoints.png)

## Project Structure
event-locator/
├── src/
│ ├── config/ # Configuration files
│ ├── controllers/ # Request handlers
│ ├── middleware/ # Custom middleware
│ ├── models/ # Database models
│ ├── routes/ # API routes
│ ├── services/ # Business logic
│ ├── utils/ # Utility functions
│ ├── queues/ # Redis queue handlers
│ ├── i18n/ # Internationalization
│ └── app.js # Express app setup
├── tests/ # Test files
├── docs/ # Documentation
└── README.md


## Running Tests

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create your feature branch
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. Commit your changes
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. Push to the branch
   ```bash
   git push origin feature/AmazingFeature
   ```
5. Open a Pull Request

## Support

For support, email anelechidera4@gmail.com or create an issue in the repository.
