import httpx
from datetime import datetime, timezone
from fastapi import APIRouter, Request
from fastapi.responses import PlainTextResponse

from app.core.config import settings
from app.core.supabase_client import supabase

router = APIRouter(tags=["WhatsApp"])


@router.post("/webhook")
async def twilio_webhook(request: Request):
    print("=== TWILIO WEBHOOK HIT ===")
    form = await request.form()
    print(dict(form))

    num_media_raw = form.get("NumMedia", "0") or "0"
    try:
        num_media = int(num_media_raw)
    except ValueError:
        num_media = 0

    if num_media == 0:
        print("Text message received")
        print(form.get("Body", ""))
    else:
        print("Media message received")
        print(form.get("MediaUrl0", ""))
        print(form.get("MediaContentType0", ""))

        media_url = (form.get("MediaUrl0") or "").strip()
        try:
            if not media_url:
                raise ValueError("Missing MediaUrl0")
            if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
                raise RuntimeError("TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not configured")

            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.get(
                    media_url,
                    auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
                    follow_redirects=True,
                )
                resp.raise_for_status()
                media_bytes = resp.content

            print("Media downloaded successfully")
            print(len(media_bytes))

            raw_from = form.get("From") or ""
            phone_number = (
                raw_from.replace("whatsapp:", "").replace("+", "").strip() or "unknown"
            )
            ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
            storage_path = f"whatsapp/{phone_number}/{ts}.ogg"

            supabase.storage.from_("voice-notes").upload(
                storage_path,
                media_bytes,
                file_options={"content-type": "audio/ogg"},
            )
            print("Uploaded to Supabase")
            print(storage_path)
        except Exception as e:
            print("Media download failed")
            print(e)
        else:
            try:
                async with httpx.AsyncClient(timeout=120.0) as client:
                    response = await client.post(
                        "https://api.sarvam.ai/speech-to-text",
                        headers={
                            "api-subscription-key": settings.SARVAM_API_KEY,
                        },
                        files={
                            "file": ("audio.ogg", media_bytes, "audio/ogg"),
                        },
                        data={
                            "model": "saaras:v3",
                            "mode": "transcribe",
                            "language_code": "hi-IN",
                        },
                    )

                response.raise_for_status()
                result = response.json()

                transcript = result.get("transcript") or result.get("text") or ""

                print("Transcription:")
                print(transcript)

            except Exception as e:
                print("STT failed")
                print(e)

                if "response" in locals():
                    print("Response body:")
                    print(response.text)

    return PlainTextResponse("OK")
