"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  BriefcaseIcon,
  UserCircleIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  BookmarkIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

const quickActions = [
  {
    label: "Browse Jobs",
    description: "Find your next opportunity",
    icon: BriefcaseIcon,
    color: "blue",
    bgColor: "bg-blue-50",
    hoverBg: "hover:bg-blue-100",
    iconColor: "text-blue-600",
    href: "/userdashboard/jobs",
  },
  {
    label: "Update Profile",
    description: "Keep your profile current",
    icon: UserCircleIcon,
    color: "purple",
    bgColor: "bg-purple-50",
    hoverBg: "hover:bg-purple-100",
    iconColor: "text-purple-600",
    href: "/userdashboard/profile",
  },
  {
    label: "Upload Resume",
    description: "Update your CV",
    icon: DocumentTextIcon,
    color: "green",
    bgColor: "bg-green-50",
    hoverBg: "hover:bg-green-100",
    iconColor: "text-green-600",
    href: "/userdashboard/profile?tab=resume",
  },
  {
    label: "Saved Jobs",
    description: "View bookmarked positions",
    icon: BookmarkIcon,
    color: "amber",
    bgColor: "bg-amber-50",
    hoverBg: "hover:bg-amber-100",
    iconColor: "text-amber-600",
    href: "/userdashboard/saved-jobs",
  },
  {
    label: "Job Search",
    description: "Advanced search options",
    icon: MagnifyingGlassIcon,
    color: "indigo",
    bgColor: "bg-indigo-50",
    hoverBg: "hover:bg-indigo-100",
    iconColor: "text-indigo-600",
    href: "/userdashboard/jobs",
  },
];

export default function UserQuickActions() {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="bg-white rounded-sm p-3 sm:p-4 border border-gray-100 hover:shadow-md transition-shadow duration-300"
    >
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-3">
        {quickActions.map((action, index) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
            onClick={() => router.push(action.href)}
            className={`${action.bgColor} ${action.hoverBg} rounded-sm p-2.5 sm:p-3 text-left transition-all duration-200 border border-transparent hover:border-${action.color}-200 hover:shadow-md group`}
          >
            <action.icon
              className={`w-5 h-5 sm:w-6 sm:h-6 ${action.iconColor} mb-1.5 group-hover:scale-110 transition-transform duration-200`}
            />
            <h3 className="font-semibold text-gray-900 mb-0.5 text-xs sm:text-sm">{action.label}</h3>
            <p className="text-xs text-gray-600">{action.description}</p>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
