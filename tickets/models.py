from django.db import models
from django.contrib.auth.models import User

# Create your models here.


class Ticket(models.Model):
    title = models.CharField(max_length=120)
    description = models.TextField()
    image = models.ImageField(upload_to="tickets/%y/%m/%d", null=True, blank=True)
    status = models.CharField(max_length=20, default="New")
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_by = models.ForeignKey(User,on_delete=models.CASCADE,related_name="created_tickets",null=True,blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20)

    def __str__(self):
        return self.user.username
