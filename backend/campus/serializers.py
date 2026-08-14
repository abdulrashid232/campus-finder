from rest_framework import serializers
from .models import Building, Room, Course

class BuildingSerializer(serializers.ModelSerializer):
    image_absolute = serializers.SerializerMethodField()

    def get_image_absolute(self, obj):
        if not obj.image:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url

    class Meta:
        model = Building
        fields = '__all__'

class RoomSerializer(serializers.ModelSerializer):
    building = BuildingSerializer(read_only=True)
    effective_latitude = serializers.DecimalField(max_digits=9, decimal_places=6, read_only=True)
    effective_longitude = serializers.DecimalField(max_digits=9, decimal_places=6, read_only=True)
    image_absolute = serializers.SerializerMethodField()

    def get_image_absolute(self, obj):
        if not obj.image:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url

    class Meta:
        model = Room
        fields = '__all__'

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'
