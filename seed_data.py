"""
Run with:  python seed_data.py
Loads the official Cloud Cafe PH menu into the database.
"""
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cloudcafe.settings')
django.setup()

from cafe.models import MenuCategory, MenuItem
from decimal import Decimal

# Clear existing data
MenuItem.objects.all().delete()
MenuCategory.objects.all().delete()

# Categories
coffee_cat = MenuCategory.objects.create(name='Coffee', order=1)
drinks_cat = MenuCategory.objects.create(name='Other Drinks', order=2)

# Coffee
MenuItem.objects.bulk_create([
    MenuItem(category=coffee_cat, name='Americano',   price=Decimal('120.00'), is_available=True, is_featured=True,  order=1),
    MenuItem(category=coffee_cat, name='Latte',       price=Decimal('150.00'), is_available=True, is_featured=True,  order=2),
    MenuItem(category=coffee_cat, name='Cappuccino',  price=Decimal('150.00'), is_available=True, is_featured=True,  order=3),
    MenuItem(category=coffee_cat, name='Mocha',       price=Decimal('160.00'), is_available=True, is_featured=False, order=4),
    MenuItem(category=coffee_cat, name='Iced Coffee', price=Decimal('140.00'), is_available=True, is_featured=True,  order=5),
])

# Other Drinks
MenuItem.objects.bulk_create([
    MenuItem(category=drinks_cat, name='Hot Chocolate', price=Decimal('130.00'), is_available=True, is_featured=False, order=1),
    MenuItem(category=drinks_cat, name='Green Tea',     price=Decimal('120.00'), is_available=True, is_featured=False, order=2),
    MenuItem(category=drinks_cat, name='Iced Tea',      price=Decimal('110.00'), is_available=True, is_featured=False, order=3),
])

print(f"✅ Seeded {MenuCategory.objects.count()} categories and {MenuItem.objects.count()} menu items.")
