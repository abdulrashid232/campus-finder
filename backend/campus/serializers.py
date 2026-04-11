from rest_framework import serializers
from .models import Building, Room, Course

class BuildingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Building
        fields = '__all__'

class RoomSerializer(serializers.ModelSerializer):
    building = BuildingSerializer(read_only=True)
    
    class Meta:
        model = Room
        fields = '__all__'

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'
