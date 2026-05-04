"""
Translation service for automatic listing translation.
Uses LibreTranslate API (self-hosted or public instance).
"""
import os
import httpx
from typing import Optional, Dict
from datetime import datetime

# LibreTranslate API endpoint (can be self-hosted for production)
# Public instances: https://github.com/LibreTranslate/LibreTranslate#mirrors
LIBRETRANSLATE_URL = os.getenv("LIBRETRANSLATE_URL", "https://libretranslate.de")

# Supported languages mapping (our codes -> LibreTranslate codes)
LANGUAGE_MAP = {
    'en': 'en',
    'es': 'es',
    'zh': 'zh',
    'ar': 'ar',
    'ja': 'ja',
    'de': 'de',
    'ko': 'ko',
    'tr': 'tr',
}

# Languages we support for translation
SUPPORTED_LANGUAGES = ['en', 'es', 'zh', 'ar', 'ja', 'de', 'ko', 'tr']


def detect_language(text: str) -> str:
    """Detect the language of the given text"""
    try:
        with httpx.Client(timeout=10) as client:
            response = client.post(
                f"{LIBRETRANSLATE_URL}/detect",
                data={"q": text[:200]},  # Limit text length for detection
            )
        if response.status_code == 200:
            result = response.json()
            if result and len(result) > 0:
                detected = result[0]['language']
                # Map back to our language codes
                for our_code, libre_code in LANGUAGE_MAP.items():
                    if libre_code == detected:
                        return our_code
        return 'en'  # Default to English
    except Exception as e:
        print(f"[TRANSLATION] Language detection error: {e}")
        return 'en'


def translate_text(text: str, source_lang: str, target_lang: str) -> Optional[str]:
    """Translate text from source language to target language"""
    if source_lang == target_lang:
        return text

    # Skip if languages not in our supported list
    if target_lang not in LANGUAGE_MAP:
        return None

    try:
        with httpx.Client(timeout=30) as client:
            response = client.post(
                f"{LIBRETRANSLATE_URL}/translate",
                data={
                    "q": text,
                    "source": LANGUAGE_MAP.get(source_lang, 'auto'),
                    "target": LANGUAGE_MAP[target_lang],
                    "format": "text"
                },
            )

        if response.status_code == 200:
            result = response.json()
            return result.get("translatedText")
        else:
            print(f"[TRANSLATION] Error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"[TRANSLATION] Translation error: {e}")
        return None


def translate_listing(name: str, description: str, source_lang: str) -> Dict[str, Dict[str, str]]:
    """
    Translate a listing to all supported languages.
    Returns a dictionary of translations.
    """
    translations = {}

    for target_lang in SUPPORTED_LANGUAGES:
        if target_lang == source_lang:
            continue

        translated_name = translate_text(name, source_lang, target_lang)
        translated_desc = translate_text(description, source_lang, target_lang)

        if translated_name and translated_desc:
            translations[target_lang] = {
                'name': translated_name,
                'description': translated_desc,
            }

    return translations
