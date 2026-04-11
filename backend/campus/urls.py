from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BuildingViewSet, RoomViewSet, CourseViewSet, SearchView

router = DefaultRouter()
router.register(r'buildings', BuildingViewSet)
router.register(r'rooms', RoomViewSet)
router.register(r'courses', CourseViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('search/', SearchView.as_view(), name='search'),
]
