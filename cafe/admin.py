from django.contrib import admin
from .models import MenuCategory, MenuItem


@admin.register(MenuCategory)
class MenuCategoryAdmin(admin.ModelAdmin):
    list_display  = ('name', 'order')
    ordering      = ('order', 'name')


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display   = ('name', 'category', 'price', 'is_available', 'is_featured', 'order')
    list_filter    = ('category', 'is_available', 'is_featured')
    list_editable  = ('price', 'is_available', 'is_featured', 'order')
    search_fields  = ('name', 'description')
    ordering       = ('category', 'order', 'name')
