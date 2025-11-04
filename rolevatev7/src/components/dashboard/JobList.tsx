"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { JobPost } from "@/services/job";
import {
  PlusIcon,
  BriefcaseIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  EyeIcon,
  UsersIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Skeleton } from "@/components/ui/skeleton";

interface JobListProps {
  jobs: JobPost[];
  filteredJobs: JobPost[];
  onJobAction: (job: JobPost, action: string) => void;
  onDeleteJob: (jobId: string, jobTitle: string) => void;
  loading?: boolean;
}

// Utility functions for styling and display
const getTypeColor = (type: JobPost["type"]) => {
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

const getStatusColor = (status: JobPost["status"]) => {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800";
    case "PAUSED":
      return "bg-yellow-100 text-yellow-800";
    case "CLOSED":
      return "bg-red-100 text-red-800";
    case "DRAFT":
      return "bg-gray-100 text-gray-800";
    case "EXPIRED":
      return "bg-red-100 text-red-800";
    case "DELETED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getTypeDisplayText = (type: JobPost["type"]) => {
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
      return type;
  }
};

const getStatusDisplayText = (status: JobPost["status"]) => {
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
    case "DELETED":
      return "Deleted";
    default:
      return status;
  }
};

// Format date for display
const formatPostedDate = (dateString: string) => {
  if (!dateString) return 'Recently';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  } catch (error) {
    return dateString; // Return original if parsing fails
  }
};

// Format deadline for display
const formatDeadline = (dateString: string) => {
  if (!dateString) return 'No deadline';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return dateString; // Return original if parsing fails
  }
};

const JobList: React.FC<JobListProps> = ({
  jobs,
  filteredJobs,
  onJobAction,
  onDeleteJob,
  loading = false,
}) => {
  const router = useRouter();

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="px-2 sm:px-3 pt-3 sm:pt-4 pb-2 sm:pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Job Postings
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {filteredJobs.length} of {jobs.length} jobs
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-sm"></div>
              <span className="text-xs font-medium text-gray-700">Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-gray-400 rounded-full shadow-sm"></div>
              <span className="text-xs font-medium text-gray-700">Draft</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full shadow-sm"></div>
              <span className="text-xs font-medium text-gray-700">Paused</span>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="px-2 sm:px-3 pb-4 sm:pb-6 space-y-2">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-4 sm:p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <Skeleton className="w-64 h-5 mb-2" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-20 h-6 rounded-full" />
                      <Skeleton className="w-20 h-6 rounded-full" />
                      <Skeleton className="w-24 h-6 rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Skeleton className="w-6 h-6 rounded-lg" />
                    <Skeleton className="w-6 h-6 rounded-lg" />
                    <Skeleton className="w-6 h-6 rounded-lg" />
                  </div>
                </div>
                <Skeleton className="w-full h-4 mb-3" />
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <Skeleton className="w-28 h-4" />
                  <Skeleton className="w-32 h-4" />
                  <Skeleton className="w-20 h-4" />
                  <Skeleton className="w-24 h-4" />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-32 h-4" />
                    <Skeleton className="w-40 h-4" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-20 h-6" />
                    <Skeleton className="w-16 h-6" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-inner">
              <BriefcaseIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {jobs.length === 0 ? 'No jobs posted yet' : 'No jobs match your filters'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
              {jobs.length === 0 
                ? 'Start building your team by posting your first job listing and attract top talent.' 
                : 'Try adjusting your search criteria or filters to find more jobs.'}
            </p>
            {jobs.length === 0 && (
              <button
                onClick={() => router.push('/dashboard/jobs/create')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold transform hover:scale-105"
              >
                <PlusIcon className="w-5 h-5" />
                Create Your First Job
              </button>
            )}
          </div>
        ) : (
          filteredJobs.map((job) => (
            <JobListItem
              key={job.id}
              job={job}
              onJobAction={onJobAction}
              onDeleteJob={onDeleteJob}
              router={router}
            />
          ))
        )}
      </div>
    </div>
  );
};

interface JobListItemProps {
  job: JobPost;
  onJobAction: (job: JobPost, action: string) => void;
  onDeleteJob: (jobId: string, jobTitle: string) => void;
  router: ReturnType<typeof useRouter>;
}

const JobListItem: React.FC<JobListItemProps> = ({
  job,
  onJobAction,
  onDeleteJob,
  router,
}) => {
  const getActionButtonText = (status: JobPost["status"]) => {
    switch (status) {
      case "ACTIVE":
        return "Pause";
      case "PAUSED":
        return "Activate";
      case "DRAFT":
        return "Publish";
      case "CLOSED":
      case "EXPIRED":
        return "Reopen";
      default:
        return "Activate";
    }
  };

  const getActionButtonStyle = (status: JobPost["status"]) => {
    return status === "DRAFT" 
      ? "bg-primary-600 text-white hover:bg-primary-700 shadow-md hover:shadow-lg transform hover:scale-105" 
      : "text-gray-700 hover:bg-gray-100 border border-gray-200 hover:border-gray-300";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group overflow-hidden">
      <div className="p-3 sm:p-4">
        {/* Header Section - Title & Actions */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate group-hover:text-primary-600 transition-colors duration-200">
              {job.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm ${getTypeColor(job.type)}`}
              >
                {getTypeDisplayText(job.type)}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(job.status)}`}
              >
                {getStatusDisplayText(job.status)}
              </span>
              <div className="px-2 py-0.5 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full shadow-sm">
                <span className="text-xs font-semibold text-gray-700">{job.department}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button 
              title="View Details"
              className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-600/10 rounded-lg transition-all duration-200"
            >
              <EyeIcon className="w-4 h-4" />
            </button>
            <button 
              title="Edit Job"
              onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button 
              title="Delete Job"
              onClick={() => onDeleteJob(job.id, job.title)}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Description - Single Line */}
        <p className="text-gray-600 text-xs mb-2 line-clamp-1">
          {job.shortDescription || job.description}
        </p>

        {/* Quick Details - Inline Compact */}
        <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
          <div className="flex items-center gap-1">
            <MapPinIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <span className="text-gray-700 truncate">{job.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <CurrencyDollarIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <span className="text-gray-700 truncate">{job.salary}</span>
          </div>
          <div className="flex items-center gap-1">
            <UsersIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <span className="text-gray-700 whitespace-nowrap">{job.applicants}</span>
          </div>
          <div className="flex items-center gap-1">
            <EyeIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <span className="text-gray-700 whitespace-nowrap">{job.views}</span>
          </div>
        </div>

        {/* Footer - Dates & Actions */}
        <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
            <span className="whitespace-nowrap">📅 Posted {formatPostedDate(job.createdAt)}</span>
            <span className="whitespace-nowrap">⏰ Deadline: {formatDeadline(job.deadline || "")}</span>
          </div>
          
          <div className="flex items-center gap-1.5 flex-wrap">
            <button 
              onClick={() => router.push(`/dashboard/jobs/${job.id}/applications`)}
              className="px-2.5 py-1 text-primary-600 hover:bg-primary-600/10 rounded-lg transition-all duration-200 font-semibold text-xs border border-primary-600/20 hover:border-primary-600/40 whitespace-nowrap"
            >
              Applications
            </button>
            <button 
              onClick={() => {
                const action = getActionButtonText(job.status);
                onJobAction(job, action);
              }}
              className={`px-2.5 py-1 rounded-lg transition-all duration-200 font-semibold text-xs whitespace-nowrap ${getActionButtonStyle(job.status)}`}
            >
              {getActionButtonText(job.status)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobList;

