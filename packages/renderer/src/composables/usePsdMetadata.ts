import { reactive, readonly } from "vue";

const editedMap = reactive(new Map<string, boolean>());

export function usePsdMetadata() {
  const psdApi = window.electron?.psd;

  const isEdited = (path: string) => {
    return editedMap.get(path) ?? false;
  };

  const loadFromGroups = async (groups: PsdGroup[]) => {
    editedMap.clear();
    for (const group of groups) {
      editedMap.set(group.psd.path, !!group.metadata.edited);
    }
  };

  const toggleEdited = async (psdPath: string) => {
    if (!psdApi) return;
    const next = !isEdited(psdPath);
    const meta = await psdApi.setEdited(psdPath, next);
    editedMap.set(psdPath, !!meta.edited);
  };

  return {
    editedMap: readonly(editedMap),
    isEdited,
    loadFromGroups,
    toggleEdited,
  };
}

