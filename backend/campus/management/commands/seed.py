from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from campus.models import Building, Room, Course
from timetable.models import Schedule
import decimal

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed database with initial data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding data...')
        
        # 1. Create a Test User
        if not User.objects.filter(email='test@example.com').exists():
            User.objects.create_user(
                username='teststudent',
                email='test@example.com',
                password='password123'
            )
            self.stdout.write(self.style.SUCCESS('Created test user: test@example.com / password123'))

        # 2. Buildings & Rooms
        b1, _ = Building.objects.get_or_create(
            code='ENG',
            defaults={
                'name': 'Engineering Center',
                'latitude': decimal.Decimal('37.774900'),
                'longitude': decimal.Decimal('-122.419400'),
                'image_url': 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80'
            }
        )
        b2, _ = Building.objects.get_or_create(
            code='SCI',
            defaults={
                'name': 'Science Building',
                'latitude': decimal.Decimal('37.775000'),
                'longitude': decimal.Decimal('-122.418000'),
                'image_url': 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80'
            }
        )

        r1, _ = Room.objects.get_or_create(building=b1, room_number='101', defaults={'floor': 1})
        r2, _ = Room.objects.get_or_create(building=b1, room_number='202', defaults={'floor': 2})
        r3, _ = Room.objects.get_or_create(building=b2, room_number='105A', defaults={'floor': 1})

        # 3. Courses
        c1, _ = Course.objects.get_or_create(course_code='CS101', defaults={'name': 'Intro to Computer Science'})
        c2, _ = Course.objects.get_or_create(course_code='PHY201', defaults={'name': 'Advanced Physics'})
        c3, _ = Course.objects.get_or_create(course_code='ENG300', defaults={'name': 'Engineering Ethics'})

        # 4. Schedules (Global)
        Schedule.objects.get_or_create(
            course=c1, room=r1, day_of_week=0, start_time='09:00', end_time='10:30'
        )
        Schedule.objects.get_or_create(
            course=c1, room=r1, day_of_week=2, start_time='09:00', end_time='10:30'
        )
        Schedule.objects.get_or_create(
            course=c2, room=r3, day_of_week=1, start_time='11:00', end_time='13:00'
        )
        Schedule.objects.get_or_create(
            course=c3, room=r2, day_of_week=4, start_time='14:00', end_time='15:30'
        )

        self.stdout.write(self.style.SUCCESS('Database completely seeded!'))
