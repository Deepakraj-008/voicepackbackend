import 'dart:convert';
import 'package:http/http.dart' as http;
import '../urls.dart';

class AIService {
  // Get trending AI models from Hugging Face
  static Future<List<dynamic>> fetchAIModels() async {
    try {
      final response = await http.get(Uri.parse(URLS.buildUrl(URLS.AI_MODELS)));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['data'] ?? [];
      }
      return [];
    } catch (e) {
      print('Error fetching AI models: $e');
      return [];
    }
  }

  // Get AI datasets from Hugging Face
  static Future<List<dynamic>> fetchAIDatasets() async {
    try {
      final response = await http.get(
        Uri.parse(URLS.buildUrl(URLS.AI_DATASETS)),
      );
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['data'] ?? [];
      }
      return [];
    } catch (e) {
      print('Error fetching AI datasets: $e');
      return [];
    }
  }

  // Get recent AI papers from arXiv
  static Future<List<dynamic>> fetchAIPapers() async {
    try {
      final response = await http.get(Uri.parse(URLS.buildUrl(URLS.AI_PAPERS)));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['data'] ?? [];
      }
      return [];
    } catch (e) {
      print('Error fetching AI papers: $e');
      return [];
    }
  }

  // Get AI news from multiple sources
  static Future<List<dynamic>> fetchAINews() async {
    try {
      final response = await http.get(Uri.parse(URLS.buildUrl(URLS.AI_NEWS)));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['data'] ?? [];
      }
      return [];
    } catch (e) {
      print('Error fetching AI news: $e');
      return [];
    }
  }

  // Get AI community posts from Hacker News
  static Future<List<dynamic>> fetchAICommunity() async {
    try {
      final response = await http.get(
        Uri.parse(URLS.buildUrl(URLS.AI_COMMUNITY)),
      );
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['data'] ?? [];
      }
      return [];
    } catch (e) {
      print('Error fetching AI community: $e');
      return [];
    }
  }

  // Get trending AI repositories from GitHub
  static Future<List<dynamic>> fetchAIRepos() async {
    try {
      final response = await http.get(Uri.parse(URLS.buildUrl(URLS.AI_REPOS)));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['data'] ?? [];
      }
      return [];
    } catch (e) {
      print('Error fetching AI repos: $e');
      return [];
    }
  }

  // Get comprehensive AI dashboard data
  static Future<Map<String, dynamic>> fetchAIDashboard() async {
    try {
      final response = await http.get(
        Uri.parse(URLS.buildUrl(URLS.AI_DASHBOARD)),
      );
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['data'] ?? {};
      }
      return {};
    } catch (e) {
      print('Error fetching AI dashboard: $e');
      return {};
    }
  }

  // Get all AI data at once
  static Future<Map<String, dynamic>> fetchAllAIData() async {
    try {
      final response = await http.get(Uri.parse(URLS.buildUrl(URLS.AI_ALL)));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data;
      }
      return {};
    } catch (e) {
      print('Error fetching all AI data: $e');
      return {};
    }
  }

  // Search AI models
  static Future<List<dynamic>> searchAIModels(String query) async {
    try {
      final models = await fetchAIModels();
      return models
          .where(
            (model) =>
                model['name'].toString().toLowerCase().contains(
                  query.toLowerCase(),
                ) ||
                model['description'].toString().toLowerCase().contains(
                  query.toLowerCase(),
                ),
          )
          .toList();
    } catch (e) {
      print('Error searching AI models: $e');
      return [];
    }
  }

  // Get AI model details
  static Future<Map<String, dynamic>?> getAIModelDetails(String modelId) async {
    try {
      final models = await fetchAIModels();
      return models.firstWhere(
        (model) => model['id'] == modelId,
        orElse: () => null,
      );
    } catch (e) {
      print('Error getting AI model details: $e');
      return null;
    }
  }

  // Filter AI papers by category
  static Future<List<dynamic>> filterAIPapersByCategory(String category) async {
    try {
      final papers = await fetchAIPapers();
      return papers
          .where(
            (paper) => paper['category'].toString().toLowerCase().contains(
              category.toLowerCase(),
            ),
          )
          .toList();
    } catch (e) {
      print('Error filtering AI papers: $e');
      return [];
    }
  }

  // Get trending AI topics
  static Future<List<String>> getTrendingAITopics() async {
    try {
      final dashboard = await fetchAIDashboard();
      final trending = dashboard['trending_topics'] ?? [];
      return List<String>.from(trending);
    } catch (e) {
      print('Error getting trending AI topics: $e');
      return [];
    }
  }

  // Get AI statistics
  static Future<Map<String, dynamic>> getAIStatistics() async {
    try {
      final allData = await fetchAllAIData();
      return {
        'total_models': allData['summary']?['total_models'] ?? 0,
        'total_datasets': allData['summary']?['total_datasets'] ?? 0,
        'total_papers': allData['summary']?['total_papers'] ?? 0,
        'total_news': allData['summary']?['total_news'] ?? 0,
        'total_community': allData['summary']?['total_community'] ?? 0,
        'total_repos': allData['summary']?['total_repos'] ?? 0,
        'last_updated': allData['last_updated'] ?? '',
      };
    } catch (e) {
      print('Error getting AI statistics: $e');
      return {};
    }
  }
}
