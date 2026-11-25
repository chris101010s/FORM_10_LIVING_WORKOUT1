import {Text,VStack} from '@expo/ui/swift-ui';
import {font,padding} from '@expo/ui/swift-ui/modifiers';
import {createLiveActivity} from 'expo-widgets';
import type {ActivityProps} from '../utils/widgetData';
export type {ActivityProps} from '../utils/widgetData';
const TrainingActivity=(props:ActivityProps)=>{'widget';return {
 banner:<VStack modifiers={[padding({all:12})]}><Text modifiers={[font({size:18,weight:'bold'})]}>FORM · {props.status}</Text><Text>{props.sets} Sätze · Aktive Dauer</Text>{props.elapsedPaused!==null?<Text>{props.elapsedPaused}</Text>:<Text date={new Date(props.elapsedStartMs)} dateStyle="timer"/>}{props.restEndMs!==null?<><Text>Pause</Text><Text timerInterval={{lower:new Date(props.restFromMs),upper:new Date(props.restEndMs)}} countsDown/></>:props.restPaused!==null?<Text>Pause angehalten · {props.restPaused}</Text>:null}</VStack>,
 compactLeading:<Text>FORM</Text>,compactTrailing:props.restEndMs!==null?<Text timerInterval={{lower:new Date(props.restFromMs),upper:new Date(props.restEndMs)}} countsDown/>:<Text>{props.sets}</Text>,minimal:<Text>F</Text>,expandedLeading:<Text>FORM</Text>,expandedTrailing:<Text>{props.sets} Sätze</Text>,
 expandedBottom:<VStack><Text>{props.status}</Text>{props.elapsedPaused!==null?<Text>{props.elapsedPaused}</Text>:<Text date={new Date(props.elapsedStartMs)} dateStyle="timer"/>}{props.restEndMs!==null&&<Text timerInterval={{lower:new Date(props.restFromMs),upper:new Date(props.restEndMs)}} countsDown/>}</VStack>
}};
export default createLiveActivity('FORMTrainingActivity',TrainingActivity);
