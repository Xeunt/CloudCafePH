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
coffee_cat    = MenuCategory.objects.create(name='Coffee',      order=1)
drinks_cat    = MenuCategory.objects.create(name='Other Drinks', order=2)
pastry_cat    = MenuCategory.objects.create(name='Pastries',    order=3)
sandwich_cat  = MenuCategory.objects.create(name='Sandwiches',  order=4)
meals_cat     = MenuCategory.objects.create(name='Light Meals', order=5)
dessert_cat   = MenuCategory.objects.create(name='Desserts',    order=6)

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

# Pastries
MenuItem.objects.bulk_create([
    MenuItem(category=pastry_cat, name='Butter Croissant',    price=Decimal('120.00'), is_available=True, is_featured=True,  order=1),
    MenuItem(category=pastry_cat, name='Chocolate Croissant', price=Decimal('140.00'), is_available=True, is_featured=False, order=2),
    MenuItem(category=pastry_cat, name='Blueberry Muffin',    price=Decimal('130.00'), is_available=True, is_featured=False, order=3),
    MenuItem(category=pastry_cat, name='Banana Bread',        price=Decimal('120.00'), is_available=True, is_featured=False, order=4),
])

# Sandwiches
MenuItem.objects.bulk_create([
    MenuItem(category=sandwich_cat, name='Ham & Cheese Sandwich', price=Decimal('180.00'), is_available=True, is_featured=False, order=1),
    MenuItem(category=sandwich_cat, name='Chicken Sandwich',      price=Decimal('190.00'), is_available=True, is_featured=True,  order=2),
    MenuItem(category=sandwich_cat, name='Tuna Sandwich',         price=Decimal('180.00'), is_available=True, is_featured=False, order=3),
])

# Light Meals
MenuItem.objects.bulk_create([
    MenuItem(category=meals_cat, name='French Fries',       price=Decimal('130.00'), is_available=True, is_featured=False, order=1),
    MenuItem(category=meals_cat, name='Chicken & Waffles',  price=Decimal('250.00'), is_available=True, is_featured=True,  order=2),
    MenuItem(category=meals_cat, name='Pasta Carbonara',    price=Decimal('220.00'), is_available=True, is_featured=False, order=3),
    MenuItem(category=meals_cat, name='Chicken Pesto Pasta',price=Decimal('230.00'), is_available=True, is_featured=False, order=4),
])

# Desserts
MenuItem.objects.bulk_create([
    MenuItem(category=dessert_cat, name='Chocolate Cake',   price=Decimal('180.00'), is_available=True, is_featured=False, order=1),
    MenuItem(category=dessert_cat, name='Cheesecake',       price=Decimal('190.00'), is_available=True, is_featured=True,  order=2),
    MenuItem(category=dessert_cat, name='Chocolate Brownie',price=Decimal('150.00'), is_available=True, is_featured=False, order=3),
])

print(f"✅ Seeded {MenuCategory.objects.count()} categories and {MenuItem.objects.count()} menu items.")
