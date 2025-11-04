"use client";

import React, { useState, useEffect } from "react";
import {
  BookmarkIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BriefcaseIcon,
  TrashIcon,
  LightBulbIcon,
  EyeIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { getSavedJobsDetails } from "@/services/savedJobs";

interface SavedJob {
  id: string;
  slug?: string;
  title: string;
  department: string;
  location: string;
  salary: string;
  type: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
  deadline: string;
  description: string;
  shortDescription: string;
  responsibilities: string;
  requirements: string;
  benefits: string;
  skills: string[];
  experience: string;
  education: string;
  jobLevel: "ENTRY" | "MID" | "SENIOR" | "EXECUTIVE";
  workType: "ON_SITE" | "REMOTE" | "HYBRID";
  industry: string;
  status: "ACTIVE" | "INACTIVE" | "CLOSED";
  featured: boolean;
  applicants: number;
  views: number;
  createdAt: string;
  updatedAt: string;
  company: {
    id: string;
    name: string;
    industry: string;
    numberOfEmployees: number;
    address: {
      city: string;
      country: string;
    };
  };
  screeningQuestions: Array<{
    id: string;
    question: string;
    type: "YES_NO" | "MULTIPLE_CHOICE" | "TEXT";
    required: boolean;
  }>;
  _count: {
    applications: number;
  };
}

const isDeadlineApproaching = (deadline: string) => {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 3;
};

const formatJobType = (type: string) => {
  switch (type) {
    case "FULL_TIME":
      return "Full-time";
    case "PART_TIME":
      return "Part-time";
    case "CONTRACT":
      return "Contract";
    case "INTERNSHIP":
      return "Internship";
    default:
      return type;
  }
};

export default function SavedJobsPage() {
  const { unsaveJob } = useSavedJobs();
  const [savedJobsDetails, setSavedJobsDetails] = useState<SavedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch saved jobs details from API
  useEffect(() => {
    const fetchSavedJobsDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getSavedJobsDetails();
        // Extract job details from the savedJobs response
        const jobs = response.map((savedJob: any) => savedJob.job);
        setSavedJobsDetails(jobs);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load saved jobs"
        );
        console.error("Failed to fetch saved jobs details:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedJobsDetails();
  }, []);

  const handleUnsaveJob = async (jobId: string) => {
    try {
      await unsaveJob(jobId);
      // Remove from local state
      setSavedJobsDetails((prev) => prev.filter((job) => job.id !== jobId));
    } catch (error) {
      console.error("Failed to unsave job:", error);
      // You could show a toast notification here
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="px-2 sm:px-3 py-4">
          <div className="flex justify-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="px-2 sm:px-3 py-4">
          <div className="bg-red-50 border border-red-200 rounded-sm p-3 sm:p-4">
            <h3 className="text-sm sm:text-base font-medium text-red-800 mb-1">
              Error Loading Saved Jobs
            </h3>
            <p className="text-xs sm:text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex-1 min-h-screen bg-gray-50 pt-16">
      <div className="px-2 sm:px-3 space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="bg-white rounded-sm p-3 sm:p-4 border border-gray-100 shadow-sm">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1">
            Saved Jobs
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Keep track of interesting opportunities you want to apply to later
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-white rounded-sm p-3 sm:p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Saved</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">
                  {savedJobsDetails.length}
                </p>
              </div>
              <div className="p-2 sm:p-2.5 bg-primary-100 rounded-sm">
                <BookmarkIcon className="w-4 h-4 text-primary-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-sm p-3 sm:p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">
                  Applied From Saved
                </p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">0</p>
              </div>
              <div className="p-2 sm:p-2.5 bg-green-100 rounded-sm">
                <BriefcaseIcon className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-sm p-3 sm:p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">
                  Deadlines Soon
                </p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">
                  {
                    savedJobsDetails.filter(
                      (job) =>
                        job.deadline && isDeadlineApproaching(job.deadline)
                    ).length
                  }
                </p>
              </div>
              <div className="p-2 sm:p-2.5 bg-red-100 rounded-sm">
                <ClockIcon className="w-4 h-4 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-sm p-3 sm:p-4 border border-gray-100 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 sm:gap-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center space-y-1.5 sm:space-y-2 md:space-y-0 md:space-x-2">
              <select className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-sm text-xs sm:text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-600">
                <option>All Jobs</option>
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
                <option>Remote</option>
              </select>
              <select className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-sm text-xs sm:text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-600">
                <option>Sort by: Most Recent</option>
                <option>Sort by: Best Match</option>
                <option>Sort by: Salary</option>
                <option>Sort by: Deadline</option>
              </select>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 text-center md:text-right">
              {savedJobsDetails.length} saved jobs
            </div>
          </div>
        </div>

        {/* Saved Jobs List */}
        {savedJobsDetails.length === 0 ? (
          <div className="bg-white rounded-sm p-8 sm:p-12 text-center border border-gray-100 shadow-sm">
            <HeartIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-1">
              No saved jobs yet
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-3">
              Start saving jobs you're interested in to keep track of them here.
            </p>
            <a
              href="/userdashboard/jobs"
              className="inline-flex items-center space-x-2 px-3 py-1.5 bg-primary-600 text-white rounded-sm hover:bg-primary-700 transition-all duration-300 shadow-sm hover:shadow-md text-xs sm:text-sm"
            >
              <span>Browse Jobs</span>
            </a>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {savedJobsDetails.map((job) => (
              <div key={job.id} className="bg-white rounded-sm border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-3 sm:p-4">
                <div className="flex items-start justify-between mb-2.5 sm:mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1 flex-wrap">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                        {job.title}
                      </h3>
                      {job.workType === "REMOTE" && (
                        <span className="inline-flex px-1.5 py-0.5 text-xs font-medium rounded-sm bg-blue-100 text-blue-800 flex-shrink-0">
                          Remote
                        </span>
                      )}
                      {job.workType === "HYBRID" && (
                        <span className="inline-flex px-1.5 py-0.5 text-xs font-medium rounded-sm bg-purple-100 text-purple-800 flex-shrink-0">
                          Hybrid
                        </span>
                      )}
                      {job.deadline && isDeadlineApproaching(job.deadline) && (
                        <span className="inline-flex px-1.5 py-0.5 text-xs font-medium rounded-sm bg-red-100 text-red-800 flex-shrink-0">
                          Deadline Soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-primary-600 font-medium mb-1.5">
                      {job.company?.name || 'Company Name Not Available'}
                    </p>
                    <p className="text-gray-600 mb-2 line-clamp-2 text-xs sm:text-sm">
                      {job.description}
                    </p>
                    <div className="flex items-center space-x-3 sm:space-x-4 text-xs text-gray-500 flex-wrap">
                      <div className="flex items-center space-x-1">
                        <MapPinIcon className="w-3.5 h-3.5" />
                        <span>{job.location || 'Location Not Specified'}</span>
                      </div>
                      {job.salary && (
                        <div className="flex items-center space-x-1">
                          <CurrencyDollarIcon className="w-3.5 h-3.5" />
                          <span>{job.salary}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <BriefcaseIcon className="w-3.5 h-3.5" />
                        <span>{formatJobType(job.type)}</span>
                      </div>
                      {job.experience && (
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="w-3.5 h-3.5" />
                          <span>{job.experience}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start space-x-1 sm:space-x-2 ml-2 flex-shrink-0">
                    <button className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-sm transition-colors">
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleUnsaveJob(job.id)}
                      className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-sm transition-colors"
                      title="Remove from saved jobs"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between pt-4 border-t border-gray-200 gap-3">
                  <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 text-sm text-gray-500">
                    <span>
                      Saved on {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                    {job.deadline && (
                      <span>
                        Apply by {new Date(job.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href={`/jobs/${job.slug || job.id}`}
                      className="flex-1 md:flex-none px-4 py-2 border border-gray-300 text-gray-700 rounded-sm hover:bg-gray-50 transition-colors text-center"
                    >
                      View Details
                    </a>
                    <a
                      href={`/jobs/${job.slug || job.id}/apply`}
                      className="flex-1 md:flex-none px-4 py-2 bg-primary-600 text-white rounded-sm hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-center"
                    >
                      Apply Now
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tips */}
        <div className="bg-primary-50 rounded-sm p-6 border border-primary-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <LightBulbIcon className="w-5 h-5 text-primary-600" />
            Tips for Managing Saved Jobs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <p className="font-medium mb-1">Set Application Reminders</p>
              <p>
                Don't let great opportunities slip away due to missed deadlines.
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">Research Companies</p>
              <p>
                Use your saved list to research companies and prepare better
                applications.
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">Track Application Status</p>
              <p>
                Move applied jobs to your applications tracker for better
                organization.
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">Regular Review</p>
              <p>
                Clean up your saved jobs list regularly to keep it relevant.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
