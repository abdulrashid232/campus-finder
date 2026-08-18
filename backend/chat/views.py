import os
import json
from datetime import datetime

from google import genai
from google.genai import types
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from campus.models import Building
from timetable.models import TimetableEntry

DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']


def _build_system_prompt(user):
    now = datetime.now()
    today_name = DAYS[now.weekday()]

    # Campus buildings
    buildings = Building.objects.prefetch_related('rooms').all()
    building_lines = []
    for b in buildings:
        rooms = ', '.join(
            f"Room {r.room_number} (id={r.id}, floor={r.floor})"
            for r in b.rooms.all()
        )
        building_lines.append(
            f"  - {b.code}: {b.name} | rooms: [{rooms}]"
        )
    buildings_text = '\n'.join(building_lines) if building_lines else '  (none)'

    # User timetable
    entries = (
        TimetableEntry.objects
        .filter(user=user)
        .select_related('course', 'room', 'room__building')
        .order_by('day_of_week', 'start_time')
    )
    if entries.exists():
        timetable_lines = []
        for e in entries:
            if e.room:
                loc = (
                    f"Room {e.room.room_number}, {e.room.building.name} "
                    f"(building_code={e.room.building.code}, room_id={e.room.id})"
                )
            else:
                loc = 'Location TBD'
            timetable_lines.append(
                f"  - {DAYS[e.day_of_week]}: {e.course.course_code} — "
                f"{e.start_time.strftime('%H:%M')}–{e.end_time.strftime('%H:%M')} | {loc}"
            )
        timetable_text = 'USER TIMETABLE:\n' + '\n'.join(timetable_lines)
    else:
        timetable_text = 'USER TIMETABLE: No classes registered yet.'

    return f"""You are a friendly campus navigation assistant built into CampusFinder, a university app.

Today is {today_name}, {now.strftime('%d %B %Y')}. Current time: {now.strftime('%H:%M')}.

CAMPUS BUILDINGS & ROOMS:
{buildings_text}

{timetable_text}

YOUR JOB:
- Help students find classrooms and navigate campus.
- Answer schedule questions using the timetable above.
- Keep replies short and friendly (2–3 sentences max).

STRICT OUTPUT FORMAT — respond ONLY with valid JSON, no other text:
{{
  "message": "your friendly response here",
  "action": {{
    "type": "navigate" | "show_timetable" | "none",
    "building_code": "CODE",
    "room_id": 123,
    "label": "Human-readable destination"
  }}
}}

RULES:
- type is always one of: "navigate", "show_timetable", "none".
- For "navigate": include building_code and label. Include room_id only for a specific room.
- For "show_timetable": omit building_code / room_id.
- For "none": omit building_code / room_id.
- Never output anything outside the JSON object.
"""


class ChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_message = request.data.get('message', '').strip()
        history = request.data.get('history', [])

        if not user_message:
            return Response({'error': 'No message provided'}, status=400)

        api_key = os.environ.get('GEMINI_API_KEY', '')
        if not api_key:
            return Response({
                'message': 'The chat assistant is not configured yet. Please add GEMINI_API_KEY to your environment.',
                'action': {'type': 'none'},
            })

        system_prompt = _build_system_prompt(request.user)

        # Build Gemini conversation history (role must be 'user' or 'model')
        gemini_history = []
        for turn in history[-10:]:
            role = turn.get('role', '')
            content = turn.get('content', '')
            if role == 'user' and content:
                gemini_history.append({'role': 'user', 'parts': [content]})
            elif role == 'assistant' and content:
                gemini_history.append({'role': 'model', 'parts': [content]})

        raw = ''
        try:
            client = genai.Client(api_key=api_key)

            # Build contents list from history + current message
            contents = []
            for turn in gemini_history:
                contents.append(
                    types.Content(role=turn['role'], parts=[types.Part(text=turn['parts'][0])])
                )
            contents.append(
                types.Content(role='user', parts=[types.Part(text=user_message)])
            )

            response = client.models.generate_content(
                model='gemini-2.5-flash',
                config=types.GenerateContentConfig(system_instruction=system_prompt),
                contents=contents,
            )
            raw = response.text.strip()

            # Strip markdown code fences if Gemini wraps the JSON
            if raw.startswith('```'):
                raw = raw.split('```')[1]
                if raw.startswith('json'):
                    raw = raw[4:]
                raw = raw.strip()

            parsed = json.loads(raw)
            return Response(parsed)

        except json.JSONDecodeError:
            return Response({
                'message': raw or 'Unexpected response from assistant.',
                'action': {'type': 'none'},
            })
        except Exception as e:
            import traceback
            traceback.print_exc()          # prints full trace to Django console
            return Response({
                'message': f'Assistant error: {type(e).__name__}: {e}',
                'action': {'type': 'none'},
            }, status=503)
