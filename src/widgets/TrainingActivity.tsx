import {Text,VStack} from '@expo/ui/swift-ui';
import {font,padding} from '@expo/ui/swift-ui/modifiers';
import {createLiveActivity} from 'expo-widgets';
export type ActivityProps={sets:number;status:string;restEnd:string};
const TrainingActivity=(props:ActivityProps)=>{'widget';return {banner:<VStack modifiers={[padding({all:12})]}><Text modifiers={[font({size:18,weight:'bold'})]}>FORM · {props.status}</Text><Text>{props.sets} Sätze</Text>{props.restEnd!==''&&<Text>Pause bis {props.restEnd}</Text>}</VStack>,compactLeading:<Text>FORM</Text>,compactTrailing:<Text>{props.sets}</Text>,minimal:<Text>F</Text>,expandedLeading:<Text>FORM</Text>,expandedTrailing:<Text>{props.sets} Sätze</Text>,expandedBottom:<Text>{props.restEnd?`Pause bis ${props.restEnd}`:props.status}</Text>}};
export default createLiveActivity('FORMTrainingActivity',TrainingActivity);
