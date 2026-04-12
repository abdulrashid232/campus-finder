from django.contrib import admin
from .models import Building, Room, Course

@admin.register(Building)
class BuildingAdmin(admin.ModelAdmin):
    list_display = ('code', 'name')
    search_fields = ('code', 'name')

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('building', 'room_number', 'floor')
    search_fields = ('room_number', 'building__code')
    list_filter = ('building',)

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('course_code', 'name')
    search_fields = ('course_code', 'name')
