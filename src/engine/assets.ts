import { worldAssets } from '../data/worlds';
import type { AssetDef, Scenario } from './types';

/** Resolve the asset list of a scenario from the built-in world assets plus custom assets. */
export function resolveAssets(scenario: Scenario, custom: AssetDef[]): AssetDef[] {
  const pool = [...worldAssets('farm'), ...worldAssets('space'), ...worldAssets('city'), ...custom];
  return scenario.assets.map((id) => pool.find((a) => a.id === id)).filter((a): a is AssetDef => !!a);
}
