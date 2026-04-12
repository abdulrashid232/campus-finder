from django.contrib import admin
from .models import Schedule, TimetableEntry

@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    list_display = ('course', 'room', 'day_of_week', 'start_time', 'end_time')
    list_filter = ('day_of_week',)

@admin.register(TimetableEntry)
class TimetableEntryAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'room', 'day_of_week', 'start_time', 'end_time')
    list_filter = ('day_of_week',)
