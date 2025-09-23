// Flutter Client Integration for Django-style API
// Place this file in your Flutter project's lib/services/ directory

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

class ApiService {
  static const String baseUrl = 'http://localhost:3000/api';
  static final Dio _dio = Dio(
    BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ),
  );

  // Add interceptor for logging and error handling
  static void setupInterceptors() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          if (kDebugMode) {
            print('REQUEST[${options.method}] => PATH: ${options.path}');
            print('REQUEST DATA: ${options.data}');
          }
          return handler.next(options);
        },
        onResponse: (response, handler) {
          if (kDebugMode) {
            print('RESPONSE[${response.statusCode}] => PATH: ${response.requestOptions.path}');
            print('RESPONSE DATA: ${response.data}');
          }
          return handler.next(response);
        },
        onError: (DioException error, handler) {
          if (kDebugMode) {
            print('ERROR[${error.response?.statusCode}] => PATH: ${error.requestOptions.path}');
            print('ERROR MESSAGE: ${error.message}');
          }
          return handler.next(error);
        },
      ),
    );
  }

  // Authentication Service
  static Future<Map<String, dynamic>> register({
    required String username,
    required String email,
    required String password,
    String? firstName,
    String? lastName,
  }) async {
    try {
      final response = await _dio.post('/auth/register', data: {
        'username': username,
        'email': email,
        'password': password,
        'first_name': firstName,
        'last_name': lastName,
      });
      
      if (response.data['success'] == true) {
        return response.data['user'];
      } else {
        throw Exception(response.data['error'] ?? 'Registration failed');
      }
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  static Future<Map<String, dynamic>> login({
    required String username,
    required String password,
  }) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'username': username,
        'password': password,
      });
      
      if (response.data['success'] == true) {
        // Store the token for future requests
        final token = response.data['access'];
        _dio.options.headers['Authorization'] = 'Bearer $token';
        return {
          'token': token,
          'user': response.data['user'],
        };
      } else {
        throw Exception(response.data['error'] ?? 'Login failed');
      }
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  // Courses Service
  static Future<List<dynamic>> getCourses({
    String? search,
    String? category,
    String? level,
  }) async {
    try {
      final response = await _dio.get('/courses', queryParameters: {
        if (search != null) 'search': search,
        if (category != null) 'category': category,
        if (level != null) 'level': level,
      });
      
      if (response.data['success'] == true) {
        return response.data['results'];
      } else {
        throw Exception(response.data['error'] ?? 'Failed to fetch courses');
      }
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  static Future<Map<String, dynamic>> getCourseDetail(int id) async {
    try {
      final response = await _dio.get('/courses/$id');
      
      if (response.data['success'] == true) {
        return response.data['course'];
      } else {
        throw Exception(response.data['error'] ?? 'Failed to fetch course detail');
      }
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  // Exams Service
  static Future<List<dynamic>> getExams({
    int? courseId,
    String? status,
  }) async {
    try {
      final response = await _dio.get('/exams', queryParameters: {
        if (courseId != null) 'course_id': courseId,
        if (status != null) 'status': status,
      });
      
      if (response.data['success'] == true) {
        return response.data['results'];
      } else {
        throw Exception(response.data['error'] ?? 'Failed to fetch exams');
      }
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  static Future<Map<String, dynamic>> submitExam(int id, List<dynamic> answers) async {
    try {
      final response = await _dio.post('/exams/$id/submit', data: {
        'answers': answers,
      });
      
      if (response.data['success'] == true) {
        return response.data['result'];
      } else {
        throw Exception(response.data['error'] ?? 'Failed to submit exam');
      }
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  // Flashcards Service
  static Future<List<dynamic>> getFlashcards({
    int? courseId,
    String? category,
  }) async {
    try {
      final response = await _dio.get('/flashcards', queryParameters: {
        if (courseId != null) 'course_id': courseId,
        if (category != null) 'category': category,
      });
      
      if (response.data['success'] == true) {
        return response.data['results'];
      } else {
        throw Exception(response.data['error'] ?? 'Failed to fetch flashcards');
      }
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  static Future<Map<String, dynamic>> reviewFlashcard(int id, String difficulty) async {
    try {
      final response = await _dio.post('/flashcards/$id/review', data: {
        'difficulty': difficulty,
      });
      
      if (response.data['success'] == true) {
        return response.data['review'];
      } else {
        throw Exception(response.data['error'] ?? 'Failed to review flashcard');
      }
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  // Payments Service
  static Future<Map<String, dynamic>> createPayment({
    required int courseId,
    required double amount,
    String currency = 'USD',
  }) async {
    try {
      final response = await _dio.post('/payments/create', data: {
        'course_id': courseId,
        'amount': amount,
        'currency': currency,
      });
      
      if (response.data['success'] == true) {
        return response.data['payment'];
      } else {
        throw Exception(response.data['error'] ?? 'Failed to create payment');
      }
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  static Future<Map<String, dynamic>> verifyPayment(String paymentId) async {
    try {
      final response = await _dio.post('/payments/verify', data: {
        'payment_id': paymentId,
      });
      
      if (response.data['success'] == true) {
        return response.data['verification'];
      } else {
        throw Exception(response.data['error'] ?? 'Failed to verify payment');
      }
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  // Feedback Service
  static Future<Map<String, dynamic>> submitFeedback({
    required int courseId,
    required int rating,
    String? comment,
    String type = 'general',
  }) async {
    try {
      final response = await _dio.post('/feedback', data: {
        'course_id': courseId,
        'rating': rating,
        'comment': comment,
        'type': type,
      });
      
      if (response.data['success'] == true) {
        return response.data['feedback'];
      } else {
        throw Exception(response.data['error'] ?? 'Failed to submit feedback');
      }
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  static Future<Map<String, dynamic>> getFeedback({int? courseId}) async {
    try {
      final response = await _dio.get('/feedback', queryParameters: {
        if (courseId != null) 'course_id': courseId,
      });
      
      if (response.data['success'] == true) {
        return {
          'count': response.data['count'],
          'average_rating': response.data['average_rating'],
          'results': response.data['results'],
        };
      } else {
        throw Exception(response.data['error'] ?? 'Failed to fetch feedback');
      }
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  // Live Data Service
  static Future<List<dynamic>> getLiveDataCategories() async {
    try {
      final response = await _dio.get('/live-data/categories');
      
      if (response.data['success'] == true) {
        return response.data['categories'];
      } else {
        throw Exception(response.data['error'] ?? 'Failed to fetch categories');
      }
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  static Future<Map<String, dynamic>> getLiveData(String category) async {
    try {
      final response = await _dio.get('/live-data/$category');
      
      if (response.data['success'] == true) {
        return response.data;
      } else {
        throw Exception(response.data['error'] ?? 'Failed to fetch live data');
      }
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  // Django-style Live Data Endpoints
  static Future<Map<String, dynamic>> getLiveWeather() async {
    try {
      final response = await _dio.get('/live/weather');
      return response.data['data'];
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  static Future<List<dynamic>> getLiveNews() async {
    try {
      final response = await _dio.get('/live/news');
      return response.data['data'];
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  static Future<Map<String, dynamic>> getLiveSports() async {
    try {
      final response = await _dio.get('/live/sports');
      return response.data['data'];
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  static Future<Map<String, dynamic>> getLiveTrending() async {
    try {
      final response = await _dio.get('/live/trending');
      return response.data['data'];
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  static Future<List<dynamic>> getLiveCourses() async {
    try {
      final response = await _dio.get('/live/courses');
      return response.data['data'];
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  static Future<Map<String, dynamic>> getAllLiveData() async {
    try {
      final response = await _dio.get('/live/all');
      return response.data['data'];
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  // Error handling
  static String _handleError(DioException error) {
    if (error.response != null) {
      final statusCode = error.response?.statusCode;
      final data = error.response?.data;
      
      if (data != null && data is Map && data.containsKey('error')) {
        return data['error'];
      } else if (statusCode == 400) {
        return 'Bad request. Please check your input.';
      } else if (statusCode == 401) {
        return 'Unauthorized. Please login again.';
      } else if (statusCode == 404) {
        return 'Resource not found.';
      } else if (statusCode == 500) {
        return 'Server error. Please try again later.';
      }
    }
    
    return 'Network error. Please check your connection.';
  }

  // Set authentication token
  static void setAuthToken(String token) {
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  // Remove authentication token
  static void removeAuthToken() {
    _dio.options.headers.remove('Authorization');
  }
}

// Example usage in Flutter widgets
/*
class ExampleUsage extends StatefulWidget {
  @override
  _ExampleUsageState createState() => _ExampleUsageState();
}

class _ExampleUsageState extends State<ExampleUsage> {
  List<dynamic> courses = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    ApiService.setupInterceptors();
    loadCourses();
  }

  Future<void> loadCourses() async {
    try {
      final data = await ApiService.getCourses();
      setState(() {
        courses = data;
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading courses: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Courses')),
      body: isLoading
          ? Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: courses.length,
              itemBuilder: (context, index) {
                final course = courses[index];
                return ListTile(
                  title: Text(course['title']),
                  subtitle: Text(course['description']),
                  trailing: Text('\$${course['price']}'),
                );
              },
            ),
    );
  }
}
*/