from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login/", views.Login, name="login"),
    path("Beneficiary/", views.Beneficiary, name="Beneficiary"),
    path("Beneficiary/create-ticket/", views.CreateTicket, name="CreateTicket"),
    path("Beneficiary/my-tickets/", views.MyTickets, name="MyTickets"),
    path("Technical/", views.Technical, name="Technical"),
    path("Technical/assigned-tickets/", views.AssignedTickets, name="AssignedTickets"),
    path("Admin/", views.Admin, name="Admin"),
    path("Admin/manage-tickets/", views.ManageTickets, name="ManageTickets"),
    path("Admin/manage-users/", views.ManageUsers, name="ManageUsers"),
    path(
        "Admin/assign-ticket/<int:ticket_id>/", views.AssignTicket, name="AssignTicket"
    ),
    path(
        "Technical/start-ticket/<int:ticket_id>/", views.StartTicket, name="StartTicket"
    ),
    path(
        "Technical/resolve-ticket/<int:ticket_id>/",
        views.ResolveTicket,
        name="ResolveTicket",
    ),
    path("Admin/close-ticket/<int:ticket_id>/", views.CloseTicket, name="CloseTicket"),
    path("logout/", views.Logout, name="logout"),
]
