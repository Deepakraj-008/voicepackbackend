class URLS {
  // Base URL
  static const String BASE_URL = 'http://localhost:3000/api';

  // Authentication endpoints
  static const String REGISTER = '/auth/register/';
  static const String LOGIN = '/auth/login/';
  static const String LOGOUT = '/auth/logout/';
  static const String PROFILE = '/auth/profile/';
  static const String FORGOT_PASSWORD = '/auth/forgot-password/';
  static const String RESET_PASSWORD = '/auth/reset-password/';
  static const String CHANGE_PASSWORD = '/auth/change-password/';
  static const String VERIFY_EMAIL = '/auth/verify-email/';
  static const String RESEND_VERIFICATION = '/auth/resend-verification/';

  // User management endpoints
  static const String USERS = '/users/';
  static const String USER_DETAIL = '/users/{id}/';
  static const String USER_UPDATE = '/users/{id}/update/';
  static const String USER_DELETE = '/users/{id}/delete/';

  // Course endpoints
  static const String COURSES = '/courses/';
  static const String COURSE_DETAIL = '/courses/{id}/';
  static const String COURSE_CREATE = '/courses/create/';
  static const String COURSE_UPDATE = '/courses/{id}/update/';
  static const String COURSE_DELETE = '/courses/{id}/delete/';
  static const String COURSE_ENROLL = '/courses/{id}/enroll/';
  static const String COURSE_UNENROLL = '/courses/{id}/unenroll/';
  static const String COURSE_PROGRESS = '/courses/{id}/progress/';
  static const String COURSE_COMPLETION = '/courses/{id}/completion/';

  // Lesson endpoints
  static const String LESSONS = '/lessons/';
  static const String LESSON_DETAIL = '/lessons/{id}/';
  static const String LESSON_CREATE = '/lessons/create/';
  static const String LESSON_UPDATE = '/lessons/{id}/update/';
  static const String LESSON_DELETE = '/lessons/{id}/delete/';
  static const String LESSON_COMPLETE = '/lessons/{id}/complete/';

  // Assignment endpoints
  static const String ASSIGNMENTS = '/assignments/';
  static const String ASSIGNMENT_DETAIL = '/assignments/{id}/';
  static const String ASSIGNMENT_CREATE = '/assignments/create/';
  static const String ASSIGNMENT_UPDATE = '/assignments/{id}/update/';
  static const String ASSIGNMENT_DELETE = '/assignments/{id}/delete/';
  static const String ASSIGNMENT_SUBMIT = '/assignments/{id}/submit/';
  static const String ASSIGNMENT_GRADE = '/assignments/{id}/grade/';

  // Quiz endpoints
  static const String QUIZZES = '/quizzes/';
  static const String QUIZ_DETAIL = '/quizzes/{id}/';
  static const String QUIZ_CREATE = '/quizzes/create/';
  static const String QUIZ_UPDATE = '/quizzes/{id}/update/';
  static const String QUIZ_DELETE = '/quizzes/{id}/delete/';
  static const String QUIZ_SUBMIT = '/quizzes/{id}/submit/';
  static const String QUIZ_RESULTS = '/quizzes/{id}/results/';

  // Grade endpoints
  static const String GRADES = '/grades/';
  static const String GRADE_DETAIL = '/grades/{id}/';
  static const String GRADE_UPDATE = '/grades/{id}/update/';
  static const String GRADE_DELETE = '/grades/{id}/delete/';

  // Live data endpoints
  static const String LIVE_DATA = '/live/';
  static const String LIVE_DATA_SUMMARY = '/live/summary/';
  static const String LIVE_DATA_OVERVIEW = '/live/summary/overview/';
  static const String LIVE_DATA_REFRESH = '/live/{category}/refresh/';

  // Django-style endpoints
  static const String DJANGO_REGISTER = '/register/';
  static const String DJANGO_LOGIN = '/login/';
  static const String DJANGO_LOGOUT = '/logout/';
  static const String DJANGO_PROFILE = '/profile/';
  static const String DJANGO_COURSES = '/courses/';
  static const String DJANGO_COURSE_DETAIL = '/courses/{id}/';
  static const String DJANGO_LESSONS = '/lessons/';
  static const String DJANGO_LESSON_DETAIL = '/lessons/{id}/';
  static const String DJANGO_ASSIGNMENTS = '/assignments/';
  static const String DJANGO_ASSIGNMENT_DETAIL = '/assignments/{id}/';
  static const String DJANGO_QUIZZES = '/quizzes/';
  static const String DJANGO_QUIZ_DETAIL = '/quizzes/{id}/';
  static const String DJANGO_GRADES = '/grades/';
  static const String DJANGO_GRADE_DETAIL = '/grades/{id}/';

  // AI Hub endpoints - NEW AI FEATURES
  static const String AI_MODELS = '/ai/models/';
  static const String AI_DATASETS = '/ai/datasets/';
  static const String AI_PAPERS = '/ai/papers/';
  static const String AI_NEWS = '/ai/news/';
  static const String AI_COMMUNITY = '/ai/community/';
  static const String AI_REPOS = '/ai/repos/';
  static const String AI_DASHBOARD = '/ai/dashboard/';
  static const String AI_ALL = '/ai/all/';

  // Utility methods
  static String replaceId(String url, String id) {
    return url.replaceAll('{id}', id);
  }

  static String buildUrl(String endpoint, {Map<String, String>? queryParams}) {
    String url = BASE_URL + endpoint;
    if (queryParams != null && queryParams.isNotEmpty) {
      final queryString = queryParams.entries
          .map((e) => '${e.key}=${e.value}')
          .join('&');
      url += '?$queryString';
    }
    return url;
  }

  static String buildLiveDataUrl(String category) {
    return '$BASE_URL/live/$category/';
  }

  static String buildLiveDataRefreshUrl(String category) {
    return '$BASE_URL/live/$category/refresh/';
  }
}
