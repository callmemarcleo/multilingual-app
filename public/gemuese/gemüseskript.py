import time
import pathlib
import requests

# Unsplash Access Key
UNSPLASH_KEY = "hrNuVGMFpeeppWyT1mXgSftdkY4tpguQoxH7RxKyWM4"

# Zielordner
OUT_DIR = pathlib.Path(r"C:\Users\marcb\BFH\DIFA\multilingual-app\public\gemuese")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Liste von Gemüsesorten
GEMUESE = [
    "Spinat", "Kopfsalat", "Rucola", "Feldsalat", "Mangold", "Grünkohl",
    "Chinakohl", "Eisbergsalat", "Wirsing",
    "Brokkoli", "Blumenkohl", "Artischocke", "Romanesco",
    "Tomate", "Paprika", "Gurke", "Zucchini", "Kürbis", "Aubergine",
    "Karotte", "Rote Bete", "Pastinake", "Sellerie", "Rettich",
    "Radieschen", "Petersilienwurzel",
    "Zwiebel", "Knoblauch", "Lauch", "Schalotte", "Schnittlauch",
    "Spargel", "Rhabarber", "Kohlrabi",
    "Erbsen", "Bohnen", "Zuckerschoten", "Edamame",
    "Mais", "Okra", "Süßkartoffel", "Topinambur"
]

def download_image(term: str, suffix: str = ""):
    query = f"{term} vegetable"

    headers = {
        "Authorization": f"Client-ID {UNSPLASH_KEY}",
        "Accept-Version": "v1"
    }

    url = f"https://api.unsplash.com/photos/random?query={query}&orientation=landscape&count=1"

    resp = requests.get(url, headers=headers, timeout=15)
    if resp.status_code == 403:
        print("403 Forbidden – möglicherweise Rate Limit oder Key falsch.")
        time.sleep(10)
        return download_image(term, suffix)
    resp.raise_for_status()

    data = resp.json()[0]
    img_url = data["urls"]["regular"]

    # Dateiendung ermitteln
    ext = pathlib.Path(img_url.split("?")[0]).suffix.lstrip(".") or "jpg"

    # Bild herunterladen
    img_bytes = requests.get(img_url, timeout=15).content

    safe_name = term.lower().replace(" ", "_")
    filename = OUT_DIR / f"{safe_name}{suffix}.{ext}"
    filename.write_bytes(img_bytes)

    print(f"Gespeichert: {filename}")
    return filename

def download_images_for_term(term: str):
    print(f"\n Lade Bilder für: {term}")
    try:
        # Erstes Bild
        download_image(term)
        time.sleep(2)
        # Zweites Bild
        download_image(term, "_2")
        time.sleep(2)
    except Exception as e:
        print(f"Fehler bei {term}: {e}")

def main():
    print(f"Bilder werden gespeichert in: {OUT_DIR}")
    for veg in GEMUESE:
        download_images_for_term(veg)

if __name__ == "__main__":
    main()