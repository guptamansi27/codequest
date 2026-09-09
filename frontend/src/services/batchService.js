import api from "../api/axiosInstance";

export const fetchBatchHierarchy = async () => {
  const response = await api.get("/batches/hierarchy/");
  return response.data || [];
};

export const createSuperBatch = async (name) => {
  const response = await api.post("/batches/super/", { name });
  return response.data;
};

export const createBatch = async ({ name, superBatchId }) => {
  const response = await api.post("/batches/", { names: name, super_batch: superBatchId });
  return response.data;
};

export const createSubBatch = async ({ name, batchId }) => {
  const response = await api.post("/batches/sub/", { names: name, batch: batchId });
  return response.data;
};

export const updateBatch = async ({ id, name }) => {
  const response = await api.patch(`/batches/${id}/`, { name });
  return response.data;
};

export const deleteBatch = async (id) => {
  const response = await api.delete(`/batches/${id}/`);
  return response.data;
};

export const updateSubBatch = async ({ id, name }) => {
  const response = await api.patch(`/batches/sub/${id}/`, { name });
  return response.data;
};

export const deleteSubBatch = async (id) => {
  const response = await api.delete(`/batches/sub/${id}/`);
  return response.data;
};

const splitValues = (value) => String(value || "").split(",").map((item) => item.trim().toUpperCase()).filter(Boolean);

export const validateBatchInput = (value) => {
  const names = splitValues(value);
  if (!names.length) return { names, error: "Enter at least one batch." };
  const seen = new Set();
  for (const name of names) {
    if (!/^[A-Z]$/.test(name)) {
      return { names, error: `Batch '${name}' is invalid. Only single alphabetical characters are allowed.` };
    }
    if (seen.has(name)) return { names, error: `Duplicate batch '${name}' detected.` };
    seen.add(name);
  }
  return { names, error: "" };
};

export const validateSubBatchInput = (value, batchName = "") => {
  const names = splitValues(value);
  if (!names.length) return { names, error: "Enter at least one sub-batch." };
  const expectedPrefix = String(batchName || "").trim().toUpperCase();
  const seen = new Set();
  for (const name of names) {
    if (!/^[A-Z][0-9]+$/.test(name)) {
      return { names, error: `Sub-batch '${name}' is invalid. Use letter followed by number, for example A1.` };
    }
    if (expectedPrefix && !name.startsWith(expectedPrefix)) {
      return { names, error: `Sub-batch '${name}' must start with Batch ${expectedPrefix}.` };
    }
    if (seen.has(name)) return { names, error: `Duplicate sub-batch '${name}' detected.` };
    seen.add(name);
  }
  return { names, error: "" };
};

export const flattenBatchHierarchy = (hierarchy = [], selectedSuperBatchNames = [], selectedBatchNames = []) => {
  const safeHierarchy = Array.isArray(hierarchy) ? hierarchy : [];
  const selectedSuperNames = new Set(selectedSuperBatchNames);
  const scopedSuperBatches = selectedSuperNames.size
    ? safeHierarchy.filter((superBatch) => selectedSuperNames.has(superBatch.name))
    : safeHierarchy;
  const batches = scopedSuperBatches.flatMap((superBatch) => superBatch.batches || []);
  const selectedBatchSet = new Set(selectedBatchNames);
  const scopedBatches = selectedBatchSet.size
    ? batches.filter((batch) => selectedBatchSet.has(batch.name))
    : batches;

  return {
    superBatches: safeHierarchy.map((superBatch) => superBatch.name),
    batches: Array.from(new Set(batches.map((batch) => batch.name))),
    subBatches: Array.from(new Set(scopedBatches.flatMap((batch) => (batch.sub_batches || []).map((subBatch) => subBatch.name)))),
  };
};
