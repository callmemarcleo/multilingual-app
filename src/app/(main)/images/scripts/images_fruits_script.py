import time
import pathlib
import requests
import unicodedata
from urllib.parse import urlencode

# 🔑 Dein Unsplash Access Key
UNSPLASH_KEY = ""

# 📁 Zielordner – hier kannst du einfach den absoluten Pfad aus dem Explorer einfügen
OUT_DIR = pathlib.Path(r"C:\Users\hosli\BFH\DIFA\multilingual-app\public\fruits")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# 🥬 Liste von Gemüsesorten
FRUITS = [
     "Walnut", "Hazelnut", "Almond", "Pistachio", "Cashew", "Peanut"

]


def slugify_german(term: str) -> str:

    t = term.strip().lower()

    # Deutsche Umlaute/ß sauber ersetzen
    t = (t.replace("ä", "ae")
           .replace("ö", "oe")
           .replace("ü", "ue")
           .replace("ß", "ss"))

    # Sonderzeichen normalisieren, nur a-z, 0-9, - und _
    t = unicodedata.normalize("NFKD", t)
    out = []
    for ch in t:
        if ch.isalnum():
            out.append(ch)
        elif ch in [" ", "-", "_"]:
            out.append("-")
        # alles andere raus
    slug = "".join(out)
    # Mehrfach-Delimiters reduzieren
    while "--" in slug:
        slug = slug.replace("--", "-")
    slug = slug.strip("-")
    return slug

def download_one_image(term: str) -> None:
    """
    Lädt genau 1 Bild für den Begriff herunter und speichert es als <slug>.jpg
    """
    headers = {
        "Authorization": f"Client-ID {UNSPLASH_KEY}",
        "Accept-Version": "v1",
    }

    # Query leicht präzisieren, damit eher "Food"-Bilder kommen
    query = f"{term} fruit"

    params = {
        "query": query,
        "orientation": "portrait",
        "count": 1,
        "content_filter": "high",
    }
    url = "https://api.unsplash.com/photos/random?" + urlencode(params)

    resp = requests.get(url, headers=headers, timeout=20)
    if resp.status_code == 403:
        # Rate limit / forbidden → warten und einmal erneut versuchen
        print(f"🚫 403 bei '{term}' – warte 10s und versuche erneut...")
        time.sleep(10)
        resp = requests.get(url, headers=headers, timeout=20)

    resp.raise_for_status()
    data = resp.json()

    # Unsplash liefert bei count=1 meist eine Liste mit 1 Element
    item = data[0] if isinstance(data, list) else data
    img_url = item["urls"]["regular"]

    # Dateiname wie gewünscht: /fruits/apfel.jpg (also apfel.jpg im fruits-Ordner)
    filename = OUT_DIR / f"{slugify_german(term)}.jpg"

    # Wenn Datei schon existiert, überspringen (optional, aber praktisch)
    if filename.exists():
        print(f"⏭️  Überspringe (existiert schon): {filename.name}")
        return

    # Bild herunterladen (streaming)
    with requests.get(img_url, stream=True, timeout=30) as r:
        r.raise_for_status()
        with open(filename, "wb") as f:
            for chunk in r.iter_content(chunk_size=1024 * 128):
                if chunk:
                    f.write(chunk)

    print(f"✔️  Gespeichert: {filename}")

def main():
    print(f"📁 Bilder werden gespeichert in: {OUT_DIR}")
    for term in FRUITS:
        try:
            download_one_image(term)
            time.sleep(1.5)  # kleine Pause wegen API-Limits
        except Exception as e:
            print(f"⚠️  Fehler bei {term}: {e}")

if __name__ == "__main__":
    main()