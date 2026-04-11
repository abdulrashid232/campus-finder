from rest_framework import viewsets, generics
from rest_framework.permissions import AllowAny
from django.db.models import Q
from .models import Building, Room, Course
from .serializers import BuildingSerializer, RoomSerializer, CourseSerializer

class BuildingViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Building.objects.all()
    serializer_class = BuildingSerializer
    permission_classes = [AllowAny]

class RoomViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [AllowAny]

class CourseViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [AllowAny]

class SearchView(generics.ListAPIView):
    serializer_class = CourseSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        query = self.request.query_params.get('query', '')
        if query:
            return Course.objects.filter(
                Q(course_code__icontains=query) | Q(name__icontains=query)
            )
        return Course.objects.none()
