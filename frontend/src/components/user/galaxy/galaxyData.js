import api from "../../../api/axiosInstance";

let galaxyDataPromise = null;
let galaxyDataCache = null;

export const loadGalaxyData = ({ force = false } = {}) => {
  if (!force && galaxyDataCache) {
    return Promise.resolve(galaxyDataCache);
  }

  if (!force && galaxyDataPromise) {
    return galaxyDataPromise;
  }

  galaxyDataPromise = Promise.all([api.get("/challenges/"), api.get("/submissions/")])
    .then(([challengeRes, submissionRes]) => {
      galaxyDataCache = {
        challenges: challengeRes.data,
        submissions: submissionRes.data,
      };
      return galaxyDataCache;
    })
    .finally(() => {
      galaxyDataPromise = null;
    });

  return galaxyDataPromise;
};

export const clearGalaxyDataCache = () => {
  galaxyDataCache = null;
  galaxyDataPromise = null;
};
