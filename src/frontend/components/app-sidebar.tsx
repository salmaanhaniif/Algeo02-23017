"use client";
"use client";
import Upload from "./upload";
import Mapper from "./showmapper";
import React, { useState, useEffect } from "react";
import { Map, Database, Music, Camera } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  { title: "Audio", url: "/", icon: Music },
  { title: "Picture", url: "/images", icon: Camera },
];

const itemmapper = [{ title: "Mapper", url: "#", icon: Map }];

const AppSidebar = () => {
  const [isPopUpOpen, setIsPopUpOpen] = useState(false);

  return (
    <Sidebar>
      <SidebarContent>
        <div className="absolute top-10 ml-10">
          <SidebarGroup>
            <SidebarGroupLabel></SidebarGroupLabel>
            <SidebarGroupContent>
              <Upload />
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
        <div className="absolute bottom-20 ml-20">
          <SidebarGroup>
            <SidebarGroupLabel></SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* Regular Sidebar Items */}
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="justify-center mt-5">
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

                {/* Mapper Item */}
                {itemmapper.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => setIsPopUpOpen(true)}
                      asChild
                      className="justify-center mt-5"
                    >
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
      <SidebarFooter>{/* Empty Footer */}</SidebarFooter>
      <Mapper isOpen={isPopUpOpen} onClose={() => setIsPopUpOpen(false)} />
    </Sidebar>
  );
};

export default AppSidebar;