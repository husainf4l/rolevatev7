import React, { useState, useEffect } from "react";
import {
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { getCompanyApplications, Application, updateApplicationStatus } from "@/services/application";

export default function RecentApplications() {
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentApplications();
  }, []);

  const fetchRecentApplications = async () => {
    try {
      setLoading(true);
      const applications = await getCompanyApplications();
      // Get the most recent 4 applications
      const sortedApplications = [...applications]
        .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
        .slice(0, 4);
      setRecentApplications(sortedApplications);
    } catch (error) {
      console.error('Error fetching recent applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAppliedDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return '1 day ago';
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: Application['status']) => {
    try {
      await updateApplicationStatus(applicationId, newStatus);
      // Refresh the applications list
      await fetchRecentApplications();
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };
  const getStatusColor = (status: Application["status"]) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "REVIEWED":
        return "bg-blue-100 text-blue-800";
      case "SHORTLISTED":
        return "bg-purple-100 text-purple-800";
      case "INTERVIEWED":
        return "bg-indigo-100 text-indigo-800";
      case "OFFERED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "WITHDRAWN":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusDisplayText = (status: Application["status"]) => {
    switch (status) {
      case "PENDING":
        return "Submitted";
      case "REVIEWED":
        return "Under Review";
      case "SHORTLISTED":
        return "Interview Scheduled";
      case "INTERVIEWED":
        return "Interviewed";
      case "OFFERED":
        return "Offered";
      case "REJECTED":
        return "Rejected";
      case "WITHDRAWN":
        return "Withdrawn";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-primary-600" />
            Recent Applications
          </h2>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 border border-gray-100 rounded-lg animate-pulse">
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-2 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
          <DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
          Recent Applications
        </h2>
        <button className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium">
          View All
        </button>
      </div>

      <div className="space-y-2">
        {recentApplications.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <DocumentTextIcon className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No applications yet</p>
            <p className="text-xs">Applications will appear here when candidates apply</p>
          </div>
        ) : (
          recentApplications.map((application) => (
            <div
              key={application.id}
              className="p-2.5 sm:p-3 border border-gray-100 rounded-lg hover:border-primary-600/30 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <DocumentTextIcon className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm text-gray-900 truncate">
                      {application.candidate.name}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">
                      {application.job.title} • {formatAppliedDate(application.appliedAt)}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{application.candidate.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0 mt-1.5 sm:mt-0">
                  <button 
                    className="p-1 text-gray-400 hover:text-primary-600 transition-colors duration-200"
                    title="View Application"
                  >
                    <EyeIcon className="w-3.5 h-3.5" />
                  </button>
                  {application.resumeUrl && (
                    <a 
                      href={application.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-gray-400 hover:text-primary-600 transition-colors duration-200"
                      title="Download CV"
                    >
                      <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {application.status !== "OFFERED" && application.status !== "REJECTED" && (
                    <>
                      <button 
                        className="p-1 text-gray-400 hover:text-green-600 transition-colors duration-200"
                        title="Accept Application"
                        onClick={() => handleStatusUpdate(application.id, "OFFERED")}
                      >
                        <CheckCircleIcon className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                        title="Reject Application"
                        onClick={() => handleStatusUpdate(application.id, "REJECTED")}
                      >
                        <XCircleIcon className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between text-xs gap-1.5 xs:gap-0">
                <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-3 text-gray-500">
                  <span className="truncate">Score: {application.cvAnalysisScore || 'N/A'}</span>
                  <span className="truncate">Expected: {application.expectedSalary}</span>
                </div>
                <div
                  className={`px-2 py-0.5 rounded-full text-xs font-medium self-start xs:self-center ${getStatusColor(
                    application.status
                  )}`}
                >
                  {getStatusDisplayText(application.status)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

