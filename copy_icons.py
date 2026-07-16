import os
import shutil

src = r"C:\Users\hp\.gemini\antigravity-ide\brain\20d45149-29d7-4a3e-9a34-b4a3c8e32b47\grove_pwa_icon_1783527812235.png"
dest_dir = r"c:\Users\hp\.gemini\antigravity\scratch\public"

icon_192 = os.path.join(dest_dir, "icon-192.png")
icon_512 = os.path.join(dest_dir, "icon-512.png")

try:
    from PIL import Image
    im = Image.open(src)
    im.resize((192, 192), Image.Resampling.LANCZOS).save(icon_192)
    im.resize((512, 512), Image.Resampling.LANCZOS).save(icon_512)
    print("Resized and copied icons successfully using PIL.")
except ImportError:
    shutil.copy(src, icon_192)
    shutil.copy(src, icon_512)
    print("PIL not installed. Copied icons directly without resizing.")
except Exception as e:
    print(f"Error copying icons: {e}")
