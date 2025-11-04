"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import JobListCard, { JobData } from "@/components/common/JobListCard";
import { Button } from "@/components/ui/button";
import { jobsService } from "@/services/jobs.service";
import { useSavedJobs } from "@/hooks/useSavedJobs";

export default function UserDashboardJobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [loading, setLoading] = useState(false);

  // Initialize search term from URL params
  useEffect(() => {
    const searchQuery = searchParams.get('search');
    // Ignore "true" as a search term (from old quick action links)
    if (searchQuery && searchQuery !== 'true') {
      setSearchTerm(searchQuery);
    }
  }, [searchParams]);

  // Update URL when search term changes
  const updateSearchTerm = useCallback((value: string) => {
    setSearchTerm(value);
    
    // Update URL with search query
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    router.replace(`/userdashboard/jobs${newUrl}`, { scroll: false });
  }, [searchParams, router]);

  // Clear search function
  const clearSearch = useCallback(() => {
    updateSearchTerm("");
  }, [updateSearchTerm]);

  // Use the useSavedJobs hook for canonical saved jobs state
  const { isJobSaved, saveJob, unsaveJob } = useSavedJobs();

  // API state
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pagination, setPagination] = useState<any>(null);

  const jobsPerPage = 10;

  // Helper function to convert JobPost to JobData format
  const convertJobPostToJobData = (jobPost: any): JobData => {
    try {
      const logoResult = getJobLogo(jobPost);

      const jobData: JobData = {
        id: jobPost.id || '', // Use string ID directly (UUID from backend)
        title: jobPost.title || 'Untitled Position',
        company: (jobPost as any).company || "Company", // Use actual company name from API
        location: jobPost.location || 'Location TBD',
        type:
          jobPost.type === "FULL_TIME"
            ? "Full-time"
            : jobPost.type === "PART_TIME"
            ? "Part-time"
            : jobPost.type === "CONTRACT"
            ? "Contract"
            : jobPost.type === "REMOTE"
            ? "Remote"
            : "Other",
        salary: jobPost.salary || 'Competitive',
        postedAt: jobPost.createdAt ? new Date(jobPost.createdAt).toLocaleDateString() : 'Recently',
        description: jobPost.shortDescription || jobPost.description || '',
        slug: jobPost.slug || '',
      };

      // Only add logo field if it exists (handles exactOptionalPropertyTypes)
      if (logoResult !== undefined) {
        (jobData as any).logo = logoResult;
      }

      // Only add experience field if it exists
      if (jobPost.experience) {
        (jobData as any).experience = jobPost.experience;
      }

      return jobData;
    } catch (error) {
      console.error("Error converting job post:", jobPost, error);
      // Return a minimal valid job data object
      return {
        id: jobPost.id || 'unknown',
        title: 'Error Loading Job',
        company: 'Unknown',
        location: 'Unknown',
        type: 'Full-time',
        salary: 'N/A',
        postedAt: 'Unknown',
        description: 'Error loading job details',
      };
    }
  };

  // Helper function to get job logo from API response (no emoji fallback)
  const getJobLogo = (jobPost: any): string | undefined => {
    // Priority order: companyLogo -> company.logo -> undefined (no fallback)
    if ((jobPost as any).companyLogo) {
      return (jobPost as any).companyLogo;
    }

    if ((jobPost as any).company?.logo) {
      return (jobPost as any).company.logo;
    }

    // No fallback - return undefined if no logo is available
    return undefined;
  };

  // Fetch jobs from API
  const fetchJobs = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);

      // Don't pass search to API - filter locally instead
      const response = await jobsService.getPublicJobs(
        page,
        jobsPerPage,
        undefined // No filters for API
      );

      // Check if response has the expected structure
      if (!response || !Array.isArray(response.jobs)) {
        throw new Error("Invalid response structure from API");
      }

      const convertedJobs = response.jobs.map(convertJobPostToJobData);

      setJobs(convertedJobs);
      setPagination({
        totalPages: Math.ceil(response.total / jobsPerPage),
        currentPage: page,
        hasNextPage: page < Math.ceil(response.total / jobsPerPage),
        hasPrevPage: page > 1,
        nextPage: page + 1,
        prevPage: page - 1,
        total: response.total
      });
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      console.error("Error details:", error instanceof Error ? error.message : "Unknown error");
      // Set empty state instead of fallback data
      setJobs([]);
      setPagination(undefined);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies needed

  // Initial fetch on mount only
  useEffect(() => {
    fetchJobs(1);
  }, [fetchJobs]);

  // Filter jobs locally based on search term (backend doesn't support search)
  const filteredJobs = jobs.filter((job) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      job.title.toLowerCase().includes(searchLower) ||
      job.company.toLowerCase().includes(searchLower) ||
      job.location.toLowerCase().includes(searchLower) ||
      job.description?.toLowerCase().includes(searchLower) ||
      (job as any).experience?.toLowerCase().includes(searchLower)
    );
  });

  // Sort the jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case "latest":
        return new Date(b.postedAt || 0).getTime() - new Date(a.postedAt || 0).getTime();
      case "salary":
        // Extract numeric values from salary strings for comparison
        const getSalaryValue = (salary: string) => {
          const numbers = salary.match(/\d+/g);
          return numbers ? parseInt(numbers[0]) : 0;
        };
        return getSalaryValue(b.salary || '') - getSalaryValue(a.salary || '');
      case "applicants":
        return (b as any).applicants - (a as any).applicants;
      default:
        return 0;
    }
  });

  const handleApply = (jobId: string, jobSlug?: string) => {
    const identifier = jobSlug || jobId;
    router.push(`/jobs/${identifier}`);
  };

  const handleSaveJob = async (jobId: string) => {
    try {
      if (isJobSaved(jobId)) {
        await unsaveJob(jobId);
      } else {
        await saveJob(jobId);
      }
    } catch (error) {
      console.error("Failed to toggle save job:", error);
      // Error handling is already done in the hook
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchJobs(page);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Header */}
      <div className="px-2 sm:px-3">
        <div className="py-3 sm:py-4">
          <div className="text-center mb-3 sm:mb-4">
            <h1 className="font-display text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 tracking-tight">
              Explore{" "}
              <span className="text-primary-600">
                Opportunities
              </span>
            </h1>
            <p className="font-text text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto px-2">
              Find your next career opportunity
            </p>
          </div>

          {/* Search and Sort Bar */}
          <div className="mb-2 sm:mb-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-center">
              <div className="flex-1 relative w-full">
                <svg
                  className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 sm:w-4 sm:h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Job title, company, or skills..."
                  className="w-full pl-8 sm:pl-9 pr-8 sm:pr-9 py-2 border border-gray-200 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500 text-xs sm:text-sm shadow-sm transition-all duration-200"
                  value={searchTerm}
                  onChange={(e) => updateSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="flex gap-1 sm:gap-1.5 flex-wrap justify-center sm:justify-start">
                <button
                  onClick={() => setSortBy("latest")}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium rounded-sm transition-all duration-200 ${
                    sortBy === "latest"
                      ? "bg-primary-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Latest
                </button>
                <button
                  onClick={() => setSortBy("salary")}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium rounded-sm transition-all duration-200 ${
                    sortBy === "salary"
                      ? "bg-primary-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Salary
                </button>
                <button
                  onClick={() => setSortBy("applicants")}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium rounded-sm transition-all duration-200 ${
                    sortBy === "applicants"
                      ? "bg-primary-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Popular
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs Content */}
      <div className="px-2 sm:px-3 py-2 pb-8">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <div className="text-xs sm:text-sm font-semibold text-gray-900">
            {sortedJobs.length} {sortedJobs.length === 1 ? "Job" : "Jobs"} Found
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            <div className="space-y-2 sm:space-y-3">
              {sortedJobs.map((job) => (
                <JobListCard
                  key={job.id}
                  job={job}
                  onApply={(jobId) => handleApply(jobId, job.slug)}
                  onSave={handleSaveJob}
                  isSaved={isJobSaved(job.id)}
                />
              ))}
            </div>

            {sortedJobs.length === 0 && (
              <div className="text-center py-8 sm:py-12">
                <p className="text-xs sm:text-sm text-gray-500">No jobs found matching your criteria.</p>
                <Button
                  variant="outline"
                  onClick={clearSearch}
                  className="mt-3 text-xs sm:text-sm px-2.5 sm:px-3 py-1 sm:py-1.5"
                >
                  Clear Search
                </Button>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center mt-4 sm:mt-6 space-x-1.5 sm:space-x-2">
                <Button
                  variant="secondary"
                  disabled={!pagination.hasPrevPage || loading}
                  onClick={() => handlePageChange(pagination.prevPage)}
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
                >
                  Previous
                </Button>
                <span className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm">
                  Page {currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="secondary"
                  disabled={!pagination.hasNextPage || loading}
                  onClick={() => handlePageChange(pagination.nextPage)}
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

