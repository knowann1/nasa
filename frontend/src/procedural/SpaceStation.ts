import { MeshBuilder, Scene, TransformNode } from "@babylonjs/core";

export function createSpaceStation(scene: Scene): TransformNode {
  const root = new TransformNode("space-station", scene);
  MeshBuilder.CreateCylinder("station-core", { diameter: 2, height: 5 }, scene).parent = root;
  return root;
}
