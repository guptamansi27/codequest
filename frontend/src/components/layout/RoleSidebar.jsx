import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import DockNavItem from "./DockNavItem";

const sidebarClasses = {
  admin: {
    root: "admin-sidebar-inner",
    header: "sidebar-header",
    logo: "sidebar-logo",
    logoMark: "sidebar-logo-mark",
    nav: "sidebar-nav",
    link: "nav-link",
    icon: "nav-icon",
    iconWrap: true,
    footer: "sidebar-footer",
    user: "user-info",
    avatar: "user-avatar",
    logout: "logout-btn",
  },
  user: {
    header: "cq-sidebar-logo",
    logo: "cq-brand",
    logoMark: "cq-brand-code",
    nav: "cq-sidebar-nav",
    list: "cq-menu",
    item: "",
    link: "cq-menu-link",
    icon: "cq-menu-icon",
    footer: "cq-sidebar-user",
    avatar: "cq-avatar",
    logout: "cq-logout-button",
    active: "is-active",
  },
};

function NavItems({ classes, isActiveRoute, navItems, useList }) {
  const items = navItems.map((item) => {
    const Icon = item.Icon;
    const activeClass = classes.active || "active";
    const link = (
      <DockNavItem key={item.label} label={item.label}>
        <Link
          to={item.path}
          aria-label={item.label}
          className={`${classes.link} ${isActiveRoute(item.path) ? activeClass : ""}`.trim()}
        >
          {classes.iconWrap ? (
            <span className={classes.icon}>
              <Icon />
            </span>
          ) : (
            <Icon className={classes.icon} />
          )}
        </Link>
      </DockNavItem>
    );

    return useList ? <li key={item.label}>{link}</li> : link;
  });

  return useList ? <ul className={classes.list}>{items}</ul> : items;
}

export default function RoleSidebar({
  avatarLetter,
  displayId,
  isActiveRoute,
  navItems,
  onLogout,
  variant = "admin",
}) {
  const classes = sidebarClasses[variant] || sidebarClasses.admin;
  const useList = Boolean(classes.list);

  const content = (
    <>
      <div className={classes.header}>
        <DockNavItem label="CodeQuest">
          <div className={classes.logo} role="img" aria-label="CodeQuest home">
            <span className={classes.logoMark}>&lt;/&gt;</span>
          </div>
        </DockNavItem>
      </div>

      <nav className={classes.nav}>
        <NavItems classes={classes} isActiveRoute={isActiveRoute} navItems={navItems} useList={useList} />
      </nav>

      <div className={classes.footer}>
        <DockNavItem label={displayId}>
          {classes.user ? (
            <div className={classes.user}>
              <div className={classes.avatar} aria-hidden>{avatarLetter}</div>
            </div>
          ) : (
            <div className={classes.avatar} aria-hidden>
              <span>{avatarLetter}</span>
            </div>
          )}
        </DockNavItem>
        <DockNavItem label="Logout">
          <button type="button" className={classes.logout} onClick={onLogout} aria-label="Logout">
            {classes.iconWrap ? (
              <span className={classes.icon}>
                <LogOut />
              </span>
            ) : (
              <LogOut className={classes.icon} />
            )}
          </button>
        </DockNavItem>
      </div>
    </>
  );

  return classes.root ? <div className={classes.root}>{content}</div> : content;
}
