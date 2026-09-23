import { Color3, MeshBuilder, StandardMaterial, TransformNode, Vector3 } from "@babylonjs/core";
export function createAstronaut(scene, era = "early") {
    const root = new TransformNode(`astronaut-${era}`, scene);
    const bodyMaterial = new StandardMaterial("astronaut-body", scene);
    bodyMaterial.diffuseColor = new Color3(0.88, 0.88, 0.92);
    const visorMaterial = new StandardMaterial("astronaut-visor", scene);
    visorMaterial.diffuseColor = new Color3(0.15, 0.25, 0.35);
    visorMaterial.alpha = 0.85;
    const torso = MeshBuilder.CreateCapsule("torso", { height: 2.2, radius: 0.35 }, scene);
    torso.material = bodyMaterial;
    torso.parent = root;
    const helmet = MeshBuilder.CreateSphere("helmet", { diameter: 0.85 }, scene);
    helmet.position.y = 1.55;
    helmet.material = bodyMaterial;
    helmet.parent = root;
    const visor = MeshBuilder.CreateSphere("visor", { diameterX: 0.45, diameterY: 0.3, diameterZ: 0.2 }, scene);
    visor.position = new Vector3(0, 1.55, 0.38);
    visor.material = visorMaterial;
    visor.parent = root;
    const backpack = MeshBuilder.CreateBox("backpack", { width: 0.5, height: 0.7, depth: 0.28 }, scene);
    backpack.position = new Vector3(0, 0.8, -0.38);
    backpack.material = bodyMaterial;
    backpack.parent = root;
    const limbs = [];
    const limbPairs = [
        ["armL", -0.5, 0.7, 0],
        ["armR", 0.5, 0.7, 0],
        ["legL", -0.18, -1.05, 0],
        ["legR", 0.18, -1.05, 0]
    ];
    for (const [name, x, y, z] of limbPairs) {
        const limb = MeshBuilder.CreateCapsule(name, { height: 1.0, radius: 0.12 }, scene);
        limb.position = new Vector3(x, y, z);
        limb.material = bodyMaterial;
        limb.parent = root;
        limbs.push(limb);
    }
    const bootL = MeshBuilder.CreateBox("bootL", { width: 0.22, height: 0.12, depth: 0.34 }, scene);
    bootL.position = new Vector3(-0.18, -1.62, 0.09);
    bootL.material = bodyMaterial;
    bootL.parent = root;
    const bootR = bootL.clone("bootR");
    if (bootR) {
        bootR.position.x = 0.18;
        bootR.parent = root;
    }
    return root;
}
