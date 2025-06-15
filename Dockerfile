FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create static and media directories
RUN mkdir -p /app/staticfiles /app/media /app/static

# Collect static files - with error handling
RUN python manage.py collectstatic --noinput || echo "Static files collection failed, continuing anyway"

ENV DJANGO_SETTINGS_MODULE=FC.settings
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["gunicorn", "FC.wsgi:application", "--bind", "0.0.0.0:8000"]

