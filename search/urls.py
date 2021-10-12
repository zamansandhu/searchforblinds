
from django.urls import path
from .views import *

app_name = "search"
urlpatterns = [
    path('', index,name=''),
    path('voice_request', voice_request,name='voice_request'),
    path('text_request', text_request,name='text_request'),
]