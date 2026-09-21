from django.shortcuts import render, redirect
from .models import Ticket, Profile
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required


# الواجهة تعت التطبيق
def index(request):
    return render(request, "index.html")


# تسجيل الدخول
def Login(request):

    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            role = user.profile.role.lower()
            if role == "admin":
                return redirect("Admin")

            elif role == "technical":
                return redirect("Technical")

            elif role == "beneficiary":
                return redirect("Beneficiary")

    return render(request, "login.html")


# صفحة الخروج
def Logout(request):
    logout(request)
    return redirect("login")


# المستفيد
@login_required(login_url="login")
def Beneficiary(request):
    if request.user.profile.role.lower() != "beneficiary":
        return redirect("login")

    return render(request, "beneficiary/beneficiary-dashboard.html")


# انشاء تذكرة
@login_required(login_url="login")
def CreateTicket(request):
    if request.user.profile.role.lower() != "beneficiary":
        return redirect("login")

    if request.method == "POST":

        title = request.POST.get("title")
        description = request.POST.get("description")
        image = request.FILES.get("image")

        Ticket.objects.create(
            title=title, description=description, image=image, created_by=request.user
        )

        return redirect("MyTickets")

    return render(request, "beneficiary/create-ticket.html")


# عرض التذاكر
@login_required(login_url="login")
def MyTickets(request):
    if request.user.profile.role.lower() != "beneficiary":
        return redirect("login")
    tickets = Ticket.objects.filter(created_by=request.user).order_by("-created_at")

    return render(request, "beneficiary/my-tickets.html", {"tickets": tickets})


# صفحة الفني
@login_required(login_url="login")
def Technical(request):
    if request.user.profile.role.lower() != "technical":
        return redirect("login")

    return render(request, "technical/technical-dashboard.html")


# تعرض االتذاكر للفني المعيين
@login_required(login_url="login")
def AssignedTickets(request):
    if request.user.profile.role.lower() != "technical":
        return redirect("login")

    tickets = Ticket.objects.filter(assigned_to=request.user).order_by("-created_at")

    return render(request, "technical/assigned-tickets.html", {"tickets": tickets})


# تسجيل المدير
@login_required(login_url="login")
def Admin(request):
    if request.user.profile.role.lower() != "admin":
        return redirect("login")

    return render(request, "admin/admin-dashboard.html")


# ادارة التذاكر عن طريق المدير
@login_required(login_url="login")
def ManageTickets(request):
    if request.user.profile.role.lower() != "admin":
        return redirect("login")
    tickets = Ticket.objects.all().order_by("-created_at")
    technicians = Profile.objects.filter(role="Technical")

    return render(
        request,
        "admin/manage-tickets.html",
        {"tickets": tickets, "technicians": technicians},
    )


# ادارة المستخدمين
@login_required(login_url="login")
def ManageUsers(request):
    if request.user.profile.role.lower() != "admin":
        return redirect("login")

    users = User.objects.all().select_related("profile")

    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        role = request.POST.get("role")

        if username and password and role:
            user = User.objects.create_user(
                username=username,
                password=password
            )

            Profile.objects.create(
                user=user,
                role=role
            )

        return redirect("ManageUsers")

    return render(
        request,
        "admin/manage-users.html",
        {"users": users}
    )


# تعيين التذكرة عن طريق المدير الى الفني
@login_required(login_url="login")
def AssignTicket(request, ticket_id):
    if request.user.profile.role.lower() != "admin":
        return redirect("login")
    ticket = Ticket.objects.get(id=ticket_id)

    if request.method == "POST":
        username = request.POST.get("assigned_to")
        technician = User.objects.get(username=username)

        ticket.assigned_to = technician
        ticket.status = "Assigned"
        ticket.save()

    return redirect("ManageTickets")


# تغيير حالة التذكرة الى بدا الفني بالعمل على الحل (Progress)
@login_required(login_url="login")
def StartTicket(request, ticket_id):
    if request.user.profile.role.lower() != "technical":
        return redirect("login")
    ticket = Ticket.objects.get(id=ticket_id)
    if ticket.assigned_to != request.user:
        return redirect("AssignedTickets")
    if request.method == "POST":
        ticket.status = "In Progress"
        ticket.save()

    return redirect("AssignedTickets")


# تغيير حالة التذكرة الى تم الحل (Resolved)
@login_required(login_url="login")
def ResolveTicket(request, ticket_id):
    if request.user.profile.role.lower() != "technical":
        return redirect("login")

    ticket = Ticket.objects.get(id=ticket_id)
    if ticket.assigned_to != request.user:
        return redirect("AssignedTickets")

    if request.method == "POST":
        ticket.status = "Resolved"
        ticket.save()

    return redirect("AssignedTickets")


# تغيير حالة التذكرة الى تم الاغلاق (Closed)
@login_required(login_url="login")
def CloseTicket(request, ticket_id):
    if request.user.profile.role.lower() != "admin":
        return redirect("login")

    ticket = Ticket.objects.get(id=ticket_id)

    if request.method == "POST":
        ticket.status = "Closed"
        ticket.save()

    return redirect("ManageTickets")
