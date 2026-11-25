from pathlib import Path
import subprocess,json,hashlib

# The Ink SVG is the only app-icon source. Display themes remain independent.
root=Path(__file__).resolve().parents[1]
folder=root/'assets/icons'
source=folder/'ink.svg'
if not source.is_file():
 raise SystemExit('Missing primary Ink SVG source.')
manifest=[]
for size in (1024,120,180):
 dest=folder/('ink.png' if size==1024 else f'ink-{size}.png')
 subprocess.run(['inkscape',str(source),'--export-type=png',f'--export-filename={dest}',f'--export-width={size}',f'--export-height={size}','--export-background-opacity=255'],check=True,capture_output=True)
 manifest.append({'id':'ink','size':size,'file':str(dest.relative_to(root)),'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'source':str(source.relative_to(root)),'license':'Original FORM artwork; unrestricted use with the app'})
(folder/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Generated the primary Ink app icon in 3 sizes with SHA256 manifest.')
