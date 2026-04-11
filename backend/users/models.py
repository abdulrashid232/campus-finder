from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    # Extending default user if needed, email login will be primary.
    email = models.EmailField('email address', unique=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email
