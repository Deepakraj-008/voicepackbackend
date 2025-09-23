# Django-Style API Integration Guide

This guide explains how to use the Django-style API endpoints that have been integrated into your existing Node.js/Express backend.

## Overview

Your existing `voicepackbackend` now supports both:
1. **Original Live Data endpoints** (`/api/live-data/*`) - 50+ categories with real-time data
2. **New Django-style endpoints** (`/api/*`) - Educational platform features

## Quick Start

### 1. Backend Setup

Your backend is already configured. The new Django-style endpoints are available alongside your existing live data endpoints.

### 2. Flutter Client Integration

Use the provided `flutter_client_integration.dart` file in your Flutter project:

```dart
// Add to pubspec.yaml
dependencies:
  dio: ^5.3.2

// Import the service
import 'services/api_service.dart';

// Initialize in main.dart
void main() {
  ApiService.setupInterceptors();
  runApp(MyApp());
}
```

## Available Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Courses
- `GET /api/courses` - List courses with filters
- `GET /api/courses/{id}` - Course details

### Exams
- `GET /api/exams` - List exams
- `POST /api/exams/{id}/submit` - Submit exam answers

### Flashcards
- `GET /api/flashcards` - List flashcards
- `POST /api/flashcards/{id}/review` - Review flashcard

### Payments
- `POST /api/payments/create` - Create payment
- `POST /api/payments/verify` - Verify payment

### Feedback
- `GET /api/feedback` - Get feedback
- `POST /api/feedback` - Submit feedback

### Live Data (Django-style)
- `GET /api/live/weather` - Weather data
- `GET /api/live/news` - News headlines
- `GET /api/live/sports` - Sports scores
- `GET /api/live/trending` - Trending topics
- `GET /api/live/courses` - Live course data
- `GET /api/live/all` - All live data

### Original Live Data (50+ categories)
- `GET /api/live-data/categories` - Available categories
- `GET /api/live-data/{category}` - Specific category data

## Usage Examples

### User Authentication
```dart
// Register new user
try {
  final user = await ApiService.register(
    username: 'john_doe',
    email: 'john@example.com',
    password: 'securepassword',
    firstName: 'John',
    lastName: 'Doe',
  );
  print('User registered: $user');
} catch (e) {
  print('Registration error: $e');
}

// Login
try {
  final authData = await ApiService.login(
    username: 'john_doe',
    password: 'securepassword',
  );
  print('Login successful, token: ${authData['token']}');
} catch (e) {
  print('Login error: $e');
}
```

### Course Management
```dart
// Get courses with filters
try {
  final courses = await ApiService.getCourses(
    search: 'flutter',
    category: 'mobile',
    level: 'beginner',
  );
  print('Found ${courses.length} courses');
} catch (e) {
  print('Error loading courses: $e');
}

// Get course details
try {
  final course = await ApiService.getCourseDetail(1);
  print('Course: ${course['title']}');
} catch (e) {
  print('Error loading course: $e');
}
```

### Live Data Integration
```dart
// Get weather data
try {
  final weather = await ApiService.getLiveWeather();
  print('Current weather: ${weather['temperature']}°C');
} catch (e) {
  print('Weather error: $e');
}

// Get news headlines
try {
  final news = await ApiService.getLiveNews();
  print('Latest news: ${news.length} articles');
} catch (e) {
  print('News error: $e');
}

// Get trending topics
try {
  final trending = await ApiService.getLiveTrending();
  print('Trending: ${trending['topics']}');
} catch (e) {
  print('Trending error: $e');
}
```

### Exam and Learning Features
```dart
// Get available exams
try {
  final exams = await ApiService.getExams(courseId: 1);
  print('Available exams: ${exams.length}');
} catch (e) {
  print('Exams error: $e');
}

// Submit exam answers
try {
  final result = await ApiService.submitExam(1, [
    {'question_id': 1, 'answer': 'A'},
    {'question_id': 2, 'answer': 'B'},
  ]);
  print('Exam score: ${result['score']}%');
} catch (e) {
  print('Exam submission error: $e');
}

// Get flashcards
try {
  final flashcards = await ApiService.getFlashcards(courseId: 1);
  print('Flashcards: ${flashcards.length}');
} catch (e) {
  print('Flashcards error: $e');
}

// Review flashcard
try {
  await ApiService.reviewFlashcard(1, 'easy');
  print('Flashcard reviewed successfully');
} catch (e) {
  print('Review error: $e');
}
```

