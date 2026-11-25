import {Text,VStack} from '@expo/ui/swift-ui';
import {containerBackground,font,widgetURL} from '@expo/ui/swift-ui/modifiers';
import {createWidget} from 'expo-widgets';
import {PlatformColor} from 'react-native';
import {hiddenWidget,type WidgetProps} from '../utils/widgetData';
const TrainingWidget=(props:WidgetProps)=>{'widget';return <VStack modifiers={[containerBackground(PlatformColor('systemBackground'),'widget'),widgetURL('athleteos://training')]}><Text modifiers={[font({size:13,weight:'bold'})]}>FORM.</Text><Text modifiers={[font({size:20,weight:'bold'})]}>{props.headline}</Text><Text modifiers={[font({size:12})]}>{props.detail}</Text>{props.enabled&&<Text modifiers={[font({size:14,weight:'semibold'})]}>{props.weekPlanned?`${props.weekCompleted}/${props.weekPlanned} Pflichttermine erledigt`:`${props.weekCount} Trainingstage diese Woche`}</Text>}</VStack>};
export default createWidget('FORMTraining',TrainingWidget,hiddenWidget);
