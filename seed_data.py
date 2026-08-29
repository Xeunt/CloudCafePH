"""
Run with:  python manage.py shell < seed_data.py
Loads sample menu categories and items for Cloud Cafe PH.
"""
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cloudcafe.settings')
django.setup()

from cafe.models import MenuCategory, MenuItem
from decimal import Decimal

# Clear existing seed data (safe for dev)
MenuItem.objects.all().delete()
MenuCategory.objects.all().delete()

categories = [
    {'name': 'Hot Coffee',    'order': 1},
    {'name': 'Cold Drinks',   'order': 2},
    {'name': 'Non-Coffee',    'order': 3},
    {'name': 'Pastries & Bites', 'order': 4},
]

cat_objs = {}
for c in categories:
    obj = MenuCategory.objects.create(**c)
    cat_objs[c['name']] = obj

items = [
    # Hot Coffee
    dict(category=cat_objs['Hot Coffee'], name='Brewed Coffee',       description='Classic drip-brewed coffee, smooth and aromatic.',                price='75.00',  is_featured=True,  order=1),
    dict(category=cat_objs['Hot Coffee'], name='Americano',           description='Espresso shots topped with hot water for a bold cup.',             price='95.00',  is_featured=True,  order=2),
    dict(category=cat_objs['Hot Coffee'], name='Café Latte',          description='Espresso with steamed milk and a light layer of foam.',            price='120.00', is_featured=True,  order=3),
    dict(category=cat_objs['Hot Coffee'], name='Cappuccino',          description='Equal parts espresso, steamed milk, and frothy foam.',             price='120.00', is_featured=False, order=4),
    dict(category=cat_objs['Hot Coffee'], name='Flat White',          description='Velvety microfoam over a double espresso shot.',                   price='130.00', is_featured=False, order=5),

    # Cold Drinks
    dict(category=cat_objs['Cold Drinks'], name='Iced Americano',     description='Chilled espresso over ice — clean and refreshing.',               price='105.00', is_featured=True,  order=1),
    dict(category=cat_objs['Cold Drinks'], name='Iced Latte',         description='Espresso and cold milk poured over ice.',                          price='130.00', is_featured=True,  order=2),
    dict(category=cat_objs['Cold Drinks'], name='Cold Brew',          description='Steeped 12 hours for a smooth, low-acid cold coffee.',             price='140.00', is_featured=False, order=3),
    dict(category=cat_objs['Cold Drinks'], name='Salted Caramel Frap', description='Blended coffee with caramel and a salted cream top.',           price='165.00', is_featured=True,  order=4),

    # Non-Coffee
    dict(category=cat_objs['Non-Coffee'], name='Matcha Latte',        description='Premium Japanese matcha with steamed or iced milk.',               price='145.00', is_featured=True,  order=1),
    dict(category=cat_objs['Non-Coffee'], name='Chocolate Frappe',    description='Rich chocolate blended with milk and whipped cream.',              price='155.00', is_featured=False, order=2),
    dict(category=cat_objs['Non-Coffee'], name='Strawberry Smoothie', description='Fresh strawberry blended smooth — fruity and vibrant.',            price='140.00', is_featured=False, order=3),
    dict(category=cat_objs['Non-Coffee'], name='Honey Milk Tea',      description='Brewed black tea sweetened with honey and creamer.',               price='120.00', is_featured=False, order=4),

    # Pastries & Bites
    dict(category=cat_objs['Pastries & Bites'], name='Butter Croissant',  description='Flaky, golden, baked fresh daily.',                           price='65.00',  is_featured=True,  order=1),
    dict(category=cat_objs['Pastries & Bites'], name='Chocolate Muffin',  description='Moist double-chocolate muffin with chocolate chips.',         price='70.00',  is_featured=False, order=2),
    dict(category=cat_objs['Pastries & Bites'], name='Club Sandwich',     description='Triple-layered sandwich with chicken, bacon, and veggies.',   price='185.00', is_featured=True,  order=3),
    dict(category=cat_objs['Pastries & Bites'], name='Cheese Danish',     description='Sweet pastry filled with cream cheese, baked to perfection.', price='75.00',  is_featured=False, order=4),
]

for item in items:
    item['price'] = Decimal(item['price'])
    MenuItem.objects.create(**item)

print(f"✅ Seeded {MenuCategory.objects.count()} categories and {MenuItem.objects.count()} menu items.")
