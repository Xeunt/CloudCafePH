import json
import urllib.request
import urllib.error

from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_POST

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


@require_POST
def chat(request):
    """
    Proxy view: receives a question from the front-end widget,
    forwards it to the enterprise-ai-agent Lambda via API Gateway,
    and returns the AI answer as JSON.

    The API key is kept server-side — it is never exposed to the browser.
    """
    # --- Parse incoming request ---
    try:
        body = json.loads(request.body)
        question = str(body.get('question', '')).strip()
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({'error': 'Invalid request body.'}, status=400)

    if not question:
        return JsonResponse({'error': 'Question cannot be empty.'}, status=400)

    # Basic length guard — Lambda prompt has limits
    if len(question) > 500:
        return JsonResponse({'error': 'Question is too long (max 500 characters).'}, status=400)

    # --- Check configuration ---
    agent_url = settings.AI_AGENT_URL
    api_key   = settings.AI_AGENT_API_KEY

    if not agent_url or not api_key:
        return JsonResponse(
            {'error': 'AI assistant is not configured yet. Please check back soon!'},
            status=503
        )

    # --- Forward to Lambda ---
    endpoint = agent_url.rstrip('/') + '/ask'
    payload  = json.dumps({'question': question}).encode('utf-8')

    req = urllib.request.Request(
        url=endpoint,
        data=payload,
        method='POST',
        headers={
            'Content-Type': 'application/json',
            'x-api-key': api_key,
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read().decode('utf-8')
            data = json.loads(raw)
            answer = data.get('answer', 'Sorry, I could not find an answer.')
            return JsonResponse({'answer': answer})

    except urllib.error.HTTPError as e:
        if e.code == 401:
            return JsonResponse({'error': 'AI service authentication failed.'}, status=502)
        if e.code == 429:
            return JsonResponse(
                {'error': 'The AI assistant is busy right now. Please try again in a moment.'},
                status=429
            )
        return JsonResponse({'error': 'AI service returned an error. Please try again.'}, status=502)

    except urllib.error.URLError:
        return JsonResponse(
            {'error': 'Could not reach the AI service. Please check your connection.'},
            status=503
        )

    except (json.JSONDecodeError, KeyError):
        return JsonResponse({'error': 'Unexpected response from AI service.'}, status=502)
