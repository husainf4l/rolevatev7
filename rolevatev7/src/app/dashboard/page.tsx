"use client";

import StatsCards from "@/components/dashboard/StatsCards";
import Calendar from "@/components/dashboard/Calendar";
import RecentJobs from "@/components/dashboard/RecentJobs";
import RecentApplications from "@/components/dashboard/RecentCVs";
import Header from "@/components/dashboard/Header";
import React, { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  console.log('[Dashboard] Current state:', {
    isLoading,
    hasUser: !!user,
    userEmail: user?.email,
    hasCompany: !!user?.company,
    companyName: user?.company?.name,
  });

  useEffect(() => {
    console.log('[Dashboard] useEffect - Auth state:', {
      isLoading,
      hasUser: !!user,
      userEmail: user?.email,
      hasCompany: !!user?.company,
      companyName: user?.company?.name,
    });
    
    if (!isLoading) {
      if (!user) {
        console.log('[Dashboard] No user found, redirecting to home');
        router.push("/");
      } else if (!user.company) {
        console.log('[Dashboard] User exists but no company, redirecting to setup');
        router.push("/dashboard/setup-company");
      } else {
        console.log('[Dashboard] User and company present, rendering dashboard');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user || !user.company) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="w-full pt-16 lg:pt-16">
        <div className="px-2 sm:px-3">
          <StatsCards />
        </div>

        <div className="px-2 sm:px-3 mt-4 sm:mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Calendar />
            <RecentApplications />
          </div>
        </div>

        <div className="px-2 sm:px-3">
          <RecentJobs />
        </div>
      </div>
    </div>
  );
}

