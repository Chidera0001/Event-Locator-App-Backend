const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');
const bcrypt = require('bcrypt');

// Mock data
let authToken;
let testUserId;
let testEventId;

const testUser = {
  username: 'eventuser',
  email: 'eventuser@example.com',
  password: 'password123'
};

const testEvent = {
  title: 'Test Event',
  description: 'This is a test event',
  latitude: 40.7128,
  longitude: -74.0060,
  address: 'New York, NY',
  startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
  endTime: new Date(Date.now() + 90000000).toISOString()
};

// Setup and cleanup
beforeAll(async () => {
  // Clean up and create test user
  await db.query('DELETE FROM users WHERE email = $1', [testUser.email]);
  
  const hashedPassword = await bcrypt.hash(testUser.password, 10);
  const userResult = await db.query(
    'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
    [testUser.username, testUser.email, hashedPassword]
  );
  
  testUserId = userResult.rows[0].id;
  
  // Login to get token
  const res = await request(app)
    .post('/api/auth/login')
    .send({
      email: testUser.email,
      password: testUser.password
    });
  
  authToken = res.body.data.token;
});

afterAll(async () => {
  // Clean up test data
  if (testEventId) {
    await db.query('DELETE FROM events WHERE id = $1', [testEventId]);
  }
  await db.query('DELETE FROM users WHERE id = $1', [testUserId]);
});

describe('Event API', () => {
  describe('POST /api/events', () => {
    it('should create a new event when authenticated', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testEvent);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.event).toHaveProperty('id');
      
      testEventId = res.body.data.event.id;
    });
    
    it('should not create an event without authentication', async () => {
      const res = await request(app)
        .post('/api/events')
        .send(testEvent);
      
      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
  });
  
  describe('GET /api/events', () => {
    it('should get list of events', async () => {
      const res = await request(app).get('/api/events');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.events)).toBe(true);
    });
  });
  
  describe('GET /api/events/:id', () => {
    it('should get event details', async () => {
      const res = await request(app).get(`/api/events/${testEventId}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.event.id).toEqual(testEventId);
    });
    
    it('should return 404 for non-existent event', async () => {
      const res = await request(app).get('/api/events/99999');
      
      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
    });
  });
  
  describe('PUT /api/events/:id', () => {
    it('should update an event when authenticated as creator', async () => {
      const updatedEvent = {
        title: 'Updated Test Event',
        description: 'This event was updated'
      };
      
      const res = await request(app)
        .put(`/api/events/${testEventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedEvent);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.event.title).toEqual(updatedEvent.title);
    });
  });
  
  describe('GET /api/events/search/location', () => {
    it('should find events by location', async () => {
      const res = await request(app)
        .get('/api/events/search/location')
        .query({
          latitude: 40.7128,
          longitude: -74.0060,
          radius: 10 // 10km radius
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.events)).toBe(true);
    });
  });
  
  describe('POST /api/events/:id/favorite', () => {
    it('should add event to favorites when authenticated', async () => {
      const res = await request(app)
        .post(`/api/events/${testEventId}/favorite`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
    });
  });
  
  describe('POST /api/events/:id/reviews', () => {
    it('should add a review when authenticated', async () => {
      const review = {
        rating: 5,
        review: 'Great event!'
      };
      
      const res = await request(app)
        .post(`/api/events/${testEventId}/reviews`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(review);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.review).toHaveProperty('id');
      expect(res.body.data.review.rating).toEqual(review.rating);
    });
  });
  
  describe('DELETE /api/events/:id', () => {
    it('should delete an event when authenticated as creator', async () => {
      const res = await request(app)
        .delete(`/api/events/${testEventId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      
      // Event should no longer exist
      const checkRes = await request(app).get(`/api/events/${testEventId}`);
      expect(checkRes.statusCode).toEqual(404);
    });
  });
}); 