export function disposeObject(object) {
  const arrGeometries = new Set();
  const arrMaterials = new Set();
  const arrTextures = new Set();
  const arrSkeletons = new Set();
  object.traverse((child) => {
    if (!child.isMesh) return;
    arrGeometries.add(child.geometry);
    for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
      arrMaterials.add(material);
      for (const value of Object.values(material)) {
        if (value?.isTexture && !value.isRenderTargetTexture) arrTextures.add(value);
      }
    }
    if (child.skeleton) arrSkeletons.add(child.skeleton);
    child.userData.block = null;
  });
  for (const geometry of arrGeometries) geometry.dispose();
  for (const material of arrMaterials) material.dispose();
  const arrImages = new Set();
  for (const texture of arrTextures) {
    if (texture.image) arrImages.add(texture.image);
    texture.dispose();
  }
  for (const image of arrImages) image.close?.();
  for (const skeleton of arrSkeletons) skeleton.dispose();
}

