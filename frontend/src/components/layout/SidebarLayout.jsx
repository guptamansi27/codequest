import AppShell from "./AppShell";
import MainContent from "./MainContent";
import Sidebar from "./Sidebar";

export default function SidebarLayout({
  children,
  sidebar,
  className = "",
  sidebarClassName = "",
  mainClassName = "",
  scrollClassName = "",
  ...shellProps
}) {
  return (
    <AppShell className={className} {...shellProps}>
      <Sidebar className={sidebarClassName}>{sidebar}</Sidebar>
      <MainContent className={mainClassName} scrollClassName={scrollClassName}>
        {children}
      </MainContent>
    </AppShell>
  );
}
