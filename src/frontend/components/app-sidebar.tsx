"use client"
import Upload from "./upload";
import Pagination from "@/components/pagination"; 
import React, { useState, useEffect } from "react";
import { Map, Database, Music, Camera} from "lucide-react";
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
    { title: "Audio", url: "#", icon: Music },
    { title: "Picture", url: "#", icon: Camera },
    { title: "Mapper", url: "#", icon: Map },
    { title: "Dataset", url: "#", icon: Database },
];

const AppSidebar = () => {
  const [page, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1); 

  const fetchData = async (page: number) => {
    setTotalPages(totalPages);
  };

  useEffect(() => {
    fetchData(page);
  }, [page]);

  return (
    <Sidebar>
      <SidebarContent>
        <div className="absolute top-10 ml-10">
      <SidebarGroup>
          <SidebarGroupLabel></SidebarGroupLabel>
          <SidebarGroupContent>
            <Upload/>
          </SidebarGroupContent>
        </SidebarGroup>
        </div>
        <div className="absolute bottom-20 ml-20">
        <SidebarGroup>
          <SidebarGroupLabel></SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        </div>
      </SidebarContent>
      <SidebarFooter>
          <Pagination
          page={page}
          total={100}
          limit={5}
          onPageChange={setCurrentPage}></Pagination>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
