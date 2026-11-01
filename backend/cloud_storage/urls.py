from django.urls import path, include
from django.http import JsonResponse

def api_root(request):
    return JsonResponse({
        "status": "healthy",
        "service": "File Backup & Sync Backend API",
        "frontend_url": "http://localhost:5173",
        "endpoints": {
            "auth": "/api/auth/",
            "files": "/api/files/",
            "folders": "/api/folders/",
            "storage": "/api/storage/"
        }
    })

urlpatterns = [
    path('', api_root, name='index'),
    path('api/', api_root, name='api-root'),
    path('api/auth/', include('accounts.urls')),
    path('api/files/', include('files.urls_files')),
    path('api/folders/', include('files.urls_folders')),
    path('api/storage/', include('storage.urls')),
]

