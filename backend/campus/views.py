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

from rest_framework.permissions import IsAuthenticatedOrReadOnly

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

from rest_framework.views import APIView
from rest_framework.response import Response

class SearchView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get('query', '')
        if not query:
            return Response([])

        results = []
        # Match buildings
        for b in Building.objects.filter(Q(name__icontains=query) | Q(code__icontains=query))[:5]:
            results.append({'type': 'building', 'id': f"b_{b.id}", 'title': b.name, 'subtitle': f"Building ({b.code})", 'target': b.code})
            
        # Match rooms
        for r in Room.objects.filter(room_number__icontains=query)[:5]:
            results.append({'type': 'room', 'id': f"r_{r.id}", 'title': f"Room {r.room_number}", 'subtitle': r.building.name, 'target': r.building.code})

        # Match courses
        for c in Course.objects.filter(Q(course_code__icontains=query) | Q(name__icontains=query))[:10]:
            results.append({'type': 'course', 'id': f"c_{c.id}", 'title': c.course_code, 'subtitle': c.name, 'target': None})

        return Response(results)
