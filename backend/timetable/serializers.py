from rest_framework import serializers
from .models import Schedule, TimetableEntry
from campus.serializers import CourseSerializer, RoomSerializer

class ScheduleSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    room = RoomSerializer(read_only=True)

    class Meta:
        model = Schedule
        fields = '__all__'

class TimetableEntrySerializer(serializers.ModelSerializer):
    course_detail = CourseSerializer(source='course', read_only=True)
    room_detail = RoomSerializer(source='room', read_only=True)

    class Meta:
        model = TimetableEntry
        fields = '__all__'
        read_only_fields = ('user',)

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
