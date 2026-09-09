import GalaxySelect from "../../components/user/galaxy/GalaxySelect";
import ContentWrapper from "../../components/layout/ContentWrapper";
import PageContainer from "../../components/layout/PageContainer";

export default function Challenges() {
  return (
    <PageContainer
      className="user-challenge-page"
      maxWidth="100%"
    >
      <ContentWrapper>
        <GalaxySelect />
      </ContentWrapper>
    </PageContainer>
  );
}
