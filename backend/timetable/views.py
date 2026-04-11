from rest_framework import viewsets, generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from .models import Schedule, TimetableEntry
from .serializers import ScheduleSerializer, TimetableEntrySerializer

class ScheduleTodayView(generics.ListAPIView):
    serializer_class = ScheduleSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # 0 = Monday ... 6 = Sunday for Python datetime.weekday()
        # Which matches our choices (0-6)
        today = timezone.localtime().weekday()
        return Schedule.objects.filter(day_of_week=today)

class TimetableViewSet(viewsets.ModelViewSet):
    serializer_class = TimetableEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TimetableEntry.objects.filter(user=self.request.user)
