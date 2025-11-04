import React, { useState, useEffect } from "react";
import { CalendarDaysIcon, ClockIcon } from "@heroicons/react/24/outline";
// import { DashboardEvent } from "@/services/dashboard";
interface DashboardEvent {
  id: string;
  jobTitle: string;
  company: string;
  date: string;
  time: string;
  type: string;
}

export default function Calendar() {
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      setLoading(true);
      // Events API not implemented yet - just show empty state
      setEvents([]);
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: DashboardEvent["type"]) => {
    switch (type) {
      case "interview":
        return "bg-blue-100 text-blue-800";
      case "deadline":
        return "bg-red-100 text-red-800";
      case "meeting":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
            <CalendarDaysIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
            Upcoming Schedule
          </h2>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-2.5 sm:p-3 bg-gray-50 rounded-lg animate-pulse">
              <div className="h-3 bg-gray-200 rounded mb-1.5"></div>
              <div className="h-2.5 bg-gray-200 rounded w-1/2"></div>
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
          <CalendarDaysIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
          Upcoming Schedule
        </h2>
        <button className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium">
          View All
        </button>
      </div>

      <div className="space-y-2">
        {events.length === 0 ? (
          <div className="text-center py-5 text-gray-500">
            <CalendarDaysIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No upcoming events</p>
            <p className="text-xs">Your schedule will appear here</p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 border border-gray-100"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-gray-900 truncate">
                  {event.jobTitle}
                </h3>
                <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5">
                  <ClockIcon className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">
                    {event.date} at {event.time}
                  </span>
                </div>
              </div>
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${getTypeColor(
                  event.type
                )}`}
              >
                {event.type}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

