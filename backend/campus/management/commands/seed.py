import os
import decimal

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.core.files.images import ImageFile

from campus.models import Building, Room, Course
from timetable.models import Schedule

User = get_user_model()

IMAGES_DIR = os.path.join(os.path.dirname(__file__), 'seed_images')


def attach_image(instance, filename):
    """Attach a seed image file to a Building/Room, unless one is already set."""
    if instance.image:
        return
    path = os.path.join(IMAGES_DIR, filename)
    if not os.path.exists(path):
        return
    with open(path, 'rb') as f:
        instance.image.save(filename, ImageFile(f), save=True)


class Command(BaseCommand):
    help = 'Seed database with initial data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding data...')

        # 1. Create a Test User and Superuser
        if not User.objects.filter(email='admin@example.com').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@example.com',
                password='adminpassword123'
            )
            self.stdout.write(self.style.SUCCESS('Created admin user: admin@example.com / adminpassword123'))

        if not User.objects.filter(email='test@example.com').exists():
            User.objects.create_user(
                username='teststudent',
                email='test@example.com',
                password='password123'
            )
            self.stdout.write(self.style.SUCCESS('Created test user: test@example.com / password123'))

        # 2. Buildings & Rooms
        b1, _ = Building.objects.get_or_create(
            code='ODU',
            defaults={
                'name': 'Oduro Block',
                'latitude': decimal.Decimal('4.9097171'),
                'longitude': decimal.Decimal('-1.7563530'),
                'image_url': 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80'
            }
        )
        b2, _ = Building.objects.get_or_create(
            code='FOE',
            defaults={
                'name': 'Faculty of Engineering',
                'latitude': decimal.Decimal('4.9075520'),
                'longitude': decimal.Decimal('-1.7555028'),
                'image_url': 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80'
            }
        )

        # Drop the old placeholder Oduro Block rooms in favour of the real,
        # surveyed first-floor doors (OBFF1-6) below.
        Room.objects.filter(building=b1, room_number__in=['101', '202']).delete()

        obff_rooms_data = [
            ('OBFF1', '4.9096580', '-1.7560500', 'OBFF1.jpeg'),
            ('OBFF2', '4.9096827', '-1.7561834', 'OBFF2.jpeg'),
            ('OBFF3', '4.9096643', '-1.7563638', 'OBFF3.jpeg'),
            ('OBFF4', '4.9097001', '-1.7564929', 'OBFF4.jpeg'),
            ('OBFF5', '4.9097248', '-1.7565985', 'OBFF5.jpeg'),
            ('OBFF6', '4.9097138', '-1.7568912', 'OBFF6.jpeg'),
        ]
        obff_rooms = {}
        for room_number, lat, lng, image_file in obff_rooms_data:
            room, _ = Room.objects.get_or_create(
                building=b1, room_number=room_number,
                defaults={
                    'floor': 1,
                    'latitude': decimal.Decimal(lat),
                    'longitude': decimal.Decimal(lng),
                }
            )
            attach_image(room, image_file)
            obff_rooms[room_number] = room

        r3, _ = Room.objects.get_or_create(
            building=b2, room_number='105A',
            defaults={
                'floor': 1,
                'latitude': decimal.Decimal('4.9075900'),   # east wing entrance
                'longitude': decimal.Decimal('-1.7554600'),
            }
        )

        # New buildings surveyed on campus
        new_library, _ = Building.objects.get_or_create(
            code='NEWLIB',
            defaults={
                'name': 'New Library',
                'latitude': decimal.Decimal('4.9098908'),
                'longitude': decimal.Decimal('-1.7556651'),
            }
        )
        attach_image(new_library, 'new_library.jpeg')

        old_library, _ = Building.objects.get_or_create(
            code='OLDLIB',
            defaults={
                'name': 'Old Library',
                'latitude': decimal.Decimal('4.9100127'),
                'longitude': decimal.Decimal('-1.7557137'),
            }
        )
        attach_image(old_library, 'old_library.jpeg')

        annan_block, _ = Building.objects.get_or_create(
            code='ANNAN',
            defaults={
                'name': 'Annan Block',
                'latitude': decimal.Decimal('4.9098688'),
                'longitude': decimal.Decimal('-1.7561821'),
            }
        )
        attach_image(annan_block, 'annan_block.jpeg')

        administrative_block, _ = Building.objects.get_or_create(
            code='ADMINBLK',
            defaults={
                'name': 'Administrative Block',
                'latitude': decimal.Decimal('4.9100839'),
                'longitude': decimal.Decimal('-1.7560952'),
            }
        )
        attach_image(administrative_block, 'administrative_block.jpeg')

        auditorium, _ = Building.objects.get_or_create(
            code='AUDI',
            defaults={
                'name': 'Nicholas Aidoo-Taylor Auditorium',
                'latitude': decimal.Decimal('4.9095872'),
                'longitude': decimal.Decimal('-1.7572080'),
            }
        )
        attach_image(auditorium, 'auditorium.jpeg')

        # Administrative offices housed along the Annan Block corridor
        annan_offices_data = [
            ('Directorate of Works and Physical Development', '4.9099165', '-1.7560858', 'directorate_works.jpeg'),
            ('Payroll Office', '4.9098811', '-1.7561720', 'payroll_office.jpeg'),
            ('Directorate of Finance', '4.9099172', '-1.7563282', 'directorate_finance.jpeg'),
            ('Student Loan Trust Fund', '4.9098250', '-1.7564114', 'student_loan_trust_fund.jpeg'),
            ('Guidance and Counselling', '4.9098046', '-1.7565284', 'guidance_counselling.jpeg'),
            ('Eskills Lab', '4.9098227', '-1.7566320', 'eskills_lab.jpeg'),
        ]
        for room_number, lat, lng, image_file in annan_offices_data:
            office, _ = Room.objects.get_or_create(
                building=annan_block, room_number=room_number,
                defaults={
                    'floor': 0,
                    'latitude': decimal.Decimal(lat),
                    'longitude': decimal.Decimal(lng),
                }
            )
            attach_image(office, image_file)

        # 3. Courses
        c1, _ = Course.objects.get_or_create(course_code='CS101', defaults={'name': 'Intro to Computer Science'})
        c2, _ = Course.objects.get_or_create(course_code='PHY201', defaults={'name': 'Advanced Physics'})
        c3, _ = Course.objects.get_or_create(course_code='ENG300', defaults={'name': 'Engineering Ethics'})

        # 4. Schedules (Global)
        Schedule.objects.get_or_create(
            course=c1, room=obff_rooms['OBFF1'], day_of_week=0, start_time='09:00', end_time='10:30'
        )
        Schedule.objects.get_or_create(
            course=c1, room=obff_rooms['OBFF1'], day_of_week=2, start_time='09:00', end_time='10:30'
        )
        Schedule.objects.get_or_create(
            course=c2, room=r3, day_of_week=1, start_time='11:00', end_time='13:00'
        )
        Schedule.objects.get_or_create(
            course=c3, room=obff_rooms['OBFF2'], day_of_week=4, start_time='14:00', end_time='15:30'
        )

        self.stdout.write(self.style.SUCCESS('Database completely seeded!'))
