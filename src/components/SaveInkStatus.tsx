import React from 'react';
import {Text,View} from 'react-native';
import {useAthlete} from '../data/context';
import {usePalette} from './Design';
import {MotionCue} from './MotionCue';
import {Doodle} from './Sketchbook';
export function SaveInkStatus(){const {saving,fault,lastSaved}=useAthlete(),p=usePalette();return <View accessibilityLiveRegion="polite" style={{flexDirection:'row',alignItems:'center',gap:7}}>{!saving&&!fault&&lastSaved&&<MotionCue variant="savedDot" eventKey={lastSaved} confirmed><Doodle name="localSave" size={23}/></MotionCue>}<Text style={{color:fault?p.error:p.muted,fontSize:11}}>{fault?'Speicherung offen':saving?'Lokal speichern …':lastSaved?'Lokal gespeichert':''}</Text></View>}
