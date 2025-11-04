import React, { useState, useEffect } from "react";
import {
  BriefcaseIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  EyeIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { jobService, Job } from "@/services/job";
import { getApplicationsByJob } from "@/services/application";
import { Skeleton } from "@/components/ui/skeleton";

interface JobWithStats extends Job {
  applicants: number;
  views: number;
}

export default function RecentJobs() {
  const [recentJobs, setRecentJobs] = useState<JobWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentJobs();
  }, []);

  const fetchRecentJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await jobService.getCompanyJobs();

      if (response) {
        // Fetch application counts for each job
        const jobsWithStats = await Promise.all(
          response.map(async (job) => {
            try {
              const applications = await getApplicationsByJob(job.id);
              return {
                ...job,
                applicants: applications.length,
                views: 0, // Views not implemented in backend yet
              };
            } catch (error) {
              console.error(
                `Error fetching applications for job ${job.id}:`,
                error
              );
              return {
                ...job,
                applicants: 0,
                views: 0,
              };
            }
          })
        );

        setRecentJobs(jobsWithStats);
      }
    } catch (error) {
      console.error("Error fetching recent jobs:", error);
      setError(error instanceof Error ? error.message : 'Failed to load recent jobs');
    } finally {
      setLoading(false);
    }
  };

  const formatPostedDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return "1 day ago";
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  const getTypeColor = (type: string | undefined) => {
    switch (type) {
      case "FULL_TIME":
        return "bg-green-100 text-green-800";
      case "PART_TIME":
        return "bg-blue-100 text-blue-800";
      case "CONTRACT":
        return "bg-purple-100 text-purple-800";
      case "REMOTE":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "PAUSED":
        return "bg-yellow-100 text-yellow-900";
      case "CLOSED":
        return "bg-red-100 text-red-800";
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "EXPIRED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeDisplayText = (type: string | undefined) => {
    switch (type) {
      case "FULL_TIME":
        return "Full-time";
      case "PART_TIME":
        return "Part-time";
      case "CONTRACT":
        return "Contract";
      case "REMOTE":
        return "Remote";
      default:
        return type || "Unknown";
    }
  };

  const getStatusDisplayText = (status: string | undefined) => {
    switch (status) {
      case "ACTIVE":
        return "Active";
      case "PAUSED":
        return "Paused";
      case "CLOSED":
        return "Closed";
      case "DRAFT":
        return "Draft";
      case "EXPIRED":
        return "Expired";
      default:
        return status || "Unknown";
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
            <BriefcaseIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
            Your Job Postings
          </h2>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-2.5 sm:p-3 bg-white rounded-lg shadow-none border border-gray-100">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div>
                    <Skeleton className="w-40 h-4 mb-1" />
                    <Skeleton className="w-24 h-3" />
                  </div>
                </div>
                <Skeleton className="w-16 h-5 rounded-full" />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <Skeleton className="w-24 h-3" />
                <Skeleton className="w-20 h-6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
            <BriefcaseIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
            Your Job Postings
          </h2>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-lg p-3">
          <div className="flex items-center gap-2 text-red-800">
            <span className="text-xs sm:text-sm font-medium">Error loading job postings:</span>
            <span className="text-xs sm:text-sm">{error}</span>
          </div>
          <button 
            onClick={fetchRecentJobs}
            className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
          <BriefcaseIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
          Your Job Postings
        </h2>
        <button className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium">
          View All
        </button>
      </div>

      <div className="space-y-2">
        {recentJobs.length === 0 ? (
          <div className="text-center py-5 text-gray-500">
            <BriefcaseIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No job postings yet</p>
            <p className="text-xs">
              Create your first job posting to get started
            </p>
          </div>
        ) : (
          recentJobs.map((job) => (
            <div
              key={job.id}
              className="p-2.5 sm:p-3 border border-gray-100 rounded-lg hover:border-primary-600/50 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 truncate">
                    {job.title}
                  </h3>
                  <p className="text-xs text-gray-600 truncate">
                    {job.department || "General"}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getTypeColor(
                      job.type
                    )}`}
                  >
                    {getTypeDisplayText(job.type)}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(
                      job.status
                    )}`}
                  >
                    {getStatusDisplayText(job.status)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col xs:flex-row xs:items-center xs:gap-3 text-xs text-gray-600 mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    <MapPinIcon className="w-3 h-3" />
                    <span className="truncate">{job.location}</span>
                  </div>
                  {job.salary && (
                    <div className="flex items-center gap-0.5">
                      <CurrencyDollarIcon className="w-3 h-3" />
                      <span className="truncate">{job.salary}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col xs:flex-row xs:items-center xs:gap-3 text-xs text-gray-600 mb-2">
                <div className="flex items-center gap-2">
                  {job.applicants && (
                    <div className="flex items-center gap-1">
                      <UsersIcon className="w-3 h-3" />
                      <span>{job.applicants} applicants</span>
                    </div>
                  )}
                  {job.views && (
                    <div className="flex items-center gap-1">
                      <EyeIcon className="w-3 h-3" />
                      <span>{job.views} views</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  {job.createdAt && formatPostedDate(job.createdAt)}
                </span>
                <button className="text-xs px-2.5 py-1.5 text-primary-600 hover:bg-primary-50 rounded-md font-medium transition-colors">
                  Edit
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

