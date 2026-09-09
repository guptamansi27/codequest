import { useParams } from "react-router-dom";
import GalaxyView from "../../components/user/galaxy/GalaxyView";

export default function Galaxy() {
  const { type = "html" } = useParams();
  
  return <GalaxyView type={type} />;
}
