from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import UserViewSet, FileViewSet, StatusViewSet, FileRequestViewSet, NotificationViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'files', FileViewSet, basename='file')
router.register(r'statuses', StatusViewSet)
router.register(r'requests', FileRequestViewSet, basename='request')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('', include(router.urls)),
]
