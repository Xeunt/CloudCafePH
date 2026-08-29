web: gunicorn cloudcafe.wsgi --workers 2 --threads 2 --timeout 60 --log-file -
release: python manage.py migrate --no-input && python manage.py collectstatic --no-input
