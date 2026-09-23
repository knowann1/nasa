import { MeshBuilder, Scene, TransformNode } from "@babylonjs/core";

export function createLunarRover(scene: Scene): TransformNode {
  const root = new TransformNode("lunar-rover", scene);
  const body = MeshBuilder.CreateBox("rover-body", { width: 1.4, height: 0.4, depth: 1.1 }, scene);
  body.parent = root;
  return root;
}

export function createMarsRover(scene: Scene): TransformNode {
  const root = new TransformNode("mars-rover", scene);
  const body = MeshBuilder.CreateBox("mars-rover-body", { width: 1.8, height: 0.5, depth: 1.2 }, scene);
  body.parent = root;
  return root;
}
