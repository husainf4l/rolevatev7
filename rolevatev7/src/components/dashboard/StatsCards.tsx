import React, { useState, useEffect } from "react";
import {
  BriefcaseIcon,
  DocumentTextIcon,
  UsersIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { jobsService, applicationService } from "@/services";

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  change?: {
    value: string;
    trend: "up" | "down";
  };
  loading?: boolean;
}

interface DashboardStats {
  activeJobs: number;
  totalApplications: number;
  candidatesHired: number;
  hireSuccessRate: number;
}

export default function StatsCards() {
  const [stats, setStats] = useState<DashboardStats>({
    activeJobs: 0,
    totalApplications: 0,
    candidatesHired: 0,
    hireSuccessRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch jobs and applications in parallel
      const [jobs, applications] = await Promise.all([
        jobsService.getCompanyJobs(),
        applicationService.getCompanyApplications(),
      ]);

      const activeJobs = jobs.filter((job) => job.status === "ACTIVE").length;
      const totalApplications = applications.length;
      const hiredApplications = applications.filter(
        (app) => app.status === "HIRED"
      ).length;
      const hireSuccessRate =
        totalApplications > 0
          ? Math.round((hiredApplications / totalApplications) * 100)
          : 0;

      setStats({
        activeJobs,
        totalApplications,
        candidatesHired: hiredApplications,
        hireSuccessRate,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load dashboard statistics"
      );
    } finally {
      setLoading(false);
    }
  };

  const statCards: StatCard[] = [
    {
      title: "Active Job Postings",
      value: loading ? "..." : stats.activeJobs,
      icon: BriefcaseIcon,
      loading,
    },
    {
      title: "Total Applications",
      value: loading ? "..." : stats.totalApplications,
      icon: DocumentTextIcon,
      loading,
    },
    {
      title: "Candidates Hired",
      value: loading ? "..." : stats.candidatesHired,
      icon: UsersIcon,
      loading,
    },
    {
      title: "Hire Success Rate",
      value: loading ? "..." : `${stats.hireSuccessRate}%`,
      icon: ChartBarIcon,
      loading,
    },
  ];

  if (error) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="col-span-full bg-red-50 border border-red-100 rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 text-red-800">
            <span className="text-xs sm:text-sm font-medium">
              Error loading dashboard statistics:
            </span>
            <span className="text-xs sm:text-sm">{error}</span>
          </div>
          <button
            onClick={fetchDashboardStats}
            className="mt-2 text-xs sm:text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
      {statCards.map((card) => (
        <div
          key={card.title}
          className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 sm:p-2 bg-primary-600/10 rounded-lg">
              <card.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
            </div>
            {card.change && (
              <div
                className={`flex items-center text-xs sm:text-sm font-medium ${
                  card.change.trend === "up" ? "text-green-600" : "text-red-600"
                }`}
              >
                {card.change.value}
              </div>
            )}
          </div>
          <div className="space-y-0.5">
            <p className="text-lg sm:text-xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs sm:text-sm text-gray-600 font-medium">{card.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

