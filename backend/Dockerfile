FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
RUN python manage.py collectstatic --noinput
CMD python manage.py migrate --noinput && (python manage.py createsuperuser --noinput || true) && python manage.py rebuild_index && gunicorn config.wsgi:application --bind 0.0.0.0:8000