### Payment Processing
```dart
// Create payment
try {
  final payment = await ApiService.createPayment(
    courseId: 1,
    amount: 99.99,
    currency: 'USD',
  );
  print('Payment created: ${payment['payment_id']}');
  
  // After payment completion
  final verification = await ApiService.verifyPayment(payment['payment_id']);
  print('Payment verified: ${verification['status']}');
} catch (e) {
  print('Payment error: $e');
}
```

### Feedback System
```dart
// Submit feedback
try {
  final feedback = await ApiService.submitFeedback(
    courseId: 1,
    rating: 5,
    comment: 'Excellent course!',
    type: 'general',
  );
  print('Feedback submitted: ${feedback['id']}');
} catch (e) {
  print('Feedback error: $e');
}

// Get course feedback
try {
  final feedbackData = await ApiService.getFeedback(courseId: 1);
  print('Average rating: ${feedbackData['average_rating']}');
  print('Total reviews: ${feedbackData['count']}');
} catch (e) {
  print('Feedback fetch error: $e');
}
```

## Error Handling

All API methods include comprehensive error handling:

```dart
try {
  final data = await ApiService.getCourses();
  // Process data
} on DioException catch (e) {
  // Handle network errors
  if (e.response?.statusCode == 401) {
    // Unauthorized - redirect to login
  } else if (e.response?.statusCode == 404) {
    // Resource not found
  } else {
    // Other errors
  }
} catch (e) {
  // Handle other exceptions
  print('Unexpected error: $e');
}
```

## Configuration

### Environment Variables (.env)
Your backend `.env` file now includes Django-style configurations:

```env
# Django-style settings
DEBUG=true
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=*
CORS_ALLOW_ALL=true

# Live data API keys
NEWS_API_KEY=your-news-api-key
OPENWEATHER_API_KEY=your-weather-api-key
ALPHAVANTAGE_API_KEY=your-stock-api-key
COINMARKETCAP_API_KEY=your-crypto-api-key
TMDB_API_KEY=your-movie-api-key

# Database and cache
REDIS_URL=redis://localhost:6379/0

# Default location
DEFAULT_CITY=Hyderabad
DEFAULT_LAT=17.3850
DEFAULT_LON=78.4867
```

### Flutter Configuration
Update your Flutter app's base URL in `flutter_client_integration.dart`:

```dart
class ApiService {
  static const String baseUrl = 'http://your-server-url:3000/api';
  // ... rest of the code
}
```

## Architecture Benefits

### Hybrid Approach
- **Node.js Backend**: Handles 50+ live data categories with real-time updates
- **Django-style API**: Provides educational platform features
- **Unified Interface**: Single backend serves both use cases
- **Shared Resources**: Common caching, rate limiting, and error handling

### Performance Features
- **Redis Caching**: Reduces API calls and improves response times
- **Rate Limiting**: Prevents API abuse
- **Connection Pooling**: Efficient database connections
- **Error Recovery**: Automatic retry mechanisms

### Security Features
- **JWT Authentication**: Secure user authentication
- **CORS Protection**: Cross-origin request security
- **Input Validation**: Request validation and sanitization
- **Rate Limiting**: API abuse prevention

## Migration Guide

### From Pure Django
If you were using a pure Django backend, you can now:
1. Keep your existing Flutter client code (minimal changes needed)
2. Use the enhanced live data capabilities
3. Benefit from Node.js performance for real-time data

### From Pure Node.js
If you were using a pure Node.js backend, you now have:
1. Educational platform features
2. User authentication and management
3. Course, exam, and flashcard management
4. Payment processing capabilities

## Testing

### Backend Testing
```bash
# Start your backend
npm start

# Test endpoints
curl http://localhost:3000/api/courses
curl http://localhost:3000/api/live/weather
curl http://localhost:3000/api/live-data/categories
```

### Flutter Testing
```dart
// Test API connection
void testApi() async {
  try {
    final categories = await ApiService.getLiveDataCategories();
    print('API working! Categories: ${categories.length}');
  } catch (e) {
    print('API test failed: $e');
  }
}
```

## Deployment

### Production Considerations
1. **Environment Variables**: Set production API keys
2. **Database**: Use PostgreSQL instead of SQLite
3. **Redis**: Set up Redis cluster for caching
4. **SSL**: Enable HTTPS for secure connections
5. **Rate Limiting**: Adjust limits for production load
6. **Monitoring**: Set up logging and monitoring

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Support

For issues or questions:
1. Check the error logs in your backend console
2. Verify your `.env` configuration
3. Test endpoints using curl or Postman
4. Check Flutter debug output for API call details

Your hybrid Django-style Node.js backend is now ready to power your Flutter educational app with both learning features and comprehensive live data!