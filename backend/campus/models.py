from django.db import models

class Building(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    image_url = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.code})"

class Room(models.Model):
    building = models.ForeignKey(Building, on_delete=models.CASCADE, related_name='rooms')
    room_number = models.CharField(max_length=50)
    floor = models.IntegerField(default=1)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    class Meta:
        unique_together = ('building', 'room_number')

    def __str__(self):
        return f"{self.building.code} {self.room_number}"

    @property
    def effective_latitude(self):
        return self.latitude if self.latitude is not None else self.building.latitude

    @property
    def effective_longitude(self):
        return self.longitude if self.longitude is not None else self.building.longitude

class Course(models.Model):
    course_code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.course_code} - {self.name}"
