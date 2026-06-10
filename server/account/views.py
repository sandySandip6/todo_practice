from .serializers import UserSerializer
from rest_framework import generics

class UserCreateView(generics.CreateAPIView):
    queryset = UserSerializer.Meta.model.objects.all() 
    serializer_class = UserSerializer 
    
