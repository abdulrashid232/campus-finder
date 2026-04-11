from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ScheduleTodayView, TimetableViewSet

router = DefaultRouter()
router.register(r'', TimetableViewSet, basename='timetable')

urlpatterns = [
    path('schedule/today/', ScheduleTodayView.as_view(), name='schedule_today'),
    path('', include(router.urls)),
]
