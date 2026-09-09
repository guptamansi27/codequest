import CosmicLoader from "../../ui/CosmicLoader";

export default function GalaxyLoadingOverlay({ label = "Loading galaxy data..." }) {
  return (
    <CosmicLoader
      variant="embed"
      label={label}
      subtitle="Syncing your universe from the database"
    />
  );
}
