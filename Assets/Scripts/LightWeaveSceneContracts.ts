/** Stable authored paths and final asset mappings for inspection and future integration. No domain state. */
export const LIGHTWEAVE_CONTRACTS = {
  main: 'LightWeave',
  garden: 'LightWeave/LightWeaveGarden',
  mirror: 'LightWeave/LightWeaveGarden/LightWeaveMirrorPose',
  mirrorHit: 'LightWeave/LightWeaveMirrorHitTarget',
  beams: 'LightWeave/LightWeaveGarden/LightWeaveBeamPool',
  ui: 'LightWeave/LightWeaveControls',
  buttonRow: 'LightWeave/LightWeaveControls/BackPlate/Content/PanelLayout/Controls/ButtonRow',
  flowers: ['LightWeaveCoral', 'LightWeaveTeal', 'LightWeaveGold'],
  meshAssets: ['Flower_Coral_Closed.glb', 'Flower_Teal_Closed.glb', 'Flower_Gold_Closed.glb', 'Mirror_16x18cm.glb', 'PhotonSource.glb', 'Beam_1cm.glb'].map(name => 'GeneratedMeshes/' + name),
  audioAssets: ['mirror_adjust_click', 'bloom_01', 'bloom_02', 'bloom_03', 'garden_complete', 'garden_air_loop'].map(name => 'GeneratedSFX/' + name + '.wav'),
};
