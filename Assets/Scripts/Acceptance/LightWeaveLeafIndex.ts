import {scenariosIndex} from 'Leaf.lspkg/Scenarios/decorator/ScenarioIndexDecorator';
import {ScenarioMetadata} from 'Leaf.lspkg/Scenarios/scenario/ScenarioMetadata';
import {LightWeaveStartControlsScenario} from './LightWeaveStartControlsScenario';
import {LightWeaveDragScenario} from './LightWeaveDragScenario';
import {LightWeaveConnectionsScenario} from './LightWeaveConnectionsScenario';
import {LightWeaveReplayScenario} from './LightWeaveReplayScenario';
import {LightWeaveCancelScenario} from './LightWeaveCancelScenario';
@component
export class LightWeaveLeafIndex extends BaseScriptComponent {
  @scenariosIndex static scenariosIndex:ScenarioMetadata[]=[
    {id:'lightweave-start-controls',typename:LightWeaveStartControlsScenario.getTypeName()},
    {id:'lightweave-drag-retention',typename:LightWeaveDragScenario.getTypeName()},
    {id:'lightweave-connections-audio',typename:LightWeaveConnectionsScenario.getTypeName()},
    {id:'lightweave-replay-repeat',typename:LightWeaveReplayScenario.getTypeName()},
    {id:'lightweave-pending-cue-cancel',typename:LightWeaveCancelScenario.getTypeName()},
  ];
}
