from django.shortcuts import render
from .models import MenuCategory, MenuItem


def home(request):
    featured_items = MenuItem.objects.filter(is_featured=True, is_available=True)[:6]
    return render(request, 'cafe/home.html', {'featured_items': featured_items})


def menu(request):
    categories = MenuCategory.objects.prefetch_related(
        'items'
    ).filter(items__is_available=True).distinct()
    return render(request, 'cafe/menu.html', {'categories': categories})


def about(request):
    return render(request, 'cafe/about.html')
