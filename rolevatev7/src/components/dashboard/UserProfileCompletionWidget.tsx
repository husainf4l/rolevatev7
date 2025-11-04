"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

interface ProfileSection {
  label: string;
  completed: boolean;
  href: string;
}

interface UserProfileCompletionWidgetProps {
  sections: ProfileSection[];
  completionPercentage: number;
}

export default function UserProfileCompletionWidget({
  sections,
  completionPercentage,
}: UserProfileCompletionWidgetProps) {
  const router = useRouter();
  const incompleteSections = sections.filter((s) => !s.completed);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="bg-gradient-to-br from-primary-50 to-white rounded-sm p-3 sm:p-4 border border-primary-100 hover:shadow-md transition-shadow duration-300"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Profile Completion</h2>
        <span className="text-lg sm:text-xl font-bold text-primary-600">
          {completionPercentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-3 sm:mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 1, delay: 0.3 }}
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
          />
        </div>
      </div>

      {completionPercentage === 100 ? (
        <div className="text-center py-2 sm:py-4">
          <CheckCircleIcon className="w-10 h-10 text-green-500 mx-auto mb-2" />
          <p className="text-green-700 font-medium mb-1 text-xs sm:text-sm">
            🎉 Profile Complete!
          </p>
          <p className="text-xs text-gray-600">
            Your profile is fully optimized for job applications
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs sm:text-sm text-gray-600 mb-3">
            Complete your profile to increase your chances of getting hired
          </p>

          <div className="space-y-1.5 sm:space-y-2">
            {incompleteSections.slice(0, 3).map((section, index) => (
              <motion.button
                key={section.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.05, duration: 0.3 }}
                onClick={() => router.push(section.href)}
                className="w-full flex items-center justify-between p-2 sm:p-2.5 bg-white rounded-sm hover:bg-gray-50 transition-colors border border-gray-200 hover:border-primary-300 group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <XCircleIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                    {section.label}
                  </span>
                </div>
                <ArrowRightIcon className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
              </motion.button>
            ))}
          </div>

          {incompleteSections.length > 3 && (
            <button
              onClick={() => router.push("/userdashboard/profile")}
              className="w-full mt-2 text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all incomplete sections
            </button>
          )}
        </>
      )}
    </motion.div>
  );
}
