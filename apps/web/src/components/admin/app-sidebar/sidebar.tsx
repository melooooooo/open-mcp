"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@repo/ui/components/ui/sidebar";

import { SidebarNav } from "./sidebar-nav";
import type { IAppSidebarNavItem } from "./type";

export type IAppSidebarProps = {
  title?: string;
  logo?: React.ReactNode;
  description?: string;
  navItemList?: IAppSidebarNavItem[];
  itemList?: IAppSidebarNavItem[];
  sidebarUI?: typeof Sidebar;
};

export function AppSidebar(props: IAppSidebarProps) {
  const {
    title,
    logo,
    description,
    navItemList = [],
    itemList = [],
    sidebarUI,
  } = props;

  return (
    <Sidebar className="border-r-0" {...sidebarUI}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="flex items-center justify-center rounded-lg text-sidebar-primary-foreground">
                  {logo}
                </div>
                <div className="flex flex-col gap-2 leading-none">
                  <span className="font-semibold">{title}</span>
                  <span>{description}</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel>应用管理</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarNav items={navItemList} />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>业务管理</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarNav items={itemList} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
