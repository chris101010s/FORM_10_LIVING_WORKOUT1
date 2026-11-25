from pathlib import Path
import subprocess,json,hashlib
root=Path(__file__).resolve().parents[1]
folder=root/'assets/icons';folder.mkdir(parents=True,exist_ok=True)
line='<path d="M350 360L350 665M350 360L560 360M350 490L515 490M595 658L596 580" fill="none" stroke="{ink}" stroke-width="45" stroke-linecap="round" stroke-linejoin="round"/>'
variants={
 'ink':('<rect width="1024" height="1024" fill="#1D2025"/><path d="M226 202L679 183L804 312L772 811L237 829L202 425Z" fill="#FAF9F3"/><path d="M679 184L665 334L804 312" fill="#FFE48A" stroke="#1D2025" stroke-width="17" stroke-linejoin="round"/><path d="M276 277L485 251" stroke="#2655D9" stroke-width="27" stroke-linecap="round"/>','#1D2025'),
 'paper':('<rect width="1024" height="1024" fill="#FAF9F3"/><path d="M0 210H1024M0 340H1024M0 470H1024M0 600H1024M0 730H1024M0 860H1024" stroke="#D9D8D0" stroke-width="4"/><path d="M172 0V1024" stroke="#F4D0C8" stroke-width="8"/><path d="M244 250L701 229L789 315L762 796L239 813Z" fill="#FFFEFB" stroke="#1D2025" stroke-width="18"/><path d="M701 230L688 329L789 315" fill="#FFE48A" stroke="#1D2025" stroke-width="14"/><path d="M349 198L381 180L423 193L464 181L512 198L551 183L586 202L572 257L526 249L490 265L446 251L403 267L361 249Z" fill="#FFE48A"/>','#2655D9'),
 'blueprint':('<rect width="1024" height="1024" fill="#17365C"/><path d="M0 128H1024M0 256H1024M0 384H1024M0 512H1024M0 640H1024M0 768H1024M0 896H1024M128 0V1024M256 0V1024M384 0V1024M512 0V1024M640 0V1024M768 0V1024M896 0V1024" stroke="#38608A" stroke-width="3"/><path d="M231 209L684 189L800 309L773 814L236 831Z" fill="#2655D9" stroke="#E2EAF9" stroke-width="15"/><path d="M684 190L670 329L799 309" fill="none" stroke="#E2EAF9" stroke-width="15"/><path d="M170 205V834M151 205H190M151 834H190M236 888H773M236 869V907M773 869V907" stroke="#9BCCFF" stroke-width="9"/>','#FAF9F3'),
 'retro':('<rect width="1024" height="1024" fill="#CFE8D5"/><path d="M188 221H836V839H188Z" fill="#1D2025"/><path d="M163 189H811V807H163Z" fill="#FAF9F3" stroke="#1D2025" stroke-width="17"/><path d="M173 199H801V291H173Z" fill="#2655D9"/><path d="M195 218H244V267H195ZM260 218H309V267H260Z" fill="#FFE48A" stroke="#1D2025" stroke-width="8"/><path d="M702 218H767V267H702Z" fill="#F4D0C8" stroke="#1D2025" stroke-width="8"/><path d="M716 231L753 254M753 231L716 254" stroke="#1D2025" stroke-width="9"/><path d="M202 745H772" stroke="#D9D8D0" stroke-width="12"/>','#1D2025')}
manifest=[]
for name,(body,ink) in variants.items():
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">{body}{line.format(ink=ink)}</svg>'
 src=folder/f'{name}.svg';src.write_text(svg)
 for size in (1024,120,180):
  dest=folder/(f'{name}.png' if size==1024 else f'{name}-{size}.png')
  subprocess.run(['inkscape',str(src),'--export-type=png',f'--export-filename={dest}',f'--export-width={size}',f'--export-height={size}','--export-background-opacity=255'],check=True,capture_output=True)
  manifest.append({'id':name,'size':size,'file':str(dest.relative_to(root)),'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'source':str(src.relative_to(root)),'license':'Original FORM artwork; unrestricted use with the app'})
(folder/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Generated 4 original app icons × 3 sizes, SVG sources and SHA256 manifest.')
